import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    // В dev-режиме пропускаем проверку секретного ключа для упрощения
    const isDev = process.env.NODE_ENV !== "production";
    
    if (!isDev) {
      // В production проверяем секретный ключ бота
      const config = useRuntimeConfig();
      const botSecret = event.node.req.headers["x-bot-secret"];
      const expectedSecret = config.botSecret || process.env.BOT_SECRET || "your-secret-key-change-me";

      if (botSecret !== expectedSecret) {
        console.error("❌ Неверный секретный ключ бота");
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden - Invalid bot secret",
        });
      }
    } else {
      console.log("🔓 Dev mode: пропускаем проверку секретного ключа");
    }

    const componentId = getRouterParam(event, "id");
    const body = await readBody(event);
    const { action, reason } = body; // action: 'approve' or 'reject'

    console.log(`🤖 Бот модерирует компонент ${componentId}: ${action}`);

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
        rejectionReason: action === "reject" ? reason : null,
      },
    });

    console.log(`✅ Компонент ${componentId} ${action === "approve" ? "одобрен" : "отклонен"}`);

    // Отправляем уведомление автору
    if (component.author?.telegramId) {
      await notifyAuthor(component.author.telegramId, component.name, action, reason);
    }

    return {
      success: true,
      component: {
        id: updatedComponent.id,
        moderationStatus: updatedComponent.moderationStatus,
      },
    };
  } catch (error: any) {
    console.error("Ошибка модерации компонента:", error);
    
    // Если это наша ошибка с правильным форматом
    if (error.statusCode) {
      throw error;
    }
    
    return {
      success: false,
      error: error.message || "Ошибка модерации компонента",
    };
  }
});

async function notifyAuthor(
  telegramId: string,
  componentName: string,
  action: string,
  reason?: string
) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!TELEGRAM_BOT_TOKEN) {
    console.log("⚠️ TELEGRAM_BOT_TOKEN не настроен");
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
${reason ? `<b>Причина:</b> ${reason}` : ""}

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
    if (data.ok) {
      console.log(`✅ Уведомление автору отправлено (${action})`);
    } else {
      console.error("❌ Ошибка отправки уведомления:", data);
    }
  } catch (error) {
    console.error("❌ Ошибка отправки в Telegram:", error);
  }
}

