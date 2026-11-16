import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Security-заголовки для всех ответов приложения.
 *
 * Политика выдаётся приложением, а не Nginx: production-Nginx для
 * kiruhak11.ru не добавляет заголовков и не скрывает заголовки приложения,
 * поэтому дублирования и конфликтов не возникает.
 *
 * CSP для документов собирается по хешам инлайновых скриптов, которые
 * действительно присутствуют в ответе: это позволяет обойтись без
 * `unsafe-inline` в `script-src`. Если тело ответа не является строкой
 * (потоковая выдача), используется безопасный запасной вариант.
 *
 * На ошибочных ответах значения `Content-Security-Policy`, `Referrer-Policy`,
 * `X-Frame-Options` и `X-Content-Type-Options` задаёт обработчик ошибок
 * Nitro — он строже и совпадает с политикой API-ответов. Остальные заголовки
 * добавляются этим плагином и сохраняются.
 */

/** Политика для API-ответов и статики: совпадает с обработчиком ошибок Nitro. */
export const API_CONTENT_SECURITY_POLICY =
  "script-src 'none'; frame-ancestors 'none';";

/** Разрешения, которые сайту действительно нужны. */
export const PERMISSIONS_POLICY =
  "camera=(), microphone=(), geolocation=(), payment=(), usb=(), clipboard-write=(self)";

/** HSTS: без includeSubDomains и preload — подтверждения нет. */
export const STRICT_TRANSPORT_SECURITY = "max-age=31536000";

/** Referrer-Policy для документов. */
export const DOCUMENT_REFERRER_POLICY = "strict-origin-when-cross-origin";

/** Origin Telegram Login SDK: без него вход через Telegram не работает. */
export const TELEGRAM_LOGIN_ORIGIN = "https://oauth.telegram.org";

const INLINE_SCRIPT_PATTERN = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

/**
 * Считает CSP-хеши инлайновых скриптов ответа.
 *
 * Возвращает null, если тело не является строкой: тогда хеши вычислить
 * нельзя и нужен запасной вариант политики.
 */
export function extractInlineScriptHashes(body: unknown): string[] | null {
  const text = htmlTextOf(body);
  if (text === null) return null;

  const hashes = new Set<string>();
  INLINE_SCRIPT_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null = INLINE_SCRIPT_PATTERN.exec(text);
  while (match) {
    const digest = createHash("sha256")
      .update(match[1], "utf8")
      .digest("base64");
    hashes.add(`'sha256-${digest}'`);
    match = INLINE_SCRIPT_PATTERN.exec(text);
  }

  return [...hashes];
}

/**
 * Достаёт HTML из тела ответа.
 *
 * Nitro отдаёт результат SSR-рендера объектом `{ body, statusCode, headers }`,
 * поэтому текст лежит во вложенном поле.
 */
export function htmlTextOf(body: unknown): string | null {
  if (typeof body === "string") return body;
  if (body && typeof body === "object") {
    const inner = (body as { body?: unknown }).body;
    if (typeof inner === "string") return inner;
  }
  return null;
}

/**
 * Собирает хеши инлайновых скриптов из частей документа, которые Nitro
 * складывает в финальный HTML (хук `render:html`).
 */
export function collectRenderedScriptHashes(context: {
  head?: unknown;
  body?: unknown;
  bodyPrepend?: unknown;
  bodyAppend?: unknown;
}): string[] {
  const parts = [
    ...(Array.isArray(context.head) ? context.head : []),
    ...(Array.isArray(context.bodyPrepend) ? context.bodyPrepend : []),
    ...(Array.isArray(context.body) ? context.body : []),
    ...(Array.isArray(context.bodyAppend) ? context.bodyAppend : []),
  ]
    .filter((part): part is string => typeof part === "string")
    .join("\n");

  const hashes = extractInlineScriptHashes(parts);
  return hashes ?? [];
}

/**
 * Собирает CSP для HTML-документа.
 *
 * `null` вместо массива хешей означает, что тело ответа не удалось
 * проанализировать: тогда используется `unsafe-inline` для скриптов.
 */
