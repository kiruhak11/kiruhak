import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

import {
  ANALYTICS_EVENT_PAGE_VIEW,
  ANALYTICS_SITE_ID_ATTRIBUTE,
  ANALYTICS_TRACKER_PATH,
} from "../constants/analytics";
import {
  analyticsEnabled,
  analyticsWriteAllowed,
  sanitizeAnalyticsPage,
  sanitizeAnalyticsReferrer,
  sanitizeAnalyticsUserAgent,
} from "../server/utils/analytics";
import { classifyApiRoute } from "../server/utils/auth-route-policy";
import { buildDocumentContentSecurityPolicy } from "../server/utils/content-security-policy";

/**
 * Регрессии трекера посещений.
 *
 * Поведение проверяется на самом поставляемом файле `public/analytics.js`:
 * он выполняется в изолированном контексте с подменёнными `window`,
 * `document`, `navigator` и `fetch`. Никаких сетевых запросов и записей
 * в базу — проверяется только логика клиента.
 */

const trackerSource = readFileSync(
  new URL("../public/analytics.js", import.meta.url),
  "utf8"
);
const pluginSource = readFileSync(
  new URL("../plugins/analytics.client.ts", import.meta.url),
  "utf8"
);
const snippetSource = readFileSync(
  new URL("../server/api/sites.post.ts", import.meta.url),
  "utf8"
);
const trackSource = readFileSync(
  new URL("../server/api/analytics/track.post.ts", import.meta.url),
  "utf8"
);
const trackSimpleSource = readFileSync(
  new URL("../server/api/analytics/track-simple.post.ts", import.meta.url),
  "utf8"
);
const analyticsUtilSource = readFileSync(
  new URL("../server/utils/analytics.ts", import.meta.url),
  "utf8"
);
const configEndpointSource = readFileSync(
  new URL("../server/api/analytics/config.get.ts", import.meta.url),
  "utf8"
);

type TrackerCall = { url: string; body: Record<string, unknown> };

type HarnessOptions = {
  siteId?: string | null;
  pathname?: string;
  search?: string;
  referrer?: string;
  respond?: { status: number; body?: unknown } | "network-error";
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const runTracker = (options: HarnessOptions = {}) => {
  const calls: TrackerCall[] = [];
  const warnings: string[] = [];
  const respond = options.respond ?? { status: 200, body: { success: true } };

  const script = {
    getAttribute: (name: string) =>
      name === ANALYTICS_SITE_ID_ATTRIBUTE ? options.siteId ?? null : null,
  };

  const location = {
    origin: "https://kiruhak11.ru",
    hostname: "kiruhak11.ru",
    pathname: options.pathname ?? "/",
    search: options.search ?? "",
  };

  const win: Record<string, unknown> = {
    location,
    fetch: async (url: string, init: { body: string }) => {
      calls.push({ url, body: JSON.parse(init.body) });
      if (respond === "network-error") throw new TypeError("fetch failed");
      return {
        ok: respond.status >= 200 && respond.status < 300,
        status: respond.status,
        json: async () => respond.body,
      };
    },
  };

  const sandbox: Record<string, unknown> = {
    window: win,
    document: {
      currentScript: script,
      referrer: options.referrer ?? "",
    },
    navigator: { userAgent: "test-agent" },
    console: { warn: (message: unknown) => warnings.push(String(message)) },
    URL,
    Date,
    setTimeout,
  };

  vm.createContext(sandbox);
  vm.runInContext(trackerSource, sandbox);

  return {
    calls,
    warnings,
    tracker: win.KiruhakAnalytics as
      | { trackPageView: () => void; isEnabled: () => boolean }
      | undefined,
  };
};

// --- 1. Нет CSP-блокируемого инлайн-скрипта ---------------------------------

test("плагин и сниппет не создают инлайн-скрипт", () => {
  assert.doesNotMatch(pluginSource, /innerHTML/);
  assert.doesNotMatch(pluginSource, /KIRUHAK_SITE_ID/);
  assert.doesNotMatch(snippetSource, /window\.KIRUHAK_SITE_ID/);
  assert.doesNotMatch(snippetSource, /<script>/);
  assert.match(pluginSource, /data-site-id/);
  assert.match(snippetSource, /data-site-id/);
  assert.match(trackerSource, /data-site-id/);
});

// --- 2. Валидный siteId передаётся корректно ---------------------------------

test("валидный siteId передаётся трекеру и уходит в запрос", () => {
  const { calls } = runTracker({ siteId: "site-valid-1" });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.siteId, "site-valid-1");
  assert.equal(calls[0].body.event, ANALYTICS_EVENT_PAGE_VIEW);
  assert.equal(calls[0].url, "https://kiruhak11.ru/api/analytics/track");
});

