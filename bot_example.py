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
import logging
from datetime import datetime, timedelta
from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    ReplyKeyboardMarkup,
    KeyboardButton,
)
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes

import os

# Импортируем обработчик модерации
from bot_moderation import handle_component_callback

# Конфигурация
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
API_URL = os.getenv("API_URL", "http://app:3015/api/auth/create-account")
CHANNEL_ID = os.getenv("CHANNEL_ID", "@webmonke")  # ID вашего канала
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID") or os.getenv("ADMIN_TELEGRAM_ID", "123456789")
BOT_SECRET = os.getenv("BOT_SECRET", "")
BOT_API_BASE_URL = os.getenv("BOT_API_BASE_URL", "").strip()
NOTIFY_NEW_REGISTRATIONS = os.getenv("NOTIFY_NEW_REGISTRATIONS", "true").strip().lower() in (
    "1",
    "true",
    "yes",
    "on",
)

logger = logging.getLogger(__name__)

if not BOT_API_BASE_URL:
    if "/api/" in API_URL:
        BOT_API_BASE_URL = API_URL.split("/api/")[0]
    else:
        BOT_API_BASE_URL = "http://app:3015"

# Глобальная переменная для хранения приложения бота
bot_app = None

MENU_TOPUP = "💰 Пополнить баланс"
MENU_CHANGE_PASSWORD = "🔐 Сменить пароль"
MENU_LOGOUT_ALL = "🚪 Завершить сессии"
MENU_QUICK_LOGIN = "🔑 Быстрый вход"
MENU_PROFILE = "👤 Профиль"

STATE_KEY = "flow_state"
STATE_NONE = "none"
STATE_AWAIT_TOPUP = "await_topup"
STATE_AWAIT_CURRENT_PASSWORD = "await_current_password"
STATE_AWAIT_NEW_PASSWORD = "await_new_password"
TMP_CURRENT_PASSWORD_KEY = "tmp_current_password"


def bot_headers():
    headers = {}
    if BOT_SECRET:
        headers["x-bot-secret"] = BOT_SECRET
    return headers


def bot_api_url(path):
    return f"{BOT_API_BASE_URL.rstrip('/')}{path}"


def _safe_json(response):
    try:
        payload = response.json()
    except ValueError:
        text = (response.text or "").strip()
        return {
            "success": False,
            "error": f"Invalid JSON response (HTTP {response.status_code})",
            "statusMessage": text[:200] or "Empty body",
        }

    if not isinstance(payload, dict):
        return {
            "success": False,
            "error": "Invalid API response shape",
            "statusMessage": f"Expected object, got {type(payload).__name__}",
        }

    # Нормализуем ошибки HTTP в единый формат.
    if response.status_code >= 400 and payload.get("success") is not True:
        payload.setdefault("success", False)
        payload.setdefault("error", payload.get("statusMessage") or f"HTTP {response.status_code}")
    return payload


def _normalize_account_payload(payload):
    if not isinstance(payload, dict):
        return {
            "success": False,
            "error": "API returned non-object payload",
            "raw": payload,
        }

    data = payload.get("data")
    if isinstance(data, dict):
        merged = dict(payload)
        # Поля верхнего уровня важнее, но недостающие подхватываем из data.
        for key, value in data.items():
            merged.setdefault(key, value)
        payload = merged

    user_obj = payload.get("user")
    if not isinstance(user_obj, dict):
        user_obj = {}

    login = payload.get("login") or user_obj.get("login") or "-"
    quick_token = payload.get("quickToken") or payload.get("quick_token") or "-"
    quick_url = payload.get("quickLoginUrl") or payload.get("quick_login_url") or "-"
    balance = payload.get("balance")
    if balance is None:
        balance = user_obj.get("balance")

    normalized = dict(payload)
    normalized["user"] = user_obj
    normalized["login"] = login
    normalized["quickToken"] = quick_token
    normalized["quickLoginUrl"] = quick_url
    normalized["balance"] = balance
    return normalized


