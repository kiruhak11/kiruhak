import { computed, reactive, ref } from "vue";

/**
 * Логика отправки заявки.
 *
 * Единая реализация используется на главной странице и на `/contact`.
 * Контракт `/api/telegram` не меняется: тело заявки, заголовок
 * `Idempotency-Key` и набор полей те же, что и раньше.
 *
 * Семантика идемпотентности:
 *
 * * ключ хранится вместе с нормализованным телом заявки;
 * * повторная попытка **той же** заявки переиспользует ключ — запись в
 *   очередь доставки не дублируется;
 * * изменение данных после ошибки создаёт **новый** ключ, потому что
 *   тело уже другое;
 * * после подтверждённого успеха ключ сбрасывается: следующая заявка
 *   получает новый.
 *
 * Форма не сбрасывается до подтверждённого ответа сервера: при ошибке все
 * введённые значения сохраняются, и отправку можно повторить.
 */

export type LeadFormValues = {
  name: string;
  contact: string;
  email: string;
  business: string;
  task: string;
  budget: string;
};

export type LeadSubmissionState = "idle" | "submitting" | "success" | "error";

export type LeadErrorKind =
  | "validation"
  | "conflict"
  | "rate-limit"
  | "temporary"
  | "network"
  /** Ответ сервера не подтверждает сохранение заявки. */
  | "unconfirmed"
  | "unknown";

export type LeadSubmissionError = {
  kind: LeadErrorKind;
  /** Текст для пользователя. Данные формы при этом не теряются. */
  message: string;
  statusCode?: number;
  retryAfterSeconds?: number;
};

export type LeadSubmissionResult = {
  /** Сервер вернул 200: такая заявка уже сохранена. */
  duplicate: boolean;
};

export type LeadFetcher = (
  request: string,
  options: {
    method: string;
    headers: Record<string, string>;
    body: Record<string, string>;
  }
) => Promise<unknown>;

export type LeadStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export const LEAD_ENDPOINT = "/api/telegram";
export const LEAD_IDEMPOTENCY_STORAGE_KEY = "kstudio.lead.idempotency-key";

/** Ограничения полей — те же, что проверяет сервер. */
export const LEAD_FIELD_LIMITS = {
  name: 120,
  contact: 160,
  email: 254,
  business: 180,
  task: 4000,
  budget: 160,
} as const;

/** Поля, обязательные для сохранения заявки. */
export const LEAD_REQUIRED_FIELDS = ["name", "email", "task"] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createEmptyLeadValues = (): LeadFormValues => ({
  name: "",
  contact: "",
  email: "",
  business: "",
  task: "",
  budget: "",
});

/**
 * Нормализованное тело заявки — только заполненные поля, как ожидает
 * сервер. Одинаковое тело означает ту же самую заявку.
 */
export const buildLeadPayload = (
  values: LeadFormValues
): Record<string, string> => {
  const payload: Record<string, string> = {};

  for (const [key, raw] of Object.entries(values)) {
    const text = typeof raw === "string" ? raw.trim() : "";
    if (text) payload[key] = text;
  }

  return payload;
};

/** Проверка email на клиенте — та же логика, что на сервере. */
export const isValidLeadEmail = (email: string): boolean => {
  const text = typeof email === "string" ? email.trim() : "";
  if (!text) return false;
  return EMAIL_PATTERN.test(text);
};

export const missingLeadFields = (values: LeadFormValues): string[] => {
  const missing: string[] = [];

  for (const key of LEAD_REQUIRED_FIELDS) {
    const text = values[key]?.trim() ?? "";
    if (!text) missing.push(key);
  }

  return missing;
};

const readHeader = (headers: unknown, name: string): string | null => {
  if (!headers || typeof headers !== "object") return null;
  const bag = headers as { get?: (key: string) => string | null } & Record<
    string,
    unknown
  >;
  if (typeof bag.get === "function") {
    const value = bag.get(name);
    return typeof value === "string" ? value : null;
  }
  const direct = bag[name] ?? bag[name.toLowerCase()];
  return typeof direct === "string" ? direct : null;
};

const readStatusCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object") return undefined;
  const bag = error as {
    statusCode?: unknown;
    status?: unknown;
    response?: { status?: unknown };
  };

  for (const candidate of [bag.statusCode, bag.response?.status, bag.status]) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

const readStatusMessage = (error: unknown): string => {
  if (!error || typeof error !== "object") return "";
  const bag = error as {
    statusMessage?: unknown;
    data?: { statusMessage?: unknown; message?: unknown };
    message?: unknown;
  };

  for (const candidate of [
    bag.statusMessage,
    bag.data?.statusMessage,
    bag.data?.message,
    bag.message,
  ]) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  return "";
};

