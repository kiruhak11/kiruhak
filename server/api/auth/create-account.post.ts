import { prisma } from "../../utils/prisma";
import { randomBytes } from "crypto";
import { hashPassword } from "../../utils/password";
import { createAuthToken } from "../../utils/auth-token";

function buildQuickLogin(
  config: ReturnType<typeof useRuntimeConfig>,
  targetUser: { id: string; telegramId: string; isAdmin: boolean }
) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const quickToken = createAuthToken(
    {
      userId: targetUser.id,
      telegramId: targetUser.telegramId,
      isAdmin: targetUser.isAdmin,
      iat: issuedAt,
      exp: issuedAt + 15 * 60, // 15 минут
    },
    config.authTokenSecret
  );

  const baseUrl = String(config.public.siteUrl || "https://kiruhak11.ru").replace(
    /\/$/,
    ""
  );
  const quickLoginUrl = `${baseUrl}/bot-login?token=${encodeURIComponent(
    quickToken
  )}`;

  return { quickToken, quickLoginUrl };
}

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

    if (!telegramId || !firstName) {
      return {
        success: false,
        error: "Необходимы telegramId и firstName",
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
    });

    if (existingUser) {
      const { quickToken, quickLoginUrl } = buildQuickLogin(config, existingUser);
      return {
        success: true,
        existing: true,
        message: "Пользователь уже существует",
        login: existingUser.login,
        quickToken,
        quickLoginUrl,
      };
    }

    let login = `user_${randomBytes(4).toString("hex")}`;
    while (await prisma.user.findUnique({ where: { login } })) {
      login = `user_${randomBytes(4).toString("hex")}`;
    }

    const password = randomBytes(6).toString("base64url");
    const passwordHash = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        telegramId: String(telegramId),
        username: username || null,
        firstName,
        lastName: lastName || null,
        photoUrl: null,
        login,
        password: passwordHash,
        balance: 15000,
        isAdmin: false,
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "credit",
        amount: 15000,
        description: "Начальный бонус",
      },
    });

    const { quickToken, quickLoginUrl } = buildQuickLogin(config, user);

    return {
      success: true,
      existing: false,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        login: user.login,
        password,
        balance: user.balance,
      },
      quickToken,
      quickLoginUrl,
    };
  } catch (error) {
    console.error("Create account error:", error);
    return {
      success: false,
      error: "Ошибка создания аккаунта",
    };
  }
});