def get_main_menu_markup():
    return ReplyKeyboardMarkup(
        [
            [KeyboardButton(MENU_TOPUP), KeyboardButton(MENU_QUICK_LOGIN)],
            [KeyboardButton(MENU_CHANGE_PASSWORD), KeyboardButton(MENU_LOGOUT_ALL)],
            [KeyboardButton(MENU_PROFILE)],
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
    )


async def show_main_menu(message):
    await message.reply_text(
        "Выберите действие в меню:",
        reply_markup=get_main_menu_markup(),
    )


async def notify_admin_new_registration(
    telegram_id,
    first_name,
    last_name,
    username,
    login,
    balance,
):
    if not NOTIFY_NEW_REGISTRATIONS:
        return
    if not bot_app:
        return

    admin_chat_id = str(ADMIN_CHAT_ID or "").strip()
    if not admin_chat_id:
        return

    full_name = " ".join([part for part in [first_name, last_name] if part]).strip() or "Без имени"
    username_part = f"@{username}" if username else "не указан"
    balance_rub = (balance / 100) if isinstance(balance, (int, float)) else 0

    text = (
        "🆕 Новая регистрация\n\n"
        f"👤 Имя: {full_name}\n"
        f"🆔 Telegram ID: {telegram_id}\n"
        f"🔗 Username: {username_part}\n"
        f"🔐 Логин: {login or '-'}\n"
        f"💰 Стартовый баланс: {balance_rub:.2f} ₽\n"
        f"🕒 Время: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}"
    )

    try:
        await bot_app.bot.send_message(chat_id=admin_chat_id, text=text)
    except Exception:
        logger.exception("Failed to send registration notification to admin")


async def create_user_account(telegram_id, first_name, last_name, username):
    """Создание аккаунта пользователя через API"""
    data = {
        "telegramId": str(telegram_id),
        "firstName": first_name,
        "lastName": last_name or "",
        "username": username or ""
    }
    
    try:
        result = create_or_fetch_account_payload(telegram_id, first_name, last_name, username)

        if result is None:
            return "❌ Ошибка: пустой ответ от сервера"
        
        normalized = _normalize_account_payload(result)

        if normalized.get("success"):
            quick_token = normalized.get("quickToken", "")
            quick_url = normalized.get("quickLoginUrl", "")
            if normalized.get("existing"):
                login = normalized.get("login", "неизвестно")
                return (
                    "ℹ️ Аккаунт уже существует.\n\n"
                    f"🔑 Логин: `{login}`\n"
                    f"🪙 Токен быстрого входа: `{quick_token}`\n"
                    f"🌐 Быстрый вход: {quick_url}\n"
                )

            user = normalized.get("user", {})
            balance = normalized.get("balance")
            if not isinstance(balance, (int, float)):
                balance = 0

            await notify_admin_new_registration(
                telegram_id=telegram_id,
                first_name=first_name,
                last_name=last_name,
                username=username,
                login=user.get("login", ""),
                balance=balance,
            )

            return (
                "✅ Аккаунт успешно создан!\n\n"
                f"🔑 Логин: `{user.get('login', '')}`\n"
                f"🔐 Пароль: `{user.get('password', '')}`\n"
                f"💰 Баланс: {balance / 100} ₽\n\n"
                f"🪙 Токен быстрого входа: `{quick_token}`\n"
                f"🌐 Быстрый вход: {quick_url}\n"
            )
        else:
            return f"❌ Ошибка: {_get_api_error(normalized)}"
                
    except requests.exceptions.Timeout:
        return "❌ Ошибка: Превышено время ожидания ответа от сервера"
    except requests.exceptions.ConnectionError:
        return "❌ Ошибка: Не удается подключиться к серверу"
    except requests.exceptions.RequestException as e:
        return f"❌ Ошибка сети: {str(e)}"
    except Exception as e:
        return f"❌ Неожиданная ошибка: {str(e)}"


def create_or_fetch_account_payload(telegram_id, first_name, last_name, username):
    data = {
        "telegramId": str(telegram_id),
        "firstName": first_name,
        "lastName": last_name or "",
        "username": username or "",
    }

    fallback_api_url = API_URL.replace("/api/auth/telegram", "/api/auth/create-account")
    api_candidates = [API_URL]
    if fallback_api_url != API_URL:
        api_candidates.append(fallback_api_url)

    result = None
    for idx, api_url in enumerate(api_candidates):
        response = requests.post(api_url, json=data, headers=bot_headers(), timeout=10)
        result = _safe_json(response)

        # Если попали в telegram-auth endpoint по ошибке, делаем fallback.
        if (
            result.get("success") is False
            and result.get("error") in ("Invalid Telegram data", "Invalid Telegram signature")
            and idx < len(api_candidates) - 1
        ):
            continue
        break

    if result is None:
        raise RuntimeError("Empty API response")

    return _normalize_account_payload(result)


def bot_post(path, payload):
    response = requests.post(
        bot_api_url(path),
        json=payload,
        headers=bot_headers(),
        timeout=10,
    )
    return _safe_json(response)


def _get_api_error(payload):
    return (
        payload.get("error")
        or payload.get("statusMessage")
        or payload.get("message")
        or "Неизвестная ошибка"
    )


async def _ensure_account_exists(telegram_user):
    account_message = await create_user_account(
        telegram_id=telegram_user.id,
        first_name=telegram_user.first_name,
        last_name=telegram_user.last_name,
        username=telegram_user.username,
    )
    return not account_message.startswith("❌"), account_message

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

async def menu_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data[STATE_KEY] = STATE_NONE
    context.user_data.pop(TMP_CURRENT_PASSWORD_KEY, None)
    await show_main_menu(update.message)


async def profile_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    try:
        payload = create_or_fetch_account_payload(
            user.id, user.first_name, user.last_name, user.username
        )
        if not payload.get("success"):
            await update.message.reply_text(
                f"❌ Не удалось получить данные аккаунта: {_get_api_error(payload)}"
            )
            return

        login = payload.get("login", "-")
        quick_token = payload.get("quickToken", "-")
        quick_url = payload.get("quickLoginUrl", "-")
        balance = payload.get("balance")
        balance_line = ""
        if isinstance(balance, (int, float)):
            balance_line = f"💰 Баланс: {balance / 100:.2f} ₽\n"

        await update.message.reply_text(
            "👤 Профиль\n\n"
            f"🔑 Логин: `{login}`\n"
            f"{balance_line}"
            f"🪙 Токен быстрого входа: `{quick_token}`\n"
            f"🌐 Быстрый вход: {quick_url}",
        )
    except Exception:
        logger.exception("Profile command failed")
        await update.message.reply_text("❌ Ошибка профиля. Попробуйте снова позже.")


async def quick_login_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    try:
        payload = create_or_fetch_account_payload(
            user.id, user.first_name, user.last_name, user.username
        )
        if not payload.get("success"):
            await update.message.reply_text(
                f"❌ Не удалось сформировать ссылку быстрого входа: {_get_api_error(payload)}"
            )
            return

        quick_token = payload.get("quickToken")
        quick_url = payload.get("quickLoginUrl")
        if not quick_token or not quick_url:
            await update.message.reply_text(
                "❌ API не вернул quickToken/quickLoginUrl. Обнови app до последнего кода."
            )
            return

        await update.message.reply_text(
            "🔑 Быстрый вход\n\n"
            f"🪙 Токен: `{quick_token}`\n"
            f"🌐 Ссылка: {quick_url}",
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Ошибка быстрого входа: {str(e)}")


async def logout_all_sessions_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    try:
        result = bot_post("/api/bot/logout-all", {"telegramId": str(user.id)})
        if not result.get("success") and _get_api_error(result) == "User not found":
            ok, account_message = await _ensure_account_exists(user)
            if not ok:
                await update.message.reply_text(account_message)
                return
            result = bot_post("/api/bot/logout-all", {"telegramId": str(user.id)})

        if result.get("success"):
            await update.message.reply_text(
                "✅ Все активные сессии завершены.\n"
                "Войдите в аккаунт заново на нужных устройствах."
            )
        else:
            await update.message.reply_text(
                f"❌ Не удалось завершить сессии: {_get_api_error(result)}"
            )
    except Exception as e:
        await update.message.reply_text(f"❌ Ошибка завершения сессий: {str(e)}")

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    user = update.effective_user
    context.user_data[STATE_KEY] = STATE_NONE
    context.user_data.pop(TMP_CURRENT_PASSWORD_KEY, None)
    
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
    await update.message.reply_text(account_message)
    if account_message.startswith("❌"):
        await update.message.reply_text(
            "Меню недоступно, пока аккаунт не создан. Исправьте ошибку и отправьте /start снова."
        )
        return
    await show_main_menu(update.message)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /help"""
    help_text = """
📚 Справка по боту

🔹 /start - Создать аккаунт в системе аналитики
🔹 /menu - Показать меню действий
🔹 /help - Показать эту справку
🔹 /stats - Показать текущую статистику (только для админа)
🔹 /cancel - Отменить текущий шаг

🌐 Сайт: https://kiruhak11.ru
📧 Поддержка: @kiruhak11

После создания аккаунта вы сможете:
• Войти на сайте с полученными данными
• Создавать сайты для аналитики
• Отслеживать посещения и статистику
• Управлять своими проектами
    """
    
    await update.message.reply_text(help_text)

async def cancel_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data[STATE_KEY] = STATE_NONE
    context.user_data.pop(TMP_CURRENT_PASSWORD_KEY, None)
    await update.message.reply_text("Действие отменено.")
    await show_main_menu(update.message)

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
    message_text = (update.message.text or "").strip()
    state = context.user_data.get(STATE_KEY, STATE_NONE)

    if message_text == MENU_TOPUP:
        context.user_data[STATE_KEY] = STATE_AWAIT_TOPUP
        await update.message.reply_text("Введите сумму пополнения в рублях (например: 150):")
        return

    if message_text == MENU_CHANGE_PASSWORD:
        context.user_data[STATE_KEY] = STATE_AWAIT_CURRENT_PASSWORD
        await update.message.reply_text("Введите текущий пароль:")
        return

    if message_text == MENU_LOGOUT_ALL:
        context.user_data[STATE_KEY] = STATE_NONE
        await logout_all_sessions_command(update, context)
        await show_main_menu(update.message)
        return

    if message_text == MENU_QUICK_LOGIN:
        context.user_data[STATE_KEY] = STATE_NONE
        await quick_login_command(update, context)
        await show_main_menu(update.message)
        return

    if message_text == MENU_PROFILE:
        context.user_data[STATE_KEY] = STATE_NONE
        await profile_command(update, context)
        await show_main_menu(update.message)
        return

    if state == STATE_AWAIT_TOPUP:
        raw_amount = message_text.replace(",", ".")
        try:
            amount = float(raw_amount)
            if amount <= 0:
                raise ValueError("amount <= 0")

            result = bot_post(
                "/api/bot/topup",
                {
                    "telegramId": str(user.id),
                    "amount": amount,
                },
            )
            if result.get("success"):
                await update.message.reply_text(
                    f"✅ Баланс пополнен.\nНовый баланс: {result.get('formattedBalance', '-')}"
                )
            else:
                await update.message.reply_text(
                    f"❌ Ошибка пополнения: {result.get('error', 'неизвестная ошибка')}"
                )
        except Exception:
            await update.message.reply_text("❌ Неверный формат суммы. Пример: 150")

        context.user_data[STATE_KEY] = STATE_NONE
        await show_main_menu(update.message)
        return

    if state == STATE_AWAIT_CURRENT_PASSWORD:
        if len(message_text) < 1:
            await update.message.reply_text("❌ Текущий пароль не может быть пустым.")
            return

        context.user_data[TMP_CURRENT_PASSWORD_KEY] = message_text
        context.user_data[STATE_KEY] = STATE_AWAIT_NEW_PASSWORD
        await update.message.reply_text("Введите новый пароль (минимум 8 символов):")
        return

    if state == STATE_AWAIT_NEW_PASSWORD:
        current_password = context.user_data.get(TMP_CURRENT_PASSWORD_KEY, "")
        new_password = message_text
        if len(new_password) < 8:
            await update.message.reply_text("❌ Новый пароль должен быть не короче 8 символов.")
            return

        try:
            result = bot_post(
                "/api/bot/change-password",
                {
                    "telegramId": str(user.id),
                    "currentPassword": current_password,
                    "newPassword": new_password,
                },
            )
            if result.get("success"):
                await update.message.reply_text(
                    "✅ Пароль изменен. Все предыдущие сессии завершены."
                )
            else:
                await update.message.reply_text(
                    f"❌ Ошибка смены пароля: {result.get('error', 'неизвестная ошибка')}"
                )
        except Exception as e:
            await update.message.reply_text(f"❌ Ошибка смены пароля: {str(e)}")

        context.user_data[STATE_KEY] = STATE_NONE
        context.user_data.pop(TMP_CURRENT_PASSWORD_KEY, None)
        await show_main_menu(update.message)
        return

    await update.message.reply_text(
        "Команда не распознана. Используйте /menu или кнопки ниже."
    )
    await show_main_menu(update.message)

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
    
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    if not BOT_TOKEN or ":" not in BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is not configured")

    print("🚀 Запуск улучшенного бота...")
    print(f"🌐 API_URL: {API_URL}")
    print(f"🌐 BOT_API_BASE_URL: {BOT_API_BASE_URL}")
    if "/api/auth/telegram" in API_URL:
        print("⚠️ API_URL указывает на /api/auth/telegram, будет использован fallback на /api/auth/create-account")
    
    try:
        # Создаем приложение
        bot_app = Application.builder().token(BOT_TOKEN).build()
        
        # Добавляем обработчики
        bot_app.add_handler(CommandHandler("start", start_command))
        bot_app.add_handler(CommandHandler("menu", menu_command))
        bot_app.add_handler(CommandHandler("cancel", cancel_command))
        bot_app.add_handler(CommandHandler("help", help_command))
        bot_app.add_handler(CommandHandler("stats", stats_command))
        bot_app.add_handler(CallbackQueryHandler(handle_component_callback))
        bot_app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
        
        # Добавляем обработчик ошибок
        bot_app.add_error_handler(error_handler)
        
        # Запускаем бота
        print("✅ Улучшенный бот запущен!")
        print("📊 Бот готов к приему команд")
        bot_app.run_polling(
            drop_pending_updates=True,
            allowed_updates=["message", "callback_query"]
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
