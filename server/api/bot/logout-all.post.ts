import { prisma } from "../../utils/prisma";
import { revokeAllUserSessions } from "../../utils/session-control";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const isDev = process.env.NODE_ENV !== "production";

  if (!isDev) {
    const secret = getHeader(event, "x-bot-secret");
    const expectedSecret =
      config.botSecret || process.env.BOT_SECRET || process.env.NUXT_BOT_SECRET || "";
    if (!expectedSecret || secret !== expectedSecret) {
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
