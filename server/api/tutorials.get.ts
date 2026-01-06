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
        userProgress: user
          ? {
              where: {
                userId: user.id,
              },
            }
          : false,
        _count: {
          select: {
            steps: true,
            testQuestions: true,
          },
        },
      },
    });

    // Вычисляем прогресс для каждого туториала
    const tutorialsWithProgress = tutorials.map((tutorial) => {
      const progress = tutorial.userProgress?.[0];
      const isCompleted = progress?.completed || false;
      const progressPercentage = isCompleted ? 100 : 0;

      console.log(`📚 Туториал "${tutorial.title}": завершен=${isCompleted}, userId=${user?.id || 'guest'}`);

      return {
        id: tutorial.id,
        title: tutorial.title,
        description: tutorial.description,
        difficulty: tutorial.difficulty,
        category: tutorial.category,
        duration: tutorial.duration,
        features: tutorial.features,
        order: tutorial.order,
        isActive: tutorial.isActive,
        createdAt: tutorial.createdAt,
        updatedAt: tutorial.updatedAt,
        progress: progressPercentage,
        isCompleted: isCompleted,
        testScore: progress?.testScore || null,
        stepsCount: tutorial._count.steps,
        testQuestionsCount: tutorial._count.testQuestions,
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
