# 🚀 Быстрое исправление Telegram бота

## Проблема
Ошибка "Ошибка конфигурации бота" на продакшене.

## Решение

### 1. Получите токен бота
1. Найдите @BotFather в Telegram
2. Отправьте `/newbot` (если бота нет) или `/mybots` (если есть)
3. Скопируйте токен (формат: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Примените токен на продакшене

```bash
# На продакшене выполните:
./set-telegram-token.sh YOUR_BOT_TOKEN_HERE
```

**Пример:**
```bash
./set-telegram-token.sh 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 3. Перезапустите приложение

```bash
# Docker
docker-compose restart

# Или systemd
systemctl restart kiruhak
```

### 4. Проверьте работу

```bash
# Проверьте API бота
curl -X POST https://api.telegram.org/botYOUR_TOKEN/getMe

# Проверьте логи
docker-compose logs -f app
```

## ✅ Готово!

Теперь проверка подписки будет работать корректно.

## 🔄 Восстановление

Если нужно восстановить файл:
```bash
cp server/api/telegram/check-subscription.post.ts.backup.* server/api/telegram/check-subscription.post.ts
```

---

📖 **Подробная инструкция:** [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)
