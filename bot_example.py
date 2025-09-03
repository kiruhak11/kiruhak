#!/usr/bin/env python3
"""
Улучшенный Telegram бот для создания аккаунтов и отправки ежедневной статистики
Используйте этот код как основу для вашего бота @gs_company_bot
"""

import requests
import json
import asyncio
import schedule
import time
from datetime import datetime, timedelta
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

import os

# Конфигурация
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "6122558496:AAEXwnP3E4uIk5sSSNzD-13vQK6A4ybCBFI")
API_URL = os.getenv("API_URL", "http://app:3015/api/auth/create-account")
CHANNEL_ID = os.getenv("CHANNEL_ID", "@your_channel")  # ID вашего канала
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "123456789")  # ID админа для статистики

# Глобальная переменная для хранения приложения бота
bot_app = None

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

async def get_channel_stats():
    """Получение статистики канала"""
    try:
        # Получаем информацию о канале
        chat_info = await bot_app.bot.get_chat(CHANNEL_ID)
        
        # Получаем количество подписчиков
        member_count = await bot_app.bot.get_chat_member_count(CHANNEL_ID)
        
        # Получаем последние сообщения для анализа
        messages = await bot_app.bot.get_chat_history(CHANNEL_ID, limit=10)
        
        # Анализируем активность (упрощенная версия)
        recent_activity = len(messages) if messages else 0
        
        return {
            "channel_name": chat_info.title,
            "subscribers": member_count,
            "recent_activity": recent_activity,
            "description": chat_info.description or "Нет описания"
        }
    except Exception as e:
        print(f"Ошибка получения статистики канала: {e}")
        return None

async def get_website_stats():
    """Получение статистики сайта"""
    try:
        # Получаем общую статистику сайтов
        response = requests.get("http://app:3015/api/sites", timeout=10)
        if response.status_code == 200:
            sites_data = response.json()
            
            total_sites = len(sites_data) if isinstance(sites_data, list) else 0
            
            # Получаем статистику посещений (если есть API)
            total_visits = 0
            try:
                visits_response = requests.get("http://app:3015/api/analytics/overview", timeout=10)
                if visits_response.status_code == 200:
                    visits_data = visits_response.json()
                    total_visits = visits_data.get("totalVisits", 0)
            except:
                pass
            
            return {
                "total_sites": total_sites,
                "total_visits": total_visits,
                "active_users": total_sites * 2  # Примерная оценка
            }
    except Exception as e:
        print(f"Ошибка получения статистики сайта: {e}")
        return None

def calculate_growth(current, previous):
    """Вычисление процента роста"""
    if previous == 0:
        return 100 if current > 0 else 0
    return round(((current - previous) / previous) * 100, 1)

def generate_recommendations(channel_stats, website_stats, prev_stats):
    """Генерация рекомендаций на основе статистики"""
    recommendations = []
    
    # Анализ канала
    if channel_stats and prev_stats.get("channel"):
        prev_subs = prev_stats["channel"].get("subscribers", 0)
        current_subs = channel_stats.get("subscribers", 0)
        growth = calculate_growth(current_subs, prev_subs)
        
        if growth < 5:
            recommendations.append("📈 Рост подписчиков медленный. Попробуйте:")
            recommendations.append("• Публиковать контент в одно время")
            recommendations.append("• Использовать больше хештегов")
            recommendations.append("• Создавать интерактивные посты")
        elif growth > 20:
            recommendations.append("🚀 Отличный рост! Продолжайте:")
            recommendations.append("• Поддерживать качество контента")
            recommendations.append("• Анализировать популярные посты")
            recommendations.append("• Увеличивать частоту публикаций")
    
    # Анализ сайта
    if website_stats and prev_stats.get("website"):
        prev_sites = prev_stats["website"].get("total_sites", 0)
        current_sites = website_stats.get("total_sites", 0)
        growth = calculate_growth(current_sites, prev_sites)
        
        if growth < 10:
            recommendations.append("🌐 Рост сайтов медленный. Рекомендации:")
            recommendations.append("• Улучшить onboarding процесс")
            recommendations.append("• Добавить больше бесплатных функций")
            recommendations.append("• Упростить регистрацию")
        elif growth > 30:
            recommendations.append("🎯 Отличный рост сайтов! Действия:")
            recommendations.append("• Масштабировать инфраструктуру")
            recommendations.append("• Добавить новые функции")
            recommendations.append("• Улучшить поддержку пользователей")
    
    # Общие рекомендации
    if not recommendations:
        recommendations.append("📊 Стабильный рост. Рекомендации:")
        recommendations.append("• Анализируйте метрики еженедельно")
        recommendations.append("• Тестируйте новые форматы контента")
        recommendations.append("• Оптимизируйте пользовательский опыт")
    
    return recommendations

