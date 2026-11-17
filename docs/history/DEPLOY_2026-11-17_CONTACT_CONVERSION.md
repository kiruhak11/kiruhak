# K-STUDIO — CONTACT CONVERSION 2.0 (RELEASE + PRODUCTION DEPLOY)

**Release:** `contact-conversion-20261117`
**Date:** 2026-11-17
**Site:** https://kiruhak11.ru
**Host:** VPS Jino (`jino-main`)
**Статус:** `K-STUDIO CONTACT CONVERSION 2.0 — PRODUCTION VERIFIED`

---

## 1. Git

| Параметр | Значение |
| --- | --- |
| Ветка | `feat/contact-conversion` |
| PR | https://github.com/kiruhak11/kiruhak/pull/3 |
| Merge-коммит PR #3 | `28108e9da937266ec4391e38a607f2855e627138` |
| Тип merge | обычный merge-коммит (без squash, без force push) |
| `master` до merge | `3e37f97ae4b8b947a32da73f47fa6945c5c4ca95` |
| `master` после merge | `28108e9da937266ec4391e38a607f2855e627138` |
| Follow-up в master | `48eded5` — исправление проверки окружения в `ops/deploy-app.sh` (только tooling) |
| `master-2` | `31e6a9b117f3a50cd33d6f76e297cc7ec24d3b71` — не изменялся |

Коммиты ветки: `0e9de70` (форма и страница), `0b19154` (три исправления).

---

## 2. Артефакт

| Параметр | Значение |
| --- | --- |
| Образ | `kiruhak-app:contact-conversion-20261117` |
| Image ID | `sha256:ea540b9ff47dd8dbb080deb1408a285fb0b8d4f7e183c8c1e8024ad20948ac2b` |
| Платформа | `linux/amd64` |
| Source snapshot | `e6c0d6bf7944321829629ee71c33b31bec5373a9f8343f5378dc3f283dd20f60` |
| Коммит образа | `28108e9da937266ec4391e38a607f2855e627138` |
| Архив | `/var/lib/kiruhak/contact-conversion-20261117-linux-amd64.tar.gz` (108 648 649 B) |
| SHA-256 архива | `1196105ba1af019c06cbd5d096b49db08ff9e39e456736cb374024ec150da1ca` |

Образ собран из master (`28108e9`) и задеплоен без пересборки: процедура
загрузила готовый tar-артефакт и сверила image ID, платформу, source snapshot
и SHA-256 архива.

Коммит `48eded5` менял только `ops/` (инструмент деплоя) и не затрагивает
рантайм-код образа.

---

## 3. Production до и после

| Параметр | До | После |
| --- | --- | --- |
| Образ | `kiruhak-app:security-headers-rate-limit-20261117` | `kiruhak-app:contact-conversion-20261117` |
| Image ID | `sha256:3819f38f9ce9…` | `sha256:ea540b9ff47d…` |
| Health | healthy | healthy |
| Порт | `127.0.0.1:3015` | `127.0.0.1:3015` |
| PostgreSQL | `e11a23a24e784…` (up с 2026-10-02) | тот же id — не пересоздавался |
| Бот | `76a7893c6f8e…` (up с 2026-10-23) | тот же id — не пересоздавался |

Compose-файлы контейнера:

```
/var/www/html/kiruhak/docker-compose.prod.yml
/var/lib/kiruhak/release-overrides/app-secrets.override.yml
/var/lib/kiruhak/release-overrides/contact-conversion-20261117.yml
```

Rollback checkpoint:
`/var/lib/kiruhak/rollback-checkpoints/contact-conversion-20261117-20261117T145221Z.txt`

```
previous_image=kiruhak-app:security-headers-rate-limit-20261117
previous_image_id=sha256:3819f38f9ce9b72bc2c59a7fd2e168f211df5aa91743e76529be0bc8ed248534
rollback_command=cd /var/www/html/kiruhak && docker compose -p kiruhak -f docker-compose.prod.yml -f /var/lib/kiruhak/release-overrides/app-secrets.override.yml -f /var/lib/kiruhak/release-overrides/security-headers-rate-limit-20261117-rollback.yml up -d --no-deps --force-recreate app
db_invariants=5|10|14|21|3|1|1
```

