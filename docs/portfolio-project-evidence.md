# Portfolio project evidence audit

Audit date: 2026-10-06. This is a read-only evidence snapshot of the production `/api/projects` response and public repositories before the ownership UI change. Production URLs were fetched with redirects enabled; a `200` only confirms an HTTP response, not the quality or ownership of a site. Repository links were checked against GitHub's public repository API. No project was cloned and no database or seed command was run.

## Inventory of public project sources

The deployed public `/api/projects` returned eight records. The homepage consumes that API and, before this change, showed the first three records; `/projects` showed all eight. `ProjectCard` and `ProjectModal` are the public presentation components. No other mounted public page currently includes `InteractiveGallery`; its fallback is documented below because it contains static project-like records.

| Project / production API ID | Production URL | Repository URL | Current product description (shortened) | Current stack (production API) | Image source | Existing role/contribution claims | Source |
|---|---|---|---|---|---|---|---|
| K-Studio / `cmm7zid0n0004o301rk66jffv` | `https://kiruhak11.ru` | `https://github.com/kiruhak11` (profile URL, not repository URL) | Nuxt 3 portfolio and web platform with public content, admin, API, Telegram, analytics and PostgreSQL | Nuxt 3, Vue 3, TypeScript, Node.js, Prisma, PostgreSQL, Pinia, SCSS, Docker, Nginx, Telegram Bot API | `https://ltdfoto.ru/images/2026/05/19/AVATARKA-DLY-SAITA-20-MAY-2026.png` | Client says “Собственный проект”; solutions claim API/auth refactoring, Prisma, Docker deploy | Production API; local repository `kiruhak11/kiruhak`; README; local Git history |
| KES — КотлоЭнергоСнаб / `cmewb3qvv0003o11ge17zb005` | `https://kes-sib.ru` | `https://github.ru/kiruhak11/kes` | Official industrial boiler-equipment catalogue and request site | Vue.js, Nuxt 3, Node.js, Telegram Bot, Supabase, Docker, Nginx | `https://ltdfoto.ru/images/2026/05/19/AVATARKA-DLY-SAITA.png` | Client identifies KES; solutions claim SSR, Prisma, catalog filters, validation and Telegram | Production API/site; local `../kes` repository and history |
| Расписание миксеров Adalin / `cmewb3qw10005o11gpf3x0vtn` | `https://github.com/kiruhak11/mixers` (same value as repo field; not a production site) | `https://github.com/kiruhak11/mixers` (GitHub API 404 at audit) | Rotation schedule for industrial mixers with current/future views and PDF export | Nuxt 3, Vue 3, TypeScript, SCSS, jsPDF, jsPDF-AutoTable, Progress Kendo Font Icons | `https://ltdfoto.ru/images/2026/05/19/AVATARKA-DLY-SAITA-20-MAY-2026-2.png` | Client says Adalin; solutions claim rotation algorithm, PDF font support, reusable components | Production API; linked repo unavailable; stale seed mentions a similarly named domain but does not establish this record's live URL |
| okna-brn.ru / `cmm7z9yya0003o3013vri6scs` | `https://okna-brn.ru` | `https://github.com/kiruhak11/okna` | Barnaul window repair master's service site with prices, contacts and lead form | Nuxt 4, Vue 3, TypeScript, SCSS, Node.js, Telegram Bot API | `https://ltdfoto.ru/images/2026/05/19/AVATARKA-DLY-SAITA-20-MAY-2026-1.png` | Client identifies a private window-repair master; description/solutions claim site, form API, Telegram and SEO feeds | Production API/site; local `../okna` repo, README, source and Git history |
| Lexid Shop / `cmqun63t30000me01yu4r2iax` | `https://github.com/kiruhak11/lexid` (not production; GitHub API 404) | `https://github.com/kiruhak11/lexid` (GitHub API 404) | E-commerce platform description claims catalog, cart, account, cases, chat, push and admin | Vue.js, Nuxt, TypeScript, SCSS, Prisma, PostgreSQL, Docker, YooKassa, Web Push, PWA, Sharp, WebP, Vitest | `https://github.com/kiruhak11/lexid` (repository URL, not an image) | Client says Lexid Shop; description and solutions claim broad full-stack implementation | Production API; linked repo unavailable; `lexid.shop` returned 403 to this audit request, so no project mapping inferred |
| OVERHEAT / `cmowkh9cv0002qp014udt4cdl` | `https://github.com/kiruhak11/OVERHEAT` (not production; GitHub API 404) | `https://github.com/kiruhak11/OVERHEAT` (GitHub API 404) | Game pre-launch promo site description claims release funnel, pages and effects | Nuxt 4, Vue 3, TypeScript, SCSS, Vue Router | `https://ltdfoto.ru/images/2026/05/19/AVATARKA-DLY-SAITA-1.png` | Client says “Собственный проект (OVERHEAT Team)”; description says “Разработал”; solutions claim funnel, UI and animation | Production API; linked repo unavailable |
| Проф Ремонт Квартир / `cmowkemul0001qp01741xqdo9` | `https://remdom22.ru` | `https://github.com/kiruhak11/remdom` (GitHub API 404) | Multi-page local construction/renovation company website | Nuxt 4, Vue 3, TypeScript, SCSS, Nitro, Nodemailer | `https://ltdfoto.ru/images/2026/05/19/AVATARKA-DLY-SAITA-20-MAY-2026-4.png` | Description says developed/launched; solutions claim page, API, gallery and SEO work | Production API/site; linked repository unavailable |
| MALINA / `cmmth95p90000qp017bjtfbkt` | `https://malina14.ru` | `https://github.com/kiruhak11/malina` | Dessert-brand site with catalogue, gallery, orders, reviews and admin | Nuxt 4, Vue 3, TypeScript, Prisma, PostgreSQL, Docker, Telegram Bot API, HTML, CSS | `https://ltdfoto.ru/images/2026/05/19/AVATARKA-DLY-SAITA-2.png` | Client identifies private dessert brand; solutions claim auth/session, DB/env, upload storage and mobile header | Production API/site; public GitHub README/tree/history |

