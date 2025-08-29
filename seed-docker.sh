#!/bin/bash

echo "🚀 Запуск заполнения базы данных в Docker..."

# Проверяем, что Docker запущен
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker не запущен. Пожалуйста, запустите Docker и попробуйте снова."
    exit 1
fi

# Проверяем, что контейнер с базой данных запущен
if ! docker ps | grep -q "kiruhak_postgres"; then
    echo "❌ Контейнер с PostgreSQL не найден. Запустите docker-compose up -d"
    exit 1
fi

echo "📦 Устанавливаем зависимости..."
docker-compose exec app npm install

echo "🔄 Применяем миграции..."
docker-compose exec app npx prisma migrate deploy

echo "🌱 Заполняем базу данных тестовыми данными..."
docker-compose exec app npx prisma db seed

echo "✅ База данных успешно заполнена!"
echo ""
echo "📊 Создано:"
echo "   - 1 администратор (admin/admin123)"
echo "   - 4 проекта"
echo "   - 3 UI компонента"
echo "   - 3 материала"
echo "   - 2 туториала с шагами и тестами"
echo ""
echo "🔗 Для входа в админку используйте:"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""
echo "�� Готово к работе!"
