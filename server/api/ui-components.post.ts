import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      name,
      description,
      category,
      code,
      preview,
      tags = [],
      order = 0,
    } = body;

    if (!name || !category || !code) {
      return {
        success: false,
        error: "Необходимо указать название, категорию и код компонента",
      };
    }

    const component = await prisma.uiComponent.create({
      data: {
        name,
        description,
        category,
        code,
        preview,
        tags: Array.isArray(tags) ? tags : [],
        order: parseInt(order) || 0,
      },
    });

    return {
      success: true,
      component,
    };
  } catch (error) {
    console.error("Ошибка создания UI компонента:", error);
    return {
      success: false,
      error: "Ошибка создания компонента",
    };
  }
});
