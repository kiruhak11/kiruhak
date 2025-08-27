#!/bin/bash

echo "🤖 Настройка токена Telegram бота..."

# Проверяем, что токен передан
if [ -z "$1" ]; then
    echo "❌ Ошибка: Не указан токен бота"
    echo ""
    echo "📖 Использование:"
    echo "   ./set-telegram-token.sh YOUR_BOT_TOKEN"
    echo ""
    echo "📋 Пример:"
    echo "   ./set-telegram-token.sh 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
    echo ""
    echo "🔗 Как получить токен:"
    echo "   1. Найдите @BotFather в Telegram"
    echo "   2. Отправьте /newbot или /mybots"
    echo "   3. Скопируйте токен"
    exit 1
fi

TOKEN="$1"

# Проверяем формат токена
if [[ ! $TOKEN =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
    echo "❌ Ошибка: Неверный формат токена"
    echo "   Токен должен быть в формате: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
    exit 1
fi

echo "🔧 Заменяем токен в файле..."

# Создаем резервную копию
cp server/api/telegram/check-subscription.post.ts server/api/telegram/check-subscription.post.ts.backup.$(date +%Y%m%d_%H%M%S)

# Заменяем токен
sed -i "s/YOUR_BOT_TOKEN_HERE/$TOKEN/g" server/api/telegram/check-subscription.post.ts

echo "✅ Токен успешно заменен!"
echo ""
echo "📋 Что было сделано:"
echo "   - Создана резервная копия файла"
echo "   - Токен заменен в коде"
echo ""
echo "🔄 Перезапустите приложение:"
echo "   docker-compose restart"
echo "   или"
echo "   systemctl restart kiruhak"
echo ""
echo "🧪 Проверьте работу:"
echo "   curl -X POST https://api.telegram.org/bot$TOKEN/getMe"
echo ""
echo "📖 Для восстановления файла:"
echo "   cp server/api/telegram/check-subscription.post.ts.backup.* server/api/telegram/check-subscription.post.ts"