// --- 3. Некорректный siteId не создаёт событий -------------------------------

test("без идентификатора сайта трекер не отправляет ничего", () => {
  const { calls, tracker } = runTracker({ siteId: null });

  assert.equal(calls.length, 0, "запросов быть не должно");
  assert.equal(tracker, undefined, "трекер не должен инициализироваться");
});

test("неподтверждённый ответ сервера отключает трекер", async () => {
  const { calls, tracker } = runTracker({
    siteId: "site-unknown-1",
    respond: { status: 200, body: { success: false, error: "Site not found" } },
  });
  await flush();

  assert.equal(calls.length, 1);
  assert.equal(tracker?.isEnabled(), false);

  const before = calls.length;
  tracker?.trackPageView();
  await flush();
  assert.equal(calls.length, before, "после отказа повторов быть не должно");
});

// --- 4. Первый page view учитывается один раз ---------------------------------

test("повторный вызов с тем же путём не создаёт второе событие", async () => {
  const { calls, tracker } = runTracker({ siteId: "site-valid-1" });
  await flush();

  assert.equal(calls.length, 1);
  tracker?.trackPageView();
  tracker?.trackPageView();
  await flush();
  assert.equal(calls.length, 1, "один переход — одно событие");
});

test("переход на другой путь создаёт новое событие", async () => {
  const { calls, tracker } = runTracker({ siteId: "site-valid-1" });
  await flush();

  const win = tracker as unknown as { trackPageView: () => void };
  win.trackPageView();
  await flush();
  assert.equal(calls.length, 1);
});

// --- 5/6. SPA и Back/Forward не ломают счётчик --------------------------------

