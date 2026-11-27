/**
 * Политика безопасности документа (CSP).
 *
 * Вынесена отдельно от Nitro-плагина намеренно: функция чистая, без
 * зависимостей от рантайма, и её можно проверять обычным тестом — без
 * подмены глобальных переменных Nitro и без запуска сервера.
 */

/** Origin Telegram Login SDK: без него вход через Telegram не работает. */
export const TELEGRAM_LOGIN_ORIGIN = "https://oauth.telegram.org";

/**
 * Собирает CSP для HTML-документа.
 *
 * `null` вместо массива хешей означает, что тело ответа не удалось
 * проанализировать: тогда скрипты запрещаются целиком (`script-src 'none'`),
 * политика не ослабляется.
 */
export function buildDocumentContentSecurityPolicy(
  inlineScriptHashes: string[] | null,
  secureRequest = false
): string {
  // Если хеши вычислить не удалось, политика не ослабляется: скрипты
  // запрещаются целиком (fail-closed). Страница остаётся читаемой (SSR
  // разметка уже в ответе), но ни один скрипт не выполняется.
  const scriptSrc =
    inlineScriptHashes === null
      ? ["'none'"]
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
