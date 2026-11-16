# K-STUDIO — API SECURITY P0 / FAIL-CLOSED AUTHORIZATION

**Release:** `api-fail-closed-20261115`
**Date:** 2026-11-15
**Site:** https://kiruhak11.ru
**Host:** VPS Jino (`jino-main`, `edc78826a428.vps.myjino.ru`)

---

## 1. Контекст восстановления

Локальный checkout K-Studio на машине разработчика **утрачен**: iCloud Drive
вытеснил содержимое каталогов `~/Documents/kiruhak` и
`~/Documents/kiruhak-release-candidates`, оставив только пустые каталоги
(единственный уцелевший файл — пустой `assets/styles/global/_load-fonts.scss`,
0 байт). Git-объекты, `HEAD`, `refs` и все worktree-метаданные также удалены.

Восстановление выполнено из трёх независимых источников:

| Источник | Что дал |
| --- | --- |
| `https://github.com/kiruhak11/kiruhak` (публичный) | Чистая официальная линия до `4256f5f` (2026-10-08) — основа кандидата |
| Скомпилированный production-образ `kiruhak-app:materials-privacy-20261109` | 183 sourcemap → точный перечень исходных модулей production, логика всех 24 утраченных файлов, canonical CSS юридических страниц |
| Живой production + PostgreSQL | Фактическое поведение, инварианты БД, механизм деплоя |

Production-образ копировался с VPS; его `.output` использован как «оракул»
поведения при восстановлении.

---

## 2. Production baseline (до релиза)

| Параметр | Значение |
| --- | --- |
| Контейнер | `kiruhak_app` (healthy, up 3 days) |
| Образ | `kiruhak-app:materials-privacy-20261109` |
| Image ID | `7d14f643c90a` |
| Источник образа | `/var/lib/kiruhak/materials-privacy-20261109-linux-amd64.tar` |
| Source snapshot label | `sha256:f50c0aa3ec27df294faa7771ea5914e0d9842c824dbf66ec3dcc2bff911c7817` |
| VCS ref label | `a1c6e19` |
| Compose-проект | `kiruhak` |
| Compose-файлы | `/var/www/html/kiruhak/docker-compose.prod.yml` + `app-secrets.override.yml` + `materials-privacy-20261109.yml` |
| Порт | `127.0.0.1:3015` (наружу отдаёт nginx) |
| PostgreSQL | `kiruhak_postgres` (postgres:15-alpine) — не трогаем |

### Инварианты PostgreSQL (зафиксированы до релиза)

```
users=5 projects=10 materials=3 migrations=14 tables=21
lead_deliveries=5 telegram_login_tx=1 revoked_sessions=1 session_controls=1
schema checksum = ae9ec9409d0d01de0b31f793d668e7b1
last migration  = 2026-10-22 06:35:25.687579+00
```

---

## 3. Подтверждённый дефект (P0)

### 3.1 Fail-open авторизация — ПОДТВЕРЖДЕНО В PRODUCTION

Скомпилированный production-bundle (`nitro.mjs`) содержит:

```js
const needsAuth = isAuthenticatedRoute(path, method) || isAdminRoute(path, method);
if (!needsAuth) return;   // любой неизвестный /api/** проходит без проверки
```

То есть новый endpoint, не добавленный в политику, автоматически становился
публичным. Политика production перечисляет только «известные» маршруты; всё
остальное — fail-open.

### 3.2 Проверка секрета бота, зависящая от NODE_ENV — ПОДТВЕРЖДЕНО

Исходный код GitHub master:

```ts
const isDev = process.env.NODE_ENV !== "production";
if (!isDev) { /* проверка x-bot-secret */ }
```

В production-артефакте видно `const isDev = false;` — **rollup подставляет
`process.env.NODE_ENV` на этапе сборки**. Значит:

* образ, собранный с `NODE_ENV != production` в builder-стадии, **полностью
  компилирует проверку секрета**, и `/api/bot/quick-login` выдаёт токен входа
  по произвольному Telegram ID без авторизации;
* builder-стадия Dockerfile **не** задаёт `NODE_ENV=production` — то есть
  пересборка образа «как есть» тихо снимала защиту.

Production-образ был собран в production-режиме, поэтому в текущем контейнере
дефект не проявлялся — но исходный код и процесс сборки были уязвимы.

---

## 4. Изменения релиза

### 4.1 Fail-closed политика маршрутов (новое)

`server/utils/auth-route-policy.ts` переписан в табличную форму с учётом
HTTP-метода:

