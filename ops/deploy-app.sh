#!/usr/bin/env bash
# K-Studio app-only production deploy (no DB, no bot, no nginx, no DNS).
#
# The deploy uses a PRE-VERIFIED immutable artifact: the image is loaded from
# the release tarball and checked against the expected image ID, platform and
# source snapshot. Nothing is rebuilt here — a rebuild would produce a
# different image than the one that was reviewed and tested. The release
# override removes the `build:` section entirely, so compose can never fall
# back to compiling the application from the compose context.
#
# Usage:
#   deploy-app.sh --tag <tag> --artifact <tar.gz> --sha256 <hex> \
#                 --image-id <sha256:...> [--snapshot <hex>] \
#                 [--trusted-proxies <list>] \
#                 [--expect-rollback-image <ref>] \
#                 [--expect-rollback-image-id <sha256:...>] [--dry-run]
#
# Options:
#   --dry-run           run every check (including artifact load and compose
#                       config rendering) and print the plan, but do NOT
#                       recreate the running container
#
# Environment:
#   COMPOSE_DIR         compose project directory (default /var/www/html/kiruhak)
#   OVERRIDES           release override directory (default /var/lib/kiruhak/release-overrides)
#   CHECKPOINTS         rollback checkpoint directory (default /var/lib/kiruhak/rollback-checkpoints)
#   SECRETS_OVERRIDE    secrets override file (default ${OVERRIDES}/app-secrets.override.yml)
#   APP_CONTAINER       app container name (default kiruhak_app)
#   NGINX_ACCESS_LOG    nginx access log used to detect the TLS edge peer
#
# The PostgreSQL container, the bot container, nginx and DNS are never touched.

set -euo pipefail

COMPOSE_DIR="${COMPOSE_DIR:-/var/www/html/kiruhak}"
OVERRIDES="${OVERRIDES:-/var/lib/kiruhak/release-overrides}"
CHECKPOINTS="${CHECKPOINTS:-/var/lib/kiruhak/rollback-checkpoints}"
PROJECT="${PROJECT:-kiruhak}"
SECRETS_OVERRIDE="${SECRETS_OVERRIDE:-${OVERRIDES}/app-secrets.override.yml}"
APP_CONTAINER="${APP_CONTAINER:-kiruhak_app}"
NGINX_ACCESS_LOG="${NGINX_ACCESS_LOG:-/var/log/nginx/access.log}"

TAG=""
ARTIFACT=""
EXPECTED_SHA256=""
EXPECTED_IMAGE_ID=""
EXPECTED_SNAPSHOT=""
TRUSTED_PROXIES="${TRUSTED_PROXY_IPS:-}"
EXPECT_ROLLBACK_IMAGE=""
EXPECT_ROLLBACK_ID=""
DRY_RUN=0

while [ $# -gt 0 ]; do
  case "$1" in
    --tag) TAG="$2"; shift 2 ;;
    --artifact) ARTIFACT="$2"; shift 2 ;;
    --sha256) EXPECTED_SHA256="$2"; shift 2 ;;
    --image-id) EXPECTED_IMAGE_ID="$2"; shift 2 ;;
    --snapshot) EXPECTED_SNAPSHOT="$2"; shift 2 ;;
    --trusted-proxies) TRUSTED_PROXIES="$2"; shift 2 ;;
    --expect-rollback-image) EXPECT_ROLLBACK_IMAGE="$2"; shift 2 ;;
    --expect-rollback-image-id) EXPECT_ROLLBACK_ID="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

fail() { echo "DEPLOY ABORTED: $*" >&2; exit 1; }
info() { echo "  $*"; }

[ -n "${TAG}" ] || fail "--tag is required"
[ -n "${ARTIFACT}" ] || fail "--artifact is required"
[ -n "${EXPECTED_SHA256}" ] || fail "--sha256 is required"
[ -n "${EXPECTED_IMAGE_ID}" ] || fail "--image-id is required"

IMAGE="kiruhak-app:${TAG}"

