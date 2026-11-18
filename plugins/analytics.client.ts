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
 * Разрешение на трекинг даёт только runtime-конфигурация: ответ
 * `/api/analytics/config`. Значение из payload пререндеренных страниц
 * собрано при сборке и может быть устаревшим, поэтому по нему трекер
 * никогда не включается — иначе выключенная аналитика включалась бы сама
 * на старых страницах.
 *
 * Fail-closed: трекер подключается, только если сервер явно разрешил сбор
 * и вернул идентификатор сайта. Любая ошибка, пустой ответ или таймаут
 * означают, что аналитика не работает — и это правильное состояние.
 *
 * Идентификатор сайта передаётся внешнему скрипту через атрибут
 * `data-site-id`. Инлайн-скрипт не создаётся: enforced CSP его блокирует,
 * а `unsafe-inline` в политику добавлять нельзя.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const injectTracker = (id: string) => {
    if (!id) return;
    const script = document.createElement("script");
    script.src = `${ANALYTICS_TRACKER_PATH}?v=${ANALYTICS_TRACKER_VERSION}`;
    script.async = true;
    script.setAttribute(ANALYTICS_SITE_ID_ATTRIBUTE, id);
    document.head.appendChild(script);
  };

  const trackPageView = () => {
    const tracker = (window as unknown as { KiruhakAnalytics?: KiruhakAnalyticsApi })
      .KiruhakAnalytics;
    tracker?.trackPageView?.();
  };

  const startTracking = (siteId: string) => {
    injectTracker(siteId);

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
  };

  // Запрос конфигурации не блокирует запуск приложения: при любом сбое
  // аналитика просто остаётся выключенной.
  void $fetch<{ enabled?: boolean; siteId?: string | null }>(
    "/api/analytics/config",
    { cache: "no-store" }
  )
    .then((response) => {
      if (response?.enabled !== true) return;
      const siteId = String(response?.siteId || "").trim();
      if (!siteId) return;
      startTracking(siteId);
    })
    .catch(() => {
      // Конфигурация недоступна — аналитика просто не включается.
    });
});
