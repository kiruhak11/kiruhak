import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { siteId, period = "7d" } = query;

    if (!siteId) {
      throw createError({
        statusCode: 400,
        statusMessage: "siteId is required",
      });
    }

    // Вычисляем дату начала периода
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Получаем общую статистику
    const totalVisits = await prisma.visit.count({
      where: {
        siteId: String(siteId),
        timestamp: {
          gte: startDate,
        },
      },
    });

    // Получаем уникальные посетители (по IP)
    const uniqueVisitors = await prisma.visit.groupBy({
      by: ["ip"],
      where: {
        siteId: String(siteId),
        timestamp: {
          gte: startDate,
        },
      },
    });

    // Получаем популярные страницы
    const popularPages = await prisma.visit.groupBy({
      by: ["page"],
      where: {
        siteId: String(siteId),
        timestamp: {
          gte: startDate,
        },
      },
      _count: {
        page: true,
      },
      orderBy: {
        _count: {
          page: "desc",
        },
      },
      take: 10,
    });

    // Получаем статистику по дням (упрощенная версия)
    const dailyStats = await prisma.visit.groupBy({
      by: ['timestamp'],
      where: {
        siteId: String(siteId),
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 30
    });

    // Получаем источники трафика
    const trafficSources = await prisma.visit.groupBy({
      by: ["referrer"],
      where: {
        siteId: String(siteId),
        timestamp: {
          gte: startDate,
        },
        referrer: {
          not: null,
        },
      },
      _count: {
        referrer: true,
      },
      orderBy: {
        _count: {
          referrer: "desc",
        },
      },
      take: 10,
    });

    return {
      siteId,
      period,
      totalVisits,
      uniqueVisitors: uniqueVisitors.length,
      popularPages: popularPages.map((p) => ({
        page: p.page,
        visits: p._count.page,
      })),
      dailyStats,
      trafficSources: trafficSources.map((s) => ({
        referrer: s.referrer,
        visits: s._count.referrer,
      })),
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch analytics",
    });
  }
});
