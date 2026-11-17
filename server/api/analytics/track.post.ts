import { prisma } from "../../utils/prisma";
import { resolveClientIp } from "../../utils/client-ip";
import { recordAnalyticsPageView } from "../../utils/analytics";

export default defineEventHandler(async (event) => {
  let body;
  try {
    body = await readBody(event);
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


    const requestIp = resolveClientIp(event).address;

    // Проверяем существование и активность сайта
    let site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, isActive: true },
    });

    if (site && !site.isActive) {
      return {
        success: false,
        error: "Site not found",
      };
    }

    // Если сайта нет и мы в режиме разработки, создаем его
    if (!site && process.env.NODE_ENV !== "production") {
      // Находим первого пользователя для привязки сайта
      const firstUser = await prisma.user.findFirst();

      if (firstUser) {
        try {
          site = await prisma.site.upsert({
            where: { id: siteId },
            update: {},
            create: {
              id: siteId,
              name: "Dev Site",
              domain: `localhost-${Date.now()}`, // Уникальный домен
              description: "Автоматически созданный сайт для разработки",
              isActive: true,
              userId: firstUser.id,
            },
          });
        } catch (error) {
          // Пробуем найти существующий сайт по домену localhost
          site = await prisma.site.findFirst({
            where: { domain: { startsWith: "localhost" } },
          });
        }
      }
    }

    // Если сайт всё ещё не существует, возвращаем ошибку
    if (!site) {
      return {
        success: false,
        error: "Site not found",
      };
    }

    // Создаем запись о посещении: только просмотр страницы, остальные типы
    // событий не представлены в модели Visit.
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
    console.error("Error tracking visit:", error);
    return {
      success: false,
      error: "Failed to track visit",
    };
  }
});
