import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    // Проверяем права администратора
    const user = event.context.user;
    if (!user || !user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Admin access required",
      });
    }

    const id = getRouterParam(event, "id");

    if (!id) {
      return {
        success: false,
        error: "ID компонента не указан",
      };
    }

    await prisma.uiComponent.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Компонент удален",
    };
  } catch (error) {
    console.error("Ошибка удаления UI компонента:", error);
    return {
      success: false,
      error: "Ошибка удаления компонента",
    };
  }
});
