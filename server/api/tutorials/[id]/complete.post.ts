import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const tutorialId = getRouterParam(event, "id");
    const body = await readBody(event);
    const { userId, testScore } = body;

    // Проверяем, не завершал ли пользователь уже этот туториал
    const existingProgress = await prisma.tutorialProgress.findFirst({
      where: {
        tutorialId,
        userId,
      },
    });

    if (existingProgress && existingProgress.completed) {
      return {
        success: false,
        error: "Туториал уже завершен",
      };
    }

    // Создаем или обновляем прогресс
    const progress = await prisma.tutorialProgress.upsert({
      where: {
        id: existingProgress?.id || "new",
      },
      update: {
        completed: true,
        completedAt: new Date(),
        testScore: testScore || null,
      },
      create: {
        tutorialId,
        userId,
        completed: true,
        completedAt: new Date(),
        testScore: testScore || null,
      },
    });

    // Начисляем 25 рублей за завершение туториала
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: user.balance + 25,
        },
      });
    }

    return {
      success: true,
      progress,
      reward: 25,
    };
  } catch (error) {
    console.error("Ошибка завершения туториала:", error);
    return {
      success: false,
      error: "Ошибка завершения туториала",
    };
  }
});
