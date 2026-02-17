import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  let body;
  try {
    body = await readBody(event);
    const { siteId, page = "/", referrer = null, userAgent = "unknown" } = body;

    if (!siteId) {
      return {
        success: false,
        error: "siteId is required",
      };
    }

    const requestIp =
      getRequestIP(event, { xForwardedFor: true }) ||
      event.node.req.socket.remoteAddress ||
      "unknown";

    // Проверяем существование сайта
    let site = await prisma.site.findUnique({
      where: { id: siteId },
    });

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

    // Создаем запись о посещении
    const visit = await prisma.visit.create({
      data: {
        siteId,
        page,
        referrer,
        userAgent,
        ip: requestIp,
        timestamp: new Date(),
        sessionId: null,
        userId: null,
      },
    });

    return {
      success: true,
      visitId: visit.id,
      timestamp: visit.timestamp,
    };
  } catch (error) {
    console.error("Error tracking visit:", error);
    return {
      success: false,
      error: "Failed to track visit",
    };
  }
});
