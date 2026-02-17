import { prisma } from "../utils/prisma";
import { sanitizeHtml } from "../../util/sanitize-html";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();
    const difficulty = String(body?.difficulty || "").trim();
    const category = String(body?.category || "").trim();
    const duration = String(body?.duration || "").trim();
    const features = Array.isArray(body?.features) ? body.features : [];
    const steps = Array.isArray(body?.steps) ? body.steps : [];
    const test = body?.test || null;

    if (!title || !description || !difficulty || !category || !duration) {
      return { success: false, error: "Некорректные данные туториала" };
    }

    const tutorial = await prisma.tutorial.create({
      data: {
        title,
        description,
        difficulty,
        category,
        duration,
        features: features.filter((item) => typeof item === "string").slice(0, 30),
        test: test || null,
        order: 0,
        isActive: true,
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
    console.error("Ошибка создания туториала:", error);
    return {
      success: false,
      error: "Ошибка создания туториала",
    };
  }
});
