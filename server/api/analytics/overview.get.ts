import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    if (!user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Admin access required",
      });
    }

    const query = getQuery(event);
    const { period = "7d" } = query;
    const normalizedPeriod = typeof period === "string" ? period : "7d";
    const validPeriods = new Set(["1d", "7d", "30d", "90d"]);
    if (!validPeriods.has(normalizedPeriod)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid period",
      });
    }

    // Вычисляем дату начала периода
    const now = new Date();
    let startDate: Date;

    switch (normalizedPeriod) {
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

    // Получаем общую статистику по всем сайтам
    const totalVisits = await prisma.visit.count({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
    });

    // Получаем уникальные посетители по всем сайтам
    const uniqueVisitors = await prisma.visit.groupBy({
      by: ["ip"],
      where: {
        timestamp: {
          gte: startDate,
        },
      },
    });

    // Получаем количество активных сайтов
    const activeSites = await prisma.site.count({
      where: {
        visits: {
          some: {
            timestamp: {
              gte: startDate,
            },
          },
        },
      },
    });

    // Получаем общее количество сайтов
    const totalSites = await prisma.site.count();

    // Получаем статистику по дням
    const dailyStats = await prisma.visit.groupBy({
      by: ["timestamp"],
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 30,
    });

    // Получаем популярные страницы по всем сайтам
    const popularPages = await prisma.visit.groupBy({
      by: ["page"],
      where: {
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

    // Получаем источники трафика по всем сайтам
    const trafficSources = await prisma.visit.groupBy({
      by: ["referrer"],
      where: {
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

    // Получаем статистику по браузерам
    const browserStats = await prisma.visit.groupBy({
      by: ["userAgent"],
      where: {
        timestamp: {
          gte: startDate,
        },
        userAgent: {
          not: null,
        },
      },
      _count: {
        userAgent: true,
      },
      orderBy: {
        _count: {
          userAgent: "desc",
        },
      },
      take: 10,
    });

    return {
      period: normalizedPeriod,
      totalVisits,
      uniqueVisitors: uniqueVisitors.length,
      totalSites,
      activeSites,
      popularPages: popularPages.map((p) => ({
        page: p.page,
        visits: p._count.page,
      })),
      trafficSources: trafficSources.map((s) => ({
        referrer: s.referrer,
        visits: s._count.referrer,
      })),
      browserStats: browserStats.map((b) => ({
        userAgent: b.userAgent,
        visits: b._count.userAgent,
      })),
      dailyStats: dailyStats.map((d) => ({
        date: d.timestamp,
        visits: d._count.id,
      })),
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error("Error fetching overview analytics:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch overview analytics",
    });
  }
});
