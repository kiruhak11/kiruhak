import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    // Получаем пользователя из контекста (если авторизован)
    const user = event.context.user;

    const tutorials = await prisma.tutorial.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: "asc",
      },
      include: {
        steps: {
          orderBy: {
            order: "asc",
          },
        },
        userProgress: user
          ? {
              where: {
                userId: user.id,
              },
            }
          : false,
        testQuestions: {
          include: {
            answers: {
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    // Вычисляем прогресс для каждого туториала
    const tutorialsWithProgress = tutorials.map((tutorial) => {
      const progress = tutorial.userProgress?.[0];
      const totalSteps = tutorial.steps.length;
      const completedSteps = progress
        ? progress.completed
          ? totalSteps
          : 0
        : 0;

      const progressPercentage =
        totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      return {
        ...tutorial,
        progress: progressPercentage,
        isCompleted: progress?.completed || false,
        testScore: progress?.testScore || null,
        userProgress: progress || null,
      };
    });

    return {
      success: true,
      tutorials: tutorialsWithProgress,
    };
  } catch (error) {
    console.error("Ошибка получения туториалов:", error);
    return {
      success: false,
      error: "Ошибка получения туториалов",
    };
  }
});
