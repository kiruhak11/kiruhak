import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const currentUser = event.context.user;
    if (!currentUser) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    // Настройки Telegram бота из конфига
    const config = useRuntimeConfig();
    const botToken = config.telegramToken;
    const rawChannelUsername = String(config.channelUsername || "")
      .trim()
      .toLowerCase();
    const channelUsername =
      !rawChannelUsername ||
      rawChannelUsername === "webmonke" ||
      rawChannelUsername === "@webmonke"
        ? "webmonke"
        : String(config.channelUsername || "")
            .trim()
            .replace(/^@/, "");

    if (!botToken || !channelUsername) {
      return {
        success: false,
        error: "Ошибка конфигурации бота",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) {
      return {
        success: false,
        error: "Пользователь не найден",
      };
    }

    if (!user.telegramId) {
      return {
        success: false,
        error: "Telegram аккаунт не привязан",
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
        return {
          success: false,
          error: "Ошибка проверки подписки",
          telegramError: data.description,
        };
      }

      const member = data.result;
      const isSubscribed = ["member", "administrator", "creator"].includes(
        member.status,
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
        channelUsername,
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
      return {
        success: false,
        error: "Ошибка соединения с Telegram",
        telegramError:
          telegramError instanceof Error
            ? telegramError.message
            : "Unknown Telegram error",
      };
    }
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    return {
      success: false,
      error: "Внутренняя ошибка сервера",
    };
  }
});
