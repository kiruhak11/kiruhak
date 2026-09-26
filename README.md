<div align="center">

# K-Studio

### Веб‑разработка и цифровые продукты под ключ

Корпоративные сайты, веб‑сервисы и интеграции — от идеи и дизайна до запуска и поддержки.

[Сайт](https://kiruhak11.ru) · [Проекты](https://kiruhak11.ru/projects) · [Связаться](https://kiruhak11.ru/contact) · [Telegram](https://t.me/kiruhak11)

</div>

---

## О проекте

K-Studio — личное портфолио и рабочая платформа студии. Сайт показывает проекты и материалы, принимает брифы и заказы, а также включает личный кабинет с авторизацией через Telegram.

## Возможности

- Портфолио проектов с подробными карточками, технологиями и ссылками на результат.
- Формы связи и бриф на разработку.
- Разделы с материалами, обучающими материалами и UI-компонентами.
- Авторизация, профиль пользователя и баланс.
- Административные страницы для управления проектами и контентом.
- Telegram-интеграция для уведомлений и пользовательских сценариев.
- Адаптивная мобильная версия и переключение темы.

## Технологии

| Область | Стек |
| --- | --- |
| Приложение | Nuxt 3, Vue 3, TypeScript |
| Интерфейс | SCSS, адаптивная компонентная вёрстка |
| Сервер | Nitro API, Node.js |
| Данные | PostgreSQL, Prisma |
| Интеграции | Telegram Bot API |
| Развёртывание | Docker, Docker Compose, Nginx |

## Локальный запуск

Нужны Node.js и npm. Для полного набора серверных функций настройте PostgreSQL и переменные окружения.

```bash
git clone https://github.com/kiruhak11/kiruhak.git
cd kiruhak
npm install
cp .env.example .env
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`.

Для production-сборки:

```bash
npm run build
npm run preview
```

## Переменные окружения

Начните с `.env.example`. Для API и авторизации задайте подключение к базе данных, секреты приложения и параметры Telegram. Не добавляйте `.env` и реальные токены в Git.

| Переменная | Назначение |
| --- | --- |
| `DATABASE_URL` | Строка подключения Prisma к PostgreSQL |
| `AUTH_TOKEN_SECRET` | Секрет подписи токенов авторизации |
| `BOT_SECRET` | Секрет для доверенного обмена с ботом |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота |
| `ADMIN_TELEGRAM_ID` | Telegram ID администратора |
| `TELEGRAM_CHANNEL_USERNAME` | Канал для сценариев проверки подписки |
| `NUXT_PUBLIC_SITE_URL` | Публичный адрес сайта |
| `YANDEX_METRIKA_ID` | Необязательный идентификатор Яндекс Метрики |

## Docker

Конфигурации Compose и инструкции по подготовке production-окружения находятся в [`DOCKER_DEPLOY.md`](DOCKER_DEPLOY.md). Перед запуском убедитесь, что `.env` содержит уникальные секреты и параметры подключения к базе.

## Структура

```text
components/   Переиспользуемые интерфейсные компоненты
pages/        Страницы сайта и административной панели
server/api/   Серверные API-маршруты Nitro
prisma/       Схема базы данных и начальные данные
assets/       Глобальные стили и ресурсы
```

## Контакты

- Сайт: [kiruhak11.ru](https://kiruhak11.ru)
- Telegram: [@kiruhak11](https://t.me/kiruhak11)
- Email: [kiruhak2005@gmail.com](mailto:kiruhak2005@gmail.com)

---

<div align="center">Сделано K-Studio · <a href="https://kiruhak11.ru">kiruhak11.ru</a></div>
