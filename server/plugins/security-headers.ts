import { createHash } from "node:crypto";

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
  if (typeof body !== "string") return null;

  const hashes = new Set<string>();
  INLINE_SCRIPT_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null = INLINE_SCRIPT_PATTERN.exec(body);
  while (match) {
    const digest = createHash("sha256")
      .update(match[1], "utf8")
      .digest("base64");
    hashes.add(`'sha256-${digest}'`);
    match = INLINE_SCRIPT_PATTERN.exec(body);
  }

  return [...hashes];
}

/**
 * Собирает CSP для HTML-документа.
 *
 * `null` вместо массива хешей означает, что тело ответа не удалось
 * проанализировать: тогда используется `unsafe-inline` для скриптов.
 */
export function buildDocumentContentSecurityPolicy(
  inlineScriptHashes: string[] | null
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

  if (process.env.NODE_ENV === "production") {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

type NitroEvent = Parameters<typeof setResponseHeader>[0];

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

  nitroApp.hooks.hook("beforeResponse", (event, response) => {
    applyCommonHeaders(event);

    if (isDocumentResponse(event)) {
      setResponseHeader(
        event,
        "Referrer-Policy",
        DOCUMENT_REFERRER_POLICY
      );
      setResponseHeader(
        event,
        "Content-Security-Policy",
        buildDocumentContentSecurityPolicy(
          extractInlineScriptHashes(response?.body)
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
