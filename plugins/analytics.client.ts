import { useRouter } from "vue-router";

import {
  ANALYTICS_SITE_ID_ATTRIBUTE,
  ANALYTICS_TRACKER_PATH,
  ANALYTICS_TRACKER_VERSION,
  type KiruhakAnalyticsApi,
} from "~/constants/analytics";

/**
 * Подключение трекера посещений.
 *
 * Идентификатор сайта передаётся внешнему скрипту через атрибут
 * `data-site-id`. Инлайн-скрипт не создаётся: enforced CSP его блокирует,
 * а `unsafe-inline` в политику добавлять нельзя.
 *
 * Без идентификатора сайта трекер не подключается вовсе — запросов нет и
 * ложные события не создаются.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const siteId = String(config.public.analyticsSiteId || "").trim();

  const injectTracker = (id: string) => {
    if (!id) return;
    const script = document.createElement("script");
    script.src = `${ANALYTICS_TRACKER_PATH}?v=${ANALYTICS_TRACKER_VERSION}`;
    script.async = true;
    script.setAttribute(ANALYTICS_SITE_ID_ATTRIBUTE, id);
    document.head.appendChild(script);
  };

  if (siteId) {
    injectTracker(siteId);
  } else {
    // Пререндеренные страницы собираются на этапе сборки, поэтому значение
    // из окружения в их payload отсутствует. Endpoint отдаёт актуальный
    // идентификатор; запрос не блокирует запуск приложения.
    void $fetch<{ siteId: string | null }>("/api/analytics/config")
      .then((response) => {
        injectTracker(String(response?.siteId || "").trim());
      })
      .catch(() => {
        // Конфигурация недоступна — аналитика просто не включается.
      });
  }

  const trackPageView = () => {
    const tracker = (window as unknown as { KiruhakAnalytics?: KiruhakAnalyticsApi })
      .KiruhakAnalytics;
    tracker?.trackPageView?.();
  };

  // Переходы внутри SPA и кнопки «назад/вперёд» браузера. Роутер — единственный
  // источник переходов, поэтому history не подменяется, а обработчики не
  // регистрируются повторно. Трекер сам отбрасывает повтор того же пути.
  const router = useRouter();
  router?.afterEach(() => {
    trackPageView();
  });

  nuxtApp.hook("page:finish", () => {
    trackPageView();
  });
});
