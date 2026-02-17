import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    // Проверяем, что можем выполнить простой запрос
    const userCount = await prisma.user.count();
    const isDev = process.env.NODE_ENV !== "production";

    return {
      success: true,
      status: "healthy",
      database: {
        connected: true,
        userCount,
        environment: isDev ? "development" : "production",
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      success: false,
      status: "unhealthy",
      error: "Database check failed",
      timestamp: new Date().toISOString(),
    };
  }
});