echo "=== 1. pre-flight ==="
info "tag            : ${TAG}"
info "artifact       : ${ARTIFACT}"
info "expected id    : ${EXPECTED_IMAGE_ID}"
info "expected sha256: ${EXPECTED_SHA256}"
[ -n "${EXPECTED_SNAPSHOT}" ] && info "expected source: ${EXPECTED_SNAPSHOT}"
[ "${DRY_RUN}" = "1" ] && info "mode           : DRY-RUN (контейнер не пересоздаётся)"

[ -f "${COMPOSE_DIR}/docker-compose.prod.yml" ] || fail "нет ${COMPOSE_DIR}/docker-compose.prod.yml"
[ -f "${SECRETS_OVERRIDE}" ] || fail "нет файла секретов ${SECRETS_OVERRIDE}"
[ -f "${ARTIFACT}" ] || fail "нет артефакта ${ARTIFACT}"
command -v jq >/dev/null 2>&1 || fail "требуется jq для проверки итоговой конфигурации"

CURRENT_IMAGE="$(docker inspect "${APP_CONTAINER}" --format '{{.Config.Image}}' 2>/dev/null || echo "<нет контейнера>")"
CURRENT_ID="$(docker inspect "${APP_CONTAINER}" --format '{{.Image}}' 2>/dev/null || echo "<нет контейнера>")"
info "current image  : ${CURRENT_IMAGE} (${CURRENT_ID})"

# Тег не должен указывать на другой образ: иначе «docker load» молча перезапишет
# проверенное содержимое и подменит артефакт.
EXISTING_ID="$(docker image inspect "${IMAGE}" --format '{{.Id}}' 2>/dev/null || echo "")"
if [ -n "${EXISTING_ID}" ] && [ "${EXISTING_ID}" != "${EXPECTED_IMAGE_ID}" ]; then
  fail "тег ${IMAGE} уже указывает на другой образ (${EXISTING_ID}); ожидался ${EXPECTED_IMAGE_ID}"
fi
[ -z "${EXISTING_ID}" ] && info "tag            : свободен (образа с таким тегом нет)"

echo
echo "=== 2. проверка артефакта ==="
ACTUAL_SHA256="$(sha256sum "${ARTIFACT}" | cut -d' ' -f1)"
info "artifact sha256: ${ACTUAL_SHA256}"
[ "${ACTUAL_SHA256}" = "${EXPECTED_SHA256}" ] || fail "SHA-256 артефакта не совпадает: ожидался ${EXPECTED_SHA256}, получен ${ACTUAL_SHA256}"

echo
echo "=== 3. обязательная конфигурация доверенных прокси ==="
[ -n "${TRUSTED_PROXIES}" ] || fail "не задан TRUSTED_PROXY_IPS: без него все посетители получат один адрес и форма заявок перестанет работать"
info "TRUSTED_PROXY_IPS: ${TRUSTED_PROXIES}"
echo "${TRUSTED_PROXIES}" | tr ',' '\n' | grep -qE '^[0-9a-fA-F:.]+/[0-9]+$' \
  || fail "TRUSTED_PROXY_IPS должен содержать конкретные CIDR (например 172.18.0.1/32)"
if echo "${TRUSTED_PROXIES}" | tr ',' '\n' | grep -qxE '(0\.0\.0\.0/0|::/0|10\.0\.0\.0/8|172\.16\.0\.0/12|192\.168\.0\.0/16)'; then
  fail "TRUSTED_PROXY_IPS содержит слишком широкую подсеть"
fi

# Сеть приложения: адрес, который приложение видит как пир соединения.
APP_NETWORK="$(docker inspect "${APP_CONTAINER}" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' 2>/dev/null || echo "")"
GATEWAY=""
if [ -n "${APP_NETWORK}" ]; then
  GATEWAY="$(docker network inspect "${APP_NETWORK}" --format '{{range .IPAM.Config}}{{.Gateway}}{{end}}' 2>/dev/null || echo "")"
  info "app network    : ${APP_NETWORK}, gateway ${GATEWAY:-<нет>}"
  if [ -n "${GATEWAY}" ]; then
    echo "${TRUSTED_PROXIES}" | tr ',' '\n' | grep -qx "${GATEWAY}/32" \
      || fail "адрес шлюза сети приложения (${GATEWAY}) не входит в TRUSTED_PROXY_IPS — цепочка X-Forwarded-For будет проигнорирована"
  fi
