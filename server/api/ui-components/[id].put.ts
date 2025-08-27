import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  console.log("🔒 API: PUT /api/ui-components/[id] - начало обработки");

  // Проверяем заголовки в API endpoint
  const headers = getHeaders(event);
  console.log("🔒 API: Все заголовки:", Object.keys(headers));
  console.log(
    "🔒 API: Authorization header (lowercase):",
    headers.authorization
  );
  console.log(
    "🔒 API: Authorization header (uppercase):",
    headers.Authorization
  );

  try {
    // Проверяем права администратора
    const user = event.context.user;
    console.log(
      "🔒 API: Пользователь в контексте:",
      user ? "present" : "missing"
    );

    if (!user || !user.isAdmin) {
      console.log("🔒 API: Нет пользователя или нет прав администратора");
      throw createError({
        statusCode: 403,
        statusMessage: "Admin access required",
      });
    }

    console.log(
      "🔒 API: Пользователь авторизован:",
      user.firstName,
      "isAdmin:",
      user.isAdmin
    );

    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    const {
      name,
      description,
      category,
      code,
      html,
      css,
      js,
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
        code: code || "", // Для обратной совместимости
        html: html || "",
        css: css || "",
        js: js || "",
        preview,
        tags: Array.isArray(tags) ? tags : [],
        order: parseInt(order) || 0,
        isActive,
        updatedAt: new Date(),
      },
    });

    console.log("🔒 API: Компонент успешно обновлен");
    return {
      success: true,
      component,
    };
  } catch (error) {
    console.error("🔒 API: Ошибка обновления UI компонента:", error);
    return {
      success: false,
      error: "Ошибка обновления компонента",
    };
  }
});
