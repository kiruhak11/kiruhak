import { prisma } from "../../utils/prisma";
import { hashPassword, verifyPassword } from "../../utils/password";
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
  const currentPassword = String(body?.currentPassword || "");
  const newPassword = String(body?.newPassword || "");

  if (!telegramId || !currentPassword || !newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid payload",
    });
  }

  if (newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password must be at least 8 characters",
    });
  }

  const user = await prisma.user.findUnique({
    where: { telegramId },
    select: { id: true, password: true },
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  if (!verifyPassword(currentPassword, user.password)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Current password is incorrect",
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashPassword(newPassword),
    },
  });

  await revokeAllUserSessions(user.id);

  return {
    success: true,
  };
});