fi

# Адрес пира для nginx (внешний TLS-Edge) должен быть доверенным.
PEER="$(tail -20000 "${NGINX_ACCESS_LOG}" 2>/dev/null | awk '{print $1}' | grep -vE '^(127\.|::1$)' | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')"
info "nginx peer     : ${PEER:-<не определён>}"
if [ -n "${PEER}" ]; then
  echo "${TRUSTED_PROXIES}" | tr ',' '\n' | grep -qx "${PEER}/32" \
    || fail "адрес пира nginx (${PEER}) не входит в TRUSTED_PROXY_IPS — адрес клиента не будет определён верно"
fi

echo
echo "=== 4. загрузка immutable-артефакта (без пересборки) ==="
docker load -i "${ARTIFACT}" >/dev/null || fail "не удалось загрузить артефакт"

LOADED_ID="$(docker image inspect "${IMAGE}" --format '{{.Id}}' 2>/dev/null || echo "")"
PLATFORM="$(docker image inspect "${IMAGE}" --format '{{.Os}}/{{.Architecture}}' 2>/dev/null || echo "")"
SNAPSHOT="$(docker image inspect "${IMAGE}" --format '{{index .Config.Labels "org.kstudio.source.snapshot.sha256"}}' 2>/dev/null || echo "")"
info "loaded id      : ${LOADED_ID}"
info "platform       : ${PLATFORM}"
info "source snapshot: ${SNAPSHOT}"

[ -n "${LOADED_ID}" ] || fail "образ ${IMAGE} не найден после загрузки артефакта"
[ "${LOADED_ID}" = "${EXPECTED_IMAGE_ID}" ] || fail "image ID не совпал: ожидался ${EXPECTED_IMAGE_ID}, получен ${LOADED_ID}"
[ "${PLATFORM}" = "linux/amd64" ] || fail "неожиданная платформа ${PLATFORM}"
if [ -n "${EXPECTED_SNAPSHOT}" ]; then
  [ "${SNAPSHOT}" = "${EXPECTED_SNAPSHOT}" ] || fail "source snapshot не совпал: ожидался ${EXPECTED_SNAPSHOT}, получен ${SNAPSHOT}"
fi

echo
echo "=== 5. проверка runtime-разметки образа ==="
docker run --rm --entrypoint sh "${IMAGE}" -c '
  set -e
  test -f /app/.output/server/index.mjs || { echo "missing .output/server/index.mjs"; exit 1; }
  test -f /app/package.json || { echo "missing package.json"; exit 1; }
  test -d /app/prisma || { echo "missing prisma"; exit 1; }
  test -d /app/node_modules/@prisma || { echo "missing @prisma/client"; exit 1; }
  test -d /app/node_modules/.prisma || { echo "missing generated prisma client"; exit 1; }
  test "$(id -u)" != "0" || { echo "image runs as root"; exit 1; }
  echo "  runtime layout OK (uid $(id -u))"
' || fail "проверка runtime-разметки образа не пройдена"

echo
echo "=== 6. подготовка override и rollback checkpoint ==="

cd "${COMPOSE_DIR}"
BASE_JSON="$(mktemp)"
RELEASE_JSON="$(mktemp)"
ROLLBACK_JSON="$(mktemp)"
trap 'rm -f "${BASE_JSON}" "${RELEASE_JSON}" "${ROLLBACK_JSON}"' EXIT

