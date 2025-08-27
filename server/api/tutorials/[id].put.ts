import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const {
      title,
      description,
      difficulty,
      category,
      duration,
      features,
      steps,
      test,
      isActive,
    } = body;

    // Удаляем старые шаги
    await prisma.tutorialStep.deleteMany({
      where: {
        tutorialId: id,
      },
    });

    const tutorial = await prisma.tutorial.update({
      where: { id },
      data: {
        title,
        description,
        difficulty,
        category,
        duration,
        features: features || [],
        test: test || null,
        isActive: isActive !== undefined ? isActive : true,
        steps: {
          create:
            steps?.map((step: any, index: number) => ({
              title: step.title,
              content: step.content,
              order: index + 1,
            })) || [],
        },
      },
      include: {
        steps: true,
      },
    });

    return {
      success: true,
      tutorial,
    };
  } catch (error) {
    console.error("Ошибка обновления туториала:", error);
    return {
      success: false,
      error: "Ошибка обновления туториала",
    };
  }
});