* `public` — без авторизации;
* `user` — Bearer-токен пользователя;
* `admin` — Bearer-токен администратора;
* `bot` — служебный API бота, требует `x-bot-secret`;
* `method-not-allowed` — путь известен, метод не разрешён → 405;
* `unknown` — путь не описан → **запрос отклоняется (404)**, обработчик не
  запускается.

`server/middleware/auth.ts` переписан: неизвестный `/api/**` отклоняется по
умолчанию, CORS preflight (`OPTIONS`) пропускается, служебные bot-маршруты
проверяются по секрету, административные — по `user.isAdmin`.

### 4.2 Секрет бота больше не зависит от окружения

* новый модуль `server/utils/bot-secret.ts` — сравнение в постоянном времени,
  отсутствие настроенного секрета **запрещает** действие;
* `server/api/bot/{quick-login,topup,change-password,logout-all}.post.ts`,
  `server/api/auth/create-account.post.ts`,
  `server/api/ui-components/[id]/bot-moderate.post.ts` — проверка секрета
  выполняется **всегда**, безусловно;
* `NODE_ENV` используется только для отладочного логирования, никогда — для
  авторизации;
* Dockerfile: builder-стадия получила `ENV NODE_ENV=production`, поэтому
  неправильная конфигурация сборки больше не может снять защиту.

### 4.3 Восстановленные модули production

24 файла, отсутствовавшие в публичном репозитории, восстановлены из
скомпилированного production-артефакта без изменения поведения:

`server/utils/{optional-user,material-public,lead-delivery,lead-notification,
telegram-config,telegram-http,telegram-login,telegram-login-oidc,telegram-oidc}.ts`,
`server/api/auth/{logout.post.ts,recovery/*,telegram-login/*}`,
`server/plugins/{lead-delivery-worker,recovery-security-headers}.ts`,
`constants/legal-config.ts`, `middleware/legal-publication.ts`,
`pages/legal/{index,[slug]}.vue`, `pages/account/recovery.vue`.

Также перенесены изменения production относительно публичного master:
`server/utils/{auth-token,session-control}.ts` (идентификатор сессии `jti`,
точечный отзыв сессии через `auth_revoked_sessions`), схема Prisma и 5 миграций,
уже применённых в production, и контракт формы заявки.

### 4.4 Materials Privacy — сохранено

Публичные ответы `/api/materials` и `/api/materials/:id` по-прежнему
формируются allowlist-DTO (`MATERIAL_PUBLIC_SELECT`): без `userId`, без
сырых `ratings`/`downloads`, с агрегированными `avgRating`/`ratingCount`/
`downloadCount` и `userRating` только для авторизованного владельца,
`Cache-Control: no-store`, корректные HTTP-статусы ошибок.

---

## 5. Проверки

Все проверки выполнены на VPS (x86_64, тот же целевой архитектуры, что и
production) в контейнере `node:22-alpine` с тем же `node_modules`, что и сборка
образа.

### 5.1 Автотесты — PASS

| Набор | Тестов | Passed | Failed | Примечание |
| --- | --- | --- | --- | --- |
| `npm run test:security` | 12 | 12 | 0 | fail-closed политика, полнота покрытия маршрутов, секрет бота |
| `npm run test:telegram` | 7 | 7 | 0 | конфиг секретов, allow-list Telegram-эндпоинтов |
| `npm run test:telegram-login` | 12 | 12 | 0 | режимы owner_canary/public/disabled, OIDC-подпись, nonce, JWKS |
| `npm run test:lead` | 6 | 6 | 0 | валидация заявки, fingerprint, лимиты |
| `npm run test:public` | 20 | 20 | 0 | публичное поведение (без изменений) |
| `npm run test:session-revocation` | 1 | 1 | 0 | **интеграционный**, изолированная PostgreSQL, синтетические данные |

Итого **58 тестов, 58 passed, 0 failed**.

Интеграционный тест отзыва сессий выполнен на одноразовом контейнере
`postgres:15-alpine` (`ops/run-session-revocation-integration.sh`): схема
создаётся через `prisma db push` в изолированной базе, данные — синтетические,
база удаляется после прогона. **Production-БД не затрагивалась.**

### 5.2 Линтер — PASS

* `npm run lint:portfolio` — 0 ошибок;
* `npm run lint:admin` — 0 ошибок.

### 5.3 Typecheck — PASS (ниже исторического baseline)

| | Ошибок `error TS` |
| --- | --- |
| GitHub master `4256f5f` (исторический baseline) | 216 |
| Кандидат `api-fail-closed-20261115` | **211** |

