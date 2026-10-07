ALTER TABLE "public"."projects"
  ADD COLUMN "ownershipType" TEXT NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "projectSummary" TEXT,
  ADD COLUMN "role" TEXT,
  ADD COLUMN "company" TEXT,
  ADD COLUMN "responsibilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "technicalHighlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill the reviewed case studies by stable project id. Unknown projects stay unverified.
UPDATE "public"."projects" SET
  "ownershipType" = 'OWN',
  "projectSummary" = 'Личное портфолио и веб-платформа с публичными разделами, API и административными инструментами.',
  "role" = 'Основной разработчик',
  "responsibilities" = ARRAY['Разработал публичное приложение и серверные API на Nuxt/Nitro.', 'Реализовал модели данных и работу с PostgreSQL через Prisma.', 'Интегрировал авторизацию и Telegram-сценарии; подготовил Docker-развёртывание.'],
  "technicalHighlights" = ARRAY['Nuxt 3, Vue 3 и TypeScript', 'Nitro API, PostgreSQL и Prisma', 'Docker, Nginx и Telegram Bot API'],
  "technologies" = ARRAY['Nuxt 3', 'Vue 3', 'TypeScript', 'Nitro', 'Prisma', 'PostgreSQL', 'Docker', 'Nginx', 'Telegram Bot API'],
  "liveUrl" = 'https://kiruhak11.ru', "githubUrl" = 'https://github.com/kiruhak11/kiruhak'
WHERE "id" = 'cmm7zid0n0004o301rk66jffv';

UPDATE "public"."projects" SET
  "ownershipType" = 'PARTICIPATION',
  "projectSummary" = 'Официальный сайт котельного завода с каталогом оборудования и формами обращений.',
  "role" = 'Разработчик веб-сайта', "company" = 'КотлоЭнергоСнаб',
  "responsibilities" = ARRAY['Разрабатывал страницы сайта и каталог продукции на Nuxt 3.', 'Реализовал серверные маршруты для каталога, заявок и уведомлений.', 'Работал с Prisma-моделями и MySQL-схемой проекта.'],
  "technicalHighlights" = ARRAY['Nuxt SSR и SEO-структура сайта', 'Каталог с API и Prisma/MySQL', 'Telegram-уведомления по обращениям'],
  "technologies" = ARRAY['Nuxt 3', 'Vue 3', 'Prisma', 'MySQL', 'Telegram Bot API'],
  "liveUrl" = 'https://kes-sib.ru', "githubUrl" = 'https://github.com/kiruhak11/kes'
WHERE "id" = 'cmewb3qvv0003o11ge17zb005';

UPDATE "public"."projects" SET
  "ownershipType" = 'PARTICIPATION',
  "projectSummary" = 'Сайт оконного мастера в Барнауле с услугами, контактами и формой заявки.',
  "role" = 'Разработчик веб-сайта', "company" = 'Частный мастер по ремонту окон',
  "responsibilities" = ARRAY['Реализовал страницу услуг и адаптивный интерфейс на Nuxt 4/Vue 3.', 'Подключил серверную обработку формы и Telegram-уведомления.', 'Настроил контентную структуру и технические SEO-файлы.'],
  "technicalHighlights" = ARRAY['Nuxt 4 и TypeScript', 'Server API для заявок', 'XML-фиды, robots.txt и sitemap'],
  "technologies" = ARRAY['Nuxt 4', 'Vue 3', 'TypeScript', 'SCSS', 'Telegram Bot API'],
  "liveUrl" = 'https://okna-brn.ru', "githubUrl" = 'https://github.com/kiruhak11/okna'
WHERE "id" = 'cmm7z9yya0003o3013vri6scs';

UPDATE "public"."projects" SET
  "ownershipType" = 'PARTICIPATION',
  "projectSummary" = 'Сайт кондитерского бренда с каталогом десертов, галереей, заказами и административной частью.',
  "role" = 'Fullstack-разработчик', "company" = 'Бренд «МАЛИНА»',
  "responsibilities" = ARRAY['Разрабатывал каталог, страницы продукта и галерею на Nuxt 4/Vue 3.', 'Реализовал серверные API и работу с PostgreSQL через Prisma.', 'Добавил инструменты администрирования и Telegram-сценарии для заявок и отзывов.'],
  "technicalHighlights" = ARRAY['Nuxt 4 server API и Prisma/PostgreSQL', 'CRUD для каталога и отзывов', 'Отдельный Telegram bot service'],
  "technologies" = ARRAY['Nuxt 4', 'Vue 3', 'TypeScript', 'Prisma', 'PostgreSQL', 'Docker', 'Telegram Bot API'],
  "liveUrl" = 'https://malina14.ru', "githubUrl" = 'https://github.com/kiruhak11/malina'
WHERE "id" = 'cmmth95p90000qp017bjtfbkt';

UPDATE "public"."projects" SET "projectSummary" = 'Приложение для отображения расписания промышленных миксеров и экспорта отчёта.' WHERE "id" = 'cmewb3qw10005o11gpf3x0vtn';
UPDATE "public"."projects" SET "projectSummary" = 'Интернет-магазин с каталогом товаров, корзиной и личным кабинетом.' WHERE "id" = 'cmqun63t30000me01yu4r2iax';
UPDATE "public"."projects" SET "projectSummary" = 'Промо-сайт игры OVERHEAT с информацией об игре и релизных материалах.' WHERE "id" = 'cmowkh9cv0002qp014udt4cdl';
UPDATE "public"."projects" SET "projectSummary" = 'Сайт строительной компании с перечнем услуг и примерами работ.', "liveUrl" = 'https://remdom22.ru' WHERE "id" = 'cmowkemul0001qp01741xqdo9';
