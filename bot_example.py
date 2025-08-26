#!/usr/bin/env python3
"""
Пример Telegram бота для создания аккаунтов
Используйте этот код как основу для вашего бота @gs_company_bot
"""

import requests
import json
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

import os

# Конфигурация
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "6122558496:AAEXwnP3E4uIk5sSSNzD-13vQK6A4ybCBFI")
API_URL = os.getenv("API_URL", "http://app:3015/api/auth/create-account")

async def create_user_account(telegram_id, first_name, last_name, username):
    """Создание аккаунта пользователя через API"""
    data = {
        "telegramId": str(telegram_id),
        "firstName": first_name,
        "lastName": last_name or "",
        "username": username or ""
    }
    
    try:
        response = requests.post(API_URL, json=data, timeout=10)
        result = response.json()
        
        if result["success"]:
            user = result["user"]
            
            # Создаем токен для быстрого входа
            quick_token = f"{user['login']}:{user['password']}"
            
            return f"""
✅ Аккаунт успешно создан!

👤 Ваши данные для входа:
🔑 Логин: `{user['login']}`
🔐 Пароль: `{user['password']}`
💰 Баланс: {user['balance'] / 100} ₽

🚀 Быстрый вход:
`{quick_token}`

🌐 Войдите на сайте: https://kiruhak11.ru/login

📊 После входа вы сможете:
• Создавать сайты для аналитики
• Отслеживать посещения
• Просматривать статистику
• Управлять своими проектами
            """
        else:
            if "уже существует" in result["error"]:
                return f"""
ℹ️ Аккаунт уже существует!

🔑 Ваш логин: `{result['login']}`
🌐 Войдите на сайте: http://localhost:3000/login

Если забыли пароль, обратитесь к администратору.
                """
            else:
                return f"❌ Ошибка: {result['error']}"
                
    except requests.exceptions.Timeout:
        return "❌ Ошибка: Превышено время ожидания ответа от сервера"
    except requests.exceptions.ConnectionError:
        return "❌ Ошибка: Не удается подключиться к серверу"
    except requests.exceptions.RequestException as e:
        return f"❌ Ошибка сети: {str(e)}"
    except Exception as e:
        return f"❌ Неожиданная ошибка: {str(e)}"

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    user = update.effective_user
    
    welcome_message = f"""
👋 Привет, {user.first_name}!

Добро пожаловать в систему аналитики сайтов!

📋 Что вы получите:
• 🎁 150 рублей на баланс при регистрации
• 📊 Отслеживание посещений ваших сайтов  
• 📈 Детальная аналитика и статистика
• 💳 Система оплаты за создание сайтов (100₽ за сайт)

Создаю ваш аккаунт...
    """
    
    # Отправляем приветственное сообщение
    await update.message.reply_text(welcome_message)
    
    # Создаем аккаунт
    account_message = await create_user_account(
        telegram_id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        username=user.username
    )
    
    # Отправляем данные аккаунта
    await update.message.reply_text(account_message, parse_mode='Markdown')

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /help"""
    help_text = """
📚 Справка по боту

🔹 /start - Создать аккаунт в системе аналитики
🔹 /help - Показать эту справку

🌐 Сайт: http://localhost:3000
📧 Поддержка: @kiruhak11

После создания аккаунта вы сможете:
• Войти на сайте с полученными данными
• Создавать сайты для аналитики
• Отслеживать посещения и статистику
• Управлять своими проектами
    """
    
    await update.message.reply_text(help_text)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик всех сообщений"""
    user = update.effective_user
    message_text = update.message.text
    
    # Если это не команда, создаем аккаунт
    if not message_text.startswith('/'):
        await start_command(update, context)

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик ошибок"""
    error = context.error
    
    # Игнорируем конфликты getUpdates
    if "Conflict: terminated by other getUpdates request" in str(error):
        print("⚠️ Обнаружен конфликт getUpdates - игнорируем")
        return
    
    # Игнорируем таймауты
    if "Timed out" in str(error):
        print("⚠️ Таймаут - игнорируем")
        return
    
    print(f"❌ Ошибка: {error}")
    
    if update and update.effective_message:
        try:
            await update.effective_message.reply_text(
                "❌ Произошла ошибка. Попробуйте позже или обратитесь к администратору."
            )
        except:
            pass

def main():
    """Основная функция"""
    print("🚀 Запуск бота...")
    
    try:
        # Создаем приложение
        app = Application.builder().token(BOT_TOKEN).build()
        
        # Добавляем обработчики
        app.add_handler(CommandHandler("start", start_command))
        app.add_handler(CommandHandler("help", help_command))
        app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
        
        # Добавляем обработчик ошибок
        app.add_error_handler(error_handler)
        
        # Запускаем бота
        print("✅ Бот запущен!")
        app.run_polling(
            poll_interval=1,
            drop_pending_updates=True
        )
    except Exception as e:
        print(f"❌ Ошибка запуска бота: {e}")
        print("Проверьте:")
        print("1. Правильность токена бота")
        print("2. Подключение к интернету")
        print("3. Доступность Telegram API")
        print("4. Нет ли других запущенных экземпляров бота")

if __name__ == "__main__":
    main()