Кандидат содержит **на 5 ошибок меньше**, чем upstream baseline: ошибки в
изменённых файлах устранены. Ни одна из оставшихся ошибок не вносилась этим
релизом — все они находятся в файлах, побайтово совпадающих с GitHub master
(`pages/materials.vue`, `pages/tutorials.vue`, `composables/useProjects.ts`,
`server/api/user/me.put.ts` и др. — это зафиксированный в репозитории долг
`docs/typescript-debt.md`).

### 5.4 Сборка — PASS

`npm run build` (Nuxt 3 / Nitro) — успешно, `.output` 6.52 MB (1.72 MB gzip).

### 5.5 Parity API-поверхности — PASS

Сравнение манифеста маршрутов скомпилированного кандидата и production:

```
candidate routes: 56   production routes: 56
only in production: NONE
only in candidate : NONE
```

Ни один маршрут не потерян и не добавлен. Кандидат выставляет ровно ту же
API-поверхность, что и работающий production.

### 5.6 Инвентаризация исходников — PASS

Сравнение со списком исходных модулей, извлечённым из sourcemap production:

* отсутствует только `server/error.ts` — в production он был **вырезан
  tree-shaking'ом** (0 сгенерированных строк в `nitro.mjs.map`), поэтому его
  отсутствие в кандидате не влияет на поведение;
* `pages/legal/index.vue` и `pages/legal/[slug].vue` восстановлены;
* дополнительно присутствуют 40 неиспользуемых компонентов из GitHub master
  (например `OrderModal.vue`, `DiscountContactModal.vue`) — Nuxt вырезает их из
  сборки, в production они тоже не компилировались. `OrderModal` в production
  обращается к устаревшему контракту `/api/telegram` и недостижим — это
  совпадает с production, изменений не вносилось.

---

## 6. Деплой

### 6.1 Идентичность релиза

| Параметр | Значение |
| --- | --- |
| Релиз | `api-fail-closed-20261115` |
| Кандидат (source) | `/Users/kirill/Documents/kiruhak-release-candidates/api-fail-closed-20261115` |
| Коммит кандидата | `584e7743a518380cfc695dbfbed5a83113737909` |
| Source snapshot sha256 | `a2033bf9ba85e2d92e895ebac2e4938f4bb57f82415c0fea3015eab6caaa3a8e` |
| Образ | `kiruhak-app:api-fail-closed-20261115` |
| Image ID | `sha256:245d1e23bcbda156ab70d9807a902887ad60b257977f72c333317e8012bf745b` |
| Platform | `linux/amd64` |
| Base | `node:22-alpine` (Alpine 3.24.4, Node 22.23.4) |
| Prisma engine | `libquery_engine-linux-musl-openssl-3.0.x.so.node` |
| Runtime user | `nuxtjs` (uid 1001), не root |
| Артефакт | `/var/lib/kiruhak/api-fail-closed-20261115-linux-amd64.tar.gz` (108 564 427 B) |
| Override | `/var/lib/kiruhak/release-overrides/api-fail-closed-20261115.yml` |
| Checkpoint | `/var/lib/kiruhak/rollback-checkpoints/api-fail-closed-20261115-20261115T161425Z.txt` |

Label `org.kstudio.source.snapshot.sha256` в собранном образе совпадает с
вычисленным source snapshot — подтверждено на этапе сборки.

### 6.2 Команда деплоя

```bash
cd /var/www/html/kiruhak && docker compose -p kiruhak \
  -f docker-compose.prod.yml \
  -f /var/lib/kiruhak/release-overrides/app-secrets.override.yml \
  -f /var/lib/kiruhak/release-overrides/api-fail-closed-20261115.yml \
  up -d --no-deps --force-recreate app
```

Затронут **только** сервис `app`. PostgreSQL, бот, nginx, DNS и все соседние
проекты на VPS не трогались (`--no-deps`, пересоздан только контейнер
`kiruhak_app`).

Время деплоя: `2026-11-15T19:14:25+03:00`. Контейнер стал `healthy` через
31 секунду.

### 6.3 Post-deploy smoke + security verification — PASS (30/30)

`ops/verify-production.sh` против `https://kiruhak11.ru`:

