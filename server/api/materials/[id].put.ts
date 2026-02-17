import { prisma } from "../../utils/prisma";
import { sanitizeHtml } from "../../../util/sanitize-html";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();
    const type = String(body?.type || "").trim();
    const category = String(body?.category || "").trim();
    const pages = Number(body?.pages || 0);
    const features = Array.isArray(body?.features) ? body.features : [];
    const content = sanitizeHtml(String(body?.content || ""));
    const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!id || !title || !description || !type || !category || !content) {
      return { success: false, error: "Некорректные данные материала" };
    }

    const material = await prisma.material.update({
      where: { id },
      data: {
        title,
        description,
        type,
        category,
        pages: Number.isFinite(pages) ? Math.max(1, Math.floor(pages)) : 1,
        features: features.filter((item) => typeof item === "string").slice(0, 30),
        content,
        isActive,
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
