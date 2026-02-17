import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const materialId = getRouterParam(event, "id");

    // Получаем пользователя из контекста (устанавливается middleware)
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    const userId = user.id;

    // Записываем загрузку
    await prisma.materialDownload.create({
      data: {
        materialId,
        userId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Ошибка записи загрузки:", error);
    return {
      success: false,
      error: "Ошибка записи загрузки",
    };
  }
});
