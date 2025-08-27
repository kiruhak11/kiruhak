import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  console.log("🔒 [Auth Middleware] === MIDDLEWARE ВЫЗВАН ===");
  const path = getRequestURL(event).pathname;
  const method = getMethod(event);

  console.log(`🔒 [Auth Middleware] === НАЧАЛО ОБРАБОТКИ ===`);
  console.log(`🔒 [Auth Middleware] ${method} ${path}`);
  console.log(`🔒 [Auth Middleware] Event type:`, event.node.req.url);
  console.log(
    `🔒 [Auth Middleware] Full URL:`,
    getRequestURL(event).toString()
  );

  // Пропускаем публичные маршруты
  const publicRoutes = [
    "/api/auth/telegram",
    "/api/auth/login",
    "/api/auth/create-account",
    "/api/projects", // GET запрос для получения списка проектов
    "/api/analytics/track",
    "/api/test-auth",
    "/api/health",
    "/api/ui-components", // GET запрос для получения UI компонентов
    "/api/tutorials", // GET запрос для получения списка туториалов
    "/api/materials", // GET запрос для получения списка материалов
    "/api/telegram/check-subscription", // Проверка подписки на Telegram
  ];

  // Проверяем, является ли маршрут публичным
  const isPublicRoute = publicRoutes.includes(path);

  // Также проверяем GET запросы к проектам (публичные)
  const isPublicProjectRoute = path === "/api/projects" && method === "GET";

  // Проверяем GET запросы к туториалам (публичные)
  const isPublicTutorialRoute = path === "/api/tutorials" && method === "GET";

  // Проверяем GET запросы к материалам (публичные)
  const isPublicMaterialRoute = path === "/api/materials" && method === "GET";

  // Проверяем, является ли это операцией с проектами, требующей аутентификации
  const isProjectOperation =
    path.startsWith("/api/projects/") && method !== "GET";
  const isProjectCreate = path === "/api/projects" && method === "POST";

  // Проверяем, является ли это операцией с UI компонентами, требующей аутентификации
  const isUiComponentOperation =
    path.startsWith("/api/ui-components/") && method !== "GET";
  const isUiComponentCreate =
    path === "/api/ui-components" && method === "POST";

  // Проверяем, является ли это операцией с туториалами, требующей аутентификации
  const isTutorialOperation =
    path.startsWith("/api/tutorials/") && method !== "GET";
  const isTutorialCreate = path === "/api/tutorials" && method === "POST";

  // Проверяем, является ли это операцией с материалами, требующей аутентификации
  const isMaterialOperation =
    path.startsWith("/api/materials/") && method !== "GET";
  const isMaterialCreate = path === "/api/materials" && method === "POST";
  
  // Проверяем скачивание PDF (требует аутентификации)
  const isMaterialDownload = path.includes("/download-pdf");

  console.log(`🔒 [Auth Middleware] UI Component checks:`, {
    path,
    method,
    startsWithUiComponents: path.startsWith("/api/ui-components/"),
    isUiComponentOperation,
    isUiComponentCreate,
  });

  console.log(`🔒 [Auth Middleware] Tutorial checks:`, {
    path,
    method,
    startsWithTutorials: path.startsWith("/api/tutorials/"),
    isTutorialOperation,
    isTutorialCreate,
  });

  console.log(`🔒 [Auth Middleware] Material checks:`, {
    path,
    method,
    startsWithMaterials: path.startsWith("/api/materials/"),
    isMaterialOperation,
    isMaterialCreate,
  });

  const shouldSkipAuth =
    (isPublicRoute &&
      !isProjectCreate &&
      !isUiComponentCreate &&
      !isTutorialCreate &&
      !isMaterialCreate) ||
    isPublicProjectRoute ||
    isPublicTutorialRoute ||
    isPublicMaterialRoute;

  // Дополнительная проверка для компонентов, требующих аутентификации
  const requiresAuth =
    isUiComponentOperation ||
    isUiComponentCreate ||
    isTutorialOperation ||
    isTutorialCreate ||
    isMaterialOperation ||
    isMaterialCreate ||
    isMaterialDownload;

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
  console.log(
    `🔒 [Auth Middleware] Is public tutorial route:`,
    isPublicTutorialRoute
  );
  console.log(
    `🔒 [Auth Middleware] Is public material route:`,
    isPublicMaterialRoute
  );
  console.log(`🔒 [Auth Middleware] Is project operation:`, isProjectOperation);
  console.log(`🔒 [Auth Middleware] Is project create:`, isProjectCreate);
  console.log(
    `🔒 [Auth Middleware] Is UI component operation:`,
    isUiComponentOperation
  );
  console.log(
    `🔒 [Auth Middleware] Is UI component create:`,
    isUiComponentCreate
  );
  console.log(`🔒 [Auth Middleware] Should skip auth:`, shouldSkipAuth);
  console.log(`🔒 [Auth Middleware] Auth skip details:`, {
    isPublicRoute,
    isProjectCreate,
    isUiComponentCreate,
    isTutorialCreate,
    isMaterialCreate,
    isPublicProjectRoute,
    isPublicTutorialRoute,
    isPublicMaterialRoute,
    shouldSkipAuth,
    requiresAuth,
  });

  // Пропускаем публичные маршруты
  if (shouldSkipAuth) {
    console.log(`🔒 [Auth Middleware] Пропускаем публичный маршрут: ${path}`);
    return;
  }

  // Принудительно требуем аутентификацию для компонентов
  if (requiresAuth) {
    console.log(`🔒 [Auth Middleware] Требуется аутентификация для: ${path}`);
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

  // Проверяем токен (пробуем оба варианта регистра)
  const authHeader =
    getHeader(event, "authorization") || getHeader(event, "Authorization");
  console.log("🔒 Server Middleware: Проверка токена для", path);
  console.log(
    "🔒 Server Middleware: Authorization header:",
    authHeader ? "present" : "missing"
  );

  // Выводим все заголовки для отладки
  const allHeaders = getHeaders(event);
  console.log("🔒 Server Middleware: Все заголовки:", Object.keys(allHeaders));
  console.log("🔒 Server Middleware: Все заголовки (значения):", allHeaders);
  console.log("🔒 Server Middleware: Authorization header value:", authHeader);
  console.log(
    "🔒 Server Middleware: Authorization header starts with Bearer:",
    authHeader?.startsWith("Bearer ")
  );

  // Дополнительная отладка для понимания проблемы с заголовками
  console.log("🔒 Server Middleware: === ДОПОЛНИТЕЛЬНАЯ ОТЛАДКА ===");
  console.log(
    "🔒 Server Middleware: Event node req headers:",
    event.node.req.headers
  );
  console.log(
    "🔒 Server Middleware: Event node req rawHeaders:",
    event.node.req.rawHeaders
  );
  console.log(
    "🔒 Server Middleware: getHeader('authorization'):",
    getHeader(event, "authorization")
  );
  console.log(
    "🔒 Server Middleware: getHeader('Authorization'):",
    getHeader(event, "Authorization")
  );

  // Для операций с проектами требуем аутентификацию
  if (isProjectOperation || isProjectCreate) {
    console.log(
      "🔒 Server Middleware: Операция с проектами требует аутентификации"
    );
  }

  // Для операций с UI компонентами требуем аутентификацию
  if (isUiComponentOperation || isUiComponentCreate) {
    console.log(
      "🔒 Server Middleware: Операция с UI компонентами требует аутентификации"
    );
  }

  // Для операций с туториалами требуем аутентификацию
  if (isTutorialOperation || isTutorialCreate) {
    console.log(
      "🔒 Server Middleware: Операция с туториалами требует аутентификации"
    );
  }

  // Для операций с материалами требуем аутентификацию
  if (isMaterialOperation || isMaterialCreate) {
    console.log(
      "🔒 Server Middleware: Операция с материалами требует аутентификации"
    );
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("🔒 Server Middleware: Нет токена или неправильный формат");
    console.log("🔒 Server Middleware: authHeader:", authHeader);
    console.log(
      "🔒 Server Middleware: startsWith Bearer:",
      authHeader?.startsWith("Bearer ")
    );
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

    console.log("🔒 Server Middleware: Попытка декодирования токена...");
    console.log(
      "🔒 Server Middleware: Токен для декодирования:",
      token.substring(0, 50) + "..."
    );
    console.log("🔒 Server Middleware: Длина токена:", token.length);

    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, "base64").toString());
      console.log("🔒 Server Middleware: Декодирование успешно");
    } catch (decodeError) {
      console.error(
        "🔒 Server Middleware: Ошибка декодирования токена:",
        decodeError
      );
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid token format",
      });
    }
    console.log("🔒 Server Middleware: Токен декодирован:", {
      userId: decoded.userId,
      exp: decoded.exp,
    });
    console.log("🔒 Server Middleware: Полный декодированный токен:", decoded);

    // Проверяем, что токен содержит все необходимые поля
    console.log("🔒 Server Middleware: Проверка полей токена:");
    console.log("  - userId:", decoded.userId);
    console.log("  - exp:", decoded.exp);
    console.log("  - isAdmin:", decoded.isAdmin);

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
    console.log(
      "🔒 Server Middleware: Разница времени:",
      decoded.exp - currentTime,
      "секунд"
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

    // Проверяем права администратора для операций с UI компонентами
    if ((isUiComponentOperation || isUiComponentCreate) && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Admin access required",
      });
    }

    // Проверяем права администратора для операций с туториалами
    if ((isTutorialOperation || isTutorialCreate) && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Admin access required",
      });
    }

    // Проверяем права администратора для операций с материалами
    if ((isMaterialOperation || isMaterialCreate) && !user.isAdmin) {
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
