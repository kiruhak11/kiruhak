import { computed, ref, readonly } from "vue";

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  isAdmin: boolean;
  balance: number;
  sitesCount: number;
  transactionsCount: number;
  createdAt: string;
}

/**
 * Состояние сессии.
 *
 * `authenticated` — сервер подтвердил сессию по `/api/user/me`;
 * `anonymous`     — сервер отверг сессию (401/403) либо токена нет;
 * `unverified`    — сервер недоступен, сессия не подтверждена и не отвергнута;
 * `validating`    — идёт проверка;
 * `idle`          — проверка ещё не запускалась.
 */
export type SessionStatus =
  | "idle"
  | "validating"
  | "authenticated"
  | "anonymous"
  | "unverified";

export interface SessionValidationResult {
  status: "idle" | "authenticated" | "anonymous" | "unverified";
  user?: User;
}

/** Минимальный контракт хранилища браузера (подменяется в тестах). */
export interface SessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Запрос актуального пользователя по сохранённому токену. */
export type SessionUserFetcher = (token: string) => Promise<AuthResponse>;

export interface InitAuthOptions {
  /** Хранилище сессии; по умолчанию — localStorage браузера. */
  storage?: SessionStorage;
  /** Загрузчик пользователя; по умолчанию — `$fetch("/api/user/me")`. */
  fetchUser?: SessionUserFetcher;
  /** Принудительная повторная проверка, минуя кэш результата. */
  force?: boolean;
}

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

/**
 * Окно, в котором результат проверки считается свежим. Нужно, чтобы
 * middleware и компоненты, вызывающие initAuth() почти одновременно, не
 * порождали серию одинаковых запросов после перезагрузки страницы.
 */
const VALIDATION_CACHE_MS = 2_000;

/**
 * Проверки сессии общие для всех экземпляров композабла: useAuth() создаёт
 * собственные ref-ы, но сеть должна опрашиваться один раз.
 */
let pendingValidation: {
  token: string | null;
  promise: Promise<SessionValidationResult>;
} | null = null;
let lastValidation: {
  at: number;
  result: SessionValidationResult;
  token: string | null;
} | null = null;

const invalidateValidationCache = () => {
  lastValidation = null;
};

const extractStatusCode = (error: unknown): number | undefined => {
  const candidate = error as {
    statusCode?: number;
    status?: number;
    response?: { status?: number };
    data?: { statusCode?: number; status?: number };
  } | null;

  if (!candidate) return undefined;

  return (
    candidate.statusCode ??
    candidate.status ??
    candidate.response?.status ??
    candidate.data?.statusCode ??
    candidate.data?.status
  );
};

