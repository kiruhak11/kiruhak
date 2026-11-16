import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";

/**
 * Регрессии security-заголовков.
 *
 * Плагин подключается через Nitro, поэтому его глобальные авто-импорты
 * подменяются: так проверяется именно фактическая установка заголовков,
 * а не только чистые функции построения политики.
 */

type HeaderBag = Map<string, string>;

type FakeEvent = {
  node: { res: { __bag: HeaderBag; getHeader: (name: string) => string | undefined } };
  context: Record<string, unknown>;
  path: string;
  headers?: Record<string, string>;
};

const createEvent = (
  contentType?: string,
  path = "/"
): { event: FakeEvent; bag: HeaderBag } => {
  const bag: HeaderBag = new Map();
  const event: FakeEvent = {
    node: {
      res: {
        __bag: bag,
        getHeader: (name: string) => bag.get(name),
      },
    },
    context: {},
    path,
  };
  if (contentType) bag.set("content-type", contentType);
  return { event, bag };
};

type SecurityHeadersModule = typeof import("../server/plugins/security-headers");

let pluginPromise: Promise<{
  runBeforeResponse: (event: unknown, body?: unknown) => Promise<unknown[]>;
  runError: (event: unknown) => Promise<unknown[]>;
  runRenderHtml: (
    context: Record<string, unknown>,
    event: unknown
  ) => Promise<unknown[]>;
  module: SecurityHeadersModule;
}> | null = null;

/**
 * Модуль плагина импортируется один раз: ESM кэширует импорт, поэтому
 * загрузчик мемоизирован, иначе хуки регистрировались бы только в первом
 * тесте.
 */
const loadPlugin = () => {
  if (!pluginPromise) pluginPromise = loadPluginOnce();
  return pluginPromise;
};

const loadPluginOnce = async () => {
  const hooks = new Map<
    string,
    Array<(event: unknown, payload?: unknown) => unknown>
  >();
  const globals = globalThis as unknown as Record<string, unknown>;

  globals.defineNitroPlugin = (factory: (nitroApp: unknown) => void) => {
    factory({
      hooks: {
        hook: (
          name: string,
          callback: (event: unknown, payload?: unknown) => unknown
        ) => {
          const list = hooks.get(name) ?? [];
          list.push(callback);
          hooks.set(name, list);
        },
      },
    });
  };

  globals.getResponseHeader = (
    event: FakeEvent,
    name: string
  ): string | undefined => event.node.res.getHeader(name);

  globals.getRequestURL = (event: FakeEvent) => ({
    pathname: event.path,
    protocol: "http:",
  });

  globals.getRequestHeader = (event: FakeEvent, name: string) =>
    event.headers?.[name];

  globals.setResponseHeader = (
    event: FakeEvent,
    name: string,
    value: string
  ): void => {
    // Имена HTTP-заголовков регистронезависимы.
    event.node.res.__bag.set(name.toLowerCase(), value);
  };

  const module: SecurityHeadersModule = await import(
    "../server/plugins/security-headers"
  );

  return {
    module,
    runBeforeResponse: (event: unknown, body?: unknown) =>
      Promise.all(
        (hooks.get("beforeResponse") ?? []).map((hook) => hook(event, { body }))
      ),
    runError: (event: unknown) =>
      Promise.all(
        (hooks.get("error") ?? []).map((hook) =>
          hook(new Error("test"), { event })
        )
      ),
    runRenderHtml: (context: Record<string, unknown>, event: unknown) =>
      Promise.all(
        (hooks.get("render:html") ?? []).map((hook) => hook(context, { event }))
      ),
  };
};

