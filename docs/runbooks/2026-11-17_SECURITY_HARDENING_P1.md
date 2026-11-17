# Runbook: Security Headers & Rate Limiting (P1)

**Release candidate:** `security-headers-rate-limit-20261117`
**Branch:** `security/headers-rate-limit` (base — `master` @ `095b9ba`)
**Исходный коммит образа:** `b67b8e11d25d4885c7c091ac98cc3beb0ac55a3c`
**Ветка:** `security/headers-rate-limit` · **PR:** https://github.com/kiruhak11/kiruhak/pull/2
**Тип деплоя:** app-only (контейнер приложения), без БД, без бота, без Nginx и DNS
**Процедура деплоя:** только из immutable-артефакта (`docker load` + сверка image ID), пересборка исключена
**Верификация релиза:** health-гейт + два обязательных смоука, при провале — автоматический откат

| Артефакт | Значение |
| --- | --- |
| Образ | `kiruhak-app:security-headers-rate-limit-20261117` |
| Image ID | `sha256:3819f38f9ce9b72bc2c59a7fd2e168f211df5aa91743e76529be0bc8ed248534` |
| Платформа | `linux/amd64` |
| Source snapshot SHA-256 | `aa8996ac34a6ba5422a5615e9e9acf6074d61cfc8cf0f61e849f5e0dc356726f` |
| Архив образа | `/var/lib/kiruhak/security-headers-rate-limit-20261117-linux-amd64.tar.gz` (108 604 142 B) |
| SHA-256 архива | `96c3524fc4f7e177713d707c21940950eb213f5a5e40ede6cecfeb57e0efe7c2` |

### Соответствие образа ветке

Образ собран из коммита `b67b8e1` (метка `org.opencontainers.image.revision`),
snapshot посчитан по исходникам на момент сборки. Последующие коммиты ветки
затрагивают только `ops/`, `docs/`, `tests/` и запись npm-скрипта в
`package.json` — **рантайм-код приложения (`server/`, `composables/`,
`components/`, `pages/`, `prisma/`) не менялся**, поэтому артефакт остаётся
актуальным и пересборка не требуется.

Проверка соответствия:

```bash
git diff --name-only b67b8e11d25d4885c7c091ac98cc3beb0ac55a3c HEAD \
  -- server composables components pages layouts utils constants types prisma
# (пустой вывод = рантайм не затронут)
```

Если эта проверка даёт непустой вывод, прежний артефакт **больше не считается
актуальным**: образ пересобирается и релиз-гейт повторяется целиком.

При деплое сверяются **не** вычисленные заново хеши дерева, а метки уже
собранного образа (`image ID`, платформа, `source.snapshot.sha256`) и SHA-256
архива. Это гарантирует, что выкатывается именно проверенный артефакт, и
исключает подмену содержимого тега.

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
  **не ослабляется**: скрипты запрещаются целиком (`script-src 'none'`).
  Страница остаётся читаемой (SSR-разметка уже в ответе), но ни один скрипт
  не выполняется.
* `style-src 'self' 'unsafe-inline'` — отдельный, осознанный риск: inline-стили
  Nuxt и превью компонентов требуют `unsafe-inline`. Это разрешение не даёт
  выполнять инлайновый JavaScript и не ослабляет `script-src`.

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
TRUSTED_PROXY_IPS=172.18.0.1/32,81.177.135.137/32
```

Loopback (`127.0.0.0/8`, `::1/128`) доверен всегда — это сам хост, его
адрес подделать нельзя. Приватные подсети (`10/8`, `172.16/12`, `192.168/16`)
**не** доверены: любой соседний контейнер на хосте иначе смог бы подменить
адрес клиента.

### 2.1 Топология адресов (проверено read-only на production)

| Роль | Адрес | Как проверено |
| --- | --- | --- |
| Исходящий IP VPS | `81.177.135.137` | `curl https://api.ipify.org` с VPS |
| Публичный IP VPS | `81.177.135.137` | тот же адрес: хост стоит за NAT провайдера |
| Внешний TLS Edge (пир для nginx) | `81.177.135.137` | `tail -20000 /var/log/nginx/access.log` — 19996 из 20000 строк с этим адресом |
| Внутренний nginx | `127.0.0.1` | `proxy_pass http://127.0.0.1:3015` в `sites-enabled/kiruhak` |
| Docker gateway (пир приложения) | `172.18.0.1` | `docker network inspect kiruhak_kiruhak_network`; порт 3015 опубликован на `127.0.0.1`, поэтому внутрь контейнера соединение приходит от gateway (проверено отдельным экспериментом с опубликованным портом) |
| Реальный посетитель | предпоследний элемент `X-Forwarded-For` | `nginx` дописывает `$proxy_add_x_forwarded_for`, то есть свой адрес пира в конец цепочки |

