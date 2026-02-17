import { prisma } from "../../utils/prisma";
import { sanitizeHtml } from "../../../util/sanitize-html";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();
    const difficulty = String(body?.difficulty || "").trim();
    const category = String(body?.category || "").trim();
    const duration = String(body?.duration || "").trim();
    const features = Array.isArray(body?.features) ? body.features : [];
    const steps = Array.isArray(body?.steps) ? body.steps : [];
    const test = body?.test || null;
    const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!id || !title || !description || !difficulty || !category || !duration) {
      return { success: false, error: "Некорректные данные туториала" };
    }

    // Удаляем старые шаги
    await prisma.tutorialStep.deleteMany({
      where: {
        tutorialId: id,
      },
    });

    const tutorial = await prisma.tutorial.update({
      where: { id },
      data: {
        title,
        description,
        difficulty,
        category,
        duration,
        features: features.filter((item) => typeof item === "string").slice(0, 30),
        test: test || null,
        isActive,
        steps: {
          create:
            steps?.map((step: any, index: number) => ({
              title: String(step?.title || "").trim(),
              content: sanitizeHtml(String(step?.content || "")),
              order: index + 1,
            }))
            .filter((step) => step.title && step.content) || [],
        },
      },
      include: {
        steps: true,
      },
    });

    return {
      success: true,
      tutorial,
    };
  } catch (error) {
    console.error("Ошибка обновления туториала:", error);
    return {
      success: false,
      error: "Ошибка обновления туториала",
    };
  }
});
