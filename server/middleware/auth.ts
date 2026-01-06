import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  const method = getMethod(event);

  // Логируем только в режиме разработки
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    console.log(`🔒 [Auth Middleware] ${method} ${path}`);
  }

  // Пропускаем публичные маршруты
  const publicRoutes = [
    "/api/auth/telegram",
    "/api/auth/login",
    "/api/auth/create-account",
    "/api/telegram", // Telegram бот webhook
    "/api/projects", // GET запрос для получения списка проектов
    "/api/analytics/track",
    "/api/health",
    "/api/ui-components", // GET запрос для получения UI компонентов
    "/api/tutorials", // GET запрос для получения списка туториалов
    "/api/materials", // GET запрос для получения списка материалов
    "/api/telegram/check-subscription", // Проверка подписки на Telegram
  ];
  
  // Маршруты для бота (используют свою аутентификацию через секретный ключ)
  const isBotModeration = path.includes("/bot-moderate");

  // Проверяем, является ли маршрут публичным
  const isPublicRoute = publicRoutes.includes(path);

  // Также проверяем GET запросы к проектам (публичные)
  const isPublicProjectRoute = path === "/api/projects" && method === "GET";

  // Проверяем GET запросы к туториалам (публичные)
  const isPublicTutorialRoute = 
    (path === "/api/tutorials" && method === "GET") ||
    (path.startsWith("/api/tutorials/") && method === "GET");

  // Проверяем GET запросы к материалам (публичные)
  const isPublicMaterialRoute = 
    (path === "/api/materials" && method === "GET") ||
    (path.startsWith("/api/materials/") && method === "GET");

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
  
  // Проверяем скачивание PDF (требует аутентификации, но не админа)
  const isMaterialDownload = path.includes("/download-pdf");
  
  // Проверяем оценку материала (требует аутентификации, но не админа)
  const isMaterialRating = path.includes("/rate");

  // Логируем только в режиме разработки
  if (isDev) {
    console.log(`🔒 [Auth Middleware] UI Component checks:`, {
      isUiComponentOperation,
      isUiComponentCreate,
    });

    console.log(`🔒 [Auth Middleware] Tutorial checks:`, {
      isTutorialOperation,
      isTutorialCreate,
    });

    console.log(`🔒 [Auth Middleware] Material checks:`, {
      isMaterialOperation,
      isMaterialCreate,
    });
  }

  const shouldSkipAuth =
    (isPublicRoute &&
      !isProjectCreate &&
      !isUiComponentCreate &&
      !isTutorialCreate &&
      !isMaterialCreate) ||
    isPublicProjectRoute ||
    isPublicTutorialRoute ||
    isPublicMaterialRoute ||
    isBotModeration;

  // Дополнительная проверка для компонентов, требующих аутентификации
  const requiresAuth =
    isProjectOperation ||
    isProjectCreate ||
    isUiComponentOperation ||
    isUiComponentCreate ||
    isTutorialOperation ||
    isTutorialCreate ||
    isMaterialOperation ||
    isMaterialCreate ||
    isMaterialDownload;

  // Логируем детали только в режиме разработки
  if (isDev) {
    console.log(`🔒 [Auth Middleware] Auth check:`, {
      shouldSkipAuth,
      requiresAuth,
      isPublicRoute,
    });
  }

  // Пропускаем публичные маршруты
  if (shouldSkipAuth) {
    if (isDev) console.log(`🔒 [Auth Middleware] Публичный маршрут: ${path}`);
    return;
  }

  // Принудительно требуем аутентификацию для компонентов
  if (requiresAuth && isDev) {
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
  
  if (isDev) {
    console.log("🔒 [Auth Middleware] Проверка токена для", path);
    console.log(
      "🔒 [Auth Middleware] Authorization header:",
      authHeader ? "present" : "missing"
    );
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (isDev) {
      console.log("🔒 [Auth Middleware] Нет токена или неправильный формат");
    }
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const token = authHeader.substring(7);
  if (isDev) {
    console.log("🔒 [Auth Middleware] Токен получен, длина:", token.length);
  }

  try {
    // Декодируем токен (в реальном проекте используйте библиотеку для JWT)
    if (isDev) {
      console.log("🔒 [Auth Middleware] Декодирование токена...");
    }

    // Проверяем, что токен не пустой
    if (!token || token.trim() === "") {
      throw new Error("Empty token");
    }

    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(token, "base64").toString());
    } catch (decodeError) {
      if (isDev) {
        console.error("🔒 [Auth Middleware] Ошибка декодирования токена");
      }
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid token format",
      });
    }

    if (isDev) {
      console.log("🔒 [Auth Middleware] Токен декодирован для userId:", decoded.userId);
    }

    // Проверяем структуру токена
    if (!decoded.userId || !decoded.exp) {
      throw new Error("Invalid token structure");
    }

    // Проверяем срок действия токена
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      if (isDev) {
        console.log("🔒 [Auth Middleware] Токен истек");
      }
      throw createError({
        statusCode: 401,
        statusMessage: "Token expired",
      });
    }

    // Получаем пользователя из базы данных
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      if (isDev) {
        console.log("🔒 [Auth Middleware] Пользователь не найден");
      }
      throw createError({
        statusCode: 401,
        statusMessage: "User not found",
      });
    }

    if (isDev) {
      console.log("🔒 [Auth Middleware] Аутентификация успешна для:", user.firstName);
    }

    // Добавляем пользователя в контекст запроса
    event.context.user = user;

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
    // Исключаем оценку и скачивание - они доступны всем авторизованным пользователям
    if ((isMaterialOperation || isMaterialCreate) && !isMaterialRating && !isMaterialDownload && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Admin access required",
      });
    }

    // Проверяем права администратора для операций с проектами
    if ((isProjectOperation || isProjectCreate) && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Admin access required",
      });
    }
  } catch (error) {
    if (isDev) {
      console.error("🔒 [Auth Middleware] Ошибка аутентификации:", error instanceof Error ? error.message : error);
    }
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid token",
    });
  }
});
