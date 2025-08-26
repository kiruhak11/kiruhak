export default defineEventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = event.context.user;
    
    if (!user) {
      return {
        success: false,
        message: "Не аутентифицирован",
        status: "unauthorized"
      };
    }

    return {
      success: true,
      message: "Аутентифицирован",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        balance: user.balance
      },
      status: "authenticated"
    };
  } catch (error) {
    console.error("Test auth error:", error);
    return {
      success: false,
      message: "Ошибка проверки аутентификации",
      error: error.message,
      status: "error"
    };
  }
});
