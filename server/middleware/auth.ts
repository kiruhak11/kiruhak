import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  const method = getMethod(event);

  console.log(`🔒 [Auth Middleware] ${method} ${path}`);
  console.log(
    `🔒 [Auth Middleware] Path starts with /api/:`,
    path.startsWith("/api/")
  );

  // Пропускаем публичные маршруты
  const publicRoutes = [
    "/api/auth/telegram",
    "/api/auth/login",
    "/api/auth/create-account",
    "/api/projects",
    "/api/analytics/track",
    "/api/test-auth",
    "/api/health",
  ];

  // Пропускаем публичные маршруты
  if (publicRoutes.includes(path)) {
    return;
  }

  // Пропускаем GET запросы к статическим файлам и ресурсам
  if (
    path.startsWith("/_nuxt/") ||
    path.startsWith("/favicon.ico") ||
    path.startsWith("/assets/") ||
    path.startsWith("/images/") ||
    path.includes(".js") ||
    path.includes(".css") ||
    path.includes(".png") ||
    path.includes(".jpg") ||
    path.includes(".svg")
  ) {
    return;
  }

  // Пропускаем главную страницу и другие публичные страницы
  if (
    path === "/" ||
    path === "/login" ||
    path === "/auth-callback" ||
    path === "/test-auth" ||
    path.startsWith("/projects") ||
    path.startsWith("/contact")
  ) {
    return;
  }

  // Применяем аутентификацию только к API маршрутам
  if (!path.startsWith("/api/")) {
    return;
  }

  // Проверяем токен
  const authHeader = getHeader(event, "authorization");
  console.log("🔒 Server Middleware: Проверка токена для", path);
  console.log(
    "🔒 Server Middleware: Authorization header:",
    authHeader ? "present" : "missing"
  );

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("🔒 Server Middleware: Нет токена или неправильный формат");
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const token = authHeader.substring(7);
  console.log(
    "🔒 Server Middleware: Токен получен:",
    token.substring(0, 20) + "..."
  );

  try {
    // Декодируем токен (в реальном проекте используйте библиотеку для JWT)
    console.log("🔒 Server Middleware: Декодирование токена...");
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    console.log("🔒 Server Middleware: Токен декодирован:", {
      userId: decoded.userId,
      exp: decoded.exp,
    });

    // Проверяем срок действия токена
    const currentTime = Math.floor(Date.now() / 1000);
    console.log(
      "🔒 Server Middleware: Текущее время:",
      currentTime,
      "Время истечения:",
      decoded.exp
    );

    if (decoded.exp < currentTime) {
      console.log("🔒 Server Middleware: Токен истек");
      throw createError({
        statusCode: 401,
        statusMessage: "Token expired",
      });
    }

    // Получаем пользователя из базы данных
    console.log(
      "🔒 Server Middleware: Поиск пользователя с ID:",
      decoded.userId
    );
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      console.log("🔒 Server Middleware: Пользователь не найден");
      throw createError({
        statusCode: 401,
        statusMessage: "User not found",
      });
    }

    console.log("🔒 Server Middleware: Пользователь найден:", user.firstName);

    // Добавляем пользователя в контекст запроса
    event.context.user = user;

    // Проверяем права администратора для админских API маршрутов
    if (path.startsWith("/api/admin") && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Admin access required",
      });
    }
  } catch (error) {
    console.error("🔒 Server Middleware: Ошибка аутентификации:", error);
    if (error instanceof Error) {
      console.error(
        "🔒 Server Middleware: Тип ошибки:",
        error.constructor.name
      );
      console.error("🔒 Server Middleware: Сообщение:", error.message);
    }
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid token",
    });
  }
});
