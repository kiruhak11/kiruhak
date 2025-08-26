import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    // Получаем пользователя из контекста
    const user = event.context.user;
    if (!user) {
      return [];
    }

    const sites = await prisma.site.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            visits: true,
          },
        },
      },
    });

    // Добавляем базовую статистику для каждого сайта
    const sitesWithStats = await Promise.all(
      sites.map(async (site) => {
        const stats = await prisma.visit.groupBy({
          by: ["ip"],
          where: {
            siteId: site.id,
            timestamp: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Последние 7 дней
            },
          },
        });

        return {
          id: site.id,
          name: site.name,
          domain: site.domain,
          description: site.description,
          isActive: site.isActive,
          createdAt: site.createdAt,
          updatedAt: site.updatedAt,
          stats: {
            totalVisits: site._count.visits,
            uniqueVisitors: stats.length,
          },
        };
      })
    );

    return sitesWithStats;
  } catch (error) {
    console.error("Error fetching sites:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch sites",
    });
  }
});
