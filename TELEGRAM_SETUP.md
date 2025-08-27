# 🔧 Настройка Telegram бота для продакшена

## Проблема
Ошибка "Ошибка конфигурации бота" возникает из-за отсутствия настроенных переменных окружения для Telegram бота на продакшене.

## Решение

### 1. Создайте Telegram бота (если еще не создан)

1. Найдите @BotFather в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните полученный токен

### 2. Настройте переменные окружения

Создайте файл `.env` в корне проекта на продакшене:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_USERNAME=web_kiruhak11

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Other settings
NODE_ENV=production
```

### 3. Альтернативные способы настройки

#### Вариант A: Через Docker Compose
Добавьте переменные в `docker-compose.prod.yml`:

```yaml
services:
  app:
    environment:
      - TELEGRAM_BOT_TOKEN=your_bot_token_here
      - TELEGRAM_CHANNEL_USERNAME=web_kiruhak11
```

#### Вариант B: Через Docker run
```bash
docker run -e TELEGRAM_BOT_TOKEN=your_bot_token_here \
           -e TELEGRAM_CHANNEL_USERNAME=web_kiruhak11 \
           your-app-image
```

#### Вариант C: Через systemd (если используете systemd)
Создайте файл `/etc/systemd/system/kiruhak.service`:

```ini
[Unit]
Description=Kiruhak App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/html/kiruhak
Environment=TELEGRAM_BOT_TOKEN=your_bot_token_here
Environment=TELEGRAM_CHANNEL_USERNAME=web_kiruhak11
ExecStart=/usr/bin/npm run start
Restart=always

[Install]
WantedBy=multi-user.target
```

### 4. Проверьте права бота

Убедитесь, что ваш бот:
1. Добавлен в канал как администратор
2. Имеет права на чтение сообщений
3. Может получать информацию о участниках

### 5. Временное решение (отключить проверку)

Если нужно быстро исправить проблему, можно временно отключить проверку подписки:

```typescript
// В server/api/telegram/check-subscription.post.ts
export default defineEventHandler(async (event) => {
  // Временное решение - всегда возвращаем true
  return {
    success: true,
    isSubscribed: true,
    memberStatus: "member",
  };
});
```

### 6. Проверка настроек

После настройки проверьте:

```bash
# Проверьте переменные окружения
echo $TELEGRAM_BOT_TOKEN

# Проверьте API бота
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe"

# Перезапустите приложение
docker-compose restart
# или
systemctl restart kiruhak
```

## Безопасность

⚠️ **Важно:**
- Никогда не коммитьте токен бота в Git
- Используйте разные токены для разработки и продакшена
- Регулярно обновляйте токены
- Ограничьте права бота только необходимыми

## Тестирование

После настройки протестируйте:

1. Войдите в приложение
2. Проверьте, что статус подписки обновляется
3. Убедитесь, что нет ошибок в логах

## Логи для отладки

Проверьте логи приложения:

```bash
# Docker
docker-compose logs -f app

# Systemd
journalctl -u kiruhak -f

# Прямые логи
tail -f /var/www/html/kiruhak/server.log
```

---

🔧 **После настройки переменных окружения перезапустите приложение!**