Итог: `81.177.135.137` — адрес самого VPS и одновременно адрес Edge, с
которого nginx получает соединения. Внешний клиент этот адрес подделать не
может, поэтому его можно доверять.

### 2.2 Как определяется клиент

`nginx` дописывает адрес своего пира в конец цепочки:

```
X-Forwarded-For: <представление Edge о клиенте>, 81.177.135.137
```

Клиент может дописать адреса левее — они игнорируются: адресом считается
самый правый **недоверенный** элемент цепочки. Цепочка принимается только
если доверены и пир соединения (`172.18.0.1`), и последний хоп цепочки
(`81.177.135.137`); иначе используется адрес соединения (безопасно, но все
клиенты попадут в один счётчик) и в лог уходит предупреждение.

### 2.3 Проверка перед деплоем

```bash
# 1. адрес gateway сети приложения
docker network inspect kiruhak_kiruhak_network \
  --format '{{range .IPAM.Config}}{{.Gateway}}{{end}}'

# 2. адрес пира для nginx
tail -20000 /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head

# 3. после старта контейнера — в логе должно быть:
#    [trusted-proxy] доверенные прокси: 127.0.0.0/8, ::1/128, 172.18.0.1/32, 81.177.135.137/32
docker logs kiruhak_app 2>&1 | grep trusted-proxy
```

Если `TRUSTED_PROXY_IPS` не задан или содержит широкие подсети, приложение
печатает предупреждение при старте, а middleware — при первом неподтверждённом
запросе. Без корректного значения все посетители получают один адрес и форма
заявок перестаёт работать после нескольких отправок.

### 2.4 Граница доверия X-Forwarded-For (доказано наблюдением)

Синтетический A/B-тест «доверенный/недоверенный прокси» проверяет только
резолвер, но не доказывает, как устроен реальный внешний вход. Поэтому граница
доверия подтверждена **наблюдением реального запроса** на loopback
(AF_PACKET-сниффер, порт 3015, без правки Nginx):

```
nginx → приложение:
  X-Forwarded-For: <подделка клиента>, <реальный клиент>, 81.177.135.137
  X-Real-IP: <реальный клиент>
```

Что из этого следует:

* Edge **дописывает реальный IP справа** — клиентская подмена остаётся левее
  и не влияет на выбор адреса;
* резолвер берёт самый правый **недоверенный** элемент цепочки, то есть
  элемент непосредственно слева от Edge;
* подделка слева отбрасывается.

Захват удалён с VPS, реальный IP клиента в отчёты и runbook не попадает.
Проверка выполнена одним запросом к production, лимиты реальных посетителей
не затронуты.

### 2.4.1 Внешний Edge перезаписывает X-Forwarded-For

Наблюдением подтверждено ещё одно свойство внешнего входа: Edge
**переписывает** цепочку `X-Forwarded-For` — подставленное клиентом значение
до приложения не доходит в исходном виде.

Следствия, важные для эксплуатации:

* rate-limit smoke расходует счётчик **самого VPS** (приложение использует
  адрес соединения `172.18.0.1`, так как вся цепочка состоит из доверенных
  адресов). Реальные посетители получают счётчики по своим адресам, поэтому
  **бюджет посетителей не расходуется**;
* приложение печатает об этом одноразовое предупреждение
  «цепочка X-Forwarded-For не подтверждена доверенным прокси»;
* независимость счётчиков и устойчивость к подмене XFF проверяются
  **напрямую на приложении** (`127.0.0.1:3015`), где цепочка подконтрольна:
  пир — доверенный шлюз, последний хоп — доверенный Edge, адрес клиента —
  элемент левее. Именно это делает интеграционный тест
  `tests/client-ip.integration.test.ts`.

Через публичный Edge подделать адрес клиента нельзя: Edge не пропускает
чужую цепочку, а резолвер всё равно берёт самый правый недоверенный элемент.

### 2.5 Доступность порта приложения

| Проверка | Результат |
| --- | --- |
| `docker inspect kiruhak_app` → PortBindings | `127.0.0.1:3015` |
| Внешняя сеть → `81.177.135.137:3015` | connection refused |
| Внешняя сеть → `kiruhak11.ru:3015` | connection refused |
| Loopback → `127.0.0.1:3015` | HTTP 200 |
| Соседний контейнер → `172.18.0.2:3015` | доступен (внутренняя сеть Docker) |

