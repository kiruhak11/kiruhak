import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  LEAD_ENDPOINT,
  buildLeadPayload,
  classifyLeadError,
  isValidLeadEmail,
  missingLeadFields,
  useLeadSubmission,
  type LeadFetcher,
  type LeadStorage,
} from "../composables/useLeadSubmission";

/**
 * Регрессии формы заявки.
 *
 * Проверяется общий компонент `components/portfolio/LeadContactForm.vue` и
 * composable `composables/useLeadSubmission.ts`, которые используются и на
 * главной странице, и на `/contact`.
 *
 * Сетевые вызовы не выполняются: используется подставной fetch-заглушка и
 * подставное хранилище, поэтому реальные заявки и уведомления не создаются.
 */

const readSource = (path: string): string =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const contactPage = readSource("../pages/contact.vue");
const homePage = readSource("../pages/index.vue");
const formComponent = readSource("../components/portfolio/LeadContactForm.vue");

type FetchCall = {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body: Record<string, string>;
};

const createHarness = (
  respond: (call: FetchCall) => Promise<unknown> | unknown
) => {
  const calls: FetchCall[] = [];
  const store = new Map<string, string>();

  const storage: LeadStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };

  const fetcher: LeadFetcher = async (endpoint, options) => {
    const call: FetchCall = {
      endpoint,
      method: options.method,
      headers: options.headers,
      body: options.body,
    };
    calls.push(call);
    return respond(call);
  };

  const submission = useLeadSubmission({ fetch: fetcher, storage });

  return { calls, store, storage, submission };
};

const fillValidLead = (submission: ReturnType<typeof useLeadSubmission>) => {
  submission.values.name = "Кирилл";
  submission.values.email = "web@kiruhak11.ru";
  submission.values.task = "Нужен лендинг для услуг";
};

const httpError = (statusCode: number, statusMessage = "", headers?: Record<string, string>) => ({
  statusCode,
  statusMessage,
  response: headers ? { status: statusCode, headers } : undefined,
});

// --- 1. Форма на /contact существует -----------------------------------------

test("страница /contact содержит общую форму заявки и собственный якорь", () => {
  assert.match(contactPage, /<PortfolioLeadContactForm/);
  assert.match(contactPage, /id="contact-form"/);
  assert.match(contactPage, /id-prefix="contact-lead"/);
});

// --- 2. Главная продолжает использовать форму ---------------------------------

test("главная страница использует ту же общую форму и сохраняет свой якорь", () => {
  assert.match(homePage, /<PortfolioLeadContactForm/);
  assert.match(homePage, /id="application-form"/);
  // Логика формы не дублируется в странице.
  assert.doesNotMatch(homePage, /api\/telegram/);
  assert.doesNotMatch(homePage, /Idempotency-Key/);
  assert.doesNotMatch(homePage, /<form/);
});

// --- 3. Отправка использует существующий API ----------------------------------

test("форма отправляет заявку в существующий эндпоинт без изменений контракта", () => {
  const composable = readSource("../composables/useLeadSubmission.ts");

  assert.equal(LEAD_ENDPOINT, "/api/telegram");
  assert.match(composable, /method: "POST"/);
  assert.match(composable, /"Idempotency-Key"/);
  assert.doesNotMatch(formComponent, /api\/telegram/);
  // Набор полей совпадает с серверным контрактом.
  assert.deepEqual(
    Object.keys(buildLeadPayload({
      name: "a",
      contact: "b",
      email: "c",
      business: "d",
      task: "e",
      budget: "f",
    })).sort(),
    ["budget", "business", "contact", "email", "name", "task"]
  );
});

// --- 4. Idempotency-Key формируется корректно ---------------------------------

test("ключ идемпотентности соответствует правилам сервера", async () => {
  const { calls, submission } = createHarness(() => ({
    status: "saved",
    delivery: "queued",
    duplicate: false,
  }));
  fillValidLead(submission);
  await submission.submit();

  assert.equal(calls.length, 1);
  const key = calls[0].headers["Idempotency-Key"];
  assert.ok(key, "заголовок Idempotency-Key обязателен");
  assert.match(key, /^[A-Za-z0-9_-]{16,128}$/);
});

// --- 5. Повторный submit не создаёт дубликатов --------------------------------

