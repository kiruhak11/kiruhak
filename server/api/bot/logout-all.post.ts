import { prisma } from "../../utils/prisma";
import { revokeAllUserSessions } from "../../utils/session-control";
import { isValidBotSecret } from "../../utils/bot-secret";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Служебный API бота: корректный секрет обязателен в ЛЮБОМ окружении.
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
    select: { id: true },
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  await revokeAllUserSessions(user.id);

  return {
    success: true,
  };
});