export const useAuth = () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const logoutLoading = ref(false);
  const sessionStatus = ref<SessionStatus>("idle");

  /** Хранилище, с которым работает текущий экземпляр (в тестах — подменённое). */
  let activeStorage: SessionStorage | null = null;
  /** Последние параметры проверки — чтобы повтор использовать тот же сток. */
  let lastInitOptions: InitAuthOptions | undefined;

  const resolveStorage = (injected?: SessionStorage): SessionStorage | null => {
    if (injected) return injected;
    if (import.meta.client && typeof localStorage !== "undefined") {
      return localStorage;
    }
    return null;
  };

  const storageOrDefault = (): SessionStorage | null =>
    activeStorage ?? resolveStorage();

  /**
   * Фиксирует успешную авторизацию: пользователь и токен в состоянии.
   */
  const persistAuthenticatedSession = (
    response: AuthResponse
  ): { user: User; token: string } | null => {
    if (!response.success || !response.user || !response.token) return null;
    user.value = response.user;
    token.value = response.token;
    invalidateValidationCache();
    return { user: response.user, token: response.token };
  };

  /**
   * Очищает локальную сессию (состояние и хранилище браузера).
   */
  const clearLocalSession = (storage?: SessionStorage) => {
    user.value = null;
    token.value = null;
    sessionStatus.value = "anonymous";
    invalidateValidationCache();

    const store = storage ?? storageOrDefault();
    if (store) {
      store.removeItem(AUTH_TOKEN_KEY);
      store.removeItem(AUTH_USER_KEY);
    }

    return true;
  };

  const defaultFetchUser: SessionUserFetcher = async (savedToken) =>
    (await $fetch("/api/user/me", {
      headers: { Authorization: `Bearer ${savedToken}` },
      signal: AbortSignal.timeout(10_000),
    })) as AuthResponse;

  /**
   * Обращается к серверу и классифицирует результат проверки.
   *
   * localStorage здесь не учитывается: только ответ сервера решает, авторизован
   * ли пользователь.
   */
  const requestSessionValidation = async (
    savedToken: string,
    fetchUser: SessionUserFetcher
  ): Promise<SessionValidationResult> => {
    try {
      const response = await fetchUser(savedToken);

      if (response && response.success && response.user) {
        return { status: "authenticated", user: response.user };
      }

      // Сервер ответил, но сессию не подтвердил — считаем её отсутствующей.
      return { status: "anonymous" };
    } catch (error) {
      const statusCode = extractStatusCode(error);

      if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
        return { status: "anonymous" };
      }

      // Сеть недоступна или сервер ошибся: сессию не подтверждаем, но и не
      // уничтожаем — пользователь сможет повторить проверку.
      return { status: "unverified" };
    }
  };

  /**
   * Применяет результат проверки к состоянию.
   */
  const applyValidationResult = (
    result: SessionValidationResult,
    storage: SessionStorage,
    savedToken: string | null
  ) => {
    if (result.status === "authenticated" && result.user) {
      user.value = result.user;
      token.value = savedToken;
      storage.setItem(AUTH_TOKEN_KEY, savedToken ?? "");
      storage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
      sessionStatus.value = "authenticated";
      return;
    }

    if (result.status === "anonymous") {
      clearLocalSession(storage);
      return;
    }

    // unverified: не выдаём неподтверждённого пользователя за авторизованного.
    user.value = null;
    token.value = null;
    sessionStatus.value = "unverified";
  };

  /**
   * Восстанавливает сессию после перезагрузки страницы.
   *
   * Сохранённый токен проверяется сервером (`/api/user/me`): localStorage сам
   * по себе не является доказательством авторизации. Пока сервер не ответил,
   * пользователь считается неавторизованным, поэтому права администратора до
   * подтверждения не показываются.
   */
  const initAuth = async (
    options?: InitAuthOptions
  ): Promise<SessionValidationResult> => {
    const storage = resolveStorage(options?.storage);
    if (!storage) {
      sessionStatus.value = "idle";
      return { status: "idle" };
    }

    activeStorage = storage;
    lastInitOptions = options;

    const fetchUser = options?.fetchUser ?? defaultFetchUser;
    const force = options?.force === true;

    const savedToken = storage.getItem(AUTH_TOKEN_KEY);

    // Параллельные вызовы (middleware + компоненты) не должны плодить запросы.
    if (pendingValidation && pendingValidation.token === savedToken) {
      return pendingValidation.promise;
    }

    // Свежий результат по тому же токену переиспользуем без нового запроса.
    if (
      !force &&
      lastValidation &&
      lastValidation.token === savedToken &&
      Date.now() - lastValidation.at < VALIDATION_CACHE_MS
    ) {
      applyValidationResult(lastValidation.result, storage, lastValidation.token);
      return lastValidation.result;
    }

    if (!savedToken) {
      user.value = null;
      token.value = null;
      storage.removeItem(AUTH_USER_KEY);
      sessionStatus.value = "anonymous";

      const result: SessionValidationResult = { status: "anonymous" };
      lastValidation = { at: Date.now(), result, token: null };
      return result;
    }

    sessionStatus.value = "validating";

    const request = requestSessionValidation(savedToken, fetchUser)
      .then((result) => {
        applyValidationResult(result, storage, savedToken);
        lastValidation = { at: Date.now(), result, token: savedToken };
        return result;
      })
      .finally(() => {
        pendingValidation = null;
      });

    pendingValidation = { token: savedToken, promise: request };
    return request;
  };

  /**
   * Безопасный повтор проверки сессии (после сетевой ошибки).
   */
  const retrySessionValidation = async (): Promise<SessionValidationResult> =>
    initAuth({ ...lastInitOptions, force: true });

  // Аутентификация по логину и паролю
  const loginWithCredentials = async (login: string, password: string) => {
    loading.value = true;

    try {
      const response = (await $fetch("/api/auth/login", {
        method: "POST",
        body: { login, password },
      })) as AuthResponse;

      const persisted = persistAuthenticatedSession(response);

      if (persisted) {
        // Сохраняем в localStorage
        const store = storageOrDefault();
        if (store) {
          store.setItem(AUTH_TOKEN_KEY, persisted.token);
          store.setItem(AUTH_USER_KEY, JSON.stringify(persisted.user));
        }
        sessionStatus.value = "authenticated";

        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed" };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Завершает вход через Telegram Login (OIDC).
   *
   * Токен проверяется на сервере: клиент лишь передаёт транзакцию и id_token.
   */
  const completeTelegramLogin = async (
    transaction: string,
    idToken: string
  ) => {
    loading.value = true;

    try {
      const response = (await $fetch("/api/auth/telegram-login/verify", {
        method: "POST",
        body: { transaction, idToken },
        signal: AbortSignal.timeout(15_000),
      })) as AuthResponse;

      const persisted = persistAuthenticatedSession(response);

      if (persisted) {
        const store = storageOrDefault();
        if (store) {
          store.setItem(AUTH_TOKEN_KEY, persisted.token);
          store.setItem(AUTH_USER_KEY, JSON.stringify(persisted.user));
        }
        sessionStatus.value = "authenticated";
        return { success: true };
      }

      return {
        success: false,
        error: "Не удалось завершить вход через Telegram",
      };
    } catch {
      return {
        success: false,
        error:
          "Не удалось подтвердить вход. Начните попытку заново или войдите по логину и паролю.",
      };
    } finally {
      loading.value = false;
    }
  };

  // Выход: серверный отзыв текущей сессии + очистка локального состояния.
  const logout = async () => {
    if (logoutLoading.value) {
      return {
        serverRevoked: false,
        localCleared: false,
        alreadyInProgress: true,
      };
    }
    logoutLoading.value = true;

    const sessionToken = token.value;
    let serverRevoked = !sessionToken;
    try {
      if (sessionToken) {
        const response = (await $fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${sessionToken}` },
          signal: AbortSignal.timeout(10_000),
        })) as { success?: boolean };
        serverRevoked = response.success === true;
      }
    } catch (error) {
      const statusCode = extractStatusCode(error);
      // 401 означает, что сессия уже недействительна — считаем отзыв выполненным.
      serverRevoked = statusCode === 401;
    } finally {
      logoutLoading.value = false;
    }

    const localCleared = clearLocalSession();

    return { serverRevoked, localCleared, alreadyInProgress: false };
  };

  // Обновление данных пользователя
  const refreshUser = async () => {
    if (!token.value) {
      return;
    }

    try {
      const response = (await $fetch("/api/user/me", {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })) as AuthResponse;

      if (response.success && response.user) {
        user.value = response.user;
        sessionStatus.value = "authenticated";

        const store = storageOrDefault();
        if (store) {
          store.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
        }
      } else {
        clearLocalSession();
      }
    } catch (error) {
      console.error("Refresh user error:", error);

      const statusCode = extractStatusCode(error);
      // Сессия отвергнута сервером — чистим локальное состояние.
      if (statusCode === 401 || statusCode === 403) {
        clearLocalSession();
      }
    }
  };

  // Проверка аутентификации
  const isAuthenticated = computed(() => !!user.value);

  // Проверка прав администратора
  const isAdmin = computed(() => user.value?.isAdmin || false);

  // Форматирование баланса
  const formattedBalance = computed(() => {
    if (!user.value) return "0 ₽";
    return `${(user.value.balance / 100).toFixed(0)} ₽`;
  });

  // Проверка состояния токена
  const checkTokenStatus = () => {
    const store = storageOrDefault();
    if (store) {
      const savedToken = store.getItem(AUTH_TOKEN_KEY);
      const savedUser = store.getItem(AUTH_USER_KEY);

      return {
        hasToken: !!savedToken,
        hasUser: !!savedUser,
        tokenLength: savedToken ? savedToken.length : 0,
        sessionStatus: sessionStatus.value,
      };
    }
    return null;
  };

  // Принудительная повторная проверка сессии на сервере
  const forceRefreshToken = async () => {
    const result = await retrySessionValidation();
    return result.status === "authenticated";
  };

  // Проверка валидности токена
  const validateToken = () => {
    if (import.meta.client && token.value) {
      try {
        const payloadPart = token.value.includes(".")
          ? token.value.split(".")[0]
          : token.value;
        const normalized = payloadPart
          .replace(/-/g, "+")
          .replace(/_/g, "/")
          .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
        const decoded = JSON.parse(atob(normalized));
        const currentTime = Math.floor(Date.now() / 1000);

        return {
          isValid: decoded.exp > currentTime,
          timeLeft: decoded.exp - currentTime,
          userId: decoded.userId,
        };
      } catch (error) {
        return {
          isValid: false,
          error: error instanceof Error ? error.message : "No token",
        };
      }
    }
    return { isValid: false, error: "No token" };
  };

  return {
    user: readonly(user),
    token: readonly(token),
    loading: readonly(loading),
    logoutLoading: readonly(logoutLoading),
    sessionStatus: readonly(sessionStatus),
    isAuthenticated,
    isAdmin,
    formattedBalance,
    initAuth,
    retrySessionValidation,
    loginWithCredentials,
    completeTelegramLogin,
    logout,
    clearLocalSession,
    refreshUser,
    checkTokenStatus,
    forceRefreshToken,
    validateToken,
  };
};
