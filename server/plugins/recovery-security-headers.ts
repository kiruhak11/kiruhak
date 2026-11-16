// Заголовки безопасности для страницы восстановления пароля и её API.
// Страница не должна кэшироваться и не должна передавать referrer,
// а /login дополнительно разрывает окно для Telegram Login OAuth.

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("beforeResponse", (event) => {
    const path = getRequestURL(event).pathname;

    if (path === "/account/recovery" || path.startsWith("/api/auth/recovery/")) {
      setResponseHeader(event, "Cache-Control", "no-store");
      setResponseHeader(event, "Referrer-Policy", "no-referrer");
    }

    if (path === "/login") {
      setResponseHeader(event, "Cache-Control", "no-store");
      setResponseHeader(event, "Referrer-Policy", "no-referrer");
      setResponseHeader(
        event,
        "Cross-Origin-Opener-Policy",
        "same-origin-allow-popups"
      );
    }
  });
});
