import { prisma } from "../../utils/prisma";
import { randomBytes } from "crypto";
import { hashPassword } from "../../utils/password";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const isDev = process.env.NODE_ENV !== "production";

    // Ограничиваем вызов endpoint внешним секретом в production.
    if (!isDev) {
      const secret = getHeader(event, "x-bot-secret");
      if (!config.botSecret || secret !== config.botSecret) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
        });
      }
    }

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

    // Генерируем уникальный логин и пароль
    let login = `user_${randomBytes(4).toString("hex")}`;
    while (await prisma.user.findUnique({ where: { login } })) {
      login = `user_${randomBytes(4).toString("hex")}`;
    }
    const password = randomBytes(6).toString("base64url"); // отправляем пользователю
    const passwordHash = hashPassword(password);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        telegramId: String(telegramId),
        username: username || null,
        firstName: firstName,
        lastName: lastName || null,
        photoUrl: null,
        login: login,
        password: passwordHash,
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
        password,
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
