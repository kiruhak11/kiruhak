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
      select: {
        id: true,
        name: true,
        domain: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const siteIds = sites.map((site) => site.id);
    const visits = siteIds.length
      ? await prisma.visit.findMany({
          where: {
            siteId: { in: siteIds },
            timestamp: { gte: weekAgo },
          },
          select: {
            siteId: true,
            ip: true,
          },
        })
      : [];

    const statsBySite = visits.reduce<Record<string, { totalVisits: number; ips: Set<string> }>>(
      (acc, visit) => {
        if (!acc[visit.siteId]) {
          acc[visit.siteId] = { totalVisits: 0, ips: new Set() };
        }
        acc[visit.siteId].totalVisits += 1;
        if (visit.ip) {
          acc[visit.siteId].ips.add(visit.ip);
        }
        return acc;
      },
      {}
    );

    const sitesWithStats = sites.map((site) => ({
      ...site,
      stats: {
        totalVisits: statsBySite[site.id]?.totalVisits || 0,
        uniqueVisitors: statsBySite[site.id]?.ips.size || 0,
      },
    }));

    return sitesWithStats;
  } catch (error) {
    console.error("Error fetching sites:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch sites",
    });
  }
});
