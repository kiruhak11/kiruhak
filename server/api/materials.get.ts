import { prisma } from "../utils/prisma";
import { sanitizeHtml } from "../../util/sanitize-html";

export default defineEventHandler(async (event) => {
  try {
    // Получаем пользователя из контекста (если есть)
    const user = event.context.user;
    const userId = user?.id;

    const materials = await prisma.material.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: "asc",
      },
      include: {
        ratings: true,
        downloads: true,
      },
    });

    // Вычисляем средний рейтинг, количество загрузок и оценку пользователя
    const materialsWithStats = materials.map((material) => {
      const avgRating =
        material.ratings.length > 0
          ? material.ratings.reduce((sum, rating) => sum + rating.rating, 0) /
            material.ratings.length
          : 0;

      const downloadCount = material.downloads.length;

      // Находим оценку текущего пользователя
      const userRating = userId
        ? material.ratings.find((rating) => rating.userId === userId)?.rating ||
          0
        : 0;

      return {
        ...material,
        content: sanitizeHtml(material.content),
        avgRating: Math.round(avgRating * 10) / 10,
        downloadCount,
        userRating,
        ratingCount: material.ratings.length,
      };
    });

    return {
      success: true,
      materials: materialsWithStats,
    };
  } catch (error) {
    console.error("Ошибка получения материалов:", error);
    return {
      success: false,
      error: "Ошибка получения материалов",
    };
  }
});