# Значения Telegram-конфигурации наследуются из работающего контейнера:
# новый релиз не должен молча менять режим логина или админа.
RUNNING_ENV="$(docker inspect "${APP_CONTAINER}" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null || true)"
CURRENT_ADMIN_ID="$(printf '%s\n' "${RUNNING_ENV}" | grep -E '^ADMIN_TELEGRAM_ID=' | head -1 | cut -d= -f2- || true)"
CURRENT_LOGIN_MODE="$(printf '%s\n' "${RUNNING_ENV}" | grep -E '^TELEGRAM_LOGIN_MODE=' | head -1 | cut -d= -f2- || true)"
CURRENT_LOGIN_MODE="${CURRENT_LOGIN_MODE:-owner_canary}"
[ -n "${CURRENT_ADMIN_ID}" ] || fail "не удалось определить ADMIN_TELEGRAM_ID работающего контейнера"
[ "${CURRENT_LOGIN_MODE}" = "owner_canary" ] || fail "Telegram Login в работающем контейнере в режиме ${CURRENT_LOGIN_MODE}, а не owner_canary"
info "login mode     : ${CURRENT_LOGIN_MODE} (унаследовано из работающего контейнера)"

OVERRIDE_FILE="${OVERRIDES}/${TAG}.yml"
cat > "${OVERRIDE_FILE}" <<YAML
services:
  app:
    image: ${IMAGE}
    # build удаляется целиком: compose не должен собирать образ из контекста.
    build: !reset null
    environment:
      TELEGRAM_LOGIN_MODE: ${CURRENT_LOGIN_MODE}
      ADMIN_TELEGRAM_ID: "${CURRENT_ADMIN_ID}"
      TRUSTED_PROXY_IPS: "${TRUSTED_PROXIES}"
YAML
info "override       : ${OVERRIDE_FILE}"

# Точка отката — фактически работающий до деплоя образ, а не жёстко
# прописанный старый релиз: откатываться нужно на предыдущий рабочий образ.
ROLLBACK_OVERRIDE="${OVERRIDES}/$(echo "${CURRENT_IMAGE}" | sed 's/^kiruhak-app://')-rollback.yml"
ROLLBACK_ID="${CURRENT_ID}"
if [ "${ROLLBACK_ID}" = "<нет контейнера>" ]; then
  fail "невозможно определить предыдущий образ для отката"
fi

# Откат возможен только если образ отката реально есть локально.
docker image inspect "${ROLLBACK_ID}" >/dev/null 2>&1 \
  || fail "образ отката ${ROLLBACK_ID} отсутствует локально — откат невозможен, деплой запрещён"
info "rollback image : ${CURRENT_IMAGE} (${ROLLBACK_ID})"

if [ -n "${EXPECT_ROLLBACK_IMAGE}" ] && [ "${CURRENT_IMAGE}" != "${EXPECT_ROLLBACK_IMAGE}" ]; then
  fail "ожидаемая точка отката ${EXPECT_ROLLBACK_IMAGE}, а работает ${CURRENT_IMAGE}"
fi
if [ -n "${EXPECT_ROLLBACK_ID}" ] && [ "${ROLLBACK_ID}" != "${EXPECT_ROLLBACK_ID}" ]; then
  fail "ожидаемый image ID отката ${EXPECT_ROLLBACK_ID}, а работает ${ROLLBACK_ID}"
fi

if [ ! -f "${ROLLBACK_OVERRIDE}" ]; then
  cat > "${ROLLBACK_OVERRIDE}" <<YAML
services:
  app:
    image: ${CURRENT_IMAGE}
    build: !reset null
    environment:
      TELEGRAM_LOGIN_MODE: ${CURRENT_LOGIN_MODE}
      ADMIN_TELEGRAM_ID: "${CURRENT_ADMIN_ID}"
YAML
fi
info "rollback file : ${ROLLBACK_OVERRIDE}"

ROLLBACK_CMD="cd ${COMPOSE_DIR} && docker compose -p ${PROJECT} -f docker-compose.prod.yml -f ${SECRETS_OVERRIDE} -f ${ROLLBACK_OVERRIDE} up -d --no-deps --force-recreate app"

