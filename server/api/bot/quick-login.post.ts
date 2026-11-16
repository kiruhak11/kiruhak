import { prisma } from "../../utils/prisma";
import { createAuthToken, getAuthTokenTimes } from "../../utils/auth-token";
import { getRuntimeAuthTokenSecret } from "../../utils/security-config";
import { isValidBotSecret } from "../../utils/bot-secret";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Служебный API бота: корректный секрет обязателен в ЛЮБОМ окружении.
  // Проверка не зависит от NODE_ENV: иначе образ, собранный вне
  // production-режима, компилировал бы её полностью, и токен входа можно
  // было бы получить по произвольному Telegram ID.
  if (!isValidBotSecret(getHeader(event, "x-bot-secret"), config.botSecret)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
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

  const tokenTimes = getAuthTokenTimes(15 * 60);
  const quickToken = createAuthToken(
    {
      userId: user.id,
      telegramId: user.telegramId,
      isAdmin: user.isAdmin,
      ...tokenTimes,
    },
    getRuntimeAuthTokenSecret(config.authTokenSecret)
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
