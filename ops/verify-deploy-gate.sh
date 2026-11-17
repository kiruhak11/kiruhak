#!/usr/bin/env bash
# K-Studio release gate for ops/deploy-app.sh.
#
# Runs the deploy procedure in DRY-RUN mode against the real production
# compose project and then proves that the procedure refuses to continue when
# any safety condition is violated:
#
#   1) wrong artifact SHA-256
#   2) missing TRUSTED_PROXY_IPS
#   3) wrong PortBindings (port published beyond 127.0.0.1)
#   4) rollback image missing locally
#
# The production container is never recreated: every scenario below either
# aborts before the deploy step or runs with --dry-run. The script asserts
# that the app container id is unchanged at the end.
#
# Environment overrides (defaults match the security-headers-rate-limit release):
#   TAG ARTIFACT SHA256 IMAGE_ID SNAPSHOT TRUSTED_PROXIES
#   ROLLBACK_IMAGE ROLLBACK_IMAGE_ID

set -uo pipefail

TAG="${TAG:-security-headers-rate-limit-20261117}"
ARTIFACT="${ARTIFACT:-/var/lib/kiruhak/security-headers-rate-limit-20261117-linux-amd64.tar.gz}"
SHA256="${SHA256:-96c3524fc4f7e177713d707c21940950eb213f5a5e40ede6cecfeb57e0efe7c2}"
IMAGE_ID="${IMAGE_ID:-sha256:3819f38f9ce9b72bc2c59a7fd2e168f211df5aa91743e76529be0bc8ed248534}"
SNAPSHOT="${SNAPSHOT:-aa8996ac34a6ba5422a5615e9e9acf6074d61cfc8cf0f61e849f5e0dc356726f}"
TRUSTED_PROXIES="${TRUSTED_PROXIES:-172.18.0.1/32,81.177.135.137/32}"
ROLLBACK_IMAGE="${ROLLBACK_IMAGE:-kiruhak-app:api-fail-closed-20261115}"
ROLLBACK_IMAGE_ID="${ROLLBACK_IMAGE_ID:-sha256:245d1e23bcbda156ab70d9807a902887ad60b257977f72c333317e8012bf745b}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY="${SCRIPT_DIR}/deploy-app.sh"
SANDBOX="$(mktemp -d /tmp/kstudio-deploy-gate-XXXXXX)"
SHIM="${SANDBOX}/shim"
mkdir -p "${SHIM}"

PASS_COUNT=0
FAIL_COUNT=0

