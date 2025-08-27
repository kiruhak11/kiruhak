import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { userId, telegramId } = body;

    if (!userId && !telegramId) {
      return {
        success: false,
        error: "Необходим userId или telegramId",
      };
    }

    // Получаем токен бота из переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelUsername =
      process.env.TELEGRAM_CHANNEL_USERNAME || "web_kiruhak11";

    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN не настроен");
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
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getChatMember`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: `@${channelUsername}`,
            user_id: user.telegramId,
          }),
        }
      );

      const data = await response.json();

      if (!data.ok) {
        console.error("Ошибка Telegram API:", data);
        return {
          success: false,
          error: "Ошибка проверки подписки",
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
      console.error("Ошибка при проверке подписки:", telegramError);
      return {
        success: false,
        error: "Ошибка соединения с Telegram",
      };
    }
  } catch (error) {
    console.error("Ошибка проверки подписки:", error);
    return {
      success: false,
      error: "Внутренняя ошибка сервера",
    };
  }
});
