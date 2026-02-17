import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const tutorialId = getRouterParam(event, "id");
    const user = event.context.user;

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    const body = await readBody(event);
    const { stepNumber } = body;

    // Получаем туториал с шагами
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
        userProgress: {
          where: {
            userId: user.id,
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

    const totalSteps = tutorial.steps.length;
    const isLastStep = stepNumber >= totalSteps;

    // Создаем или обновляем прогресс
    const progressData = {
      tutorialId,
      userId: user.id,
      completed: isLastStep,
      completedAt: isLastStep ? new Date() : null,
    };

    const progress = await prisma.tutorialProgress.upsert({
      where: {
        tutorialId_userId: {
          tutorialId,
          userId: user.id,
        },
      },
      update: progressData,
      create: progressData,
    });

    // Вычисляем новый прогресс
    const progressPercentage = isLastStep
      ? 100
      : Math.round((stepNumber / totalSteps) * 100);

    return {
      success: true,
      progress: {
        ...progress,
        progressPercentage,
        isCompleted: isLastStep,
        totalSteps,
        currentStep: stepNumber,
      },
    };
  } catch (error) {
    console.error("Ошибка завершения шага:", error);
    return {
      success: false,
      error: "Ошибка завершения шага",
    };
  }
});
