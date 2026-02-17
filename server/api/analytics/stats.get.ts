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

    const query = getQuery(event);
    const { siteId, period = "7d" } = query;

    if (!siteId) {
      throw createError({
        statusCode: 400,
        statusMessage: "siteId is required",
      });
    }

    const normalizedPeriod = typeof period === "string" ? period : "7d";
    const validPeriods = new Set(["1d", "7d", "30d", "90d"]);
    if (!validPeriods.has(normalizedPeriod)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid period",
      });
    }

    const site = await prisma.site.findUnique({
      where: { id: String(siteId) },
      select: { id: true, userId: true, isActive: true },
    });

    if (!site || !site.isActive || site.userId !== user.id) {
      throw createError({
        statusCode: 404,
        statusMessage: "Site not found",
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

    // Получаем общую статистику
    const totalVisits = await prisma.visit.count({
      where: {
        siteId: site.id,
        timestamp: {
          gte: startDate,
        },
      },
    });

    // Получаем уникальные посетители (по IP)
    const uniqueVisitors = await prisma.visit.groupBy({
      by: ["ip"],
      where: {
        siteId: site.id,
        timestamp: {
          gte: startDate,
        },
      },
    });

    // Получаем популярные страницы
    const popularPages = await prisma.visit.groupBy({
      by: ["page"],
      where: {
        siteId: site.id,
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

    const visitsByDay = await prisma.visit.findMany({
      where: {
        siteId: site.id,
        timestamp: {
          gte: startDate,
        },
      },
      select: {
        timestamp: true,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 5000,
    });

    const dailyStatsMap = visitsByDay.reduce<Record<string, number>>((acc, visit) => {
      const dayKey = visit.timestamp.toISOString().slice(0, 10);
      acc[dayKey] = (acc[dayKey] || 0) + 1;
      return acc;
    }, {});

    const dailyStats = Object.entries(dailyStatsMap)
      .map(([date, visits]) => ({ date, visits }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);

    // Получаем источники трафика
    const trafficSources = await prisma.visit.groupBy({
      by: ["referrer"],
      where: {
        siteId: site.id,
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
      siteId: site.id,
      period: normalizedPeriod,
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
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error("Error fetching analytics:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch analytics",
    });
  }
});
