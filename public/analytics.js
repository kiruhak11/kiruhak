(function () {
  "use strict";

  // Конфигурация
  const ANALYTICS_URL = "https://kiruhak11.ru/api/analytics/track";
  const SITE_ID = window.KIRUHAK_SITE_ID || "your-site-id"; // Получаем из глобальной переменной

  // Генерируем уникальный session ID
  function generateSessionId() {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  // Получаем session ID из localStorage или создаем новый
  function getSessionId() {
    let sessionId = localStorage.getItem("analytics_session_id");
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem("analytics_session_id", sessionId);
    }
    return sessionId;
  }

  // Получаем информацию о странице
  function getPageInfo() {
    return {
      page: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
    };
  }

  // Отправляем данные о посещении
  function trackVisit() {
    const pageInfo = getPageInfo();

    fetch(ANALYTICS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        siteId: SITE_ID,
        ...pageInfo,
      }),
    }).catch((error) => {
      console.warn("Analytics tracking failed:", error);
    });
  }

  // Отслеживаем переходы между страницами (для SPA)
  function trackPageView() {
    trackVisit();
  }

  // Отслеживаем клики по ссылкам
  function trackClicks() {
    document.addEventListener("click", function (e) {
      const target = e.target.closest("a");
      if (target && target.href && !target.href.startsWith("javascript:")) {
        // Отправляем информацию о клике
        fetch(ANALYTICS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            siteId: SITE_ID,
            page: window.location.pathname + window.location.search,
            referrer: document.referrer || null,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            sessionId: getSessionId(),
            event: "click",
            targetUrl: target.href,
          }),
        }).catch((error) => {
          console.warn("Click tracking failed:", error);
        });
      }
    });
  }

  // Отслеживаем время на странице
  function trackTimeOnPage() {
    let startTime = Date.now();

    window.addEventListener("beforeunload", function () {
      const timeSpent = Date.now() - startTime;

      // Отправляем данные о времени на странице
      navigator.sendBeacon(
        ANALYTICS_URL,
        JSON.stringify({
          siteId: SITE_ID,
          page: window.location.pathname + window.location.search,
          referrer: document.referrer || null,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          sessionId: getSessionId(),
          event: "time_on_page",
          timeSpent: timeSpent,
        })
      );
    });
  }

  // Инициализация трекера
  function initAnalytics() {
    // Отслеживаем первое посещение
    trackVisit();

    // Отслеживаем клики
    trackClicks();

    // Отслеживаем время на странице
    trackTimeOnPage();

    // Отслеживаем обновления страницы (refresh)
    window.addEventListener("beforeunload", function () {
      // Отправляем данные о том, что страница была обновлена
      navigator.sendBeacon(
        ANALYTICS_URL,
        JSON.stringify({
          siteId: SITE_ID,
          page: window.location.pathname + window.location.search,
          referrer: document.referrer || null,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          sessionId: getSessionId(),
          event: "page_refresh",
        })
      );
    });

    // Для SPA - отслеживаем изменения URL
    if (window.history && window.history.pushState) {
      const originalPushState = window.history.pushState;
      window.history.pushState = function () {
        originalPushState.apply(this, arguments);
        setTimeout(trackPageView, 100);
      };

      window.addEventListener("popstate", function () {
        setTimeout(trackPageView, 100);
      });
    }
  }

  // Запускаем трекер когда DOM загружен
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAnalytics);
  } else {
    initAnalytics();
  }

  // Экспортируем функции для ручного использования
  window.KiruhakAnalytics = {
    track: trackVisit,
    trackPageView: trackPageView,
    trackEvent: function (eventName, data = {}) {
      fetch(ANALYTICS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteId: SITE_ID,
          page: window.location.pathname + window.location.search,
          referrer: document.referrer || null,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          sessionId: getSessionId(),
          event: eventName,
          ...data,
        }),
      }).catch((error) => {
        console.warn("Event tracking failed:", error);
      });
    },
  };
})();