# Команда отката проверяется до переключения: конфигурация с rollback-override
# должна собираться и указывать ровно на предыдущий рабочий образ.
docker compose -p "${PROJECT}" \
  -f docker-compose.prod.yml \
  -f "${SECRETS_OVERRIDE}" \
  -f "${ROLLBACK_OVERRIDE}" \
  config --format json > "${ROLLBACK_JSON}" 2>/dev/null \
  || fail "конфигурация отката не собирается — команда отката нерабочая"
jq -e --arg img "${CURRENT_IMAGE}" '.services.app.image == $img' "${ROLLBACK_JSON}" >/dev/null \
  || fail "в конфигурации отката нет образа ${CURRENT_IMAGE}"
jq -e '.services.app | has("build") | not' "${ROLLBACK_JSON}" >/dev/null \
  || fail "в конфигурации отката осталась секция build"
jq -e '.services.app.ports[0].host_ip == "127.0.0.1"' "${ROLLBACK_JSON}" >/dev/null \
  || fail "в конфигурации отката порт опубликован не на 127.0.0.1"
info "rollback config: собирается, образ ${CURRENT_IMAGE} и порт 127.0.0.1 корректны"

CHECKPOINT_FILE="${CHECKPOINTS}/${TAG}-$(date -u +%Y%m%dT%H%M%SZ).txt"
if [ "${DRY_RUN}" = "1" ]; then DEPLOY_MODE="dry-run"; else DEPLOY_MODE="deploy"; fi

# Запись чекпоинта выполняется после всех проверок: прерванная процедура
# не должна оставлять чекпоинт несостоявшегося релиза.
write_checkpoint() {
  cat > "${CHECKPOINT_FILE}" <<CHECKPOINT
checkpoint=$(date -u +%Y%m%dT%H%M%SZ)
release=${TAG}
deploy_mode=${DEPLOY_MODE}
app_image=${IMAGE}
app_image_id=${LOADED_ID}
source_snapshot_sha256=${SNAPSHOT}
artifact=${ARTIFACT}
artifact_sha256=${EXPECTED_SHA256}
previous_image=${CURRENT_IMAGE}
previous_image_id=${ROLLBACK_ID}
compose_project=${PROJECT}
compose_files=${COMPOSE_DIR}/docker-compose.prod.yml,${SECRETS_OVERRIDE},${OVERRIDE_FILE}
rollback_override=${ROLLBACK_OVERRIDE}
rollback_command=${ROLLBACK_CMD}
rollback_note=откат на непосредственно предыдущий рабочий образ; БД не меняется
db_invariants=5|10|14|21|3|1|1
trusted_proxies=${TRUSTED_PROXIES}
CHECKPOINT
  info "checkpoint     : ${CHECKPOINT_FILE}"
}

echo
echo "=== 7. проверка итоговой конфигурации compose ==="
cd "${COMPOSE_DIR}"

# Базовая конфигурация — та, по которой реально работает контейнер.
BASE_FILES_RAW="$(docker inspect "${APP_CONTAINER}" --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}' 2>/dev/null || true)"
[ -n "${BASE_FILES_RAW}" ] || BASE_FILES_RAW="${COMPOSE_DIR}/docker-compose.prod.yml,${SECRETS_OVERRIDE}"
info "base config    : ${BASE_FILES_RAW}"

BASE_ARGS=()
IFS=',' read -r -a BASE_PARTS <<< "${BASE_FILES_RAW}"
for f in "${BASE_PARTS[@]}"; do
  [ -f "${f}" ] || fail "базовый compose-файл ${f} не найден"
  BASE_ARGS+=(-f "${f}")
done

export TRUSTED_PROXY_IPS="${TRUSTED_PROXIES}"
export ADMIN_TELEGRAM_ID="${CURRENT_ADMIN_ID}"

docker compose -p "${PROJECT}" "${BASE_ARGS[@]}" config --format json > "${BASE_JSON}" 2>/dev/null \
  || fail "не удалось отрендерить базовую конфигурацию compose"
