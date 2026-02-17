import { prisma } from "../../utils/prisma";
import { createAuthToken } from "../../utils/auth-token";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const isDev = process.env.NODE_ENV !== "production";

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
  const telegramId = String(body?.telegramId || "").trim();
  if (!telegramId) {
    throw createError({
      statusCode: 400,
      statusMessage: "telegramId is required",
    });
  }

  const user = await prisma.user.findUnique({
    where: { telegramId },
    select: {
      id: true,
      login: true,
      telegramId: true,
      isAdmin: true,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const quickToken = createAuthToken(
    {
      userId: user.id,
      telegramId: user.telegramId,
      isAdmin: user.isAdmin,
      iat: issuedAt,
      exp: issuedAt + 15 * 60,
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

  return {
    success: true,
    login: user.login,
    quickToken,
    quickLoginUrl,
  };
});
