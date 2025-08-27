import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const {
      name,
      description,
      category,
      code,
      preview,
      tags = [],
      order = 0,
      isActive = true,
    } = body;

    if (!id) {
      return {
        success: false,
        error: "ID компонента не указан",
      };
    }

    if (!name || !category || !code) {
      return {
        success: false,
        error: "Необходимо указать название, категорию и код компонента",
      };
    }

    const component = await prisma.uiComponent.update({
      where: { id },
      data: {
        name,
        description,
        category,
        code,
        preview,
        tags: Array.isArray(tags) ? tags : [],
        order: parseInt(order) || 0,
        isActive,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      component,
    };
  } catch (error) {
    console.error("Ошибка обновления UI компонента:", error);
    return {
      success: false,
      error: "Ошибка обновления компонента",
    };
  }
});
