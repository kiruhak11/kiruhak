import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { userId, telegramId } = body;

    console.log("🔍 Проверка подписки:", { userId, telegramId });

    if (!userId && !telegramId) {
      console.log("❌ Отсутствуют userId или telegramId");
      return {
        success: false,
        error: "Необходим userId или telegramId",
      };
    }

    // Захардкоженные настройки бота
    const botToken = process.env.TELEGRAM_BOT_TOKEN; // Замените на ваш токен
    const channelUsername = "web_kiruhak11";

    console.log("🔧 Конфигурация:", {
      botToken: botToken ? "***" : "НЕ НАСТРОЕН",
      channelUsername,
    });

    if (!botToken || botToken === "YOUR_BOT_TOKEN_HERE") {
      console.error(
        "Токен бота не настроен - замените YOUR_BOT_TOKEN_HERE на реальный токен"
      );
      return {
        success: false,
        error: "Ошибка конфигурации бота - замените токен в коде",
      };
    }

    // Получаем информацию о пользователе из базы данных
    let user;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    } else if (telegramId) {
      user = await prisma.user.findUnique({
        where: { telegramId: telegramId },
      });
    }

    console.log(
      "👤 Найден пользователь:",
      user
        ? {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        : "НЕ НАЙДЕН"
    );

    if (!user) {
      return {
        success: false,
        error: "Пользователь не найден",
      };
    }

    // Проверяем подписку через Telegram Bot API
    try {
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getChatMember`;
      const requestBody = {
        chat_id: `@${channelUsername}`,
        user_id: user.telegramId,
      };

      console.log("📡 Запрос к Telegram API:", {
        url: telegramApiUrl,
        chat_id: `@${channelUsername}`,
        user_id: user.telegramId,
      });

      const response = await fetch(telegramApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("📡 Ответ Telegram API:", data);

      if (!data.ok) {
        console.error("❌ Ошибка Telegram API:", data);
        return {
          success: false,
          error: "Ошибка проверки подписки",
          telegramError: data.description,
        };
      }

      const member = data.result;
      const isSubscribed = ["member", "administrator", "creator"].includes(
        member.status
      );

      console.log("📊 Статус подписки:", {
        status: member.status,
        isSubscribed,
        user: member.user,
      });

      // Сохраняем статус подписки в базе данных
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isSubscribed: isSubscribed,
          subscriptionCheckedAt: new Date(),
        },
      });

      console.log("💾 Статус подписки сохранен в БД");

      return {
        success: true,
        isSubscribed,
        memberStatus: member.status,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (telegramError) {
      console.error("❌ Ошибка при проверке подписки:", telegramError);
      return {
        success: false,
        error: "Ошибка соединения с Telegram",
        telegramError: telegramError.message,
      };
    }
  } catch (error) {
    console.error("❌ Общая ошибка проверки подписки:", error);
    return {
      success: false,
      error: "Внутренняя ошибка сервера",
    };
  }
});