/**
 * Разбор ответа сервера в понятное посетителю сообщение.
 *
 * 400 — не заполнены обязательные поля или неверный email;
 * 409 — ключ идемпотентности уже использован с другими данными;
 * 429 — ограничение частоты (учитывается `Retry-After`, если он есть);
 * 503 — сервер временно не может сохранить заявку;
 * без кода ответа — сетевая ошибка.
 */
export const classifyLeadError = (error: unknown): LeadSubmissionError => {
  const statusCode = readStatusCode(error);
  const statusMessage = readStatusMessage(error);
  const retryAfterRaw = readHeader(
    (error as { response?: { headers?: unknown } })?.response?.headers,
    "retry-after"
  );
  const retryAfterSeconds = (() => {
    if (!retryAfterRaw) return undefined;
    const parsed = Number.parseInt(retryAfterRaw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  })();

  if (statusCode === 429) {
    const minutes = retryAfterSeconds
      ? Math.max(1, Math.ceil(retryAfterSeconds / 60))
      : undefined;
    return {
      kind: "rate-limit",
      statusCode,
      retryAfterSeconds,
      message: minutes
        ? `Слишком много заявок за последнее время. Повторите отправку через ${minutes} мин.`
        : "Слишком много заявок за последнее время. Повторите отправку чуть позже.",
    };
  }

  if (statusCode === 409) {
    return {
      kind: "conflict",
      statusCode,
      message:
        "Этот ключ отправки уже использован для другой заявки. Измените описание задачи и отправьте форму ещё раз.",
    };
  }

  if (statusCode === 503 || statusCode === 502 || statusCode === 504) {
    return {
      kind: "temporary",
      statusCode,
      message:
        "Сервер временно не может сохранить заявку. Данные не потеряны — повторите отправку.",
    };
  }

  if (statusCode === 400 || statusCode === 413 || statusCode === 422) {
    const message = statusMessage.includes("INVALID_EMAIL")
      ? "Проверьте адрес email — он указан неверно."
      : statusMessage.includes("FIELD_TOO_LONG")
        ? "Одно из полей слишком длинное — сократите текст."
        : "Проверьте форму: обязательны имя, email и описание задачи.";
    return { kind: "validation", statusCode, message };
  }

  if (statusCode === undefined) {
    return {
      kind: "network",
      message:
        "Нет связи с сервером. Данные не потеряны — проверьте соединение и повторите отправку.",
    };
  }

  return {
    kind: "unknown",
    statusCode,
    message:
      "Не удалось отправить заявку. Данные не потеряны — попробуйте ещё раз или напишите в Telegram.",
  };
};

/**
 * Подтверждение успешного ответа Lead API.
 *
 * Принимается только документированный ответ: `status: "saved"`,
 * `delivery: "queued"` и `duplicate` типа boolean. Разрешившийся Promise
 * сам по себе не является подтверждением — иначе незаписанная заявка была бы
 * показана посетителю как отправленная.
 */
export const isConfirmedLeadResponse = (
  value: unknown
): value is { status: string; delivery: string; duplicate: boolean } => {
  if (!value || typeof value !== "object") return false;
  const bag = value as Record<string, unknown>;
  return (
    bag.status === "saved" &&
    bag.delivery === "queued" &&
    typeof bag.duplicate === "boolean"
  );
};

const resolveStorage = (injected?: LeadStorage): LeadStorage | null => {
  if (injected) return injected;
  try {
    const storage = (globalThis as { sessionStorage?: LeadStorage }).sessionStorage;
    return storage ?? null;
  } catch {
    return null;
  }
};

const resolveFetcher = (injected?: LeadFetcher): LeadFetcher => {
  if (injected) return injected;
  const globalFetch = (globalThis as { $fetch?: LeadFetcher }).$fetch;
  if (!globalFetch) {
    throw new Error("Отправка заявки требует доступного $fetch");
  }
  return globalFetch;
};

type StoredIdempotency = { key: string; payload: string };

/**
 * Логика формы заявки: состояние, идемпотентность, разбор ошибок.
 */
export const useLeadSubmission = (
  options: {
    endpoint?: string;
    storageKey?: string;
    fetch?: LeadFetcher;
    storage?: LeadStorage;
  } = {}
) => {
  const endpoint = options.endpoint ?? LEAD_ENDPOINT;
  const storageKey = options.storageKey ?? LEAD_IDEMPOTENCY_STORAGE_KEY;
  const storage = resolveStorage(options.storage);

  const values = reactive<LeadFormValues>(createEmptyLeadValues());
  const state = ref<LeadSubmissionState>("idle");
  const error = ref<LeadSubmissionError | null>(null);
  const result = ref<LeadSubmissionResult | null>(null);
  const fieldError = ref<string | null>(null);

  const isSubmitting = computed(() => state.value === "submitting");
  const isSuccess = computed(() => state.value === "success");
  const canSubmit = computed(
    () => !isSubmitting.value && missingLeadFields(values).length === 0
  );

  const readStored = (): StoredIdempotency | null => {
    if (!storage) return null;
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredIdempotency;
      if (!parsed || typeof parsed.key !== "string" || !parsed.key) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const writeStored = (entry: StoredIdempotency | null) => {
    if (!storage) return;
    try {
      if (entry) storage.setItem(storageKey, JSON.stringify(entry));
      else storage.removeItem(storageKey);
    } catch {
      // Хранилище недоступно (приватный режим) — ключ живёт только в памяти.
    }
  };

  let memoryKey: StoredIdempotency | null = null;

  /**
   * Ключ идемпотентности для текущего тела заявки.
   * То же тело — тот же ключ; другое тело — новый ключ.
   */
  const resolveIdempotencyKey = (payload: Record<string, string>): string => {
    const serialized = JSON.stringify(payload);
    const stored = readStored() ?? memoryKey;

    if (stored && stored.payload === serialized) return stored.key;

    const key = createIdempotencyKey();
    const entry = { key, payload: serialized };
    memoryKey = entry;
    writeStored(entry);
    return key;
  };

  const clearIdempotencyKey = () => {
    memoryKey = null;
    writeStored(null);
  };

  /** Пользователь изменил данные: прежний ключ больше не подходит. */
  const handleInput = () => {
    fieldError.value = null;
    // Во время отправки состояние не трогаем: блокировка повторного submit
    // должна сохраняться.
    if (isSubmitting.value) return;
    if (state.value === "error") {
      error.value = null;
      state.value = "idle";
      // Ключ очищается не здесь: он пересоздаётся автоматически, если тело
      // заявки изменилось. Повтор той же заявки использует прежний ключ.
    }
  };

  const reset = () => {
    Object.assign(values, createEmptyLeadValues());
    state.value = "idle";
    error.value = null;
    result.value = null;
    fieldError.value = null;
    clearIdempotencyKey();
  };

  const startNewLead = () => {
    state.value = "idle";
    error.value = null;
    result.value = null;
    fieldError.value = null;
  };

  const submit = async (): Promise<LeadSubmissionResult | null> => {
    if (isSubmitting.value) return null;

    const missing = missingLeadFields(values);
    if (missing.length > 0) {
      fieldError.value =
        "Заполните обязательные поля: имя, email и описание задачи.";
      state.value = "error";
      error.value = {
        kind: "validation",
        message: fieldError.value,
      };
      return null;
    }

    if (!isValidLeadEmail(values.email)) {
      fieldError.value = "Проверьте адрес email — он указан неверно.";
      state.value = "error";
      error.value = { kind: "validation", message: fieldError.value };
      return null;
    }

    fieldError.value = null;
    error.value = null;
    state.value = "submitting";

    const payload = buildLeadPayload(values);
    const idempotencyKey = resolveIdempotencyKey(payload);

    try {
      const response = await resolveFetcher(options.fetch)(endpoint, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: payload,
      });

      if (!isConfirmedLeadResponse(response)) {
        // Ответ не подтверждает сохранение: поля и ключ сохраняются,
        // чтобы отправку можно было безопасно повторить.
        error.value = {
          kind: "unconfirmed",
          message:
            "Сервер не подтвердил сохранение заявки. Данные не потеряны — повторите отправку.",
        };
        state.value = "error";
        return null;
      }

      const duplicate = response.duplicate;

      // Сброс только после подтверждённого успеха.
      clearIdempotencyKey();
      Object.assign(values, createEmptyLeadValues());
      result.value = { duplicate };
      state.value = "success";
      return { duplicate };
    } catch (cause) {
      const classified = classifyLeadError(cause);
      // Данные формы сохраняются: отправку можно повторить.
      error.value = classified;
      state.value = "error";

      // Конфликт ключа идемпотентности означает, что этот ключ уже использован
      // для другой заявки: сбрасывается только ключ, поля остаются, и
      // повторная отправка того же содержимого получает новый ключ.
      if (classified.kind === "conflict") {
        clearIdempotencyKey();
      }

      // При сетевой ошибке, 503 и прочих неоднозначных результатах ключ
      // сохраняется: сервер мог успеть записать заявку, и повтор с тем же
      // ключом не создаст дубль.
      return null;
    }
  };

  return {
    values,
    state,
    error,
    result,
    fieldError,
    isSubmitting,
    isSuccess,
    canSubmit,
    submit,
    handleInput,
    reset,
    startNewLead,
  };
};

const createIdempotencyKey = (): string => {
  const cryptoRef = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }
  // Запасной вариант для окружений без randomUUID: ключ должен состоять
  // из допустимых символов и быть не короче 16 символов.
  const random = Math.random().toString(36).slice(2);
  return `kstudio-${Date.now().toString(36)}-${random}`.replace(
    /[^A-Za-z0-9_-]/g,
    ""
  );
};
