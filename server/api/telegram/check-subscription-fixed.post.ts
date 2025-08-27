import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { userId, telegramId } = body;

    console.log("🔍 Проверка подписки (исправленная версия):", { userId, telegramId });

    if (!userId && !telegramId) {
      console.log("❌ Отсутствуют userId или telegramId");
      return {
        success: false,
        error: "Необходим userId или telegramId",
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

    // ВРЕМЕННОЕ РЕШЕНИЕ: Всегда возвращаем true
    // TODO: Настроить TELEGRAM_BOT_TOKEN в переменных окружения
    const isSubscribed = true;
    const memberStatus = "member";

    console.log("📊 Временный статус подписки:", {
      status: memberStatus,
      isSubscribed,
      note: "TELEGRAM_BOT_TOKEN не настроен - используем временное решение"
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
      memberStatus: memberStatus,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      note: "Временное решение - настройте TELEGRAM_BOT_TOKEN для полной функциональности"
    };

  } catch (error) {
    console.error("❌ Общая ошибка проверки подписки:", error);
    return {
      success: false,
      error: "Внутренняя ошибка сервера",
    };
  }
});
