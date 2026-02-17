import { prisma } from "../../utils/prisma";
import { sanitizeHtml } from "../../../util/sanitize-html";

export default defineEventHandler(async (event) => {
  try {
    const materialId = getRouterParam(event, "id");

    // Получаем пользователя из контекста (если есть)
    const user = event.context.user;
    const userId = user?.id;

    const material = await prisma.material.findUnique({
      where: {
        id: materialId,
        isActive: true,
      },
      include: {
        ratings: true,
        downloads: true,
      },
    });

    if (!material) {
      throw createError({
        statusCode: 404,
        statusMessage: "Material not found",
      });
    }

    // Вычисляем статистику
    const avgRating =
      material.ratings.length > 0
        ? material.ratings.reduce((sum, rating) => sum + rating.rating, 0) /
          material.ratings.length
        : 0;

    const downloadCount = material.downloads.length;

    // Находим оценку текущего пользователя
    const userRating = userId
      ? material.ratings.find((rating) => rating.userId === userId)?.rating || 0
      : 0;

    const materialWithStats = {
      ...material,
      content: sanitizeHtml(material.content),
      avgRating: Math.round(avgRating * 10) / 10,
      downloadCount,
      userRating,
      ratingCount: material.ratings.length,
    };

    return {
      success: true,
      material: materialWithStats,
    };
  } catch (error) {
    console.error("Ошибка получения материала:", error);
    return {
      success: false,
      error: "Ошибка получения материала",
    };
  }
});
