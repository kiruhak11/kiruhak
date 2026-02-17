import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    // Проверяем права администратора
    const user = event.context.user;

    if (!user || !user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Admin access required",
      });
    }

    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const name = String(body?.name || "").trim();
    const description = body?.description ? String(body.description).trim() : "";
    const category = String(body?.category || "").trim();
    const code = String(body?.code || "");
    const html = String(body?.html || "");
    const css = String(body?.css || "");
    const js = String(body?.js || "");
    const preview = body?.preview ? String(body.preview).trim() : null;
    const tags = Array.isArray(body?.tags) ? body.tags : [];
    const order = Number(body?.order || 0);
    const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!id) {
      return {
        success: false,
        error: "ID компонента не указан",
      };
    }

    if (!name || !category || !code || !html || !css) {
      return {
        success: false,
        error: "Необходимо указать название, категорию, code, html и css",
      };
    }

    if (name.length > 100 || description.length > 1000) {
      return {
        success: false,
        error: "Слишком длинные поля",
      };
    }

    const component = await prisma.uiComponent.update({
      where: { id },
      data: {
        name,
        description,
        category,
        code,
        html,
        css,
        js,
        preview,
        tags: tags.filter((tag) => typeof tag === "string").slice(0, 20),
        order: Number.isFinite(order) ? Math.max(0, Math.floor(order)) : 0,
        isActive,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      component,
    };
  } catch (error) {
    if ((error as { statusCode?: number })?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка обновления компонента",
    });
  }
});
