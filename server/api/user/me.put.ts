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

    const body = await readBody(event);
    const { firstName, lastName, username } = body;

    // Валидация данных
    if (!firstName) {
      return {
        success: false,
        error: "Имя обязательно для заполнения",
      };
    }

    // Проверяем, не занято ли имя пользователя другим пользователем
    if (username && username !== user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        return {
          success: false,
          error: "Имя пользователя уже занято",
        };
      }
    }

    // Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        username: username || null,
      },
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        telegramId: updatedUser.telegramId,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        photoUrl: updatedUser.photoUrl,
        isAdmin: updatedUser.isAdmin,
        balance: updatedUser.balance,
      },
    };
  } catch (error) {
    console.error("Update user error:", error);
    return {
      success: false,
      error: "Ошибка обновления профиля",
    };
  }
});
