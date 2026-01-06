import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const isDev = process.env.NODE_ENV !== "production";
  
  try {
    const body = await readBody(event);
    const { userId, telegramId } = body;

    if (!userId && !telegramId) {
      return {
        success: false,
        error: "Необходим userId или telegramId",
      };
    }

    // Настройки Telegram бота из конфига
    const config = useRuntimeConfig();
    const botToken = config.telegramToken;
    const channelUsername = config.channelUsername;

    if (!botToken) {
      if (isDev) console.error("Токен бота не настроен в конфиге");
      return {
        success: false,
        error: "Ошибка конфигурации бота",
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

      const response = await fetch(telegramApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!data.ok) {
        if (isDev) console.error("Ошибка Telegram API:", data.description);
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

      // Сохраняем статус подписки в базе данных
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isSubscribed: isSubscribed,
          subscriptionCheckedAt: new Date(),
        },
      });

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
      if (isDev) console.error("Ошибка при проверке подписки:", telegramError);
      return {
        success: false,
        error: "Ошибка соединения с Telegram",
        telegramError: telegramError.message,
      };
    }
  } catch (error) {
    if (isDev) console.error("Общая ошибка проверки подписки:", error);
    return {
      success: false,
      error: "Внутренняя ошибка сервера",
    };
  }
});
