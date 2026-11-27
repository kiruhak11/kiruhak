(function () {
  "use strict";

  /**
   * Трекер посещений K-Studio.
   *
   * Особенности:
   *
   * * идентификатор сайта передаётся через атрибут `data-site-id` внешнего
   *   скрипта — инлайн-JavaScript не нужен, поэтому строгая CSP его не
   *   блокирует и `unsafe-inline` не требуется;
   * * без идентификатора сайта трекер не запускается вовсе: запросов нет,
   *   ложные события не создаются;
   * * фиксируются только просмотры страниц: типы событий, которых нет в
   *   модели Visit, не отправляются и не искажают количество посещений;
   * * в payload попадает путь без query-параметров, referrer — без query,
   *   постоянные идентификаторы посетителя не создаются;
   * * повторных попыток нет: при подтверждённой ошибке трекер отключается.
   */

  var script = document.currentScript;
  if (!script || !script.src) return;

  var attribute = script.getAttribute("data-site-id");
  var siteId = String(attribute === null ? window.KIRUHAK_SITE_ID || "" : attribute)
    .trim();
  if (!siteId) return;

  var ENDPOINT = new URL("/api/analytics/track", script.src).href;
  var lastTrackedPath = null;
  var disabled = false;

  function currentPath() {
    return window.location.pathname;
  }

  function withoutQuery(value) {
    // query-параметры могут содержать токены восстановления доступа.
    try {
      var parsed = new URL(value);
      return parsed.origin + parsed.pathname;
    } catch {
      return null;
    }
  }

  function buildPayload() {
    return {
      siteId: siteId,
      page: currentPath(),
      referrer: document.referrer ? withoutQuery(document.referrer) : null,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      event: "page_view",
    };
  }

  function disable(reason) {
    if (disabled) return;
    disabled = true;
    // В консоль не попадают payload, адреса и идентификаторы.
    console.warn("K-Studio analytics отключён:", reason);
  }

  function trackPageView() {
    if (disabled) return;

    var path = currentPath();
    // Один переход — одно событие: повторный вызов с тем же путём игнорируется.
    if (path === lastTrackedPath) return;
    lastTrackedPath = path;

    var payload;
    try {
      payload = buildPayload();
    } catch {
      disable("не удалось собрать данные события");
      return;
    }

    window
      .fetch(ENDPOINT, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      .then(function (response) {
        if (response.status === 429) {
          // Ограничение частоты: повтор не делаем, дожидаемся следующего
          // перехода и Retry-After.
          console.warn("K-Studio analytics: ограничение частоты, повтор отложен");
          return;
        }

        if (!response.ok) {
          disable("ошибка сервера " + response.status);
          return;
        }

        return response.json().then(function (body) {
          if (!body || body.success !== true) {
            // Сервер не подтвердил запись — дальше не пишем.
            disable("запись не подтверждена");
          }
        });
      })
      .catch(function () {
        // Транспортная ошибка: повтор не делаем.
        console.warn("K-Studio analytics: сетевая ошибка");
      });
  }

  window.KiruhakAnalytics = {
    trackPageView: trackPageView,
    isEnabled: function () {
      return !disabled;
    },
  };

  // Первый просмотр страницы. Дальнейшие переходы вызывает приложение.
  trackPageView();
})();
