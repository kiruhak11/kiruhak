import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { category, search, limit = "50" } = query;

    // Строим фильтры
    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        { tags: { hasSome: [search as string] } },
      ];
    }

    const components = await prisma.uiComponent.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: parseInt(limit as string),
    });

    return {
      success: true,
      components,
    };
  } catch (error) {
    console.error("Ошибка получения UI компонентов:", error);
    return {
      success: false,
      error: "Ошибка получения компонентов",
    };
  }
});
