import { prisma } from "../../utils/prisma";
import { createAuthToken } from "../../utils/auth-token";
import {
  hashPassword,
  isHashedPassword,
  verifyPassword,
} from "../../utils/password";
import { getRuntimeAuthTokenSecret } from "../../utils/security-config";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody(event);
    const { login, password } = body;

    // Валидация данных
    if (!login || !password) {
      return {
        success: false,
        error: "Необходимы логин и пароль",
      };
    }

    // Ищем пользователя по логину
    const user = await prisma.user.findUnique({
      where: { login: login },
    });

    if (!user) {
      return {
        success: false,
        error: "Пользователь не найден",
      };
    }

    // Проверяем пароль (поддержка хеша и legacy-формата).
    if (!verifyPassword(password, user.password)) {
      return {
        success: false,
        error: "Неверный пароль",
      };
    }

    if (!isHashedPassword(user.password)) {
      await prisma.user.updateMany({
        where: { id: user.id, password: user.password },
        data: { password: hashPassword(password) },
      });
    }

    // Создаем подписанный токен
    const issuedAt = Math.floor(Date.now() / 1000);
    const token = createAuthToken(
      {
        userId: user.id,
        telegramId: user.telegramId,
        isAdmin: user.isAdmin,
        iat: issuedAt,
        exp: issuedAt + 7 * 24 * 60 * 60, // 7 дней
      },
      getRuntimeAuthTokenSecret(config.authTokenSecret)
    );

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
    console.error("Login error:", error);
    return {
      success: false,
      error: "Ошибка входа",
    };
  }
});
