#!/bin/bash

echo "🔧 Быстрое исправление проблемы с Telegram..."

# Проверяем, что мы в правильной директории
if [ ! -f "server/api/telegram/check-subscription.post.ts" ]; then
    echo "❌ Файл check-subscription.post.ts не найден. Убедитесь, что вы в корне проекта."
    exit 1
fi

echo "📝 Создаем резервную копию оригинального файла..."
cp server/api/telegram/check-subscription.post.ts server/api/telegram/check-subscription.post.ts.backup

echo "🔧 Применяем временное исправление..."
cat > server/api/telegram/check-subscription.post.ts << 'EOF'
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { userId, telegramId } = body;

    console.log("🔍 Проверка подписки (временное исправление):", { userId, telegramId });

    if (!userId && !telegramId) {
      console.log("❌ Отсутствуют userId или telegramId");
      return {
        success: false,
        error: "Необходим userId или telegramId",
      };
    }

    // Получаем информацию о пользователе из базы данных
    let user;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    } else if (telegramId) {
      user = await prisma.user.findUnique({
        where: { telegramId: telegramId },
      });
    }

    if (!user) {
      return {
        success: false,
        error: "Пользователь не найден",
      };
    }

    // ВРЕМЕННОЕ РЕШЕНИЕ: Всегда возвращаем true
    const isSubscribed = true;
    const memberStatus = "member";

    // Сохраняем статус подписки в базе данных
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isSubscribed: isSubscribed,
        subscriptionCheckedAt: new Date(),
      },
    });

    return {
      success: true,
      isSubscribed,
      memberStatus: memberStatus,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };

  } catch (error) {
    console.error("❌ Общая ошибка проверки подписки:", error);
    return {
      success: false,
      error: "Внутренняя ошибка сервера",
    };
  }
});
EOF

echo "✅ Временное исправление применено!"
echo ""
echo "📋 Что было сделано:"
echo "   - Создана резервная копия оригинального файла"
echo "   - Применено временное исправление"
echo "   - Проверка подписки теперь всегда возвращает true"
echo ""
echo "🔄 Перезапустите приложение:"
echo "   docker-compose restart"
echo "   или"
echo "   systemctl restart kiruhak"
echo ""
echo "📖 Для полного исправления настройте TELEGRAM_BOT_TOKEN:"
echo "   См. файл TELEGRAM_SETUP.md"
echo ""
echo "🔄 Для восстановления оригинального файла:"
echo "   cp server/api/telegram/check-subscription.post.ts.backup server/api/telegram/check-subscription.post.ts"
