import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    const query = getQuery(event);
    const { category, search, limit = "50" } = query;

    // Строим фильтры
    const where: any = {
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
      take: parseInt(limit as string),
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
