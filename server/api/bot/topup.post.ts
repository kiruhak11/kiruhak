import { prisma } from "../../utils/prisma";

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
  const amount = Number(body?.amount);

  if (!telegramId || !Number.isFinite(amount) || amount <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid payload",
    });
  }

  if (amount > 100000) {
    throw createError({
      statusCode: 400,
      statusMessage: "Amount is too large",
    });
  }

  const user = await prisma.user.findUnique({
    where: { telegramId },
    select: { id: true, balance: true },
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  const amountInKopecks = Math.round(amount * 100);
  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { balance: { increment: amountInKopecks } },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "credit",
        amount: amountInKopecks,
        description: `Пополнение через Telegram-бот на ${amount}₽`,
      },
    }),
  ]);

  return {
    success: true,
    newBalance: updatedUser.balance,
    formattedBalance: `${(updatedUser.balance / 100).toFixed(0)} ₽`,
  };
});
