# 🐳 Деплой Kiruhak на Docker хостинг

## 📋 Требования

- Docker
- Docker Compose
- Git

## 🚀 Быстрый старт

### 1. Клонируйте репозиторий

```bash
git clone <your-repo-url>
cd kiruhak
```

### 2. Создайте файл .env

```bash
cp .env.example .env
```

Отредактируйте `.env` файл:

```env
# База данных
POSTGRES_PASSWORD=your_secure_password_here

# Telegram настройки
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# URL сайта
NUXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 3. Запустите деплой

```bash
./deploy.sh
```

## 🔧 Ручной деплой

### Разработка (с Redis и Nginx)

```bash
docker-compose up -d --build
```

### Продакшен (только приложение + PostgreSQL)

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📊 Управление

### Просмотр логов

```bash
# Все сервисы
docker-compose -f docker-compose.prod.yml logs -f

# Только приложение
docker-compose -f docker-compose.prod.yml logs -f app

# Только база данных
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Остановка

```bash
docker-compose -f docker-compose.prod.yml down
```

### Перезапуск

```bash
docker-compose -f docker-compose.prod.yml restart
```

### Обновление

```bash
git pull
./deploy.sh
```

## 🗄️ База данных

### Подготовка и восстановление

Выполните команды из [инструкции восстановления PostgreSQL](docs/runbooks/DATABASE_RECOVERY.md) в рабочей копии с зависимостями Prisma. Для пустой базы используйте `npm run db:bootstrap`. Для базы из полного дампа используйте `npm run db:migrate` после сверки журнала.

## 🔒 SSL/HTTPS

Для настройки HTTPS:

1. Получите SSL сертификаты
2. Создайте папку `ssl/` и поместите туда:
   - `cert.pem` - сертификат
   - `key.pem` - приватный ключ
3. Раскомментируйте HTTPS секцию в `nginx.conf`
4. Перезапустите nginx:

```bash
docker-compose restart nginx
```

## 📈 Мониторинг

### Health Check

Приложение автоматически проверяет здоровье:

- База данных: каждые 30 секунд
- Приложение: каждые 30 секунд
- Redis: каждые 30 секунд

### Логи

Логи сохраняются в Docker и доступны через:

```bash
docker-compose -f docker-compose.prod.yml logs
```

## 🛠️ Устранение неполадок

### Приложение не запускается

```bash
# Проверить логи
docker-compose -f docker-compose.prod.yml logs app

# Проверить переменные окружения
docker-compose -f docker-compose.prod.yml exec app env | grep -E "(DATABASE_URL|TELEGRAM_TOKEN)"
```

### База данных недоступна

```bash
# Проверить статус PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U kiruhak_user

# Проверить доступность базы по настроенному PostgreSQL URI
pg_isready --dbname="$RESTORE_PG_URL"
```

### Проблемы с сетью

```bash
# Проверить сеть
docker network ls
docker network inspect kiruhak_kiruhak_network
```

## 🔄 Обновление

### Автоматическое обновление

```bash
git pull
./deploy.sh
```

### Ручное обновление

```bash
# Остановить сервисы
docker-compose -f docker-compose.prod.yml down

# Пересобрать образы
docker-compose -f docker-compose.prod.yml build --no-cache

# Запустить снова
docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose -f docker-compose.prod.yml logs`
2. Убедитесь, что все переменные окружения настроены
3. Проверьте доступность портов
4. Обратитесь к документации Docker
