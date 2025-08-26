import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    // Проверяем подключение к базе данных
    await prisma.$connect();
    
    // Пробуем получить количество сайтов
    const sitesCount = await prisma.site.count();
    
    // Пробуем получить количество посещений
    const visitsCount = await prisma.visit.count();
    
    return {
      success: true,
      message: "Database connection successful",
      sitesCount,
      visitsCount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Database test error:", error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    await prisma.$disconnect();
  }
});
