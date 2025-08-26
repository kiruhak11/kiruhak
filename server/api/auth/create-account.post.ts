import { prisma } from "../../utils/prisma";
import { randomBytes } from "crypto";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { telegramId, firstName, lastName, username } = body;

    // Валидация данных
    if (!telegramId || !firstName) {
      return {
        success: false,
        error: "Необходимы telegramId и firstName",
      };
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Пользователь уже существует",
        login: existingUser.login,
      };
    }

    // Генерируем логин и пароль
    const login = `user_${Math.random().toString(36).substring(2, 8)}`;
    const password = randomBytes(4).toString("hex"); // 8 символов

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        telegramId: String(telegramId),
        username: username || null,
        firstName: firstName,
        lastName: lastName || null,
        photoUrl: null,
        login: login,
        password: password, // В реальном проекте нужно хешировать
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

    return {
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        login: user.login,
        password: user.password, // Отправляем пароль в боте
        balance: user.balance,
      },
    };
  } catch (error) {
    console.error("Create account error:", error);
    return {
      success: false,
      error: "Ошибка создания аккаунта",
    };
  }
});
