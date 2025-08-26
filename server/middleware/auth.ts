import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  const method = getMethod(event);

  console.log(`🔒 [Auth Middleware] === НАЧАЛО ОБРАБОТКИ ===`);
  console.log(`🔒 [Auth Middleware] ${method} ${path}`);

  // Пропускаем публичные маршруты
  const publicRoutes = [
    "/api/auth/telegram",
    "/api/auth/login",
    "/api/auth/create-account",
    "/api/projects", // GET запрос для получения списка проектов
    "/api/analytics/track",
    "/api/test-auth",
    "/api/health",
  ];

  // Проверяем, является ли маршрут публичным
  const isPublicRoute = publicRoutes.includes(path);

  // Также проверяем GET запросы к проектам (публичные)
  const isPublicProjectRoute = path === "/api/projects" && method === "GET";

  // Проверяем, является ли это операцией с проектами, требующей аутентификации
  const isProjectOperation =
    path.startsWith("/api/projects/") && method !== "GET";
  const isProjectCreate = path === "/api/projects" && method === "POST";

  const shouldSkipAuth =
    (isPublicRoute && !isProjectCreate) || isPublicProjectRoute;

  console.log(`🔒 [Auth Middleware] ${method} ${path}`);
  console.log(
    `🔒 [Auth Middleware] Path starts with /api/:`,
    path.startsWith("/api/")
  );
  console.log(`🔒 [Auth Middleware] Public routes:`, publicRoutes);
  console.log(`🔒 [Auth Middleware] Is public route:`, isPublicRoute);
  console.log(
    `🔒 [Auth Middleware] Is public project route:`,
    isPublicProjectRoute
  );
  console.log(`🔒 [Auth Middleware] Is project operation:`, isProjectOperation);
  console.log(`🔒 [Auth Middleware] Is project create:`, isProjectCreate);
  console.log(`🔒 [Auth Middleware] Should skip auth:`, shouldSkipAuth);

  // Пропускаем публичные маршруты
  if (shouldSkipAuth) {
    console.log(`🔒 [Auth Middleware] Пропускаем публичный маршрут: ${path}`);
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

  // Выводим все заголовки для отладки
  const allHeaders = getHeaders(event);
  console.log("🔒 Server Middleware: Все заголовки:", Object.keys(allHeaders));
  console.log("🔒 Server Middleware: Authorization header value:", authHeader);

  // Для операций с проектами требуем аутентификацию
  if (isProjectOperation || isProjectCreate) {
    console.log(
      "🔒 Server Middleware: Операция с проектами требует аутентификации"
    );
  }

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
  console.log("🔒 Server Middleware: Длина токена:", token.length);

  try {
    // Декодируем токен (в реальном проекте используйте библиотеку для JWT)
    console.log("🔒 Server Middleware: Декодирование токена...");

    // Проверяем, что токен не пустой
    if (!token || token.trim() === "") {
      console.log("🔒 Server Middleware: Токен пустой");
      throw new Error("Empty token");
    }

    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    console.log("🔒 Server Middleware: Токен декодирован:", {
      userId: decoded.userId,
      exp: decoded.exp,
    });
    console.log("🔒 Server Middleware: Полный декодированный токен:", decoded);

    // Проверяем структуру токена
    if (!decoded.userId || !decoded.exp) {
      console.log("🔒 Server Middleware: Неверная структура токена:", decoded);
      throw new Error("Invalid token structure");
    }

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

    console.log(
      "🔒 Server Middleware: Аутентификация успешна для пользователя:",
      user.firstName
    );

    // Проверяем права администратора для админских API маршрутов
    if (path.startsWith("/api/admin") && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Admin access required",
      });
    }

    console.log("🔒 Server Middleware: === КОНЕЦ ОБРАБОТКИ ===");
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
