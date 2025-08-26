import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    console.log("Simple track API - received body:", body);
    
    const { siteId, page = "/", referrer = null, userAgent = "unknown", ip = "unknown" } = body;
    
    if (!siteId) {
      return {
        success: false,
        error: "siteId is required"
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
    
    console.log("Simple track API - visit created:", visit);
    
    return {
      success: true,
      visitId: visit.id,
      timestamp: visit.timestamp
    };
    
  } catch (error) {
    console.error("Simple track API error:", error);
    return {
      success: false,
      error: error.message
    };
  }
});
