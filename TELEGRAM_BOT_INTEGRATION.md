# Интеграция с Telegram ботом

## Данные бота

- **Username**: `@gs_company_bot`
- **Token**: `6122558496:AAEXwnP3E4uIk5sSSNzD-13vQK6A4ybCBFI`

## API для создания аккаунта

### Endpoint

```
POST /api/auth/create-account
```

### Запрос

```json
{
  "telegramId": "ID_пользователя_из_Telegram",
  "firstName": "Имя_пользователя",
  "lastName": "Фамилия_пользователя",
  "username": "username_из_Telegram"
}
```

### Ответ

```json
{
  "success": true,
  "user": {
    "id": "cmeqnjdcw0004rifiql5mkb3y",
    "telegramId": "987654321",
    "firstName": "Тест",
    "lastName": "Пользователь",
    "login": "user_757it8",
    "password": "bce40e44",
    "balance": 15000
  }
}
```

## Быстрый вход по токену

Бот также отправляет токен для быстрого входа в формате `login:password`, который пользователь может скопировать и вставить на сайте.

## Пример кода для бота

### Python (python-telegram-bot)

```python
import requests
import json

def create_user_account(telegram_id, first_name, last_name, username):
    url = "http://localhost:3000/api/auth/create-account"

    data = {
        "telegramId": str(telegram_id),
        "firstName": first_name,
        "lastName": last_name or "",
        "username": username or ""
    }

    try:
        response = requests.post(url, json=data)
        result = response.json()

        if result["success"]:
            user = result["user"]
            return f"""
✅ Аккаунт успешно создан!

👤 Ваши данные для входа:
🔑 Логин: `{user['login']}`
🔐 Пароль: `{user['password']}`
💰 Баланс: {user['balance'] / 100} ₽

🚀 Быстрый вход:
`{user['login']}:{user['password']}`

🌐 Войдите на сайте: https://kiruhak11.ru/login
            """
        else:
            if "уже существует" in result["error"]:
                return f"Аккаунт уже существует! Ваш логин: `{result['login']}`"
            else:
                return f"❌ Ошибка: {result['error']}"

    except Exception as e:
        return f"❌ Ошибка соединения: {str(e)}"

# Пример использования в обработчике команды
async def start_command(update, context):
    user = update.effective_user

    message = create_user_account(
        telegram_id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        username=user.username
    )

    await update.message.reply_text(message, parse_mode='Markdown')
```

### Node.js (node-telegram-bot-api)

```javascript
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const bot = new TelegramBot("6122558496:AAEXwnP3E4uIk5sSSNzD-13vQK6A4ybCBFI", {
  polling: true,
});

async function createUserAccount(telegramId, firstName, lastName, username) {
  const url = "https://kiruhak11.ru/api/auth/create-account";

  const data = {
    telegramId: String(telegramId),
    firstName: firstName,
    lastName: lastName || "",
    username: username || "",
  };

  try {
    const response = await axios.post(url, data);
    const result = response.data;

    if (result.success) {
      const user = result.user;
      return `
✅ Аккаунт успешно создан!

👤 Ваши данные для входа:
🔑 Логин: \`${user.login}\`
🔐 Пароль: \`${user.password}\`
💰 Баланс: ${user.balance / 100} ₽

🌐 Войдите на сайте: https://kiruhak11.ru/login
            `;
    } else {
      if (result.error.includes("уже существует")) {
        return `Аккаунт уже существует! Ваш логин: \`${result.login}\``;
      } else {
        return `❌ Ошибка: ${result.error}`;
      }
    }
  } catch (error) {
    return `❌ Ошибка соединения: ${error.message}`;
  }
}

// Обработчик команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;

  const message = await createUserAccount(
    user.id,
    user.first_name,
    user.last_name,
    user.username
  );

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});
```

## Логика работы

1. **Пользователь нажимает** кнопку "Перейти в Telegram бота" на сайте
2. **Открывается бот** `@gs_company_bot`
3. **Пользователь отправляет** команду `/start` или любое сообщение
4. **Бот создает аккаунт** через API `/api/auth/create-account`
5. **Бот отправляет** логин и пароль пользователю
6. **Пользователь вводит** данные на сайте для входа

## Обработка ошибок

- **Пользователь уже существует**: бот отправляет существующий логин
- **Ошибка сети**: бот отправляет сообщение об ошибке
- **Неверные данные**: бот отправляет сообщение о необходимости заполнить все поля

## Безопасность

- Пароли генерируются автоматически (8 символов)
- Логины генерируются автоматически (формат: `user_XXXXXX`)
- Все данные сохраняются в базе данных PostgreSQL
- Аутентификация происходит через JWT токены

## Тестирование

Для тестирования можно использовать существующие аккаунты:

**Администратор:**

- Логин: `admin`
- Пароль: `admin123`

**Обычный пользователь:**

- Логин: `user_757it8`
- Пароль: `bce40e44`
