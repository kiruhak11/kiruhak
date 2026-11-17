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
export const recordAnalyticsPageView = async (input: {
  siteId: string;
  page?: unknown;
  referrer?: unknown;
  userAgent?: unknown;
  ip: string;
  event?: unknown;
}): Promise<AnalyticsRecordResult> => {
  const event =
    typeof input.event === "string" && input.event
      ? input.event
      : ANALYTICS_SUPPORTED_EVENT;

  if (event !== ANALYTICS_SUPPORTED_EVENT) {
    return { success: false, error: "Unsupported event type" };
  }

  const site = await prisma.site.findUnique({
    where: { id: input.siteId },
    select: { id: true, isActive: true },
  });

  if (!site || !site.isActive) {
    return { success: false, error: "Site not found" };
  }

  const visit = await prisma.visit.create({
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