```
-- public pages --
  PASS  GET /                                200
  PASS  GET /projects                        200
  PASS  GET /contact                         200
  PASS  GET /legal                           200
  PASS  GET /legal/privacy                   200
  PASS  GET /materials                       200
  PASS  GET /login                           200
  PASS  GET /account/recovery                200

-- public API --
  PASS  GET /api/health                      200
  PASS  GET /api/projects                    200
  PASS  GET /api/materials                   200

-- fail-closed authorization --
  PASS  GET /api/does-not-exist (unknown route denied)       404
  PASS  GET /api/admin/projects without token                401
  PASS  GET /api/user/me without token                       401
  PASS  POST /api/brief without token                        401
  PASS  GET /api/analytics/stats without token               401

-- invalid token rejected --
  PASS  GET /api/user/me with garbage token                  401

-- bot endpoints require the service secret --
  PASS  POST /api/bot/quick-login without secret             403
  PASS  POST /api/bot/quick-login with wrong secret          403
  PASS  POST /api/auth/create-account without secret         403

-- materials privacy (no userId / no raw relations) --
  PASS  public materials response has no userId              clean
  PASS  public materials response has no ratings rows         clean
  PASS  public materials response has no downloads rows       clean
  PASS  aggregated field present: avgRating                  ok
  PASS  aggregated field present: ratingCount                ok
  PASS  aggregated field present: downloadCount              ok
  PASS  aggregated field present: userRating                 ok
  PASS  GET /api/materials Cache-Control is no-store         no-store

-- CORS preflight still allowed --
  PASS  OPTIONS /api/brief (preflight)                       204

-- lead endpoint contract (no side effects) --
  PASS  POST /api/telegram without idempotency key           400

=== RESULT: pass=30 fail=0 ===
```

### 6.4 Состояние PostgreSQL — НЕ ИЗМЕНЕНО

| Инвариант | До релиза | После релиза | |
| --- | --- | --- | --- |
| users | 5 | 5 | = |
| projects | 10 | 10 | = |
| materials | 3 | 3 | = |
| migrations | 14 | 14 | = |
| tables | 21 | 21 | = |
| lead_deliveries | 5 | 5 | = |
| telegram_login_transactions | 1 | 1 | = |
| auth_revoked_sessions | 1 | 1 | = |
| auth_session_controls | 1 | 1 | = |
| schema checksum | `ae9ec9409d0d01de0b31f793d668e7b1` | `ae9ec9409d0d01de0b31f793d668e7b1` | = |
| max(finished_at) миграций | `2026-10-22 06:35:25.687579+00` | `2026-10-22 06:35:25.687579+00` | = |

Ни одной миграции не запускалось, `prisma db push` не выполнялся, схема не
менялась.

### 6.5 Стабильность

* Новых записей в `access.log` после деплоя: 1504, из них **0 ответов 5xx**.
* Лог контейнера: без ошибок (`Listening on http://[::]:3015`).
* Единственные 404 — фоновый интернет-сканер (`/wp-admin/install.php`,
  `/.git/config`, `/.env` …) с одного IP `81.177.135.137`; такой же трафик
  фиксировался до релиза.
* 403 на `/` — блокировка того же враждебного клиента на уровне nginx
  (историческое поведение; обычные запросы получают 200).

### 6.6 Соседние проекты — НЕ ЗАТРОНУТЫ

`pockerdeeler-app-1`, `pockerdeeler-pgbouncer-1`, `pockerdeeler-postgres-1`,
`pockerdeeler-redis-1`, `kiruhak_bot`, `kiruhak_postgres`, `fleetcontrol-crm-*`,
`carfix-*`, `okna-app`, `malina-*` — все работают с прежними образами и
временем запуска. Pocker не затронут.

### 6.7 Telegram Login owner_canary

```
GET /api/auth/telegram-login/status  ->  {"enabled":true,"ownerCanary":true}
```

Страница `/login` содержит кнопку Telegram Login (`telegram-button`),
подключён официальный SDK `https://oauth.telegram.org/js/telegram-login.js?6`.

---

## 7. Rollback

### 7.1 Готовность — READY

Откат выполняется одной командой (файл уже создан, образ на месте):

```bash
cd /var/www/html/kiruhak && docker compose -p kiruhak \
  -f docker-compose.prod.yml \
  -f /var/lib/kiruhak/release-overrides/app-secrets.override.yml \
  -f /var/lib/kiruhak/release-overrides/materials-privacy-20261109.yml \
  up -d --no-deps --force-recreate app
```

| | |
| --- | --- |
| Целевой образ отката | `kiruhak-app:materials-privacy-20261109` |
| Image ID | `sha256:7d14f643c90a22a2fa93dfe38e6210b85696a0417fe2714862b90ce4100f4b13` |
| Что возвращается | текущий production: Materials Privacy, Lead Delivery, Telegram Login owner_canary |
| Что теряется | исправление fail-closed авторизации и защиты bot-секрета (P0) |
| Влияние на БД | нет — миграций нет, схема не менялась |

Откат безопасен: целевой образ — это ровно тот, что работал в production до
этого релиза.