docker compose -p "${PROJECT}" \
  -f docker-compose.prod.yml \
  -f "${SECRETS_OVERRIDE}" \
  -f "${OVERRIDE_FILE}" \
  config --format json > "${RELEASE_JSON}" 2>/dev/null \
  || fail "docker compose config завершился с ошибкой"

check() { # $1 — jq-программа, $2 — сообщение, далее — аргументы jq
  local prog="$1"; local msg="$2"; shift 2
  if ! jq -e "$@" "${prog}" "${RELEASE_JSON}" >/dev/null 2>&1; then
    fail "${msg}"
  fi
}

check '.services.app.image == $img' "в итоговой конфигурации нет образа ${IMAGE}" --arg img "${IMAGE}"
info "app image      : ${IMAGE}"

check '.services.app | has("build") | not' "у сервиса app осталась секция build — compose может пересобрать образ"
info "app build      : отсутствует (пересборка исключена)"

# Порт приложения публикуется только на loopback.
check '.services.app.ports | length == 1' "у app ожидается ровно один опубликованный порт"
check '.services.app.ports[0].host_ip == "127.0.0.1"' "порт 3015 опубликован не на 127.0.0.1 — прямой доступ в обход Nginx запрещён"
check '.services.app.ports[0].published == "3015" and .services.app.ports[0].target == 3015' "опубликованный порт 3015 настроен неверно"
info "ports          : 127.0.0.1:3015:3015 (внешний доступ исключён)"

# TRUSTED_PROXY_IPS обязан попасть в окружение именно app.
check '.services.app.environment.TRUSTED_PROXY_IPS == $proxies' "TRUSTED_PROXY_IPS не попал в окружение app или неверное значение" --arg proxies "${TRUSTED_PROXIES}"
info "TRUSTED_PROXY_IPS в окружении app: ${TRUSTED_PROXIES}"

check '.services.app.environment.TELEGRAM_LOGIN_MODE == "owner_canary"' "Telegram Login должен остаться в режиме owner_canary"
check '.services.app.environment.ADMIN_TELEGRAM_ID != null and .services.app.environment.ADMIN_TELEGRAM_ID != ""' "ADMIN_TELEGRAM_ID пуст в окружении app"
info "app env        : TELEGRAM_LOGIN_MODE=owner_canary, ADMIN_TELEGRAM_ID — на месте"

# Обязательные секреты на месте (значения не печатаются).
for key in BOT_SECRET AUTH_TOKEN_SECRET NUXT_AUTH_TOKEN_SECRET TELEGRAM_BOT_TOKEN DATABASE_URL; do
  check '.services.app.environment | has($k)' "в окружении app отсутствует ${key}" --arg k "${key}"
done
info "app secrets    : BOT_SECRET, AUTH_TOKEN_SECRET, NUXT_AUTH_TOKEN_SECRET, TELEGRAM_BOT_TOKEN, DATABASE_URL — на месте"

# PostgreSQL, бот и соседние сервисы не меняются.
check '.services.postgres == $base[0].services.postgres' "конфигурация postgres изменилась" --slurpfile base "${BASE_JSON}"
check '.services.bot == $base[0].services.bot' "конфигурация бота изменилась" --slurpfile base "${BASE_JSON}"
info "postgres, bot  : конфигурация не изменилась"

# Окружение app может отличаться от базового только TRUSTED_PROXY_IPS.
ENVDIFF="$(jq -n --slurpfile base "${BASE_JSON}" --slurpfile rel "${RELEASE_JSON}" '
  ($base[0].services.app.environment) as $a | ($rel[0].services.app.environment) as $b |
  { removed: (($a|keys) - ($b|keys)),
    added:   (($b|keys) - ($a|keys)),
    changed: [($a|keys[]) as $k | select(($b|has($k)) and (($a[$k]|tostring) != ($b[$k]|tostring))) | $k] }')"
