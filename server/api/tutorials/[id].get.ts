import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const tutorialId = getRouterParam(event, "id");
    const user = event.context.user;

    const tutorial = await prisma.tutorial.findUnique({
      where: {
        id: tutorialId,
        isActive: true,
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

    if (!tutorial) {
      throw createError({
        statusCode: 404,
        statusMessage: "Tutorial not found",
      });
    }

    // Вычисляем прогресс
    const progress = tutorial.userProgress?.[0];
    const totalSteps = tutorial.steps.length;
    const completedSteps = progress ? (progress.completed ? totalSteps : 0) : 0;

    const progressPercentage =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    const tutorialWithProgress = {
      ...tutorial,
      progress: progressPercentage,
      isCompleted: progress?.completed || false,
      testScore: progress?.testScore || null,
      userProgress: progress || null,
    };

    return {
      success: true,
      tutorial: tutorialWithProgress,
    };
  } catch (error) {
    console.error("Ошибка получения туториала:", error);
    return {
      success: false,
      error: "Ошибка получения туториала",
    };
  }
});