The full `description` and `shortDescription` strings are exactly the database fields in the production API snapshot used for this audit; the table's product-description column is a concise inventory summary. No explicit slug field exists in the current Prisma model; IDs above are the stable runtime identifiers.

### Production API descriptions (verbatim snapshot)

- **K-Studio** — “K-Studio — многостраничная веб‑платформа на Nuxt 3 для презентации услуг и кейсов, сбора заявок и публикации экспертного контента. Проект включает публичные разделы (проекты, материалы, туториалы, контакты), административную часть для управления контентом, API на серверной части Nuxt, интеграцию с Telegram-ботом, аналитику посещений, работу с PostgreSQL через Prisma и Docker‑деплой. Также реализованы интерактивные UI‑модули, фильтрация контента, система рейтингов/скачиваний материалов и базовые механики авторизации.” Short: “Корпоративный сайт и веб‑платформа студии разработки с портфолио, контентом, личными кабинетами и интеграцией с Telegram.”
- **KES** — “Современный корпоративный сайт для котельного завода в Барнауле, специализирующегося на производстве и поставке котельного оборудования. Сайт представляет полный каталог продукции (водогрейные и паровые котлы, модульные котельные, теплообменники, дымососы, вентиляторы) с детальными характеристиками, сертификатами и возможностью заказа.” Short: “Официальный сайт котельного завода \"КотлоЭнергоСнаб\" (КЭС)”
- **Расписание миксеров Adalin** — “Система автоматического планирования работы промышленных миксеров (561, 205, 206, 207) с циклическим ротационным алгоритмом. Приложение предоставляет два режима просмотра: фактическое расписание (текущий период) и полное расписание (на 2 месяца вперед). Включает функцию генерации PDF-отчетов с кастомным шрифтом для корректного отображения кириллицы. Система автоматически рассчитывает смены миксеров на основе фиксированной начальной даты (1 января 2024) и применяет алгоритм ротации, где последний миксер в списке перемещается на первое место каждый день.” Short: “Веб-приложение для управления и отображения расписания работы миксеров с возможностью экспорта в PDF”
- **okna-brn.ru** — “Коммерческий сайт для частного мастера по ремонту и обслуживанию окон в Барнауле. Реализованы блоки услуг с ценами и иконками, преимущества, CTA на звонок, быстрые контакты (2 телефона и WhatsApp), форма заявки с серверным API и уведомлениями в Telegram, SEO-файлы (robots/sitemap), а также XML-фиды для сервисов Яндекса. Проект собран на Nuxt 4/Vue 3 и подготовлен к деплою на хостинг.” Short: “Одностраничный сайт услуг оконного мастера в Барнауле с перечнем услуг, ценами, контактами и формой заявки.”
- **Lexid Shop** — “Lexid Shop — e-commerce платформа для продажи техники, одежды, обуви и аксессуаров. В проекте реализованы каталог с категориями и подкатегориями, карточки товаров с галереями, корзина, оформление заказов, бонусный баланс, кейсы с шансами выпадения товаров, чат поддержки, push-уведомления и расширенная административная панель. Отдельное внимание уделено адаптивному интерфейсу, оптимизации изображений в WebP, PWA-установке, продакшн-деплою через Docker и стабильной работе на сервере.” Short: “Премиальный интернет-магазин с каталогом товаров, кейсами, корзиной, личным кабинетом, админ-панелью, поддержкой, оплатой и PWA-функциями.”
- **OVERHEAT** — “Разработал многостраничный промо-сайт для игры OVERHEAT (этап анонса/MVP). Сайт решает задачи раннего маркетинга: объясняет уникальную механику перегрева, показывает roadmap и контент релиза, ведет пользователя к целевым действиям (скачать демо, перейти в Telegram, оставить интерес к плейтесту). В проекте реализованы адаптивный интерфейс, анимированный фон, scroll-reveal эффекты, SEO-метаданные и отдельные страницы с матрицей сборок, системными требованиями и контакт-хабом.” Short: “Имиджевый и конверсионный сайт для pre-launch игры OVERHEAT: презентация core loop, сбор аудитории и переходы в демо/Telegram.”
- **Проф Ремонт Квартир** — “Разработал и запустил сайт для компании по ремонту и строительству в Барнауле. Реализовал структуру из нескольких страниц (главная, услуги, кейсы, о компании, строительство), динамические карточки проектов, галерею выполненных работ, SEO-оптимизацию (meta/canonical), а также серверную обработку заявок с отправкой на email через SMTP. Дополнительно настроил сервисные XML-фиды и адаптивную верстку для мобильных устройств.” Short: “Многостраничный сайт строительной компании с услугами, кейсами, галереей и формой заявок.”
- **MALINA** — “Разработан production-сайт для бренда «МАЛИНА»: каталог десертов с разделением по категориям, карточки и модальные окна, галерея, формы заявок и отзывов, админ-панель для управления контентом, интеграция с Telegram для уведомлений и модерации. Реализованы SEO-настройки (meta, robots, sitemap), улучшен мобильный UX и стабилизирована работа загрузки изображений в Docker-окружении.” Short: “Адаптивный сайт для кондитерского бренда с каталогом, галереей, заявками и админ-панелью.”

