import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    console.log("Received auth data:", body);
    const { id, first_name, last_name, username, photo_url, auth_date, hash } =
      body;

    // Валидация данных от Telegram
    if (!id || !first_name || !auth_date || !hash) {
      return {
        success: false,
        error: "Invalid Telegram data",
      };
    }

    // Проверяем, существует ли пользователь
    let user = await prisma.user.findUnique({
      where: { telegramId: String(id) },
    });

    if (!user) {
      // Создаем нового пользователя
      user = await prisma.user.create({
        data: {
          telegramId: String(id),
          username: username || null,
          firstName: first_name,
          lastName: last_name || null,
          photoUrl: photo_url || null,
          balance: 15000, // 150 рублей в копейках
          isAdmin: false,
        },
      });

      // Создаем транзакцию для начального баланса
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "credit",
          amount: 15000,
          description: "Начальный бонус",
        },
      });
    } else {
      // Обновляем данные существующего пользователя
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          username: username || user.username,
          firstName: first_name,
          lastName: last_name || user.lastName,
          photoUrl: photo_url || user.photoUrl,
        },
      });
    }

    // Создаем JWT токен (в реальном проекте используйте библиотеку для JWT)
    const token = Buffer.from(
      JSON.stringify({
        userId: user.id,
        telegramId: user.telegramId,
        isAdmin: user.isAdmin,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 дней
      })
    ).toString("base64");

    return {
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        isAdmin: user.isAdmin,
        balance: user.balance,
      },
      token,
    };
  } catch (error) {
    console.error("Telegram auth error:", error);
    return {
      success: false,
      error: "Authentication failed",
    };
  }
});
