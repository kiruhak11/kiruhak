# 🔧 Исправления Docker сборки

## ❌ Проблема

Ошибка при сборке Docker образа:

```
npm error The `npm ci` command can only install with an existing package-lock.json
```

## ✅ Решение

### 1. **Исправленный Dockerfile**

- Заменил `npm ci --only=production` на `npm install --omit=dev`
- Убрал зависимость от `package-lock.json`
- Добавил правильное копирование Prisma клиента

### 2. **Упрощенный Dockerfile.simple**

Создан альтернативный упрощенный Dockerfile для случаев, когда многоэтапная сборка вызывает проблемы.

### 3. **Обновленные команды деплоя**

#### **Основная команда (рекомендуется):**

```bash
./deploy.sh
```

#### **Упрощенная сборка:**

```bash
docker-compose -f docker-compose.simple.yml up -d --build
```

#### **Стандартная сборка:**

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🚀 **Быстрый старт**

### 1. **Создайте .env файл:**

```env
# База данных
POSTGRES_PASSWORD=your_secure_password

# Telegram настройки
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# URL сайта
NUXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 2. **Запустите деплой:**

```bash
chmod +x deploy.sh
./deploy.sh
```

## 📋 **Доступные варианты сборки**

### **Вариант 1: Упрощенная сборка (рекомендуется)**

```bash
docker-compose -f docker-compose.simple.yml up -d --build
```

- Использует `Dockerfile.simple`
- Одна стадия сборки
- Более стабильная

### **Вариант 2: Многоэтапная сборка**

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

- Использует `Dockerfile`
- Многоэтапная сборка
- Оптимизированный размер образа

### **Вариант 3: Полная сборка с Nginx**

```bash
docker-compose up -d --build
```

- Включает Redis и Nginx
- Для разработки

## 🔍 **Проверка статуса**

```bash
# Статус контейнеров
docker-compose -f docker-compose.simple.yml ps

# Логи
docker-compose -f docker-compose.simple.yml logs -f

# Health check
curl http://localhost:3015/api/health
```

## 🛠️ **Устранение неполадок**

### **Если сборка все еще не работает:**

```bash
# Очистить все Docker кэши
docker system prune -a

# Пересобрать без кэша
docker-compose -f docker-compose.simple.yml build --no-cache

# Запустить
docker-compose -f docker-compose.simple.yml up -d
```

### **Проверить логи сборки:**

```bash
docker-compose -f docker-compose.simple.yml logs app
```

## 📊 **Различия между Dockerfile**

| Функция             | Dockerfile | Dockerfile.simple |
| ------------------- | ---------- | ----------------- |
| Многоэтапная сборка | ✅         | ❌                |
| Оптимизация размера | ✅         | ❌                |
| Стабильность        | ⚠️         | ✅                |
| Скорость сборки     | ⚠️         | ✅                |
| Сложность           | Высокая    | Низкая            |

## 🎯 **Рекомендация**

Для продакшена используйте **упрощенную сборку**:

```bash
./deploy.sh
```

Этот скрипт автоматически использует `docker-compose.simple.yml` для максимальной стабильности.