### Other discovered sources

- `prisma/schema.prisma` has a legacy `Project` model with product copy, links and an unstructured `results` string, but no ownership, role, responsibilities, or evidence fields. No local `DATABASE_URL` was available, so the live DB could not be inspected directly; the production public API was used as the runtime snapshot.
- `prisma/seed.ts` is not current production content. It contains four different demo records: KES, AirPods Store, Mixer Timetable, and DevHorizon. The script starts by deleting projects and other records. It was not run. These records have no evidence-backed case metadata and therefore fail closed as `UNVERIFIED` if returned by a database in future.
- The requested `kiruhak11/pockerdeeler` repository is available locally and on GitHub, but no current portfolio record matches it by repository URL, product/domain, README, or code/product structure. It was not added as a portfolio project merely because it belongs to the same GitHub account.
- `components/InteractiveGallery.vue` is currently unreferenced. Its error fallback contains “K-Studio” plus generic “Проект 2/3/4” placeholders. These are not production projects and were not counted as current public cards.
- Other static project copy was not found on mounted public pages. Admin project CRUD is private and is not a visitor-facing project listing.
- All seven `ltdfoto.ru` project images returned HTTP 200. Lexid's `image` field points to its unavailable GitHub repository rather than an image; the shared preview component rejects repository URLs, so the card uses its image fallback.

## Evidence by project

### K-Studio — `OWN`

**Evidence**

