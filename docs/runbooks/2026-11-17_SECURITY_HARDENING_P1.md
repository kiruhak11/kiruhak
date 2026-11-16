# Runbook: Security Headers & Rate Limiting (P1)

**Release candidate:** `security-headers-rate-limit-20261117`
**Branch:** `security/headers-rate-limit` (base — `master` @ `095b9ba`)
**Исходный коммит:** `aaca8e8b9f7f75515b3e5a2e00c044601d60f946`
**Тип деплоя:** app-only (контейнер приложения), без БД, без бота, без Nginx и DNS
**Статус на момент подготовки:** образ собран и проверен, **деплой не выполнялся**

| Артефакт | Значение |
| --- | --- |
| Образ | `kiruhak-app:security-headers-rate-limit-20261117` |
| Image ID | `sha256:4722cffbb00d307a4b4b1c142b8bd789e2ac0e8899c8f7f63d41cc4fc9f2318f` |
| Платформа | `linux/amd64` |
| Source snapshot SHA-256 | `abb656b0686ba9cfe1d5bffe9b387268ae2c2687ca3e2bcbb17c90faabe07bba` |
| Архив образа | `/var/lib/kiruhak/security-headers-rate-limit-20261117-linux-amd64.tar.gz` (108 588 903 B) |
| SHA-256 архива | `e4b709adb3a9df7f219341c5c0ec4141b2cda6abaa7d1bf0a9872833b210ca96` |

---

## 1. Что входит в релиз

| Область | Изменение |
| --- | --- |
| Security headers | Плагин `server/plugins/security-headers.ts` выдаёт заголовки для всех ответов приложения |
| CSP | Для документов — по хешам фактически присутствующих инлайновых скриптов; `unsafe-eval` не используется |
| Rate limiting | `server/middleware/rate-limit.ts` + `server/utils/rate-limit.ts`: 429 с `Retry-After`, ограниченная память, single-flight |
| Client IP | `server/utils/client-ip.ts`: forwarded-заголовки учитываются только от доверенного прокси |
| Обновлённые потребители IP | lead delivery, Telegram Login start, счётчик просмотров UI-компонентов, аналитика |

Nginx production **не изменяется**: для `kiruhak11.ru` он не добавляет и не
скрывает security-заголовки, поэтому дублирования не возникает. Проверка
дублей входит в `ops/verify-security-headers.sh`.

### Как устроен CSP

`script-src` не содержит `unsafe-inline`: разрешение выдаётся по **хешам**
инлайновых скриптов, которые действительно присутствуют в ответе.

* Для SSR-страниц хеши считаются в хуке `render:html` — на момент ответа
  готовый HTML ещё не собран, поэтому он берётся из частей документа.
* Пререндеренные страницы (`/`, `/contact`) отдаются как статические файлы:
  для них хеши считаются один раз при старте приложения по тем же файлам из
  `.output/public`.
* Если тело ответа проанализировать не удалось (потоковая выдача), политика
  переходит на безопасный запасной вариант с `unsafe-inline` для скриптов.

`unsafe-eval` не используется нигде. Директива `upgrade-insecure-requests`
добавляется только для защищённых запросов (определяется по
`X-Forwarded-Proto`): на не-HTTPS origin она обновляет и same-origin ресурсы
(например, `/_payload.json`) и ломает загрузку payload.
Разрешённые источники: `self`,
`oauth.telegram.org` (Telegram Login SDK), `telegram.org`, inline-стили Nuxt,
self-hosted шрифты, `data:`/`blob:` для изображений и превью.

Превью UI-компонентов (`srcdoc`-iframe) получают отдельную политику через
атрибут `csp` — иначе родительская политика заблокировала бы скрипты демо.
Изоляция обеспечивается `sandbox="allow-scripts"` без `allow-same-origin`.

## 2. Обязательная переменная окружения

```
TRUSTED_PROXY_IPS=81.177.135.137/32,127.0.0.0/8,::1/128,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
```

`81.177.135.137` — адрес Edge-провайдера (TLS терминируется вне VPS), он
дописывается `nginx` в конец `X-Forwarded-For`. Без этого адреса в списке
доверенных все посетители попали бы в один счётчик ограничения частоты, а
подмена `X-Forwarded-For` клиентом обходила бы лимит.

Проверить фактический адрес пира перед деплоем:

```bash
tail -200 /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head
```

Если адрес изменился — обновить `TRUSTED_PROXY_IPS` в окружении контейнера
**до** деплоя и перезапустить приложение.

## 3. Pre-flight

```bash
cd /var/tmp/kiruhak-repro/repo
docker inspect kiruhak_app --format '{{.Config.Image}} {{.Image}}'   # текущий образ
docker ps --format '{{.Names}} {{.Status}}' | grep -E 'kiruhak|pocker'
```

