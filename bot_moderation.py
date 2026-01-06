#!/usr/bin/env python3
"""
Обработчик модерации UI компонентов через Telegram Bot
"""

import os
import re
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes


def extract_component_id(text: str) -> str:
    """Извлекает component_id из текста сообщения"""
    print(f"🔍 Извлечение ID из текста (первые 200 символов): {text[:200]}")
    
    # Ищем различные паттерны ID
    patterns = [
        r'ID:\s*<code>([^<]+)</code>',
        r'<b>ID:</b>\s*<code>([^<]+)</code>',
        r'ID:\s*([a-zA-Z0-9_-]+)',
        r'<code>([a-zA-Z0-9_-]{20,})</code>',  # Ищем длинные ID в любом code-теге
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            component_id = match.group(1)
            print(f"✅ Найден ID: {component_id}")
            return component_id
    
    # Если не найдено, возвращаем пустую строку
    print(f"⚠️ Не удалось извлечь component_id из текста")
    print(f"📝 Полный текст: {text}")
    return ""


async def handle_component_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик нажатий на inline-кнопки для модерации компонентов"""
    query = update.callback_query
    await query.answer()
    
    callback_data = query.data
    # Используем host.docker.internal для доступа к хост-машине из Docker
    # или просто хост IP, если запущено локально используйте localhost:3000
    api_base = os.getenv("API_BASE_URL", "http://host.docker.internal:3000")
    
    if callback_data.startswith("approve_"):
        # Пытаемся извлечь ID из callback_data или из текста сообщения
        component_id = callback_data.replace("approve_", "")
        
        # Если ID короткий (обрезанный), извлекаем полный из текста
        if len(component_id) <= 20:
            text = query.message.text_html or query.message.text or query.message.caption or ""
            full_id = extract_component_id(text)
            if full_id:
                component_id = full_id
        
        # Отправляем запрос на одобрение
        try:
            url = f"{api_base}/api/ui-components/{component_id}/bot-moderate"
            print(f"📤 Отправка запроса на: {url}")
            
            response = requests.post(
                url,
                json={"action": "approve"},
                timeout=10
            )
            
            print(f"📥 Статус ответа: {response.status_code}")
            print(f"📥 Тело ответа: {response.text[:200]}")
            
            result = response.json()
            
            if result.get("success"):
                await query.edit_message_text(
                    text=f"{query.message.text}\n\n✅ <b>ОДОБРЕНО</b>",
                    parse_mode="HTML"
                )
            else:
                await query.edit_message_text(
                    text=f"{query.message.text}\n\n❌ Ошибка одобрения: {result.get('error', 'Unknown')}",
                    parse_mode="HTML"
                )
        except Exception as e:
            await query.edit_message_text(
                text=f"{query.message.text}\n\n❌ Ошибка: {str(e)}",
                parse_mode="HTML"
            )
    
    elif callback_data.startswith("reject_"):
        component_id = callback_data.replace("reject_", "")
        
        # Если ID короткий, извлекаем полный из текста
        if len(component_id) <= 20:
            text = query.message.text_html or query.message.text or query.message.caption or ""
            full_id = extract_component_id(text)
            if full_id:
                component_id = full_id
        
        # Создаем inline-кнопки для выбора причины (используем короткие коды)
        keyboard = [
            [InlineKeyboardButton("❌ Низкое качество", callback_data=f"rj_q_{component_id[:20]}")],
            [InlineKeyboardButton("❌ Не соответствует требованиям", callback_data=f"rj_r_{component_id[:20]}")],
            [InlineKeyboardButton("❌ Некорректный код", callback_data=f"rj_c_{component_id[:20]}")],
            [InlineKeyboardButton("❌ Дубликат", callback_data=f"rj_d_{component_id[:20]}")],
            [InlineKeyboardButton("↩️ Отмена", callback_data=f"cancel_{component_id[:20]}")],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        # Сохраняем полный component_id в тексте сообщения для последующего использования
        current_text = query.message.text_html or query.message.text or ""
        await query.edit_message_text(
            text=f"{current_text}\n\n⚠️ Выберите причину отклонения:\nID: <code>{component_id}</code>",
            reply_markup=reply_markup,
            parse_mode="HTML"
        )
    
    elif callback_data.startswith("rj_q_"):
        # Извлекаем component_id из текста сообщения (пробуем разные источники)
        text = query.message.text_html or query.message.text or query.message.caption or ""
        component_id = extract_component_id(text)
        await moderate_component(query, component_id, api_base, "reject", "Низкое качество кода или дизайна")
    
    elif callback_data.startswith("rj_r_"):
        text = query.message.text_html or query.message.text or query.message.caption or ""
        component_id = extract_component_id(text)
        await moderate_component(query, component_id, api_base, "reject", "Не соответствует требованиям к компонентам")
    
    elif callback_data.startswith("rj_c_"):
        text = query.message.text_html or query.message.text or query.message.caption or ""
        component_id = extract_component_id(text)
        await moderate_component(query, component_id, api_base, "reject", "Некорректный или небезопасный код")
    
    elif callback_data.startswith("rj_d_"):
        text = query.message.text_html or query.message.text or query.message.caption or ""
        component_id = extract_component_id(text)
        await moderate_component(query, component_id, api_base, "reject", "Дубликат существующего компонента")
    
    elif callback_data.startswith("cancel_"):
        text = query.message.text_html or query.message.text or query.message.caption or ""
        component_id = extract_component_id(text)
        
        # Возвращаем исходные кнопки
        keyboard = [
            [
                InlineKeyboardButton("✅ Одобрить", callback_data=f"approve_{component_id[:20]}"),
                InlineKeyboardButton("❌ Отклонить", callback_data=f"reject_{component_id[:20]}"),
            ],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        # Убираем строки с выбором причины и ID
        lines = query.message.text.split("\n\n")
        original_text = lines[0]  # Берём только первую часть
        
        await query.edit_message_text(
            text=original_text,
            reply_markup=reply_markup,
            parse_mode="HTML"
        )


async def moderate_component(query, component_id: str, api_base: str, action: str, reason: str = None):
    """Отправляет запрос на модерацию компонента"""
    try:
        data = {"action": action}
        if reason:
            data["reason"] = reason
        
        url = f"{api_base}/api/ui-components/{component_id}/bot-moderate"
        print(f"📤 Отправка запроса на: {url}")
        print(f"📤 Данные: {data}")
        
        response = requests.post(
            url,
            json=data,
            timeout=10
        )
        
        print(f"📥 Статус ответа: {response.status_code}")
        print(f"📥 Тело ответа: {response.text[:200]}")
        
        result = response.json()
        
        if result.get("success"):
            status = "✅ ОДОБРЕНО" if action == "approve" else f"❌ ОТКЛОНЕНО\nПричина: {reason}"
            await query.edit_message_text(
                text=f"{query.message.text.split('⚠️')[0]}\n\n{status}",
                parse_mode="HTML"
            )
        else:
            await query.edit_message_text(
                text=f"{query.message.text}\n\n❌ Ошибка: {result.get('error', 'Unknown')}",
                parse_mode="HTML"
            )
    except Exception as e:
        await query.edit_message_text(
            text=f"{query.message.text}\n\n❌ Ошибка: {str(e)}",
            parse_mode="HTML"
        )

