import type { PrismaClient } from "@prisma/client";

import { prisma } from "./prisma";

/**
 * Нормализация данных внутренней аналитики посещений.
 *
 * Трекер отправляет только путь страницы и referrer без query-параметров,
 * но сервер не доверяет клиенту: чувствительные параметры (токены
 * восстановления доступа и авторизации) вырезаются на стороне сервера.
 */

/** Ограничения длины сохраняемых полей. */
export const ANALYTICS_PAGE_MAX_LENGTH = 512;
export const ANALYTICS_REFERRER_MAX_LENGTH = 512;
export const ANALYTICS_USER_AGENT_MAX_LENGTH = 512;

/** Единственный поддерживаемый тип события. */
export const ANALYTICS_SUPPORTED_EVENT = "page_view";

/**
 * Разрешение на сбор посещений.
 *
 * По умолчанию аналитика выключена: флаг `ANALYTICS_ENABLED` должен быть
 * явно установлен в `true`. Выключенное состояние — это не «нет данных»,
 * а запрет: трекер не подключается, записи не создаются.
 *
 * Флаг читается из окружения в момент запроса, а не на этапе сборки:
 * переключение должно действовать сразу после перезапуска контейнера.
 */
export const analyticsEnabled = (): boolean =>
  String(process.env.ANALYTICS_ENABLED ?? "")
    .trim()
    .toLowerCase() === "true";

/**
 * Идентификатор сайта самого приложения.
 *
 * Значение приходит из окружения в момент запуска. В payload пререндеренных
 * страниц его нет намеренно: собранный при сборке идентификатор может быть
 * устаревшим, и по нему трекер включаться не должен.
 */
export const ownAnalyticsSiteId = (): string =>
  String(process.env.NUXT_PUBLIC_ANALYTICS_SITE_ID ?? "").trim();

/**
 * Разрешена ли запись посещения для конкретного сайта.
 *
 * Общий флаг `ANALYTICS_ENABLED` относится только к сайту самого
 * приложения. Чужие сайты используют тот же endpoint, и глобальный запрет
 * сломал бы их трекинг, поэтому для них действует прежнее поведение.
 */
export const analyticsWriteAllowed = (siteId: string): boolean => {
  if (analyticsEnabled()) return true;
  const own = ownAnalyticsSiteId();
  if (!own) return true;
  return siteId !== own;
};

/** Путь страницы без query-параметров и фрагмента. */
export const sanitizeAnalyticsPage = (value: unknown): string => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return "/";
  const withoutQuery = text.split("?")[0].split("#")[0];
  return (withoutQuery || "/").slice(0, ANALYTICS_PAGE_MAX_LENGTH);
};

/** Referrer без query-параметров и фрагмента. */
export const sanitizeAnalyticsReferrer = (value: unknown): string | null => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  const withoutQuery = text.split("?")[0].split("#")[0];
  if (!withoutQuery) return null;
  return withoutQuery.slice(0, ANALYTICS_REFERRER_MAX_LENGTH);
};

/** User-Agent: обрезанный, без пустых значений. */
export const sanitizeAnalyticsUserAgent = (value: unknown): string => {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || "unknown").slice(0, ANALYTICS_USER_AGENT_MAX_LENGTH);
};

export type AnalyticsRecordResult =
  | { success: true; visitId: string; timestamp: Date }
  | { success: false; error: string };

/**
 * Записывает посещение страницы.
 *
 * Создаётся ровно одна запись Visit на просмотр страницы. Остальные типы
 * событий (клик, время на странице, обновление) в модели Visit отсутствуют,
 * поэтому их запись искажала бы количество посещений и отклоняется.
 */
export const recordAnalyticsPageView = async (
  input: {
    siteId: string;
    page?: unknown;
    referrer?: unknown;
    userAgent?: unknown;
    ip: string;
    event?: unknown;
  },
  // Клиент подменяется только в изолированных интеграционных проверках:
  // там подключение должно идти к тестовой базе, а не к DATABASE_URL.
  client: PrismaClient = prisma
): Promise<AnalyticsRecordResult> => {
  const event =
    typeof input.event === "string" && input.event
      ? input.event
      : ANALYTICS_SUPPORTED_EVENT;

  if (event !== ANALYTICS_SUPPORTED_EVENT) {
    return { success: false, error: "Unsupported event type" };
  }

  // Сбор выключен — запись не создаётся, в базу не ходим вообще.
  if (!analyticsWriteAllowed(input.siteId)) {
    return { success: false, error: "Analytics is disabled" };
  }

  const site = await client.site.findUnique({
    where: { id: input.siteId },
    select: { id: true, isActive: true },
  });

  if (!site || !site.isActive) {
    return { success: false, error: "Site not found" };
  }

  const visit = await client.visit.create({
    data: {
      siteId: input.siteId,
      page: sanitizeAnalyticsPage(input.page),
      referrer: sanitizeAnalyticsReferrer(input.referrer),
      userAgent: sanitizeAnalyticsUserAgent(input.userAgent),
      ip: input.ip,
      timestamp: new Date(),
      sessionId: null,
      userId: null,
    },
  });

  return { success: true, visitId: visit.id, timestamp: visit.timestamp };
};
