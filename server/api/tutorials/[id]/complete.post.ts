import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized - Authentication required",
      });
    }

    const tutorialId = getRouterParam(event, "id");
    const body = await readBody(event);
    const { testScore } = body;
    const userId = user.id; // Используем ID из контекста, а не из body для безопасности

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
        tutorialId_userId: {
          tutorialId,
          userId,
        },
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

    // Начисляем 25 рублей за завершение туториала (только если это первое завершение)
    if (!existingProgress || !existingProgress.completed) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        const rewardAmount = 2500; // 25 рублей в копейках
        
        await prisma.user.update({
          where: { id: userId },
          data: {
            balance: user.balance + rewardAmount,
          },
        });

        // Создаем запись о транзакции
        await prisma.transaction.create({
          data: {
            userId,
            type: "credit",
            amount: rewardAmount,
            description: `Награда за завершение туториала "${tutorialId}"`,
          },
        });
        
        console.log(`💰 Пользователю ${userId} начислено ${rewardAmount / 100} рублей за туториал`);
      }
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