test("security headers are present on document responses", async () => {
  const plugin = await loadPlugin();
  const { event, bag } = createEvent("text/html; charset=utf-8");

  await plugin.runBeforeResponse(event, "<html><body>ok</body></html>");

  assert.equal(bag.get("x-content-type-options"), "nosniff");
  assert.equal(bag.get("x-frame-options"), "DENY");
  assert.equal(bag.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(bag.get("strict-transport-security"), "max-age=31536000");
  assert.match(bag.get("permissions-policy") ?? "", /camera=\(\)/);
  assert.match(bag.get("permissions-policy") ?? "", /microphone=\(\)/);
  assert.match(bag.get("permissions-policy") ?? "", /clipboard-write=\(self\)/);
  assert.ok(bag.get("content-security-policy"));
});

test("security headers are present on API responses and match the Nitro error policy", async () => {
  const plugin = await loadPlugin();
  const { event, bag } = createEvent("application/json");

  await plugin.runBeforeResponse(event, JSON.stringify({ success: true }));

  assert.equal(bag.get("x-content-type-options"), "nosniff");
  assert.equal(bag.get("x-frame-options"), "DENY");
  assert.equal(bag.get("referrer-policy"), "no-referrer");
  assert.equal(
    bag.get("content-security-policy"),
    "script-src 'none'; frame-ancestors 'none';"
  );
  assert.equal(bag.get("strict-transport-security"), "max-age=31536000");
});

test("a response never carries contradictory values of the same header", async () => {
  const plugin = await loadPlugin();
  const { event, bag } = createEvent("application/json");

  await plugin.runBeforeResponse(event, JSON.stringify({ success: true }));
  await plugin.runError(event);

  for (const name of [
    "x-content-type-options",
    "x-frame-options",
    "referrer-policy",
    "content-security-policy",
  ]) {
    const values = [...bag.entries()].filter(([key]) => key === name);
    assert.equal(values.length, 1, `${name} должен присутствовать ровно один раз`);
  }

  // Значения, которые задаёт обработчик ошибок Nitro, должны совпадать с
  // политикой API-ответов, иначе успешные и ошибочные ответы расходились бы.
  assert.equal(
    bag.get("content-security-policy"),
    "script-src 'none'; frame-ancestors 'none';"
  );
  assert.equal(bag.get("referrer-policy"), "no-referrer");
});

test("error responses keep the headers set by the plugin", async () => {
  const plugin = await loadPlugin();
  const { event, bag } = createEvent("text/html");

  await plugin.runError(event);

  assert.equal(bag.get("x-content-type-options"), "nosniff");
  assert.equal(bag.get("x-frame-options"), "DENY");
  assert.equal(bag.get("strict-transport-security"), "max-age=31536000");
  assert.match(bag.get("permissions-policy") ?? "", /geolocation=\(\)/);
});

test("document CSP stays compatible with hydration, fonts, forms and the Telegram Login SDK", async () => {
  const plugin = await loadPlugin();
  const { event, bag } = createEvent("text/html", "/__csp-hash-probe");

  const inlineScript = "window.__NUXT__={};window.__NUXT__.config={public:{}};";
  const body = `<html><head><script>${inlineScript}</script></head><body></body></html>`;

  await plugin.runBeforeResponse(event, body);

  const csp = bag.get("content-security-policy") ?? "";

  // Гидратация: внешний скрипт приложения и инлайновый bootstrap по хешу.
  assert.match(csp, /script-src 'self'/);
  const expectedHash = `'sha256-${createHash("sha256")
    .update(inlineScript, "utf8")
    .digest("base64")}'`;
  assert.ok(csp.includes(expectedHash), "в CSP должен быть хеш инлайнового скрипта");

  // Telegram Login SDK и oauth.telegram.org.
  assert.match(csp, /script-src[^;]*https:\/\/oauth\.telegram\.org/);
  assert.match(csp, /frame-src[^;]*https:\/\/telegram\.org/);
  assert.match(csp, /connect-src[^;]*https:\/\/oauth\.telegram\.org/);

  // Шрифты, изображения и инлайновые стили Nuxt.
  assert.match(csp, /font-src 'self' data:/);
  assert.match(csp, /img-src 'self' data: blob:/);
  assert.match(csp, /style-src 'self' 'unsafe-inline'/);

  // Формы остаются внутри сайта.
  assert.match(csp, /form-action 'self'/);

  // Запрещённые конструкции.
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.doesNotMatch(csp, /yandex|metrika/i);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
});

test("CSP hashes are collected from the document parts rendered by Nitro", async () => {
  const plugin = await loadPlugin();
  const { event, bag } = createEvent("text/html");

  const inlineScript = "window.__NUXT__={};window.__NUXT__.config={public:{}};";
  await plugin.runRenderHtml(
    {
      head: [`<script src="/_nuxt/entry.js"></script><script>${inlineScript}</script>`],
      body: ['<div id="__nuxt"></div>'],
      bodyPrepend: [],
      bodyAppend: [],
    },
    event
  );
  await plugin.runBeforeResponse(event, { body: { body: "<html></html>" } });

  const csp = bag.get("content-security-policy") ?? "";
  const expectedHash = `'sha256-${createHash("sha256")
    .update(inlineScript, "utf8")
    .digest("base64")}'`;
  assert.ok(csp.includes(expectedHash), "хеш инлайнового скрипта должен попасть в CSP");
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
});

test("upgrade-insecure-requests is only applied to secure requests", async () => {
  const plugin = await loadPlugin();

  const insecure = createEvent("text/html", "/__csp-probe");
  await plugin.runBeforeResponse(insecure.event, { body: { body: "<html></html>" } });
  assert.doesNotMatch(
    insecure.bag.get("content-security-policy") ?? "",
    /upgrade-insecure-requests/
  );

  const secure = createEvent("text/html", "/__csp-probe");
  secure.event.headers = { "x-forwarded-proto": "https" };
  await plugin.runBeforeResponse(secure.event, { body: { body: "<html></html>" } });
  assert.match(
    secure.bag.get("content-security-policy") ?? "",
    /upgrade-insecure-requests/
  );
});

test("prerendered pages get their own script hashes instead of unsafe-inline", async () => {
  const plugin = await loadPlugin();
  const { event, bag } = createEvent("text/html");

  const inlineScript = "window.__NUXT__={};window.__NUXT__.config={public:{}};";
  plugin.module.prerenderedScriptHashes.set("/", [
    `'sha256-${createHash("sha256").update(inlineScript, "utf8").digest("base64")}'`,
  ]);

  try {
    await plugin.runBeforeResponse(event, { body: { body: "<html></html>" } });

    const csp = bag.get("content-security-policy") ?? "";
    assert.match(csp, /script-src 'self' 'sha256-/);
    assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
  } finally {
    plugin.module.prerenderedScriptHashes.clear();
  }
});

test("prerendered file paths are mapped to their routes", async () => {
  const plugin = await loadPlugin();
  assert.equal(plugin.module.routeOfPrerenderedFile("index.html"), "/");
  assert.equal(
    plugin.module.routeOfPrerenderedFile("contact/index.html"),
    "/contact"
  );
  assert.equal(
    plugin.module.routeOfPrerenderedFile("legal/privacy.html"),
    "/legal/privacy"
  );
});

test("CSP falls back to a safe variant when the body cannot be inspected", async () => {
  const plugin = await loadPlugin();
  const { event, bag } = createEvent("text/html");

  await plugin.runBeforeResponse(event, undefined);

  const csp = bag.get("content-security-policy") ?? "";
  assert.match(csp, /script-src 'self' 'unsafe-inline'/);
  assert.doesNotMatch(csp, /unsafe-eval/);
});