Состояние релиза: `/var/lib/kiruhak/release-state/contact-conversion-20261117.state`
→ `state=VERIFIED`, `release_result=verified`, `health_result=healthy`.

---

## 4. Инварианты PostgreSQL (до и после — без изменений)

```
migrations=14 tables=21 users=5 projects=10 materials=3
lead_deliveries=5 visits=0 ui_component_views=0 revoked_sessions=1
```

Миграции не запускались, схема не менялась, реальные заявки не создавались.

---

## 5. Проверки

| Проверка | Результат |
| --- | --- |
| Юнит/функциональные наборы | 150 тестов, 0 падений |
| `test:session-revocation`, `test:client-ip-integration` | по 1 PASS |
| **Итого** | **152 теста, 0 падений** |
| lint (`lint:portfolio`, `lint:admin`, изменённые файлы) | 0 ошибок |
| typecheck | 210 ошибок (baseline 210, роста нет) |
| production build | успешен; миграций 13 без изменений |
| Post-deploy `verify-production.sh` | 30/30 PASS |
| Post-deploy `verify-security-headers.sh` | 21/21 PASS |

---

## 6. Post-deploy верификация (16 пунктов)

| Пункт | Результат |
| --- | --- |
| 1. Running image ID и healthy | PASS — `sha256:ea540b9ff47d…`, healthy |
| 2. `/` и `/contact` → 200 | PASS (также `/projects`, `/login`, `/account/recovery`, `/legal/privacy`) |
| 3. Обе формы присутствуют и гидратируются | PASS — форма и 6 полей на обеих страницах, поле реагирует на ввод |
| 4. Переключение темы | PASS — класс `html` и подпись меняются |
| 5. CTA ведут к форме | PASS — 2 ссылки на `/contact#contact-form` |
| 6. Telegram / Email / GitHub доступны | PASS |
| 7. CSP не ухудшился | PASS — хеши сверены с телом ответа, расхождений 0 |
| 8. Security Headers присутствуют | PASS — без дублей, HSTS, Permissions-Policy, CSP по хешам |
| 9. Rate limit работает | PASS — 429 с `Retry-After` |
| 10. API fail-closed сохранён | PASS — 401 без токена и с некорректным токеном |
| 11. Materials Privacy сохранена | PASS — публичный ответ без `userId`, рейтингов и загрузок |
| 12. Telegram Login / Recovery сохранены | PASS — `owner_canary`, страница восстановления 200 |
| 13. Dark / light работает | PASS |
| 14. Нет новых ошибок JavaScript | PASS — только известная CSP-блокировка скрипта метрики |
| 15. Нет новых необъяснённых 5xx | PASS — после 14:00 MSK 5xx нет (два 502 в 14:06 — сканер, до деплоя) |
| 16. PostgreSQL и другие сервисы не изменены | PASS — те же id контейнеров, те же инварианты БД, Pocker и okna не тронуты |

Переключение тем проверено на production: тема заполняет пустое поле,
переключение заменяет подставленный текст («Вакансия или работа в команде» →
«Сайт, сервис или приложение»).

---

## 7. Известное замечание (вне этого релиза)

Клиентский плагин `plugins/analytics.client.ts` добавляет в DOM инлайн-скрипт
с id счётчика метрики, который enforced CSP блокирует. Поведение унаследовано
от P1-релиза и воспроизводится на прежнем образе — аналитика не отключалась,
CSP не ослаблялся, `unsafe-inline` не добавлялся. Вынесено в отдельную задачу.

---

## 8. Что НЕ выполнялось

* изменения PostgreSQL и его схемы, миграции;
* пересоздание контейнеров PostgreSQL и Telegram-бота;
* изменения Nginx, DNS, Telegram proxy;
* команды против Pocker и чужих контейнеров;
* ослабление CSP или rate limit;
* изменение контракта Lead API;
* squash и force push.

---

## 9. Процедура

Полная процедура деплоя, health-гейта и автоматического отката —
`docs/runbooks/2026-11-17_SECURITY_HARDENING_P1.md`.
Предыдущий релиз — `docs/history/DEPLOY_2026-11-17_SECURITY_HARDENING_P1.md`.
