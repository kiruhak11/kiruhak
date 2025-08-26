# 🤖 Telegram бот в Docker

## 📋 Описание

Telegram бот для автоматического создания аккаунтов пользователей в системе аналитики.

## 🔧 Конфигурация

### Переменные окружения для бота:

```env
# Токен Telegram бота
TELEGRAM_BOT_TOKEN=your_bot_token_here

# URL API приложения (автоматически настраивается в Docker)
API_URL=http://app:3015/api/auth/create-account
```

## 🚀 Запуск

### Автоматический запуск с приложением:
```bash
./deploy.sh
```

### Ручной запуск:
```bash
# Упрощенная сборка (рекомендуется)
docker compose -f docker-compose.simple.yml up -d --build

# Продакшен сборка
docker compose -f docker-compose.prod.yml up -d --build

# Полная сборка с Nginx
docker compose up -d --build
```

## 📊 Мониторинг

### Проверка статуса бота:
```bash
# Статус контейнера
docker compose -f docker-compose.simple.yml ps bot

# Логи бота
docker compose -f docker-compose.simple.yml logs -f bot

# Health check
docker compose -f docker-compose.simple.yml exec bot python -c "import requests; requests.get('http://app:3015/api/health')"
```

## 🔍 Функциональность

### Команды бота:
- `/start` - Создание аккаунта пользователя
- Автоматическая регистрация через Telegram

### Что делает бот:
1. **Принимает команду `/start`**
2. **Создает аккаунт** через API приложения
3. **Выдает данные для входа** (логин/пароль)
4. **Предоставляет быстрый токен** для входа
5. **Направляет на сайт** для дальнейшей работы

## 🛠️ Устранение неполадок

### Бот не отвечает:
```bash
# Проверить логи
docker compose -f docker-compose.simple.yml logs bot

# Проверить переменные окружения
docker compose -f docker-compose.simple.yml exec bot env | grep TELEGRAM
```

### Ошибки подключения к API:
```bash
# Проверить доступность приложения
docker compose -f docker-compose.simple.yml exec bot python -c "import requests; print(requests.get('http://app:3015/api/health').text)"
```

### Перезапуск бота:
```bash
docker compose -f docker-compose.simple.yml restart bot
```

## 📝 Структура файлов

```
├── Dockerfile.bot          # Dockerfile для бота
├── bot_example.py          # Код бота
├── bot_requirements.txt    # Python зависимости
└── docker-compose.*.yml    # Конфигурации с ботом
```

## 🔒 Безопасность

- Бот работает в изолированном контейнере
- Использует непривилегированного пользователя
- Переменные окружения для конфиденциальных данных
- Health check для мониторинга состояния

## 🌐 Интеграция

Бот интегрирован с основным приложением:
- Использует тот же PostgreSQL
- Обменивается данными через API
- Автоматически перезапускается при сбоях
- Мониторится через Docker health checks