### 7.2 Альтернативный (не рекомендуется) откат

`kiruhak-app:audit-20261022` (`6c593b11e139`) и
`kiruhak-app:dependency-security-20261014` (`07ac426757a3`) вернут известную
утечку `/api/materials` — это security downgrade, поэтому они не
использовались.

### 7.3 Откат не применялся

Фактический откат не потребовался: release gate полностью PASS, post-deploy
верификация 30/30 PASS.

---

## 8. Оставшиеся задачи (по приоритету)

### P0 — закрыто этим релизом

* fail-open авторизация `/api/**` → fail-closed политика маршрутов;
* зависимость проверки bot-секрета от `NODE_ENV` (в т.ч. на этапе сборки);
* потеря локального checkout K-Studio (iCloud) — восстановлено из
  production-артефакта и публичного репозитория.

### P1 — отдельные релизы

1. **Вернуть историю в Git.** Кандидат собран из публичного `master`
   (`4256f5f`) плюс восстановленные модули. Нужно зафиксировать
   восстановленные файлы в `kiruhak11/kiruhak`, чтобы следующий релиз
   собирался из честной истории, а не из артефакта.
2. **Защита от повторной потери исходников.** Локальный checkout на iCloud —
   единственное место, где были незакоммиченные изменения. Нужен регулярный
   push/pack источников вне iCloud.
3. **DATA DELETION P1** (открытая задача из аудита 2026-11-09).
4. **Security headers и rate-limit.** Не закрыты (внешняя часть аудита).
5. **Устаревший контракт `/api/telegram` в `components/OrderModal.vue` и
   `components/DiscountContactModal.vue`.** Эти компоненты недостижимы ни в
   production, ни в кандидате (в production они тоже вырезаны tree-shaking'ом),
   поэтому поведение не изменено. При возврате компонентов в код контракт
   нужно перевести на новый (с `Idempotency-Key`).

### P2 — после стабилизации

6. **Визуальный polish.** Public-репозиторий отстаёт от production по
   front-end (дизайн 2026-10-14 → 2026-11-09 не был опубликован). Функционально
   кандидат покрывает production (API-поверхность совпадает 56/56), но часть
   визуальных изменений отсутствует.
7. **Страница `/api/health/db`.** Есть в `master`, отсутствует в production —
   сознательно не возвращалась, чтобы не расширять поверхность сверх production.
8. **`server/error.ts`.** Был в исходниках production, но вырезался
   tree-shaking'ом (0 строк в бандле) — в кандидате не восстанавливался.
9. **Устранение долга TypeScript.** 211 ошибок `error TS` (baseline 216).
   Затронуты `pages/materials.vue`, `pages/tutorials.vue`,
   `composables/useProjects.ts`, `server/api/user/me.put.ts` и др.
   См. `docs/typescript-debt.md`.

---

## 9. Восстановление окружения разработчика

Исходники K-Studio лежат в:

* `/Users/kirill/Documents/kiruhak-release-candidates/api-fail-closed-20261115` —
  релиз-кандидат (git-репозиторий, коммит `584e774`);
* `/Users/kirill/Documents/kiruhak/repo` — клон публичного `master`;
* `/Users/kirill/Documents/kiruhak/prod-artifact` — скомпилированный
  production-артефакт (использован как «оракул» поведения);
* `/Users/kirill/Documents/kiruhak/prod-ref` — выгрузка скомпилированных
  модулей production с привязкой к исходным путям.

Мёртвый iCloud-каталог
`~/Library/Mobile Documents/com~apple~CloudDocs/Documents/kiruhak` и
`…/kiruhak-release-candidates` **не восстановлен**: iCloud Drive на этой
машине не синхронизируется, файлы отсутствуют и в локальном виде, и в
кеше. Их можно удалить, чтобы не путать.

---

## 10. Артефакты релиза

| Файл | Назначение |
| --- | --- |
| `docs/history/DEPLOY_2026-11-15_API_SECURITY_P0.md` | этот отчёт |
| `ops/deploy-app.sh` | сборка образа, проверки, app-only деплой, checkpoint |
| `ops/verify-production.sh` | post-deploy smoke + security-проверки (30 проверок) |
| `ops/run-session-revocation-integration.sh` | интеграционный тест на изолированной PostgreSQL |
| `ops/release-overrides/api-fail-closed-20261115.yml` | release-override для compose |
| `server/utils/auth-route-policy.ts` | fail-closed политика маршрутов |
| `server/utils/bot-secret.ts` | проверка секрета бота |
| `tests/security.test.ts` | тесты fail-closed (в т.ч. полнота покрытия маршрутов) |
