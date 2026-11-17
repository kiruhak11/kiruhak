/**
 * Общие параметры трекера посещений K-Studio.
 *
 * Трекер — внешний скрипт, а идентификатор сайта передаётся атрибутом
 * `data-site-id`. Инлайн-JavaScript не используется: строгая CSP не
 * блокирует внешний скрипт, и `unsafe-inline` не требуется.
 */

/** Путь к внешнему трекеру. */
export const ANALYTICS_TRACKER_PATH = "/analytics.js";

/**
 * Версия трекера.
 *
 * Подставляется в query-параметр, чтобы браузеры и CDN не отдавали старый
 * файл трекера, который умеет отправлять неподдерживаемые типы событий.
 */
export const ANALYTICS_TRACKER_VERSION = "20261118";

/** Атрибут, в котором внешнему скрипту передаётся идентификатор сайта. */
export const ANALYTICS_SITE_ID_ATTRIBUTE = "data-site-id";

/** Единственный поддерживаемый тип события: просмотр страницы. */
export const ANALYTICS_EVENT_PAGE_VIEW = "page_view";

/** Публичный интерфейс трекера, доступный приложению. */
export type KiruhakAnalyticsApi = {
  trackPageView: () => void;
  isEnabled: () => boolean;
};
