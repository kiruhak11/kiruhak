import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const componentId = getRouterParam(event, "id");
    const user = event.context.user;

    // Получаем IP и User Agent
    const headers = event.node.req.headers;
    const ip = (headers["x-forwarded-for"] as string)?.split(",")[0] || 
               (headers["x-real-ip"] as string) || 
               event.node.req.socket.remoteAddress || 
               "unknown";
    const userAgent = headers["user-agent"] || "unknown";

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