Прямой публичный доступ к приложению в обход Nginx исключён: порт публикуется
только на loopback. Обращение из соседнего контейнера — это внутренняя сеть
Docker, а не внешняя; пир в этом случае недоверенный, поэтому цепочка
`X-Forwarded-For` игнорируется и адрес не подделывается.

Репозиторный `docker-compose.prod.yml` публиковал порт как `"3015:3015"`,
что открывало бы приложение наружу в обход Nginx. Файл приведён к серверному
эталону: `"127.0.0.1:3015:3015"`, обязательные секреты с `:?`,
`TRUSTED_PROXY_IPS: ${TRUSTED_PROXY_IPS:?...}`, `BOT_API_BASE_URL` для бота.

## 3. Pre-flight

```bash
cd /var/tmp/kstudio-p1-verify/repo
docker inspect kiruhak_app --format '{{.Config.Image}} {{.Image}}'   # текущий образ
docker ps --format '{{.Names}} {{.Status}}' | grep -E 'kiruhak|pocker'
```

Ожидаемо до деплоя: `kiruhak-app:api-fail-closed-20261115`,
`sha256:245d1e23bcbda156ab70d9807a902887ad60b257977f72c333317e8012bf745b`.

## 4. Сборка образа — разовый шаг, в релизной процедуре её нет

> **Пересобирать образ при выкатке нельзя.** Сборка ниже относится только к
> подготовке артефакта: пересобранный образ даст другой image ID, и он уже не
> будет тем, который проверен, отсобран в tar-артефакт и зафиксирован в
> таблице раздела «Артефакт». Релизная процедура (§6) только загружает
> готовый артефакт и сверяет его идентичность.

```bash
cd /var/tmp/kstudio-p1-verify/repo
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

Готовый образ сохраняется в tar-артефакт, из которого выполняется деплой:

```bash
docker save kiruhak-app:security-headers-rate-limit-20261117 \
  | gzip > /var/lib/kiruhak/security-headers-rate-limit-20261117-linux-amd64.tar.gz
sha256sum /var/lib/kiruhak/security-headers-rate-limit-20261117-linux-amd64.tar.gz
```

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

`ops/deploy-app.sh` больше не собирает образ. Процедура работает только с
ранее проверенным immutable-артефактом и останавливается при любом расхождении.

```bash
bash ops/deploy-app.sh \
  --tag      security-headers-rate-limit-20261117 \
  --artifact /var/lib/kiruhak/security-headers-rate-limit-20261117-linux-amd64.tar.gz \
  --sha256   96c3524fc4f7e177713d707c21940950eb213f5a5e40ede6cecfeb57e0efe7c2 \
  --image-id sha256:3819f38f9ce9b72bc2c59a7fd2e168f211df5aa91743e76529be0bc8ed248534 \
  --snapshot aa8996ac34a6ba5422a5615e9e9acf6074d61cfc8cf0f61e849f5e0dc356726f \
  --trusted-proxies 172.18.0.1/32,81.177.135.137/32 \
  --expect-rollback-image kiruhak-app:api-fail-closed-20261115 \
  --expect-rollback-image-id sha256:245d1e23bcbda156ab70d9807a902887ad60b257977f72c333317e8012bf745b \
  --dry-run
