import { timingSafeEqual } from "node:crypto";

/**
 * Проверка служебного секрета бота.
 *
 * КРИТИЧНО: проверка НЕ зависит от NODE_ENV и не отключается в dev-режиме.
 * Раньше условие `process.env.NODE_ENV !== "production"` вычислялось на этапе
 * сборки, поэтому образ, собранный вне production-режима, компилировал
 * проверку секрета ПОЛНОСТЬЮ, и любой мог вызвать служебные endpoints бота
 * (в том числе получить токен входа по произвольному Telegram ID).
 *
 * Отсутствие корректного секрета всегда запрещает действие.
 */

/** Возвращает ожидаемый секрет из конфигурации или окружения. */
export function resolveExpectedBotSecret(configuredValue?: string): string {
  return (
    configuredValue ||
    process.env.BOT_SECRET ||
    process.env.NUXT_BOT_SECRET ||
    ""
  );
}

/**
 * Сравнивает предоставленный секрет с ожидаемым за постоянное время.
 *
 * Возвращает false, если секрет не настроен или не совпадает: отсутствие
 * конфигурации никогда не превращается в разрешение доступа.
 */
export function isValidBotSecret(
  providedSecret: string | undefined | null,
  configuredValue?: string
): boolean {
  const expectedSecret = resolveExpectedBotSecret(configuredValue);
  if (!expectedSecret) return false;
  if (typeof providedSecret !== "string" || !providedSecret) return false;

  const provided = Buffer.from(providedSecret, "utf8");
  const expected = Buffer.from(expectedSecret, "utf8");
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(provided, expected);
}
