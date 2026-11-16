import { prisma } from "../../../utils/prisma";
import { resolveClientIp, trustedProxiesFromEnv } from "../../../utils/client-ip";

export default defineEventHandler(async (event) => {
  try {
    const componentId = getRouterParam(event, "id");
    const user = event.context.user;

    // Получаем IP и User Agent.
    // IP определяется через доверенные прокси: подмена X-Forwarded-For не
    // должна позволять обходить лимит и счётчик просмотров.
    const headers = event.node.req.headers;
    const ip = resolveClientIp(
      {
        headers: headers as unknown as Record<
          string,
          string | string[] | undefined
        >,
        socket: event.node?.req?.socket,
      },
      { trustedProxies: trustedProxiesFromEnv() }
    );
    const userAgent = headers["user-agent"] || "unknown";

    if (!componentId) {
      throw createError({
        statusCode: 404,
        statusMessage: "Component not found",
      });
    }

    // Проверяем, существует ли компонент
    const component = await prisma.uiComponent.findUnique({
      where: { id: componentId },
    });

    if (!component) {
      throw createError({
        statusCode: 404,
        statusMessage: "Component not found",
      });
    }

    // Записываем просмотр
    await prisma.uiComponentView.create({
      data: {
        componentId,
        userId: user?.id,
        ip,
        userAgent,
      },
    });

    // Обновляем счетчик просмотров
    await prisma.uiComponent.update({
      where: { id: componentId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    console.log(`👁 Просмотр компонента ${componentId} от ${user?.firstName || "гостя"}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Ошибка записи просмотра:", error);
    return {
      success: false,
      error: "Ошибка записи просмотра",
    };
  }
});