async def send_daily_stats():
    """Отправка ежедневной статистики"""
    if not bot_app:
        print("Бот не инициализирован")
        return
    
    try:
        # Получаем текущую статистику
        channel_stats = await get_channel_stats()
        website_stats = await get_website_stats()
        
        # Загружаем предыдущую статистику (упрощенная версия)
        prev_stats = load_previous_stats()
        
        # Формируем отчет
        report = "📊 **ЕЖЕДНЕВНАЯ СТАТИСТИКА**\n\n"
        report += f"📅 Дата: {datetime.now().strftime('%d.%m.%Y')}\n\n"
        
        # Статистика канала
        if channel_stats:
            report += "📢 **КАНАЛ:**\n"
            report += f"👥 Подписчики: {channel_stats['subscribers']:,}\n"
            
            if prev_stats.get("channel"):
                prev_subs = prev_stats["channel"].get("subscribers", 0)
                growth = calculate_growth(channel_stats['subscribers'], prev_subs)
                report += f"📈 Рост: {growth:+.1f}%\n"
            
            report += f"📝 Активность: {channel_stats['recent_activity']} постов\n\n"
        
        # Статистика сайта
        if website_stats:
            report += "🌐 **САЙТ:**\n"
            report += f"🏗️ Создано сайтов: {website_stats['total_sites']:,}\n"
            report += f"👀 Всего посещений: {website_stats['total_visits']:,}\n"
            report += f"👤 Активных пользователей: {website_stats['active_users']:,}\n"
            
            if prev_stats.get("website"):
                prev_sites = prev_stats["website"].get("total_sites", 0)
                growth = calculate_growth(website_stats['total_sites'], prev_sites)
                report += f"📈 Рост сайтов: {growth:+.1f}%\n"
            
            report += "\n"
        
        # Рекомендации
        recommendations = generate_recommendations(channel_stats, website_stats, prev_stats)
        if recommendations:
            report += "💡 **РЕКОМЕНДАЦИИ:**\n"
            for rec in recommendations:
                report += f"{rec}\n"
        
        # Сохраняем текущую статистику
        save_current_stats(channel_stats, website_stats)
        
        # Отправляем отчет админу
        await bot_app.bot.send_message(
            chat_id=ADMIN_CHAT_ID,
            text=report,
            parse_mode='Markdown'
        )
        
        print(f"✅ Ежедневная статистика отправлена: {datetime.now()}")
        
    except Exception as e:
        print(f"❌ Ошибка отправки статистики: {e}")

def load_previous_stats():
    """Загрузка предыдущей статистики"""
    try:
        with open("previous_stats.json", "r") as f:
            return json.load(f)
    except:
        return {}

def save_current_stats(channel_stats, website_stats):
    """Сохранение текущей статистики"""
    try:
        stats = {
            "date": datetime.now().isoformat(),
            "channel": channel_stats,
            "website": website_stats
        }
        with open("previous_stats.json", "w") as f:
            json.dump(stats, f, indent=2)
    except Exception as e:
        print(f"Ошибка сохранения статистики: {e}")

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
🔹 /stats - Показать текущую статистику (только для админа)

🌐 Сайт: http://localhost:3000
📧 Поддержка: @kiruhak11

После создания аккаунта вы сможете:
• Войти на сайте с полученными данными
• Создавать сайты для аналитики
• Отслеживать посещения и статистику
• Управлять своими проектами
    """
    
    await update.message.reply_text(help_text)

async def stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /stats (только для админа)"""
    user = update.effective_user
    
    if str(user.id) != ADMIN_CHAT_ID:
        await update.message.reply_text("❌ У вас нет доступа к этой команде")
        return
    
    # Отправляем текущую статистику
    await send_daily_stats()
    await update.message.reply_text("📊 Статистика отправлена в личные сообщения")

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

def schedule_daily_stats():
    """Планирование ежедневной отправки статистики"""
    schedule.every().day.at("09:00").do(lambda: asyncio.create_task(send_daily_stats()))
    
    while True:
        schedule.run_pending()
        time.sleep(60)

def main():
    """Основная функция"""
    global bot_app
    
    print("🚀 Запуск улучшенного бота...")
    
    try:
        # Создаем приложение
        bot_app = Application.builder().token(BOT_TOKEN).build()
        
        # Добавляем обработчики
        bot_app.add_handler(CommandHandler("start", start_command))
        bot_app.add_handler(CommandHandler("help", help_command))
        bot_app.add_handler(CommandHandler("stats", stats_command))
        bot_app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
        
        # Добавляем обработчик ошибок
        bot_app.add_error_handler(error_handler)
        
        # Запускаем планировщик статистики в отдельном потоке
        import threading
        stats_thread = threading.Thread(target=schedule_daily_stats, daemon=True)
        stats_thread.start()
        
        # Запускаем бота
        print("✅ Улучшенный бот запущен!")
        print("📊 Ежедневная статистика будет отправляться в 09:00")
        bot_app.run_polling(
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
