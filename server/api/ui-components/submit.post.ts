import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized - Authentication required",
      });
    }

    const body = await readBody(event);
    const { name, description, category, html, css, js, tags } = body;

    console.log(`🎨 Пользователь ${user.firstName} отправляет компонент: ${name}`);

    // Создаем компонент со статусом pending
    const component = await prisma.uiComponent.create({
      data: {
        name,
        description: description || "",
        category,
        html,
        css,
        js: js || "",
        code: html, // Для обратной совместимости
        tags: tags || [],
        authorId: user.id,
        moderationStatus: "pending",
        isActive: false, // Неактивен до модерации
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            username: true,
            telegramId: true,
          },
        },
      },
    });

    console.log(`✅ Компонент создан с ID: ${component.id}`);

    // Отправляем уведомление админу через телеграм
    try {
      await notifyAdminAboutNewComponent(component);
    } catch (notifyError) {
      console.error("Ошибка отправки уведомления админу:", notifyError);
    }

    return {
      success: true,
      component: {
        id: component.id,
        name: component.name,
      },
    };
  } catch (error) {
    console.error("Ошибка создания компонента:", error);
    return {
      success: false,
      error: "Ошибка создания компонента",
    };
  }
});

async function notifyAdminAboutNewComponent(component: any) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || "739618149";

  if (!TELEGRAM_BOT_TOKEN) {
    console.log("⚠️ TELEGRAM_BOT_TOKEN не настроен");
    return;
  }

  const message = `
🎨 <b>Новый UI компонент на модерацию!</b>

<b>Компонент:</b> ${component.name}
<b>Автор:</b> ${component.author?.firstName || "Неизвестен"}
<b>Категория:</b> ${component.category}
<b>Описание:</b> ${component.description || "Не указано"}

<b>HTML:</b> ${component.html.length} символов
<b>CSS:</b> ${component.css.length} символов
${component.js ? `<b>JS:</b> ${component.js.length} символов` : ""}

<b>ID:</b> <code>${component.id}</code>
`;
  
  // Используем первые 20 символов ID для callback_data (лимит Telegram - 64 байта)

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: ADMIN_TELEGRAM_ID,
          text: message,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✅ Одобрить",
                  callback_data: `approve_${component.id.substring(0, 20)}`,
                },
                {
                  text: "❌ Отклонить",
                  callback_data: `reject_${component.id.substring(0, 20)}`,
                },
              ],
            ],
          },
        }),
      }
    );

    const data = await response.json();
    if (data.ok) {
      console.log("✅ Уведомление админу отправлено");
    } else {
      console.error("❌ Ошибка отправки уведомления:", data);
    }
  } catch (error) {
    console.error("❌ Ошибка отправки в Telegram:", error);
  }
}

