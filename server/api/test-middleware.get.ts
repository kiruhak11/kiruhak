export default defineEventHandler(async (event) => {
  console.log("🔒 Test Middleware: Endpoint вызван");

  // Проверяем, есть ли пользователь в контексте
  const user = event.context.user;

  if (user) {
    return {
      success: true,
      message: "Middleware работает, пользователь аутентифицирован",
      user: {
        id: user.id,
        firstName: user.firstName,
        isAdmin: user.isAdmin,
      },
    };
  } else {
    return {
      success: false,
      message: "Middleware работает, но пользователь не аутентифицирован",
    };
  }
});