test("повторное нажатие во время отправки не создаёт вторую запись", async () => {
  let release: () => void = () => {};
  const { calls, submission } = createHarness(async () => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return { status: "saved", delivery: "queued", duplicate: false };
  });
  fillValidLead(submission);

  const first = submission.submit();
  // Второе нажатие приходит, пока первый запрос ещё в полёте.
  const second = submission.submit();
  release();
  await Promise.all([first, second]);

  assert.equal(calls.length, 1, "второй запрос не должен уходить на сервер");
});

test("после подтверждённого успеха следующая заявка получает новый ключ", async () => {
  const { calls, submission } = createHarness(() => ({
    status: "saved",
    delivery: "queued",
    duplicate: false,
  }));
  fillValidLead(submission);

  await submission.submit();
  fillValidLead(submission);
  await submission.submit();

  assert.equal(calls.length, 2);
  assert.notEqual(
    calls[0].headers["Idempotency-Key"],
    calls[1].headers["Idempotency-Key"],
    "новая заявка — новый ключ"
  );
});

// --- 6. Успешные ответы 200 и 202 ---------------------------------------------

test("ответ 202 (заявка поставлена в очередь) считается подтверждением", async () => {
  const { submission } = createHarness(() => ({
    status: "saved",
    delivery: "queued",
    duplicate: false,
  }));
  fillValidLead(submission);
  const result = await submission.submit();

  assert.deepEqual(result, { duplicate: false });
  assert.equal(submission.state.value, "success");
  assert.equal(submission.values.name, "");
  assert.equal(submission.values.task, "");
});

test("ответ 200 с duplicate:true считается подтверждением сохранённой заявки", async () => {
  const { submission } = createHarness(() => ({
    status: "saved",
    delivery: "queued",
    duplicate: true,
  }));
  fillValidLead(submission);
  const result = await submission.submit();

  assert.deepEqual(result, { duplicate: true });
  assert.equal(submission.state.value, "success");
  assert.equal(submission.result.value?.duplicate, true);
});

// --- 7. Ошибка 400 --------------------------------------------------------------

test("ответ 400 даёт понятное сообщение и сохраняет введённые данные", async () => {
  const { submission } = createHarness(() => {
    throw httpError(400, "REQUIRED_FIELDS");
  });
  fillValidLead(submission);
  await submission.submit();

  assert.equal(submission.state.value, "error");
  assert.equal(submission.error.value?.kind, "validation");
  assert.match(submission.error.value?.message ?? "", /обязательны имя, email и описание задачи/i);
  assert.equal(submission.values.name, "Кирилл");
  assert.equal(submission.values.task, "Нужен лендинг для услуг");
});

// --- 8. Конфликт 409 ------------------------------------------------------------

test("ответ 409 трактуется как конфликт ключа идемпотентности", async () => {
  const { submission } = createHarness(() => {
    throw httpError(409, "Idempotency key was already used with different content");
  });
  fillValidLead(submission);
  await submission.submit();

  assert.equal(submission.state.value, "error");
  assert.equal(submission.error.value?.kind, "conflict");
  assert.equal(submission.error.value?.statusCode, 409);
  assert.equal(submission.values.task, "Нужен лендинг для услуг");
});

// --- 9. Ограничение 429 --------------------------------------------------------

test("ответ 429 показывает ограничение частоты и учитывает Retry-After", async () => {
  const { submission } = createHarness(() => {
    throw httpError(429, "Too many requests", { "retry-after": "600" });
  });
  fillValidLead(submission);
  await submission.submit();

  assert.equal(submission.state.value, "error");
  assert.equal(submission.error.value?.kind, "rate-limit");
  assert.equal(submission.error.value?.retryAfterSeconds, 600);
  assert.match(submission.error.value?.message ?? "", /10 мин/);
});

test("ответ 429 без Retry-After всё равно объясняет ситуацию", async () => {
  const { submission } = createHarness(() => {
    throw httpError(429, "Too many requests");
  });
  fillValidLead(submission);
  await submission.submit();

  assert.equal(submission.error.value?.kind, "rate-limit");
  assert.match(submission.error.value?.message ?? "", /чуть позже/);
});

// --- 10. Временная ошибка 503 --------------------------------------------------

test("ответ 503 сохраняет данные и предлагает повторить отправку", async () => {
  const { submission } = createHarness(() => {
    throw httpError(503, "Could not save the request. Please retry.");
  });
  fillValidLead(submission);
  await submission.submit();

  assert.equal(submission.state.value, "error");
  assert.equal(submission.error.value?.kind, "temporary");
  assert.match(submission.error.value?.message ?? "", /Данные не потеряны/);
  assert.equal(submission.values.name, "Кирилл");
});

