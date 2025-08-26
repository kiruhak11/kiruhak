# Запуск Telegram бота

## Установка зависимостей

```bash
pip install -r bot_requirements.txt
```

## Запуск бота

```bash
python bot_example.py
```

## Функции бота

### Команды

- `/start` - Создать аккаунт в системе аналитики
- `/help` - Показать справку

### Автоматические действия

- Любое текстовое сообщение автоматически создает аккаунт
- Бот отправляет логин и пароль для входа на сайте

## Логика работы

1. **Пользователь пишет боту** любое сообщение
2. **Бот создает аккаунт** через API сайта
3. **Бот отправляет данные** для входа (логин + пароль)
4. **Пользователь входит** на сайте с полученными данными

## Конфигурация

В файле `bot_example.py` настройте:

```python
BOT_TOKEN = "6122558496:AAEXwnP3E4uIk5sSSNzD-13vQK6A4ybCBFI"
API_URL = "https://kiruhak11.ru/api/auth/create-account"
```

## Тестирование

1. Найдите бота `@gs_company_bot` в Telegram
2. Отправьте команду `/start`
3. Получите логин и пароль
4. Войдите на сайте https://kiruhak11.ru/login

## Пример ответа бота

```
✅ Аккаунт успешно создан!

👤 Ваши данные для входа:
🔑 Логин: `user_ytop6i`
🔐 Пароль: `c25a998f`
💰 Баланс: 150 ₽

🌐 Войдите на сайте: https://kiruhak11.ru/login

📊 После входа вы сможете:
• Создавать сайты для аналитики
• Отслеживать посещения
• Просматривать статистику
• Управлять своими проектами
```

## Обработка ошибок

- **Аккаунт уже существует**: бот отправляет существующий логин
- **Ошибка сети**: бот отправляет сообщение об ошибке
- **Неверные данные**: бот отправляет сообщение о необходимости заполнить все поля

## Развертывание

### Локально

```bash
python bot_example.py
```

### На сервере (с systemd)

Создайте файл `/etc/systemd/system/gs-company-bot.service`:

```ini
[Unit]
Description=GS Company Telegram Bot
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/bot
ExecStart=/usr/bin/python3 bot_example.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Затем:

```bash
sudo systemctl enable gs-company-bot
sudo systemctl start gs-company-bot
sudo systemctl status gs-company-bot
```

### В Docker

Создайте `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY bot_requirements.txt .
RUN pip install -r bot_requirements.txt

COPY bot_example.py .

CMD ["python", "bot_example.py"]
```

Запуск:

```bash
docker build -t gs-company-bot .
docker run -d --name gs-company-bot gs-company-bot
```
