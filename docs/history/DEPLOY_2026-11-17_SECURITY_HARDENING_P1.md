# K-STUDIO — SECURITY HARDENING P1 (RELEASE + PRODUCTION DEPLOY)

**Release:** `security-headers-rate-limit-20261117`
**Date:** 2026-11-17
**Site:** https://kiruhak11.ru
**Host:** VPS Jino (`jino-main`)
**Статус:** `K-STUDIO SECURITY HARDENING P1 — PRODUCTION DEPLOY VERIFIED`

---

## 1. Git

| Параметр | Значение |
| --- | --- |
| Ветка релиза | `security/headers-rate-limit` |
| PR | https://github.com/kiruhak11/kiruhak/pull/2 |
| Merge-коммит PR #2 | `0271843d9b5e20b80f2c688718b25923621dda94` |
| Тип merge | обычный merge-коммит (без squash, без force push) |
| `master` до merge | `095b9ba2ba043b25405f76d13ce039a70ce83675` |
| `master` после merge | `0271843d9b5e20b80f2c688718b25923621dda94` |
| `master-2` | `31e6a9b117f3a50cd33d6f76e297cc7ec24d3b71` — не изменялся |
| Коммиты в релизе | 20 (17 коммитов PR + 3 коммита оркестрации) |

---

## 2. Артефакт

| Параметр | Значение |
| --- | --- |
| Образ | `kiruhak-app:security-headers-rate-limit-20261117` |
| Image ID | `sha256:3819f38f9ce9b72bc2c59a7fd2e168f211df5aa91743e76529be0bc8ed248534` |
| Платформа | `linux/amd64` |
| Source snapshot | `aa8996ac34a6ba5422a5615e9e9acf6074d61cfc8cf0f61e849f5e0dc356726f` |
| Коммит образа | `b67b8e11d25d4885c7c091ac98cc3beb0ac55a3c` |
| Архив | `/var/lib/kiruhak/security-headers-rate-limit-20261117-linux-amd64.tar.gz` |
| SHA-256 архива | `96c3524fc4f7e177713d707c21940950eb213f5a5e40ede6cecfeb57e0efe7c2` |
| Пересборка | не выполнялась: рантайм-код не менялся после сборки образа |

Проверка актуальности артефакта:

```
git diff --name-only b67b8e11d25d4885c7c091ac98cc3beb0ac55a3c HEAD \
  -- server composables components pages layouts utils constants types prisma
# (пустой вывод — рантайм не затронут)
```

---

## 3. Production до и после

| Параметр | До | После |
| --- | --- | --- |
| Контейнер | `kiruhak_app` | `kiruhak_app` |
| Образ | `kiruhak-app:api-fail-closed-20261115` | `kiruhak-app:security-headers-rate-limit-20261117` |
| Image ID | `sha256:245d1e23bcbd…` | `sha256:3819f38f9ce9…` |
| Health | healthy | healthy |
| Порт | `127.0.0.1:3015` | `127.0.0.1:3015` |
| PostgreSQL | `e11a23a24e784…` (up 6 недель) | `e11a23a24e784…` — не пересоздавался |
| Бот | `76a7893c6f8e…` (up 3 недели) | `76a7893c6f8e…` — не пересоздавался |

Compose-файлы контейнера:

```
/var/www/html/kiruhak/docker-compose.prod.yml
/var/lib/kiruhak/release-overrides/app-secrets.override.yml
/var/lib/kiruhak/release-overrides/security-headers-rate-limit-20261117.yml
```

Release override (содержимо):

```yaml
services:
  app:
    image: kiruhak-app:security-headers-rate-limit-20261117
    build: !reset null
    environment:
      TELEGRAM_LOGIN_MODE: owner_canary
      ADMIN_TELEGRAM_ID: "502773482"
      TRUSTED_PROXY_IPS: "172.18.0.1/32,81.177.135.137/32"
```

Rollback checkpoint:
`/var/lib/kiruhak/rollback-checkpoints/security-headers-rate-limit-20261117-20261117T091747Z.txt`

```
previous_image=kiruhak-app:api-fail-closed-20261115
previous_image_id=sha256:245d1e23bcbda156ab70d9807a902887ad60b257977f72c333317e8012bf745b
rollback_override=/var/lib/kiruhak/release-overrides/api-fail-closed-20261115-rollback.yml
rollback_command=cd /var/www/html/kiruhak && docker compose -p kiruhak -f docker-compose.prod.yml -f /var/lib/kiruhak/release-overrides/app-secrets.override.yml -f /var/lib/kiruhak/release-overrides/api-fail-closed-20261115-rollback.yml up -d --no-deps --force-recreate app
db_invariants=5|10|14|21|3|1|1
```

Состояние релиза:
`/var/lib/kiruhak/release-state/security-headers-rate-limit-20261117.state` →
`state=VERIFIED`, `release_result=verified`, `health_result=healthy`, `rollback=not-needed`.
Журнал диагностики: `…-20261117.log`.