test("трекер не подменяет history и не дублирует обработчики", () => {
  assert.doesNotMatch(trackerSource, /history\.pushState\s*=/);
  assert.doesNotMatch(trackerSource, /addEventListener\("click"/);
  assert.doesNotMatch(trackerSource, /beforeunload/);
  assert.doesNotMatch(trackerSource, /sendBeacon/);
  assert.match(pluginSource, /page:finish/);
});

// --- 7. Click не становится Visit ---------------------------------------------

test("трекер не отправляет типы событий, которых нет в модели Visit", () => {
  for (const event of ["click", "time_on_page", "page_refresh"]) {
    assert.doesNotMatch(trackerSource, new RegExp(event));
  }
  assert.doesNotMatch(trackerSource, /localStorage/);
  assert.doesNotMatch(trackerSource, /sessionId/);
});

test("сервер принимает только просмотр страницы", () => {
  // Проверка типа события живёт в общей утилите записи посещения.
  assert.match(analyticsUtilSource, /event !== ANALYTICS_SUPPORTED_EVENT/);
  assert.match(analyticsUtilSource, /Unsupported event type/);
  assert.match(analyticsUtilSource, /!site \|\| !site\.isActive/);

  // Оба endpoint'а обращаются к этой утилите и не создают Visit напрямую.
  for (const source of [trackSource, trackSimpleSource]) {
    assert.match(source, /recordAnalyticsPageView/);
    assert.doesNotMatch(source, /prisma\.visit\.create/);
  }
});

// --- 8. Ошибочный ответ API не считается успехом -----------------------------

test("ответ 429 не вызывает повторов", async () => {
  const { calls, tracker } = runTracker({
    siteId: "site-valid-1",
    respond: { status: 429, body: { error: "Too many requests" } },
  });
  await flush();

  assert.equal(calls.length, 1, "автоматического повтора быть не должно");
  assert.equal(tracker?.isEnabled(), true, "ограничение частоты не отключает трекер");
});

test("сетевая ошибка не вызывает повторов", async () => {
  const { calls } = runTracker({
    siteId: "site-valid-1",
    respond: "network-error",
  });
  await flush();

  assert.equal(calls.length, 1, "автоматического повтора быть не должно");
});

test("в консоль не попадают payload и идентификаторы", async () => {
  const { warnings } = runTracker({
    siteId: "site-valid-1",
    respond: { status: 200, body: { success: false } },
  });
  await flush();

  for (const warning of warnings) {
    assert.doesNotMatch(warning, /site-valid-1/);
    assert.doesNotMatch(warning, /userAgent/);
    assert.doesNotMatch(warning, /page/);
  }
});

// --- 9. Retry-After и 429 не вызывают шторм запросов --------------------------

test("трекер не содержит циклов повторных отправок", () => {
  assert.doesNotMatch(trackerSource, /setInterval/);
  assert.doesNotMatch(trackerSource, /retry\s*:/i);
  assert.doesNotMatch(trackerSource, /while\s*\(/);
});

// --- 10. Чувствительные query-параметры не попадают в payload -----------------

test("query-параметры не попадают в payload трекера", async () => {
  const { calls } = runTracker({
    siteId: "site-valid-1",
    pathname: "/account/recovery",
    search: "?token=super-secret",
    referrer: "https://kiruhak11.ru/login?next=/admin&token=secret",
  });
  await flush();

  const body = calls[0].body;
  assert.equal(body.page, "/account/recovery");
  assert.doesNotMatch(String(body.page), /\?/);
  assert.equal(body.referrer, "https://kiruhak11.ru/login");
  assert.doesNotMatch(String(body.referrer), /token/);
});

test("сервер вырезает query-параметры из сохраняемых данных", () => {
  assert.equal(
    sanitizeAnalyticsPage("/account/recovery?token=secret"),
    "/account/recovery"
  );
  assert.equal(sanitizeAnalyticsPage("/?utm=1#frag"), "/");
  assert.equal(sanitizeAnalyticsPage(""), "/");
  assert.equal(
    sanitizeAnalyticsReferrer("https://kiruhak11.ru/login?token=secret"),
    "https://kiruhak11.ru/login"
  );
  assert.equal(sanitizeAnalyticsReferrer(""), null);
  assert.equal(sanitizeAnalyticsUserAgent("  agent  "), "agent");
  assert.equal(sanitizeAnalyticsUserAgent(""), "unknown");
});

// --- 11/12. SSR, hydration и CSP ---------------------------------------------

test("трекер подключается только по разрешению runtime-конфигурации", () => {
  assert.match(pluginSource, /\/api\/analytics\/config/);
  assert.match(pluginSource, /ANALYTICS_TRACKER_PATH/);
  assert.match(pluginSource, /ANALYTICS_SITE_ID_ATTRIBUTE/);
  assert.match(pluginSource, /page:finish/);
  assert.equal(ANALYTICS_TRACKER_PATH, "/analytics.js");
  assert.equal(ANALYTICS_SITE_ID_ATTRIBUTE, "data-site-id");
});

test("пререндеренные страницы не включают трекер по значению из payload", () => {
  // Идентификатор собирается при сборке и в пререндере устаревает: по нему
  // трекер включаться не должен. Разрешение спрашивается у сервера.
  assert.doesNotMatch(pluginSource, /analyticsSiteId/);
  assert.doesNotMatch(pluginSource, /public\./);
  assert.doesNotMatch(configEndpointSource, /public\.analyticsSiteId/);

  // Ответ конфигурации — единственный источник разрешения, и он явно
  // требует подтверждения: тишина и ошибка означают «не включать».
  assert.match(pluginSource, /response\?\.enabled !== true/);
  assert.match(configEndpointSource, /enabled/);
  assert.match(configEndpointSource, /analyticsEnabled\(\)/);

  // Запрос конфигурации не должен блокировать запуск приложения.
  assert.doesNotMatch(pluginSource, /await \$fetch/);
});

test("конфигурация аналитики не кэшируется", () => {
  // Иначе выключенная аналитика оставалась бы включённой из-за
  // закэшированного публичного ответа.
  assert.match(configEndpointSource, /Cache-Control/);
  assert.match(configEndpointSource, /no-store/);
  assert.doesNotMatch(configEndpointSource, /max-age=300/);
});

test("сбор посещений по умолчанию выключен", () => {
  const previous = process.env.ANALYTICS_ENABLED;
  try {
    delete process.env.ANALYTICS_ENABLED;
    assert.equal(analyticsEnabled(), false);

    process.env.ANALYTICS_ENABLED = "true";
    assert.equal(analyticsEnabled(), true);

    process.env.ANALYTICS_ENABLED = "TRUE";
    assert.equal(analyticsEnabled(), true);

    process.env.ANALYTICS_ENABLED = "false";
    assert.equal(analyticsEnabled(), false);

    process.env.ANALYTICS_ENABLED = "1";
    assert.equal(analyticsEnabled(), false, "включает только явный true");
  } finally {
    if (previous === undefined) delete process.env.ANALYTICS_ENABLED;
    else process.env.ANALYTICS_ENABLED = previous;
  }
});

test("выключенный сбор не пишет для сайта приложения и не запрещает чужие", () => {
  const previousFlag = process.env.ANALYTICS_ENABLED;
  const previousSite = process.env.NUXT_PUBLIC_ANALYTICS_SITE_ID;
  try {
    process.env.ANALYTICS_ENABLED = "false";
    process.env.NUXT_PUBLIC_ANALYTICS_SITE_ID = "site-of-the-application";

    assert.equal(
      analyticsWriteAllowed("site-of-the-application"),
      false,
      "сайт приложения при выключенном сборе писаться не должен"
    );
    assert.equal(
      analyticsWriteAllowed("site-of-a-client"),
      true,
      "глобальный запрет сломал бы трекинг чужих сайтов"
    );

    process.env.ANALYTICS_ENABLED = "true";
    assert.equal(analyticsWriteAllowed("site-of-the-application"), true);
  } finally {
    if (previousFlag === undefined) delete process.env.ANALYTICS_ENABLED;
    else process.env.ANALYTICS_ENABLED = previousFlag;
    if (previousSite === undefined) delete process.env.NUXT_PUBLIC_ANALYTICS_SITE_ID;
    else process.env.NUXT_PUBLIC_ANALYTICS_SITE_ID = previousSite;
  }
});

test("оба endpoint'а записи отказывают при выключенном сборе", () => {
  for (const source of [trackSource, trackSimpleSource]) {
    assert.match(source, /analyticsWriteAllowed/);
    assert.match(source, /Analytics is disabled/);
  }
});

test("CSP не ослаблена: в script-src нет unsafe-inline", () => {
  const policy = buildDocumentContentSecurityPolicy(["sha256-abc"], true);
  const scriptSrc = policy
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("script-src"));

  assert.ok(scriptSrc, "в политике должна быть директива script-src");
  assert.doesNotMatch(scriptSrc, /unsafe-inline/);
  assert.doesNotMatch(scriptSrc, /unsafe-eval/);
  assert.match(scriptSrc, /'self'/);
});

test("маршрут конфигурации аналитики публичен только для чтения", () => {
  const decision = classifyApiRoute("/api/analytics/config", "GET");
  assert.equal(decision.kind, "allow");
  assert.equal(decision.policy, "public");

  // Метод, которого маршрут не поддерживает, отклоняется.
  const write = classifyApiRoute("/api/analytics/config", "POST");
  assert.notEqual(write.kind, "allow");
});
