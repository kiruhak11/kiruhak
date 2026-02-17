import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    // Удаляем связанные данные
    await prisma.tutorialProgress.deleteMany({
      where: {
        tutorialId: id,
      },
    });

    await prisma.tutorialStep.deleteMany({
      where: {
        tutorialId: id,
      },
    });

    await prisma.tutorial.delete({
      where: { id },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Ошибка удаления туториала:", error);
    return {
      success: false,
      error: "Ошибка удаления туториала",
    };
  }
});