Ожидаемо до деплоя: `kiruhak-app:api-fail-closed-20261115`,
`sha256:245d1e23bcbda156ab70d9807a902887ad60b257977f72c333317e8012bf745b`.

## 4. Сборка образа

```bash
cd /var/tmp/kiruhak-repro/repo
SNAPSHOT_SHA=$(find . -type f -not -path './node_modules/*' -not -path './.nuxt/*' \
  -not -path './.output/*' -not -path './.git/*' -not -name '._*' -print0 \
  | sort -z | xargs -0 sha256sum | sha256sum | cut -d' ' -f1)

docker build -f Dockerfile \
  --build-arg VCS_REF="$(git rev-parse HEAD)" \
  --build-arg IMAGE_VERSION=security-headers-rate-limit-20261117 \
  --build-arg SOURCE_SNAPSHOT_SHA256="${SNAPSHOT_SHA}" \
  -t kiruhak-app:security-headers-rate-limit-20261117 .

docker image inspect kiruhak-app:security-headers-rate-limit-20261117 \
  --format '{{.Id}} {{.Os}}/{{.Architecture}} {{index .Config.Labels "org.kstudio.source.snapshot.sha256"}}'
```

Платформа обязана быть `linux/amd64`, метка snapshot — совпадать с
`SOURCE_SNAPSHOT_SHA256`.

## 5. Smoke нового образа в изолированном окружении

```bash
docker network create kstudio-smoke
docker run -d --name kstudio-smoke-db --network kstudio-smoke \
  -e POSTGRES_DB=smoke -e POSTGRES_USER=smoke -e POSTGRES_PASSWORD=smoke_pw \
  postgres:15-alpine
# prisma db push по схеме ветки в изолированную БД, затем:
docker run -d --name kstudio-smoke-app --network kstudio-smoke \
  -e DATABASE_URL=postgresql://smoke:smoke_pw@kstudio-smoke-db:5432/smoke \
  -e TRUSTED_PROXY_IPS=81.177.135.137/32,127.0.0.0/8 \
  -e PORT=3018 -p 127.0.0.1:3018:3018 \
  kiruhak-app:security-headers-rate-limit-20261117

bash ops/verify-security-headers.sh http://127.0.0.1:3018
bash ops/verify-production.sh http://127.0.0.1:3018
```

## 6. Деплой (app-only) — только после отдельного решения владельца

```bash
SRC=/var/tmp/kiruhak-repro/repo \
VCS_REF=$(git -C /var/tmp/kiruhak-repro/repo rev-parse HEAD) \
bash ops/deploy-app.sh security-headers-rate-limit-20261117
```

Скрипт собирает образ, проверяет платформу и метки, пишет release override и
rollback checkpoint, пересоздаёт **только** сервис приложения с `--no-deps`.
PostgreSQL, бот, Nginx и DNS не затрагиваются.

## 7. Проверка после деплоя

```bash
bash ops/verify-production.sh https://kiruhak11.ru   # 30 проверок
bash ops/verify-security-headers.sh https://kiruhak11.ru
curl -sI https://kiruhak11.ru/ | grep -iE 'content-security-policy|strict-transport'
```

Дополнительно вручную:

* форма заявки на главной работает, повторная отправка с тем же
  `Idempotency-Key` не создаёт вторую заявку;
* вход по логину/паролю работает, Telegram Login открывает окно авторизации;
* страница восстановления пароля открывается, ссылка «Подтвердить Telegram
  и сменить пароль» ведёт на `/account/recovery`;
* в консоли браузера нет ошибок CSP (иначе ломается гидратация).

## 8. Rollback

Точка отката — образ, работавший до релиза:

```
kiruhak-app:api-fail-closed-20261115
sha256:245d1e23bcbda156ab70d9807a902887ad60b257977f72c333317e8012bf745b
```

```bash
# 1. вернуть предыдущий образ в override и пересоздать только приложение
cat /var/lib/kiruhak/release-overrides/<previous-release>.yml
# (см. ops/deploy-app.sh — раздел rollback)
docker compose -f /var/www/html/kiruhak/docker-compose.yml \
  -f /var/lib/kiruhak/release-overrides/<previous-release>.yml \
  up -d --no-deps app
```

Rollback не требует отката БД: релиз не добавляет миграций и не меняет схему
(проверено: `prisma/migrations` без изменений, применённых миграций — 14).

## 9. Что релиз НЕ делает

* не меняет PostgreSQL и не добавляет миграций;
* не меняет Nginx, DNS и Telegram proxy;
* не трогает Pocker;
* не включает Яндекс.Метрику и не добавляет `unsafe-eval`;
* не ослабляет fail-closed авторизацию, проверку bot-секрета и Materials Privacy.