// --- 11. Сетевая ошибка --------------------------------------------------------

test("сетевая ошибка распознаётся и не выдаётся за успех", async () => {
  const { submission } = createHarness(() => {
    throw new TypeError("fetch failed");
  });
  fillValidLead(submission);
  await submission.submit();

  assert.equal(submission.state.value, "error");
  assert.equal(submission.error.value?.kind, "network");
  assert.match(submission.error.value?.message ?? "", /Нет связи с сервером/);
  assert.notEqual(submission.state.value, "success");
});

// --- 12. Повторная отправка без потери данных ----------------------------------

test("после ошибки отправку можно повторить без потери данных", async () => {
  let attempt = 0;
  const { calls, submission } = createHarness(() => {
    attempt += 1;
    if (attempt === 1) throw httpError(503, "Could not save the request. Please retry.");
    return { status: "saved", delivery: "queued", duplicate: false };
  });
  fillValidLead(submission);

  await submission.submit();
  assert.equal(submission.state.value, "error");
  assert.equal(submission.values.task, "Нужен лендинг для услуг");

  await submission.submit();
  assert.equal(submission.state.value, "success");
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].body, calls[1].body, "тело заявки не должно меняться при повторе");
  assert.equal(
    calls[0].headers["Idempotency-Key"],
    calls[1].headers["Idempotency-Key"],
    "повтор той же заявки использует прежний ключ"
  );
});

test("изменение данных после ошибки создаёт новый ключ", async () => {
  let attempt = 0;
  const { calls, submission } = createHarness(() => {
    attempt += 1;
    if (attempt === 1) throw httpError(503, "Could not save the request. Please retry.");
    return { status: "saved", delivery: "queued", duplicate: false };
  });
  fillValidLead(submission);

  await submission.submit();
  submission.values.task = "Нужен лендинг для услуг, обновлённое описание";
  submission.handleInput();
  await submission.submit();

  assert.equal(calls.length, 2);
  assert.notEqual(
    calls[0].headers["Idempotency-Key"],
    calls[1].headers["Idempotency-Key"],
    "изменённая заявка — новый ключ"
  );
});

test("форма не сбрасывается до подтверждённого успеха", async () => {
  const { submission } = createHarness(() => {
    throw httpError(400, "REQUIRED_FIELDS");
  });
  fillValidLead(submission);
  await submission.submit();

  assert.notEqual(submission.values.name, "");
  assert.notEqual(submission.values.email, "");
  assert.notEqual(submission.values.task, "");
});

// --- 13. Ссылка на политику обработки данных -----------------------------------

test("форма и страница /contact содержат ссылку на политику обработки данных", () => {
  assert.match(formComponent, /to="\/legal\/privacy"/);
  assert.match(contactPage, /to="\/legal\/privacy"/);
  assert.match(homePage, /PortfolioLeadContactForm/);
});

test("на странице /contact сохранены быстрые способы связи", () => {
  assert.match(contactPage, /publicContact\.telegram\.href/);
  assert.match(contactPage, /publicContact\.email\.href/);
  assert.match(contactPage, /publicContact\.github\.href/);
  assert.doesNotMatch(contactPage, /publicContact\.phone|publicContact\.vk/);
});

// --- 14. SSR и гидратация ------------------------------------------------------

test("форма серверно-рендерится и доступна с клавиатуры", () => {
  assert.match(formComponent, /<form[\s\S]*?@submit\.prevent="submit"/);
  assert.match(formComponent, /aria-label/);
  assert.match(formComponent, /aria-live="polite"/);
  assert.match(formComponent, /role="alert"/);
  assert.match(formComponent, /:aria-busy="isSubmitting"/);
  assert.match(formComponent, /:disabled="isSubmitting"/);
  assert.match(formComponent, /autocomplete="name"/);
  assert.match(formComponent, /autocomplete="email"/);
  assert.match(formComponent, /autocomplete="organization"/);
  // Браузерные API не используются во время SSR.
  assert.doesNotMatch(formComponent, /window\./);
});

test("валидация на клиенте совпадает с серверной", () => {
  assert.deepEqual(
    missingLeadFields({
      name: "",
      contact: "",
      email: "web@kiruhak11.ru",
      business: "",
      task: "",
      budget: "",
    }),
    ["name", "task"]
  );
  assert.equal(isValidLeadEmail("web@kiruhak11.ru"), true);
  assert.equal(isValidLeadEmail("не-почта"), false);
  assert.equal(classifyLeadError(httpError(503)).kind, "temporary");
});
