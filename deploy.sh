#!/bin/bash

# Скрипт для деплоя на Docker хостинг
set -e

echo "🚀 Начинаем деплой Kiruhak..."

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "Создайте файл .env на основе .env.example"
    exit 1
fi

# Останавливаем существующие контейнеры
echo "🛑 Останавливаем существующие контейнеры..."
docker compose -f docker-compose.prod.yml down

# Удаляем старые образы (опционально)
echo "🧹 Очищаем старые образы..."
docker system prune -f

git pull --no-ff
# Собираем и запускаем контейнеры
echo "🔨 Собираем и запускаем контейнеры..."
echo "💡 Используем упрощенную сборку для стабильности..."
docker compose -f docker-compose.simple.yml up -d --build

# Ждем запуска сервисов
echo "⏳ Ждем запуска сервисов..."
sleep 30

# Проверяем статус контейнеров
echo "📊 Проверяем статус контейнеров..."
docker compose -f docker-compose.simple.yml ps

# Проверяем health check
echo "🏥 Проверяем health check..."
docker compose -f docker-compose.simple.yml exec -T app wget --no-verbose --tries=1 --spider http://localhost:3015/api/health || {
    echo "❌ Health check не прошел!"
    exit 1
}

echo "✅ Деплой завершен успешно!"
echo "🌐 Приложение доступно по адресу: http://localhost:3015"
echo "📊 Логи: docker-compose -f docker-compose.simple.yml logs -f"
