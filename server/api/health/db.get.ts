import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== Database Health Check ===");
    
    // Проверяем подключение к базе данных
    await prisma.$connect();
    console.log("Database connection: OK");

    // Проверяем, что можем выполнить простой запрос
    const userCount = await prisma.user.count();
    console.log("User count:", userCount);

    // Проверяем схему базы данных
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Available tables:", tables);

    return {
      success: true,
      status: "healthy",
      database: {
        connected: true,
        userCount,
        tables: Array.isArray(tables) ? tables.map((t: any) => t.table_name) : [],
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      success: false,
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      details: {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
      },
      timestamp: new Date().toISOString(),
    };
  } finally {
    await prisma.$disconnect();
  }
});
