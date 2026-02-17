import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = event.context.user;
    if (!user || !user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden - Admin access required",
      });
    }

    const componentId = getRouterParam(event, "id");
    const body = await readBody(event);
    const action = String(body?.action || "");
    const rejectionReason = body?.rejectionReason
      ? String(body.rejectionReason).trim()
      : "";

    if (!componentId || !["approve", "reject"].includes(action)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid moderation payload",
      });
    }

    // Получаем компонент с автором
    const component = await prisma.uiComponent.findUnique({
      where: { id: componentId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            telegramId: true,
          },
        },
      },
    });

    if (!component) {
      throw createError({
        statusCode: 404,
        statusMessage: "Component not found",
      });
    }

    // Обновляем статус
    const updatedComponent = await prisma.uiComponent.update({
      where: { id: componentId },
      data: {
        moderationStatus: action === "approve" ? "approved" : "rejected",
        isActive: action === "approve",
        rejectionReason: action === "reject" ? rejectionReason : null,
      },
    });

    // Отправляем уведомление автору
    if (component.author?.telegramId) {
      await notifyAuthor(component.author.telegramId, component.name, action, rejectionReason);
    }

    return {
      success: true,
      component: updatedComponent,
    };
  } catch (error) {
    console.error("Ошибка модерации компонента:", error);
    return {
      success: false,
      error: "Ошибка модерации компонента",
    };
  }
});

async function notifyAuthor(
  telegramId: string,
  componentName: string,
  action: string,
  rejectionReason?: string
) {
  const config = useRuntimeConfig();
  const TELEGRAM_BOT_TOKEN = config.telegramToken;

  if (!TELEGRAM_BOT_TOKEN) {
    return;
  }

  let message = "";
  if (action === "approve") {
    message = `
✅ <b>Ваш компонент одобрен!</b>

<b>Компонент:</b> ${componentName}

Ваш компонент прошел модерацию и теперь доступен для всех пользователей. Спасибо за вклад в сообщество! 🎉
`;
  } else {
    message = `
❌ <b>Ваш компонент отклонен</b>

<b>Компонент:</b> ${componentName}
${rejectionReason ? `<b>Причина:</b> ${rejectionReason}` : ""}

Вы можете исправить замечания и отправить компонент снова.
`;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: telegramId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await response.json();
    if (!data.ok) console.error("❌ Ошибка отправки уведомления:", data);
  } catch (error) {
    console.error("❌ Ошибка отправки в Telegram:", error);
  }
}