```

Что проверяет процедура (по порядку, любой провал останавливает выполнение):

1. наличие обязательных файлов и аргументов; тег не указывает на другой образ;
2. SHA-256 архива артефакта;
3. `TRUSTED_PROXY_IPS`: непусто, формат CIDR, нет широких подсетей, шлюз
   сети приложения и адрес пира nginx входят в список;
4. `docker load` без пересборки + сверка image ID, платформы `linux/amd64`
   и source snapshot;
5. runtime-разметка образа (файлы приложения, Prisma-клиент, не root);
6. подготовка release override и rollback-override, проверка наличия образа
   отката локально и проверка собираемости конфигурации отката;
7. итоговая конфигурация compose: образ, отсутствие секции `build`, порт
   только на `127.0.0.1`, `TRUSTED_PROXY_IPS` в окружении `app`,
   `TELEGRAM_LOGIN_MODE=owner_canary`, секреты на месте, конфигурации
   postgres и бота не изменились, в окружении `app` добавлена ровно одна
   переменная — `TRUSTED_PROXY_IPS`;
8. только после всех проверок пишется rollback checkpoint.

Секция `build` в override удаляется через `build: !reset null` — обычный
`build: null` в Compose v5.5.1 **не** удаляет секцию, а только перекрывает
значение, и compose сохранил бы возможность пересборки из контекста.

Значения Telegram-конфигурации (`TELEGRAM_LOGIN_MODE`, `ADMIN_TELEGRAM_ID`)
наследуются из работающего контейнера, а не задаются константой: новый
релиз не может молча сменить режим логина.

### 6.1 Результат релиз-гейта (dry-run без деплоя)

`ops/verify-deploy-gate.sh` — воспроизводимая проверка процедуры: 32/32 PASS.

| Сценарий | Ожидаемый результат | Факт |
| --- | --- | --- |
| dry-run с корректными параметрами | все проверки пройдены, контейнер не пересоздан | PASS |
| неверный SHA-256 артефакта | отказ | PASS |
| отсутствует `TRUSTED_PROXY_IPS` | отказ | PASS |
| неверные PortBindings (`3015:3015`) | отказ | PASS |
| образ отката отсутствует локально | отказ | PASS |
| тег указывает на другой образ | отказ | PASS |
| чекпоинт прерванного прогона | не создаётся | PASS |
| production-контейнер app | id не изменился | PASS |

Гейт выполняется в изолированной песочнице (`/tmp/kstudio-deploy-gate-*`):
compose-файлы, каталоги override и checkpoint — копии, рабочие каталоги
production не затрагиваются. Секреты не копируются — используется ссылка на
рабочий `.env`.

### 6.2 Точная последовательность production rollout

```bash
# 1. dry-run: все проверки, контейнер не пересоздаётся
bash ops/deploy-app.sh --tag security-headers-rate-limit-20261117 \
  --artifact /var/lib/kiruhak/security-headers-rate-limit-20261117-linux-amd64.tar.gz \
  --sha256 96c3524fc4f7e177713d707c21940950eb213f5a5e40ede6cecfeb57e0efe7c2 \
  --image-id sha256:3819f38f9ce9b72bc2c59a7fd2e168f211df5aa91743e76529be0bc8ed248534 \
  --snapshot aa8996ac34a6ba5422a5615e9e9acf6074d61cfc8cf0f61e849f5e0dc356726f \
  --trusted-proxies 172.18.0.1/32,81.177.135.137/32 \
  --expect-rollback-image kiruhak-app:api-fail-closed-20261115 \
  --expect-rollback-image-id sha256:245d1e23bcbda156ab70d9807a902887ad60b257977f72c333317e8012bf745b \
  --dry-run

# 2. деплой: та же команда без --dry-run
#    (пересоздаётся только сервис app)

# 3. post-deploy smoke
bash ops/verify-production.sh https://kiruhak11.ru          # 30 проверок
bash ops/verify-security-headers.sh https://kiruhak11.ru   # 21 проверка
curl -sI https://kiruhak11.ru/ | grep -iE 'content-security-policy|strict-transport'

