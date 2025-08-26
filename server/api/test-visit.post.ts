import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    console.log("Test visit handler started");
    
    // Простой тест создания записи
    const testVisit = await prisma.visit.create({
      data: {
        siteId: "cmeqm6e8s0000riefq74mcyc3",
        page: "/test",
        referrer: "test",
        userAgent: "test",
        ip: "127.0.0.1",
        timestamp: new Date(),
        sessionId: "test-session",
        userId: null,
      },
    });
    
    console.log("Test visit created:", testVisit);
    
    return {
      success: true,
      visit: testVisit
    };
  } catch (error) {
    console.error("Test visit error:", error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
});
