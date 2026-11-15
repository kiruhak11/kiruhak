import { prisma } from "../../../utils/prisma";
import { isValidBotSecret } from "../../../utils/bot-secret";

// Флаг используется ТОЛЬКО для отладочного логирования и никогда —
// для проверки авторизации: проверка секрета бота всегда обязательна.
const isDev = process.env.NODE_ENV !== "production";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();

    // Служебный endpoint бота: корректный секрет обязателен в ЛЮБОМ
    // окружении. Раньше проверка зависела от NODE_ENV, что на этапе сборки
    // позволяло скомпилировать её полностью.
    if (!isValidBotSecret(getHeader(event, "x-bot-secret"), config.botSecret)) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden - Invalid bot secret",
      });
    }

    const componentId = getRouterParam(event, "id");
    const body = await readBody(event);
    const action = String(body?.action || "");
    const reason = body?.reason ? String(body.reason).trim() : "";

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
        rejectionReason: action === "reject" ? reason : null,
      },
    });

    // Отправляем уведомление автору
    if (component.author?.telegramId) {
      await notifyAuthor(
        component.author.telegramId,
        component.name,
        action,
        reason,
        config.telegramToken
      );
    }

    return {
      success: true,
      component: {
        id: updatedComponent.id,
        moderationStatus: updatedComponent.moderationStatus,
      },
    };
  } catch (error: any) {
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
  reason?: string,
  botToken?: string
) {
  if (!botToken) {
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
      `https://api.telegram.org/bot${botToken}/sendMessage`,
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
    if (!data.ok && isDev) {
      console.error("❌ Ошибка отправки уведомления:", data);
    }
  } catch (error) {
    if (isDev) {
      console.error("❌ Ошибка отправки в Telegram:", error);
    }
  }
}
