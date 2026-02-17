import { prisma } from "../../utils/prisma";
import { createAuthToken } from "../../utils/auth-token";
import { hashPassword } from "../../utils/password";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

function verifyTelegramAuthData(
  authData: Record<string, unknown>,
  botToken: string
): boolean {
  const incomingHash = String(authData.hash || "");
  if (!incomingHash) return false;

  const checkString = Object.keys(authData)
    .filter((key) => key !== "hash" && authData[key] !== undefined && authData[key] !== null)
    .sort()
    .map((key) => `${key}=${authData[key]}`)
    .join("\n");

  const secret = createHash("sha256").update(botToken).digest();
  const calculatedHash = createHmac("sha256", secret).update(checkString).digest("hex");

  const incoming = Buffer.from(incomingHash, "hex");
  const calculated = Buffer.from(calculatedHash, "hex");
  if (incoming.length !== calculated.length) return false;

  return timingSafeEqual(incoming, calculated);
}

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody(event);
    const { id, first_name, last_name, username, photo_url, auth_date, hash } =
      body;

    // Валидация данных от Telegram
    if (!id || !first_name || !auth_date || !hash) {
      return {
        success: false,
        error: "Invalid Telegram data",
      };
    }

    if (!config.telegramToken) {
      return {
        success: false,
        error: "Telegram auth is not configured",
      };
    }

    if (!verifyTelegramAuthData(body, config.telegramToken)) {
      return {
        success: false,
        error: "Invalid Telegram signature",
      };
    }

    const authDate = Number(auth_date);
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(authDate) || now - authDate > 24 * 60 * 60) {
      return {
        success: false,
        error: "Telegram auth data expired",
      };
    }

    await prisma.$connect();

    // Проверяем, существует ли пользователь
    let user = await prisma.user.findUnique({
      where: { telegramId: String(id) },
    });

    if (!user) {
      // Генерируем уникальный логин
      let login = `telegram_${id}`;
      let counter = 1;

      // Проверяем, что логин уникален
      while (await prisma.user.findUnique({ where: { login } })) {
        login = `telegram_${id}_${counter}`;
        counter++;
      }

      try {
        // Создаем нового пользователя
        user = await prisma.user.create({
          data: {
            telegramId: String(id),
            username: username || null,
            firstName: first_name,
            lastName: last_name || null,
            photoUrl: photo_url || null,
            login: login,
            password: hashPassword(randomBytes(24).toString("base64url")),
            balance: 15000, // 150 рублей в копейках
            isAdmin: false,
          },
        });

      } catch (createError) {
        throw createError;
      }

      try {
        // Создаем транзакцию для начального баланса
        await prisma.transaction.create({
          data: {
            userId: user.id,
            type: "credit",
            amount: 15000,
            description: "Начальный бонус",
          },
        });
      } catch {
        // Не прерываем процесс, если транзакция не создалась
      }
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
      config.authTokenSecret
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
    console.error("Telegram auth error:", error instanceof Error ? error.message : error);
    return {
      success: false,
      error: "Authentication failed",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