---

## 4. Инварианты PostgreSQL (до и после — без изменений)

```
migrations=14 tables=21 users=5 projects=10 materials=3
lead_deliveries=5 visits=0 ui_component_views=0 revoked_sessions=1
```

Миграции не запускались, схема не менялась.

---

## 5. Проверки

| Проверка | Результат |
| --- | --- |
| Юнит/функциональные наборы | 119 тестов, 0 падений |
| `test:session-revocation` | 1 PASS |
| `test:client-ip-integration` | 1 PASS (настоящий Nitro/H3-сервер) |
| **Итого** | **121 тест, 0 падений** |
| lint (`lint:portfolio`, `lint:admin`, изменённые файлы) | 0 ошибок |
| typecheck | 210 ошибок (baseline `master` — 211, роста нет) |
| production build | OK |
| `prisma/migrations` | 13 каталогов, без изменений |
| Гейт деплоя (dry-run + 5 негативных сценариев) | 32/32 PASS |
| Post-deploy `verify-production.sh` | 30/30 PASS |
| Post-deploy `verify-security-headers.sh` | 21/21 PASS |

---

## 6. Верификация production после деплоя

| Пункт | Результат | Чем подтверждено |
| --- | --- | --- |
| Имя и ID running image | PASS | `kiruhak-app:security-headers-rate-limit-20261117`, `sha256:3819f38f9ce9…` |
| Docker health | PASS | `healthy` сразу после старта |
| Security headers без дублей | PASS | по одному значению каждого заголовка |
| CSP | PASS | `script-src` по SHA-256 хешам, без `unsafe-inline` и `unsafe-eval`; API — `script-src 'none'` |
| Гидратация | PASS | консоль браузера без ошибок и предупреждений CSP |
| Light/dark тема | PASS | переключение меняет класс `html` (`class="dark"`) |
| Telegram Login owner_canary | PASS | страница входа: «Войти через Telegram», «сессию сможет получить только владелец аккаунта» |
| Login и Recovery без реальных данных | PASS | формы отрисованы, реальные логины/пароли не вводились |
| Ссылка восстановления | PASS | «Подтвердить Telegram и сменить пароль» (`/account/recovery`) в задеплоенном бандле; страница восстановления отдаёт 200 |
| Materials Privacy | PASS | публичный ответ без `userId`, без строк рейтингов и загрузок |
| API fail-closed | PASS | 401 без токена и с некорректным токеном |
| Bot secret | PASS | 403 без секрета и с неверным секретом |
| Независимые IP-лимиты | PASS | разные адреса — разные счётчики (10 разрешённых + 11-й заблокирован) |
| Защита от подделки XFF | PASS | подделка слева не влияет на выбор адреса; та же подделка с другим адресом не переносит счётчик |
| 429 и Retry-After | PASS | 429 с `Retry-After: 899` |
| OPTIONS разрешён | PASS | 204 на preflight `/api/brief` и `/api/telegram` |
| Публичная форма и идемпотентность | PASS | два запроса с одним `Idempotency-Key` → 400 `REQUIRED_FIELDS`, заявок в БД не создано (`lead_deliveries=5`) |
| Новых необъяснённых 5xx | PASS | после 12:00 MSK 5xx в access.log нет; последний 502 — в 09:20 MSK, за 3 часа до деплоя |
| Публичный доступ к приложению | PASS | `81.177.135.137:3015` и `kiruhak11.ru:3015` — connection refused; loopback — 200 |

### Наблюдение о внешнем TLS-Edge

Через публичный Edge заголовок `X-Forwarded-For` **перезаписывается**: все
запросы с VPS получают один ключ ограничения частоты, независимо от
подставленного значения. Приложение при этом пишет предупреждение
«цепочка X-Forwarded-For не подтверждена доверенным прокси» и использует
адрес соединения `172.18.0.1` — адрес, которым реальные посетители не
пользуются (у посетителя в цепочке есть его собственный адрес).

Следствия:

* rate-limit smoke расходует счётчик самого VPS, **бюджет реальных
  посетителей не затрагивается**;
* независимость счётчиков и устойчивость к подмене XFF проверяются
  напрямую на приложении (`127.0.0.1:3015`), где цепочка подконтрольна, —
  это и делает интеграционный тест `tests/client-ip.integration.test.ts`.

---

## 7. Что НЕ выполнялось

* пересборка Docker-образа;
* миграции Prisma и `db push` на production;
* пересоздание контейнеров PostgreSQL и бота;
* изменения Nginx, DNS, Telegram proxy;
* команды против Pocker (его контейнер пересоздан его собственным
  release-пайплайном);
* squash и force push;
* изменения `master-2`.

---

## 8. Процедура

Полная процедура деплоя, health-гейта, автоматического отката и проверок —
`docs/runbooks/2026-11-17_SECURITY_HARDENING_P1.md`.
