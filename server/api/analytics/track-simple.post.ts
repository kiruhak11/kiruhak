import { prisma } from "../../utils/prisma";
import { resolveClientIp } from "../../utils/client-ip";
import { analyticsWriteAllowed, recordAnalyticsPageView } from "../../utils/analytics";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    // Поле `event` из тела переименовывается: в обработчике `event` — это
    // H3-событие, и затенять его нельзя.
    const {
      siteId,
      page = "/",
      referrer = null,
      userAgent = "unknown",
      event: eventType,
    } = body;

    if (!siteId) {
      return {
        success: false,
        error: "siteId is required",
      };
    }

    // Сбор выключен — endpoint ничего не пишет и в базу не ходит.
    if (!analyticsWriteAllowed(siteId)) {
      return {
        success: false,
        error: "Analytics is disabled",
      };
    }


    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, isActive: true },
    });

    if (!site || !site.isActive) {
      return {
        success: false,
        error: "Site not found",
      };
    }

    const requestIp =
      resolveClientIp(event).address;

    // Создаем запись о посещении: только просмотр страницы.
    const recorded = await recordAnalyticsPageView({
      siteId,
      page,
      referrer,
      userAgent,
      ip: requestIp,
      event: eventType,
    });

    if (!recorded.success) {
      return {
        success: false,
        error: recorded.error,
      };
    }

    return {
      success: true,
      visitId: recorded.visitId,
      timestamp: recorded.timestamp,
    };
  } catch (error) {
    console.error("Simple track API error:", error);
    return {
      success: false,
      error: "Failed to track visit",
    };
  }
});
