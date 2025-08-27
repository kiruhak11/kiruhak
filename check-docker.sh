#!/bin/bash

echo "=== Docker System Check ==="

# Проверяем статус контейнеров
echo "📦 Container Status:"
docker-compose ps

echo ""
echo "🔍 Container Logs:"

# Проверяем логи приложения
echo "📱 App Container Logs (last 20 lines):"
docker-compose logs --tail=20 app

echo ""
echo "🗄️ Database Container Logs (last 10 lines):"
docker-compose logs --tail=10 postgres

echo ""
echo "🤖 Bot Container Logs (last 10 lines):"
docker-compose logs --tail=10 bot

echo ""
echo "🌐 Health Check:"
# Проверяем доступность API
if curl -f http://localhost:3015/api/health > /dev/null 2>&1; then
    echo "✅ API is accessible"
else
    echo "❌ API is not accessible"
fi

# Проверяем базу данных
if curl -f http://localhost:3015/api/health/db > /dev/null 2>&1; then
    echo "✅ Database health check passed"
else
    echo "❌ Database health check failed"
fi

echo ""
echo "🔧 Environment Variables:"
echo "DATABASE_URL: ${DATABASE_URL:-'not set'}"
echo "TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:+'set'}"
echo "NODE_ENV: ${NODE_ENV:-'not set'}"

echo ""
echo "=== Check Complete ==="
