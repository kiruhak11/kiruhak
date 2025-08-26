import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { amount } = body;

    // Получаем пользователя из контекста (добавлено middleware)
    const user = event.context.user;
    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Валидация суммы
    if (!amount || amount <= 0) {
      return {
        success: false,
        error: "Invalid amount",
      };
    }

    // Конвертируем рубли в копейки
    const amountInKopecks = Math.round(amount * 100);

    // Обновляем баланс пользователя и создаем транзакцию
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: user.balance + amountInKopecks },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "credit",
          amount: amountInKopecks,
          description: `Пополнение баланса на ${amount}₽`,
        },
      }),
    ]);

    return {
      success: true,
      newBalance: updatedUser.balance,
      formattedBalance: `${(updatedUser.balance / 100).toFixed(0)} ₽`,
    };
  } catch (error) {
    console.error("Error topping up balance:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to top up balance",
    });
  }
});