- The current local repository remote is `https://github.com/kiruhak11/kiruhak`; the deployed site links to this exact production domain. The production card had mistakenly linked to the GitHub profile instead of the repository.
- The repository README calls it a personal portfolio and working platform and documents its features and stack. See [repository README](https://github.com/kiruhak11/kiruhak/blob/master/README.md).
- Local shortlog before this change: 65 commits by `kiruhak-MAC <kiruhak1991@gmail.com>` and 11 by `kiruhak <kiruhak1991@gmail.com>` (same email), plus 2 by `kiruhak-home <kiruhak2005@gmail.com>` and 2 by Rubillex. GitHub's public contributor endpoint lists `kiruhak11` as the dominant contributor (73) and `kiruhak` (2). This is strong primary-developer evidence, not proof that every line or idea is exclusively his.
- README and code confirm Nuxt/Vue/TypeScript UI, Nitro API, Prisma/PostgreSQL, Telegram integration, Docker and Nginx deployment.

**Verified role**: Primary developer of the personal portfolio/platform. The specific full-stack areas listed in public metadata are present in this repository.

**Unverified**: Exclusive authorship of every design decision, content, and line of code; business outcomes.

**Classification / confidence**: `OWN` / `HIGH`.

**Public wording**: “Основной разработчик”; show this under “Мои проекты”.

### KES — `PARTICIPATION`

**Evidence**

- The live site and local repository both identify KотлоЭнергоСнаб: `kes-sib.ru` is configured in the repository and the site identifies the company. Local `../kes` has 198 commits attributed to `kiruhak-MAC`, 74 to `kiruhak11`, and 14 to `kiruhak` (all using `kiruhak1991@gmail.com`), with a small number of commits from Rubillex and kraizer. GitHub's contributor API reports 198 contributions by `kiruhak11` and 2 each by Rubillex and kraizer.
- The repository contains Nuxt pages, product/catalog API routes, `server/api/contact.post.ts`, Telegram notification route, and `prisma/schema.prisma`. Its schema provider is MySQL, not Supabase. Project/domain matching is confirmed by page copy, contacts, SEO host configuration and structured data.
- See [KES repository](https://github.com/kiruhak11/kes), [published schema](https://github.com/kiruhak11/kes/blob/master/prisma/schema.prisma), and the read-only local checkout adjacent to this workspace (available during the audit).

**Verified role**: Web-site developer; work in the linked codebase covers Nuxt pages, catalogue/API, request handling, Prisma/MySQL and Telegram notification integration.

**Unverified**: Product/business authorship, all design, the exact scope of other contributors, and business results. The company is the product owner/context; do not present its whole operation as Kirill's own product.

**Classification / confidence**: `PARTICIPATION` / `HIGH` for code contribution and external company context.

**Public wording**: “Разработчик веб-сайта”; “Участие в проектах”. Stack omits the legacy, conflicting Supabase claim.

### okna-brn.ru — `PARTICIPATION`

**Evidence**

- Production site and repository README name the window-repair master's service. Repository Nuxt configuration and page data correspond to the public domain/product.
- Local `../okna` history has 24 commits by `kiruhak-MAC <kiruhak1991@gmail.com>` and 1 by Rubillex. The repository contains the Nuxt 4/Vue 3 site, central `app/data.ts`, a server contact endpoint with validation and Telegram notifications, and XML/service SEO routes.
- See [repository README](https://github.com/kiruhak11/okna/blob/master/README.md) and [repository](https://github.com/kiruhak11/okna).

**Verified role**: Website developer; public metadata lists the site/page, server-side contact form and technical SEO feed work.

**Unverified**: Ownership of the master's business, design authorship, any results, and whether other people contributed outside repository history.

**Classification / confidence**: `PARTICIPATION` / `HIGH`.

**Public wording**: “Разработчик веб-сайта”; “Проект компании: частный мастер по ремонту окон”.

### MALINA — `PARTICIPATION`

**Evidence**

- Production domain is configured in the public repository README; README describes the matching dessert brand/product and documents PostgreSQL + Prisma, catalog/admin APIs, Telegram moderation and a separate bot service. The repository tree contains these server endpoints and `bot/index.mjs`.
- GitHub public metadata currently reports 20 contributions by `kiruhak11` and no other listed contributors. This supports the code contribution but does not establish exclusive authorship or product ownership.
- See [MALINA README](https://github.com/kiruhak11/malina/blob/master/README.md), [repository](https://github.com/kiruhak11/malina), and its public [commit history](https://github.com/kiruhak11/malina/commits/master/).

**Verified role**: Full-stack implementation work in the linked site repository, including catalogue/admin API and Telegram bot paths.

**Unverified**: Product/brand authorship, design, exact contribution boundaries outside repository history, and business outcomes.

**Classification / confidence**: `PARTICIPATION` / `HIGH` for repository contribution and external brand context.

**Public wording**: “Fullstack-разработчик”; “Участие в проектах”.

### Расписание миксеров Adalin — `UNVERIFIED`

**Evidence**: The production API's project description and client field are self-published claims. Its GitHub repository URL now returns 404; the API uses that same GitHub URL as `liveUrl`, so there is no independent production link in the record. A similarly named domain in the obsolete seed is insufficient to map it to this current record.

**Verified role**: None from accessible independent source/code.

**Unverified**: Product mapping, ownership, role, rotation/PDF implementation claims, repository history and production link.

**Classification / confidence**: `UNVERIFIED` / `LOW`.

**Public wording**: Product summary only in a separate “уточняю сведения о роли и вкладе” list; no role, contribution, stack or GitHub CTA.

### Lexid Shop — `UNVERIFIED`

**Evidence**: The repository API returns 404; both `liveUrl` and `githubUrl` point to that unavailable repository, and the image field is also a repository URL rather than an image. `lexid.shop` returned HTTP 403 to this audit request, which does not establish that it is this record's production URL.

**Verified role**: None from accessible independent source/code.

**Unverified**: Product mapping/availability, ownership, all listed e-commerce features and stack, role, and repository history.

**Classification / confidence**: `UNVERIFIED` / `LOW`.

**Public wording**: Product summary only in the neutral review list; no category label, stack, contribution or broken link.

### OVERHEAT — `UNVERIFIED`

**Evidence**: Repository API returns 404. Both `liveUrl` and `githubUrl` are the unavailable repository. No accessible linked source or production URL was found during the audit.

**Verified role**: None from accessible independent source/code.

**Unverified**: Product/team ownership, Kirill's role and the promo-site implementation claims, repository history, and production availability.

**Classification / confidence**: `UNVERIFIED` / `LOW`.

**Public wording**: Product summary only in the neutral review list; no “own project” wording.

### Проф Ремонт Квартир — `UNVERIFIED`

**Evidence**: `remdom22.ru` responds and identifies a construction/renovation product; linked GitHub repository returns 404. Production response does not establish who implemented the site, so the DB's “Разработал и запустил” text is not treated as independent contribution evidence.

**Verified role**: None from accessible code/history.

**Unverified**: Kirill's site implementation, role, source history and business outcomes.

**Classification / confidence**: `UNVERIFIED` / `LOW`.

**Public wording**: Product summary and working production URL only, in the neutral review list.

## Data model and source of truth

The legacy Prisma project schema is unchanged; no migration is appropriate yet. Case-specific public metadata now has one typed source of truth in `constants/project-case-studies.ts`, keyed by stable production project IDs. It stores `ownershipType` (`OWN | PARTICIPATION | UNVERIFIED`), summary, optional role/company, responsibilities, technical highlights, reviewed technologies, and reviewed links. Both project collection and single-project public reads project that metadata onto existing DB rows and suppress unreviewed claims, results, costs, duration, client strings, and dead/misclassified URLs. Internal evidence/confidence is kept in this document only and is not returned by the project APIs.

Unknown or newly seeded project IDs get a fail-closed `UNVERIFIED` public view. The production DB remains the source for ordering, category, image and record identity; curated case facts/classification are code-reviewed metadata until evidence volume justifies a database-backed editor. Seeds remain unrelated demo data and should not be run against production.

After recording the before-state inventory above, the unused `InteractiveGallery` error fallback was removed; it no longer contains generic placeholder projects.

## Current classifications

- `OWN`: K-Studio.
- `PARTICIPATION`: KES, okna-brn.ru, MALINA.
- `UNVERIFIED`: Расписание миксеров Adalin, Lexid Shop, OVERHEAT, Проф Ремонт Квартир.

There is sufficient evidence for both tabs, so `/projects` can expose “Мои проекты” and “Участие в проектах”. Unverified projects remain in a distinct neutral, collapsed area and are not mislabeled. Homepage featured cards now filter out unverified projects and require a reviewed production URL; this leaves K-Studio, KES and OKNA from the current order.

## Follow-up questions that evidence cannot answer

To reclassify the four unverified projects, provide a restored/public repository, the exact production URL, or a concise confirmation of Kirill's role and scope. Evidence does not currently justify adding dates, NDA statements, KPI outcomes, visual-design authorship, or other teammates' responsibilities.
