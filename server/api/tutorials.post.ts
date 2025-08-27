import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
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
    } = body;

    const tutorial = await prisma.tutorial.create({
      data: {
        title,
        description,
        difficulty,
        category,
        duration,
        features: features || [],
        test: test || null,
        order: 0,
        isActive: true,
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
    console.error("Ошибка создания туториала:", error);
    return {
      success: false,
      error: "Ошибка создания туториала",
    };
  }
});