DIFF_ADDED="$(jq -r '.added | join(",")' <<< "${ENVDIFF}")"
DIFF_REMOVED="$(jq -r '.removed | join(",")' <<< "${ENVDIFF}")"
DIFF_CHANGED="$(jq -r '.changed | join(",")' <<< "${ENVDIFF}")"
[ "${DIFF_ADDED}" = "TRUSTED_PROXY_IPS" ] || fail "в окружении app появились неожиданные переменные: ${DIFF_ADDED}"
[ -z "${DIFF_REMOVED}" ] || fail "из окружения app исчезли переменные: ${DIFF_REMOVED}"
[ -z "${DIFF_CHANGED}" ] || fail "в окружении app изменились значения переменных: ${DIFF_CHANGED}"
info "app env delta  : только TRUSTED_PROXY_IPS (остальное без изменений)"

# Контейнеры, которые не должны меняться, фиксируем до деплоя.
POSTGRES_BEFORE="$(docker inspect kiruhak_postgres --format '{{.Config.Image}}|{{.Id}}' 2>/dev/null || echo "")"
BOT_BEFORE="$(docker inspect kiruhak_bot --format '{{.Config.Image}}|{{.Id}}' 2>/dev/null || echo "")"
info "postgres       : ${POSTGRES_BEFORE} (не трогаем)"
info "bot            : ${BOT_BEFORE} (не трогаем)"

# Все проверки пройдены — только теперь фиксируется чекпоинт релиза.
write_checkpoint

if [ "${DRY_RUN}" = "1" ]; then
  echo
  echo "=== DRY-RUN: деплой не выполняется ==="
  echo "  единственный изменяемый сервис: app"
  echo "  команда деплоя:"
  echo "    cd ${COMPOSE_DIR} && docker compose -p ${PROJECT} -f docker-compose.prod.yml -f ${SECRETS_OVERRIDE} -f ${OVERRIDE_FILE} up -d --no-deps --force-recreate app"
  echo "  команда отката:"
  echo "    ${ROLLBACK_CMD}"
  echo "  checkpoint: ${CHECKPOINT_FILE}"
  exit 0
fi

echo
echo "=== 8. deploy (app only, --no-deps) ==="
docker compose -p "${PROJECT}" \
  -f docker-compose.prod.yml \
  -f "${SECRETS_OVERRIDE}" \
  -f "${OVERRIDE_FILE}" \
  up -d --no-deps --force-recreate app

echo
echo "=== 9. wait for health ==="
for i in $(seq 1 60); do
  status=$(docker inspect "${APP_CONTAINER}" --format '{{.State.Health.Status}}' 2>/dev/null || echo "starting")
  echo "  t+${i}s health=${status}"
  [ "${status}" = "healthy" ] && break
  sleep 1
done
docker inspect "${APP_CONTAINER}" --format '  {{.Config.Image}} | {{.Image}} | {{.State.Status}} | {{.State.Health.Status}}'
docker inspect "${APP_CONTAINER}" --format '{{json .HostConfig.PortBindings}}' | sed 's/^/  ports: /'

# Контейнеры, которые не должны меняться, остались нетронутыми.
[ "$(docker inspect kiruhak_postgres --format '{{.Config.Image}}|{{.Id}}' 2>/dev/null)" = "${POSTGRES_BEFORE}" ] \
  || fail "контейнер PostgreSQL изменился — этого не должно было произойти"
[ "$(docker inspect kiruhak_bot --format '{{.Config.Image}}|{{.Id}}' 2>/dev/null)" = "${BOT_BEFORE}" ] \
  || fail "контейнер бота изменился — этого не должно было произойти"
info "postgres, bot  : не изменены (image и id совпадают)"

echo
echo "=== 10. post-deploy smoke ==="
bash "$(dirname "$0")/verify-production.sh" https://kiruhak11.ru || echo "  !! verify-production.sh вернул ненулевой код"
bash "$(dirname "$0")/verify-security-headers.sh" https://kiruhak11.ru || echo "  !! verify-security-headers.sh вернул ненулевой код"

echo
echo "=== DEPLOY DONE ==="
echo "checkpoint: ${CHECKPOINT_FILE}"