# 4. контроль инвариантов
docker inspect kiruhak_app --format '{{.Config.Image}} {{.Image}} {{.State.Health.Status}}'
docker inspect kiruhak_postgres --format '{{.Config.Image}} {{.Id}}'   # без изменений
docker inspect kiruhak_bot --format '{{.Config.Image}} {{.Id}}'        # без изменений
```

## 7. Проверка после деплоя

Post-deploy smoke выполняется **автоматически** процедурой деплоя и является
обязательным условием успеха релиза: ненулевой код проверки означает статус
`FAILED`, а не предупреждение в журнале. Вручную те же проверки запускаются так:

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

### 7.1 Оркестрация релиза

`ops/release-orchestration.sh` владеет фазой после переключения контейнера.
Живой контейнер ещё не означает успешный релиз: контейнер может работать и
отдавать неверный HTTP-контракт.

Состояния релиза (файл `/var/lib/kiruhak/release-state/<release>.state`):

| Состояние | Значение |
| --- | --- |
| `PREPARED` | checkpoint сохранён, переключения ещё не было |
| `DEPLOYING` | новый контейнер поднят, идёт верификация |
| `VERIFIED` | health, image ID и оба смоука прошли |
| `FAILED` | верификация не пройдена, релиз непригоден |
| `ROLLED_BACK` | прежний образ возвращён и подтверждён |
| `BLOCKED` | откат невозможен или небезопасен — нужен человек |

Порядок проверок:

1. **health-гейт** — контейнер должен существовать, работать **на ожидаемом
   image ID** и стать `healthy` в пределах таймаута (по умолчанию 60 с).
   Отклонение, исчезновение контейнера или `unhealthy` — провал;
2. **smoke `verify-production.sh`** — обязательный PASS;
3. **smoke `verify-security-headers.sh`** — обязательный PASS.

`DEPLOY DONE` печатается только после всех трёх проверок. При провале
фиксируются имя упавшей проверки (`failed_check`) и точная ошибка (`error`),
после чего выполняется автоматический откат.

Журнал диагностики: `/var/lib/kiruhak/release-state/<release>.log`.

### 7.2 Автоматический откат

При провале после переключения процедура:

1. фиксирует точную ошибку и имя упавшей проверки;
2. использует **уже проверенную** конфигурацию отката (тот же
   rollback-override, который был проверен до переключения);
3. возвращает прежний образ `kiruhak-app:api-fail-closed-20261115`;
4. проверяет image ID отката, его health и **базовый** smoke;
5. не требует от прежнего образа новых security-заголовков — их в нём ещё
   нет, поэтому проверка отката использует только `verify-production.sh`;
6. не объявляет релиз успешным: состояние `ROLLED_BACK`, код выхода ≠ 0;
7. сохраняет журнал диагностики.

Если откат невозможен (нет rollback-override, отсутствует образ отката) —
состояние `BLOCKED`, код выхода 2, частично выполненное переключение **не
скрывается**.

Регрессии оркестрации (`tests/release-orchestration.test.ts`, 10 тестов)
проверяют все ветки на заглушках Docker и HTTP — живой production при этом не
затрагивается.

## 8. Rollback

Точка отката — образ, фактически работавший до релиза (не жёстко прописанный
старый релиз):

```
kiruhak-app:api-fail-closed-20261115
sha256:245d1e23bcbda156ab70d9807a902887ad60b257977f72c333317e8012bf745b
```

Процедура деплоя сама фиксирует точку отката до переключения: читает образ
работающего контейнера, проверяет, что этот образ есть локально, генерирует
rollback-override и **проверяет собираемость конфигурации отката**. Откат
невозможен, если образ отката отсутствует — в этом случае деплой блокируется.

Готовый checkpoint (`/var/lib/kiruhak/rollback-checkpoints/`) содержит:

```
previous_image=kiruhak-app:api-fail-closed-20261115
previous_image_id=sha256:245d1e23bcbda156ab70d9807a902887ad60b257977f72c333317e8012bf745b
compose_files=/var/www/html/kiruhak/docker-compose.prod.yml,/var/lib/kiruhak/release-overrides/app-secrets.override.yml,<release-override>
rollback_override=/var/lib/kiruhak/release-overrides/api-fail-closed-20261115-rollback.yml
rollback_command=cd /var/www/html/kiruhak && docker compose -p kiruhak -f docker-compose.prod.yml -f /var/lib/kiruhak/release-overrides/app-secrets.override.yml -f /var/lib/kiruhak/release-overrides/api-fail-closed-20261115-rollback.yml up -d --no-deps --force-recreate app
db_invariants=5|10|14|21|3|1|1
```

Откат одной командой (БД не трогается):

```bash
cd /var/www/html/kiruhak && docker compose -p kiruhak \
  -f docker-compose.prod.yml \
  -f /var/lib/kiruhak/release-overrides/app-secrets.override.yml \
  -f /var/lib/kiruhak/release-overrides/api-fail-closed-20261115-rollback.yml \
  up -d --no-deps --force-recreate app
```

Rollback не требует отката БД: релиз не добавляет миграций и не меняет схему
(проверено: `prisma/migrations` без изменений, применённых миграций — 14).

Основной путь отката — автоматический (раздел 7.2): при провале верификации
процедура сама возвращает прежний образ и фиксирует состояние `ROLLED_BACK`.
Команда ниже — ручной путь, если состояние `BLOCKED` и откат нужно
выполнить вручную. БД не откатывается в обоих случаях.

## 9. Найденный при подготовке дефект initAuth

При браузерной проверке кандидата обнаружена ошибка гидратации страницы:
`Cannot read properties of null (reading 'result')`. Причина — в коде
`initAuth`, смерженном в `master` ранее (`12c9716`): при применении
кэшированного результата проверки `applyValidationResult` вызывает
`clearLocalSession()`, который сбрасывает кэш, после чего код читал
`lastValidation.result` уже из `null`. Unit-тесты это не покрывали — ошибка
проявилась только в браузере.

Исправлено в этой ветке (`b67b8e1`): результат читается до применения;
добавлена регрессия «кэшированный результат применяется дважды».

Затронутого production это не касается: в работающем образе
`api-fail-closed-20261115` кода `initAuth` с серверной проверкой ещё нет.

## 10. Что релиз НЕ делает

* не меняет PostgreSQL и не добавляет миграций;
* не меняет Nginx, DNS и Telegram proxy;
* не трогает Pocker;
* не включает Яндекс.Метрику и не добавляет `unsafe-eval`;
* не ослабляет fail-closed авторизацию, проверку bot-секрета и Materials Privacy.
