import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { title, description, type, category, pages, features, content } =
      body;

    const material = await prisma.material.create({
      data: {
        title,
        description,
        type,
        category,
        pages,
        features: features || [],
        content,
        order: 0,
        isActive: true,
      },
    });

    return {
      success: true,
      material,
    };
  } catch (error) {
    console.error("Ошибка создания материала:", error);
    return {
      success: false,
      error: "Ошибка создания материала",
    };
  }
});
