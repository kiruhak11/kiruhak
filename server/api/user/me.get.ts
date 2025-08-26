import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    // Получаем актуальные данные пользователя из базы
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        sites: true,
        transactions: true,
      },
    });

    if (!currentUser) {
      throw createError({
        statusCode: 404,
        statusMessage: "User not found",
      });
    }

    return {
      success: true,
      user: {
        id: currentUser.id,
        telegramId: currentUser.telegramId,
        username: currentUser.username,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        photoUrl: currentUser.photoUrl,
        isAdmin: currentUser.isAdmin,
        balance: currentUser.balance,
        sitesCount: currentUser.sites.length,
        transactionsCount: currentUser.transactions.length,
        createdAt: currentUser.createdAt,
      },
    };
  } catch (error) {
    console.error("Get user error:", error);
    return {
      success: false,
      error: "Ошибка получения данных пользователя",
    };
  }
});
