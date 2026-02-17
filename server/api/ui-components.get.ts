import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    const query = getQuery(event);
    const category = typeof query.category === "string" ? query.category.trim() : "";
    const search = typeof query.search === "string" ? query.search.trim() : "";
    const rawLimit = Number(query.limit || 50);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.floor(rawLimit), 1), 100)
      : 50;

    // Строим фильтры
    const where: Record<string, unknown> = {
      OR: [
        { isActive: true },
      ],
    };

    // Добавляем pending компоненты пользователя
    if (user) {
      where.OR.push({
        authorId: user.id,
        moderationStatus: "pending",
      });
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search as string, mode: "insensitive" } },
            { description: { contains: search as string, mode: "insensitive" } },
            { tags: { hasSome: [search as string] } },
          ],
        },
      ];
    }

    const components = await prisma.uiComponent.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            username: true,
          },
        },
      },
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