export function buildDocumentContentSecurityPolicy(
  inlineScriptHashes: string[] | null,
  secureRequest = false
): string {
  const scriptSrc =
    inlineScriptHashes === null
      ? ["'self'", "'unsafe-inline'", TELEGRAM_LOGIN_ORIGIN]
      : ["'self'", ...inlineScriptHashes, TELEGRAM_LOGIN_ORIGIN];

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc.join(" ")}`,
    "frame-src 'self' data: blob: https://oauth.telegram.org https://telegram.org",
    "connect-src 'self' https://oauth.telegram.org https://telegram.org",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];

  // upgrade-insecure-requests применяется только к защищённым запросам:
  // на не-HTTPS origin директива обновляет и same-origin ресурсы (например,
  // /_payload.json), ломая их загрузку.
  if (secureRequest) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

type NitroEvent = Parameters<typeof setResponseHeader>[0];

/**
 * Хеши инлайновых скриптов пререндеренных страниц.
 *
 * Пререндеренные HTML отдаются как статические файлы: хук `render:html` для
 * них не выполняется, поэтому хеши считаются один раз при старте по тем же
 * файлам, которые затем отдаются пользователю.
 */
export const prerenderedScriptHashes = new Map<string, string[]>();

export const routeOfPrerenderedFile = (relative: string): string => {
  const withoutExtension = relative.replace(/\.html$/, "");
  if (withoutExtension === "index") return "/";
  const trimmed = withoutExtension.endsWith("/index")
    ? withoutExtension.slice(0, -"/index".length)
    : withoutExtension;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const loadPrerenderedScriptHashes = (): void => {
  const publicDir = join(process.cwd(), ".output", "public");
  if (!existsSync(publicDir)) return;

  const walk = (dir: string, prefix: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const relative = prefix ? `${prefix}/${entry}` : entry;
      if (statSync(full).isDirectory()) {
        walk(full, relative);
        continue;
      }
      if (!entry.endsWith(".html")) continue;
      const hashes = extractInlineScriptHashes(readFileSync(full, "utf8"));
      if (hashes && hashes.length > 0) {
        prerenderedScriptHashes.set(routeOfPrerenderedFile(relative), hashes);
      }
    }
  };

  try {
    walk(publicDir, "");
  } catch {
    // Каталог пререндера может отсутствовать — тогда политика для
    // пререндеренных страниц не вычисляется.
  }
};

/**
 * Запрос пришёл по защищённому каналу.
 *
 * За обратным прокси схема известна из X-Forwarded-Proto, который выставляет
 * production-Nginx.
 */
const isSecureRequest = (event: NitroEvent): boolean => {
  const forwarded = getRequestHeader(event, "x-forwarded-proto");
  if (forwarded) {
    return String(forwarded).split(",")[0]?.trim() === "https";
  }
  try {
    return (
      getRequestURL(event, { xForwardedHost: true, xForwardedProto: true })
        .protocol === "https:"
    );
  } catch {
    return false;
  }
};

const isDocumentResponse = (event: NitroEvent): boolean => {
  const raw = getResponseHeader(event, "content-type");
  const contentType = Array.isArray(raw) ? raw[0] : raw;
  return typeof contentType === "string" && contentType.includes("text/html");
};

export default defineNitroPlugin((nitroApp) => {
  const applyCommonHeaders = (event: NitroEvent) => {
    setResponseHeader(event, "X-Content-Type-Options", "nosniff");
    setResponseHeader(event, "X-Frame-Options", "DENY");
    setResponseHeader(event, "Permissions-Policy", PERMISSIONS_POLICY);
    setResponseHeader(
      event,
      "Strict-Transport-Security",
      STRICT_TRANSPORT_SECURITY
    );
  };

  // Хеши инлайновых скриптов собираются на этапе сборки документа: Nitro
  // складывает документ из отдельных частей, поэтому готовый HTML на момент
  // ответа недоступен как строка.
  loadPrerenderedScriptHashes();

  nitroApp.hooks.hook("render:html", (context, { event }) => {
    const hashes = collectRenderedScriptHashes(context);
    (event.context as { securityInlineScriptHashes?: string[] }).securityInlineScriptHashes = hashes;
  });

  nitroApp.hooks.hook("beforeResponse", (event, response) => {
    applyCommonHeaders(event);

    if (isDocumentResponse(event)) {
      setResponseHeader(
        event,
        "Referrer-Policy",
        DOCUMENT_REFERRER_POLICY
      );
      const renderedHashes = (
        event.context as { securityInlineScriptHashes?: string[] }
      ).securityInlineScriptHashes;
      const path = getRequestURL(event).pathname;
      const bodyHashes =
        renderedHashes ??
        prerenderedScriptHashes.get(path) ??
        extractInlineScriptHashes(response?.body);

      setResponseHeader(
        event,
        "Content-Security-Policy",
        buildDocumentContentSecurityPolicy(
          renderedHashes ?? bodyHashes,
          isSecureRequest(event)
        )
      );
      return;
    }

    setResponseHeader(event, "Referrer-Policy", "no-referrer");
    setResponseHeader(
      event,
      "Content-Security-Policy",
      API_CONTENT_SECURITY_POLICY
    );
  });

  // Ошибочные ответы обрабатываются Nitro отдельно: общий плагин не
  // вызывается, поэтому базовые заголовки добавляются здесь.
  nitroApp.hooks.hook("error", (_error, context) => {
    const event = context?.event;
    if (!event) return;
    applyCommonHeaders(event);
  });
});
