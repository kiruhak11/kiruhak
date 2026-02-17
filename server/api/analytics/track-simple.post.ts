import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { siteId, page = "/", referrer = null, userAgent = "unknown" } = body;

    if (!siteId) {
      return {
        success: false,
        error: "siteId is required",
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
      getRequestIP(event, { xForwardedFor: true }) ||
      event.node.req.socket.remoteAddress ||
      "unknown";

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
    console.error("Simple track API error:", error);
    return {
      success: false,
      error: "Failed to track visit",
    };
  }
});
