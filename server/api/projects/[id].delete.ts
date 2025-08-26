import { prisma } from "../../utils/prisma";

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

    // Проверяем права администратора
    if (!user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden - Admin access required",
      });
    }

    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Project ID is required",
      });
    }

    console.log(`🔐 [DELETE /api/projects/${id}] Удаление проекта пользователем:`, user.firstName);

    await prisma.project.delete({
      where: { id },
    });

    console.log(`🔐 [DELETE /api/projects/${id}] Проект успешно удален`);
    return { success: true, message: "Project deleted successfully" };
  } catch (error) {
    console.error("Error deleting project:", error);
    
    // Если это ошибка аутентификации, возвращаем её как есть
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete project",
    });
  }
});
