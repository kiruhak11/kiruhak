import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const materialId = getRouterParam(event, "id");
    const body = await readBody(event);
    const { rating } = body;

    // Получаем пользователя из контекста (устанавливается middleware)
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    const userId = user.id;

    // Проверяем, не оценивал ли пользователь уже этот материал
    const existingRating = await prisma.materialRating.findFirst({
      where: {
        materialId,
        userId,
      },
    });

    if (existingRating) {
      // Пользователь уже оценил материал - возвращаем ошибку
      return {
        success: false,
        error: "Вы уже оценили этот материал",
      };
    } else {
      // Создаем новую оценку
      await prisma.materialRating.create({
        data: {
          materialId,
          userId,
          rating,
        },
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Ошибка оценки материала:", error);
    return {
      success: false,
      error: "Ошибка оценки материала",
    };
  }
});