pass() { echo "  [PASS] $*"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo "  [FAIL] $*"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

# Песочница для compose-файлов и override/checkpoint-каталогов: реальные
# каталоги production не затрагиваются.
SB_COMPOSE="${SANDBOX}/compose"
SB_OVERRIDES="${SANDBOX}/overrides"
SB_CHECKPOINTS="${SANDBOX}/checkpoints"
REAL_SECRETS_OVERRIDE="${SECRETS_OVERRIDE:-/var/lib/kiruhak/release-overrides/app-secrets.override.yml}"
mkdir -p "${SB_COMPOSE}" "${SB_OVERRIDES}" "${SB_CHECKPOINTS}"
cp /var/www/html/kiruhak/docker-compose.prod.yml "${SB_COMPOSE}/docker-compose.prod.yml"
# Compose читает .env из каталога проекта. В песочнице нужен тот же набор
# переменных — ссылка на рабочий файл, без копирования секретов.
ln -sf /var/www/html/kiruhak/.env "${SB_COMPOSE}/.env"

# Обёртка docker, подменяющая image id работающего контейнера на
# несуществующий — так проверяется отказ при отсутствующем образе отката.
cat > "${SHIM}/docker" <<'SHIMEOF'
#!/usr/bin/env bash
if [ "$1" = "inspect" ] && [ "$4" = "{{.Image}}" ]; then
  echo "sha256:0000000000000000000000000000000000000000000000000000000000000000"
  exit 0
fi
exec /usr/bin/docker "$@"
SHIMEOF
chmod +x "${SHIM}/docker"

CONTAINER_BEFORE="$(docker inspect kiruhak_app --format '{{.Id}}' 2>/dev/null || echo "<нет>")"
echo "app container before gate: ${CONTAINER_BEFORE}"

run_gate() { # $1 — описание, $2 — ожидаемый фрагмент вывода, $3 — ожидаемый код,
             # остальные — аргументы команды
  local desc="$1"; local expect_msg="$2"; local expect_code="$3"; shift 3
  local out code
  out="$("$@" 2>&1)"; code=$?
  if [ "${code}" != "${expect_code}" ]; then
    fail "${desc}: код ${code}, ожидался ${expect_code}"
    printf '%s\n' "${out}" | tail -5 | sed 's/^/        /'
    return
  fi
  if [ -n "${expect_msg}" ] && ! printf '%s' "${out}" | grep -qF "${expect_msg}"; then
    fail "${desc}: в выводе нет ожидаемого сообщения «${expect_msg}»"
    printf '%s\n' "${out}" | tail -5 | sed 's/^/        /'
    return
  fi
  pass "${desc}"
}

COMMON_ARGS=(--tag "${TAG}" --artifact "${ARTIFACT}" --sha256 "${SHA256}"
             --image-id "${IMAGE_ID}" --snapshot "${SNAPSHOT}")

echo
echo "=== 1. DRY-RUN с корректными параметрами ==="
DRY_OUT="${SANDBOX}/dryrun.log"
if COMPOSE_DIR=/var/www/html/kiruhak OVERRIDES="${SB_OVERRIDES}" CHECKPOINTS="${SB_CHECKPOINTS}" SECRETS_OVERRIDE="${REAL_SECRETS_OVERRIDE}" \
   bash "${DEPLOY}" "${COMMON_ARGS[@]}" --trusted-proxies "${TRUSTED_PROXIES}" \
   --expect-rollback-image "${ROLLBACK_IMAGE}" --expect-rollback-image-id "${ROLLBACK_IMAGE_ID}" \
   --dry-run > "${DRY_OUT}" 2>&1; then
  pass "dry-run завершился успешно"
  for needle in \
      "artifact sha256: ${SHA256}" \
      "loaded id      : ${IMAGE_ID}" \
      "platform       : linux/amd64" \
      "source snapshot: ${SNAPSHOT}" \
      "ports          : 127.0.0.1:3015:3015" \
      "TRUSTED_PROXY_IPS в окружении app" \
      "app env delta  : только TRUSTED_PROXY_IPS" \
      "postgres, bot  : конфигурация не изменилась" \
      "app build      : отсутствует (пересборка исключена)" \
      "DRY-RUN: деплой не выполняется" \
      "единственный изменяемый сервис: app"; do
    if grep -qF "${needle}" "${DRY_OUT}"; then
      pass "dry-run: ${needle}"
    else
      fail "dry-run: нет строки «${needle}»"
    fi
  done
  # В dry-run приложение остаётся на прежнем образе.
  if docker inspect kiruhak_app --format '{{.Config.Image}}' | grep -qF "${ROLLBACK_IMAGE}"; then
    pass "dry-run: контейнер не пересоздан (образ прежний)"
  else
    fail "dry-run: образ контейнера изменился"
  fi
  # Чекпоинт релиза: точка отката, команда отката и использованные файлы.
  CP_FILE="$(ls -1 "${SB_CHECKPOINTS}"/*.txt 2>/dev/null | head -1)"
  if [ -n "${CP_FILE}" ]; then
    pass "dry-run: rollback checkpoint создан"
    for needle in \
        "previous_image=${ROLLBACK_IMAGE}" \
        "previous_image_id=${ROLLBACK_IMAGE_ID}" \
        "deploy_mode=dry-run" \
        "rollback_command=cd " \
        "rollback_override=" \
        "app_image_id=${IMAGE_ID}" \
        "artifact_sha256=${SHA256}" \
        "trusted_proxies=${TRUSTED_PROXIES}" \
        "db_invariants=5|10|14|21|3|1|1"; do
      if grep -qF "${needle}" "${CP_FILE}"; then
        pass "checkpoint: ${needle}"
      else
        fail "checkpoint: нет поля «${needle}»"
      fi
    done
  else
    fail "dry-run: rollback checkpoint не создан"
  fi
else
  fail "dry-run завершился с ошибкой"
  tail -20 "${DRY_OUT}" | sed 's/^/        /'
fi

echo
echo "=== 2. негативные сценарии ==="

# (а) неверный SHA-256 артефакта
run_gate "неверный SHA-256 останавливает процедуру" \
  "SHA-256 артефакта не совпадает" 1 \
  env COMPOSE_DIR=/var/www/html/kiruhak OVERRIDES="${SB_OVERRIDES}" CHECKPOINTS="${SB_CHECKPOINTS}" SECRETS_OVERRIDE="${REAL_SECRETS_OVERRIDE}" \
  bash "${DEPLOY}" --tag "${TAG}" --artifact "${ARTIFACT}" --sha256 "0000000000000000000000000000000000000000000000000000000000000000" \
  --image-id "${IMAGE_ID}" --snapshot "${SNAPSHOT}" --trusted-proxies "${TRUSTED_PROXIES}" --dry-run

# (б) отсутствует TRUSTED_PROXY_IPS
run_gate "отсутствие TRUSTED_PROXY_IPS останавливает процедуру" \
  "не задан TRUSTED_PROXY_IPS" 1 \
  env -u TRUSTED_PROXY_IPS COMPOSE_DIR=/var/www/html/kiruhak OVERRIDES="${SB_OVERRIDES}" CHECKPOINTS="${SB_CHECKPOINTS}" SECRETS_OVERRIDE="${REAL_SECRETS_OVERRIDE}" \
  bash "${DEPLOY}" "${COMMON_ARGS[@]}" --dry-run

# (в) неверные PortBindings: порт опубликован наружу, а не на loopback.
# Процедура должна отказать на любой стадии: и при проверке конфигурации
# отката, и при проверке итоговой конфигурации релиза.
SB_BAD_COMPOSE="${SANDBOX}/compose-bad"
mkdir -p "${SB_BAD_COMPOSE}"
sed 's|"127.0.0.1:3015:3015"|"3015:3015"|' /var/www/html/kiruhak/docker-compose.prod.yml > "${SB_BAD_COMPOSE}/docker-compose.prod.yml"
ln -sf /var/www/html/kiruhak/.env "${SB_BAD_COMPOSE}/.env"
grep -q '"3015:3015"' "${SB_BAD_COMPOSE}/docker-compose.prod.yml" || { echo "  [FAIL] не удалось подготовить неверный compose"; exit 1; }
run_gate "неверные PortBindings останавливают процедуру" \
  "не на 127.0.0.1" 1 \
  env COMPOSE_DIR="${SB_BAD_COMPOSE}" OVERRIDES="${SB_OVERRIDES}" CHECKPOINTS="${SB_CHECKPOINTS}" SECRETS_OVERRIDE="${REAL_SECRETS_OVERRIDE}" \
  bash "${DEPLOY}" "${COMMON_ARGS[@]}" --trusted-proxies "${TRUSTED_PROXIES}" --dry-run

# (г) образ отката отсутствует локально
run_gate "отсутствие образа отката останавливает процедуру" \
  "образ отката" 1 \
  env PATH="${SHIM}:${PATH}" COMPOSE_DIR=/var/www/html/kiruhak OVERRIDES="${SB_OVERRIDES}" CHECKPOINTS="${SB_CHECKPOINTS}" SECRETS_OVERRIDE="${REAL_SECRETS_OVERRIDE}" \
  bash "${DEPLOY}" "${COMMON_ARGS[@]}" --trusted-proxies "${TRUSTED_PROXIES}" --dry-run

# (д) тег, указывающий на другой образ
run_gate "тег, указывающий на другой образ, останавливает процедуру" \
  "уже указывает на другой образ" 1 \
  env COMPOSE_DIR=/var/www/html/kiruhak OVERRIDES="${SB_OVERRIDES}" CHECKPOINTS="${SB_CHECKPOINTS}" SECRETS_OVERRIDE="${REAL_SECRETS_OVERRIDE}" \
  bash "${DEPLOY}" --tag "api-fail-closed-20261115" --artifact "${ARTIFACT}" --sha256 "${SHA256}" \
  --image-id "${IMAGE_ID}" --snapshot "${SNAPSHOT}" --trusted-proxies "${TRUSTED_PROXIES}" --dry-run

echo
echo "=== 3. инварианты ==="
CONTAINER_AFTER="$(docker inspect kiruhak_app --format '{{.Id}}' 2>/dev/null || echo "<нет>")"
if [ "${CONTAINER_BEFORE}" = "${CONTAINER_AFTER}" ]; then
  pass "production-контейнер app не пересоздан (id не изменился)"
else
  fail "production-контейнер app был пересоздан"
fi
if docker inspect kiruhak_app --format '{{.Config.Image}}' | grep -qF "${ROLLBACK_IMAGE}"; then
  pass "production по-прежнему работает на ${ROLLBACK_IMAGE}"
else
  fail "production работает не на ожидаемом образе"
fi
if docker image inspect "${ROLLBACK_IMAGE_ID}" >/dev/null 2>&1; then
  pass "образ отката доступен локально"
else
  fail "образ отката отсутствует локально"
fi
# Прерванные процедуры не должны оставлять чекпоинт несостоявшегося релиза.
CP_COUNT="$(find "${SB_CHECKPOINTS}" -maxdepth 1 -name '*.txt' | wc -l | tr -d ' ')"
if [ "${CP_COUNT}" = "1" ]; then
  pass "прерванные прогоны не оставили чекпоинтов (чекпоинт только у успешного dry-run)"
else
  fail "чекпоинтов в каталоге отката: ${CP_COUNT}, ожидался 1"
fi

echo
echo "=== ИТОГ ==="
echo "  PASS: ${PASS_COUNT}"
echo "  FAIL: ${FAIL_COUNT}"
echo "  песочница: ${SANDBOX}"
[ "${FAIL_COUNT}" -eq 0 ] || exit 1
exit 0
