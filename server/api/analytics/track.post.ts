import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    console.log("Received body:", body);

    const {
      siteId,
      page = "/",
      referrer = null,
      userAgent = "unknown",
      ip = "unknown",
    } = body;

    if (!siteId) {
      return {
        success: false,
        error: "siteId is required",
      };
    }

    // Создаем запись о посещении
    const visit = await prisma.visit.create({
      data: {
        siteId,
        page,
        referrer,
        userAgent,
        ip,
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
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      body: body,
    });
    return {
      success: false,
      error: "Failed to track visit",
    };
  }
});
