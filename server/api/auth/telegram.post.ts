import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== Telegram Auth Start ===");
    console.log("Environment check:", {
      DATABASE_URL: process.env.DATABASE_URL ? "present" : "missing",
      NODE_ENV: process.env.NODE_ENV,
    });

    const body = await readBody(event);
    console.log("Received auth data:", body);
    const { id, first_name, last_name, username, photo_url, auth_date, hash } =
      body;

    console.log("Parsed data:", {
      id,
      first_name,
      last_name,
      username,
      photo_url,
      auth_date,
      hash: hash ? "present" : "missing",
    });

    // Валидация данных от Telegram
    if (!id || !first_name || !auth_date || !hash) {
      return {
        success: false,
        error: "Invalid Telegram data",
      };
    }

    // Проверяем подключение к базе данных
    try {
      await prisma.$connect();
      console.log("Database connection: OK");
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return {
        success: false,
        error: "Database connection failed",
        details: dbError instanceof Error ? dbError.message : "Unknown database error",
      };
    }

    // Проверяем, существует ли пользователь
    let user = await prisma.user.findUnique({
      where: { telegramId: String(id) },
    });

    if (!user) {
      // Генерируем уникальный логин
      let login = `telegram_${id}`;
      let counter = 1;

      // Проверяем, что логин уникален
      while (await prisma.user.findUnique({ where: { login } })) {
        login = `telegram_${id}_${counter}`;
        counter++;
      }

      console.log("Creating new user with data:", {
        telegramId: String(id),
        username: username || null,
        firstName: first_name,
        lastName: last_name || null,
        login: login,
        balance: 15000,
      });

      try {
        // Создаем нового пользователя
        user = await prisma.user.create({
          data: {
            telegramId: String(id),
            username: username || null,
            firstName: first_name,
            lastName: last_name || null,
            photoUrl: photo_url || null,
            login: login,
            password: `telegram_${id}_${Date.now()}`, // Генерируем временный пароль
            balance: 15000, // 150 рублей в копейках
            isAdmin: false,
          },
        });

        console.log("User created successfully:", user.id);
      } catch (createError) {
        console.error("User creation failed:", createError);
        console.error("Create error details:", {
          message: createError instanceof Error ? createError.message : "Unknown error",
          code: (createError as any)?.code,
          meta: (createError as any)?.meta,
        });
        throw createError;
      }

      try {
        // Создаем транзакцию для начального баланса
        const transaction = await prisma.transaction.create({
          data: {
            userId: user.id,
            type: "credit",
            amount: 15000,
            description: "Начальный бонус",
          },
        });

        console.log("Transaction created:", transaction.id);
      } catch (transactionError) {
        console.error("Transaction creation failed:", transactionError);
        // Не прерываем процесс, если транзакция не создалась
        console.log("Continuing without transaction...");
      }
    } else {
      // Обновляем данные существующего пользователя
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          username: username || user.username,
          firstName: first_name,
          lastName: last_name || user.lastName,
          photoUrl: photo_url || user.photoUrl,
        },
      });
    }

    // Создаем JWT токен (в реальном проекте используйте библиотеку для JWT)
    const token = Buffer.from(
      JSON.stringify({
        userId: user.id,
        telegramId: user.telegramId,
        isAdmin: user.isAdmin,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 дней
      })
    ).toString("base64");

    console.log("=== Telegram Auth Success ===");
    console.log("User authenticated:", {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      isAdmin: user.isAdmin,
    });

    return {
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        isAdmin: user.isAdmin,
        balance: user.balance,
      },
      token,
    };
  } catch (error) {
    console.error("Telegram auth error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });
    return {
      success: false,
      error: "Authentication failed",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
