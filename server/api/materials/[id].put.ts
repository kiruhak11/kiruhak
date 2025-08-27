import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const {
      title,
      description,
      type,
      category,
      pages,
      features,
      content,
      isActive,
    } = body;

    const material = await prisma.material.update({
      where: { id },
      data: {
        title,
        description,
        type,
        category,
        pages,
        features: features || [],
        content,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return {
      success: true,
      material,
    };
  } catch (error) {
    console.error("Ошибка обновления материала:", error);
    return {
      success: false,
      error: "Ошибка обновления материала",
    };
  }
});
