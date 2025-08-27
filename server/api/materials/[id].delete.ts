import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    // Удаляем связанные данные
    await prisma.materialRating.deleteMany({
      where: {
        materialId: id,
      },
    });

    await prisma.materialDownload.deleteMany({
      where: {
        materialId: id,
      },
    });

    await prisma.material.delete({
      where: { id },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Ошибка удаления материала:", error);
    return {
      success: false,
      error: "Ошибка удаления материала",
    };
  }
});
