/**
 * Диагностика конфигурации доверенных прокси при старте приложения.
 *
 * Неверная настройка `TRUSTED_PROXY_IPS` приводит к тому, что все посетители
 * получают один адрес: ограничение частоты запросов начинает считать всех
 * вместе, а форма заявок перестаёт работать после нескольких отправок.
 * Поэтому проблема должна быть видна сразу при старте, а не по жалобам.
 */

import { trustedProxyDiagnostics } from "../utils/client-ip";

export default defineNitroPlugin(() => {
  const diagnostics = trustedProxyDiagnostics();

  for (const warning of diagnostics.warnings) {
    console.warn(`[trusted-proxy] ${warning}`);
  }

  if (process.env.NODE_ENV === "production" && !diagnostics.configured) {
    console.error(
      "[trusted-proxy] TRUSTED_PROXY_IPS не задан в production: ограничение частоты запросов применит один общий счётчик ко всем посетителям. Укажите адрес локального прокси и адрес внешнего TLS-Edge (см. docs/runbooks/2026-11-17_SECURITY_HARDENING_P1.md)"
    );
  }

  console.log(
    `[trusted-proxy] доверенные прокси: ${diagnostics.trusted.join(", ") || "(пусто)"}`
  );
});
