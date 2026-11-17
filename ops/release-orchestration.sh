#!/usr/bin/env bash
# K-Studio release orchestration: health gate, blocking post-deploy smoke,
# automatic rollback.
#
# The script owns the phase that follows the container switch: it decides
# whether the release is actually usable. It never trusts the fact that the
# container is alive — a running container with a failing HTTP contract is a
# failed release.
#
# Release states (written to --state-file):
#
#   PREPARED    checkpoint is saved, nothing has been switched yet
#   DEPLOYING   the new container is up, verification is in progress
#   VERIFIED    health, image identity and both smoke suites passed
#   FAILED      verification failed; the release is not usable
#   ROLLED_BACK the previous image was restored and confirmed
#   BLOCKED     rollback could not be performed safely — needs a human
#
# Exit codes:
#   0  release verified
#   1  release failed, previous image restored (or failure before the switch)
#   2  release failed and rollback could not be performed safely — BLOCKER
#
# Usage:
#   release-orchestration.sh --container <name> --expected-image-id <sha256:...> \
#     --rollback-image-id <sha256:...> --rollback-override <file> \
#     --compose-dir <dir> --compose-file <file> [--compose-file <file> ...] \
#     --state-file <file> --log-file <file> \
#     --smoke-production <script> --smoke-security <script> \
#     [--smoke-rollback <script>] [--smoke-base-url <url>] \
#     [--health-timeout <seconds>] [--release <tag>] [--no-rollback]

set -uo pipefail

CONTAINER=""
EXPECTED_IMAGE_ID=""
ROLLBACK_IMAGE_ID=""
ROLLBACK_OVERRIDE=""
COMPOSE_DIR=""
PROJECT="kiruhak"
COMPOSE_FILES=()
STATE_FILE=""
LOG_FILE=""
HEALTH_TIMEOUT=60
SMOKE_PRODUCTION=""
SMOKE_SECURITY=""
SMOKE_ROLLBACK=""
SMOKE_BASE_URL=""
RELEASE="unknown"
ROLLBACK_ENABLED=1

while [ $# -gt 0 ]; do
  case "$1" in
    --container) CONTAINER="$2"; shift 2 ;;
    --expected-image-id) EXPECTED_IMAGE_ID="$2"; shift 2 ;;
    --rollback-image-id) ROLLBACK_IMAGE_ID="$2"; shift 2 ;;
    --rollback-override) ROLLBACK_OVERRIDE="$2"; shift 2 ;;
    --compose-dir) COMPOSE_DIR="$2"; shift 2 ;;
    --compose-file) COMPOSE_FILES+=("$2"); shift 2 ;;
    --project) PROJECT="$2"; shift 2 ;;
    --state-file) STATE_FILE="$2"; shift 2 ;;
    --log-file) LOG_FILE="$2"; shift 2 ;;
    --health-timeout) HEALTH_TIMEOUT="$2"; shift 2 ;;
    --smoke-production) SMOKE_PRODUCTION="$2"; shift 2 ;;
    --smoke-security) SMOKE_SECURITY="$2"; shift 2 ;;
    --smoke-rollback) SMOKE_ROLLBACK="$2"; shift 2 ;;
    --smoke-base-url) SMOKE_BASE_URL="$2"; shift 2 ;;
    --release) RELEASE="$2"; shift 2 ;;
    --no-rollback) ROLLBACK_ENABLED=0; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

STATE="PREPARED"
RELEASE_RESULT="pending"
FAILED_CHECK=""
ERROR=""
ROLLBACK_STATUS="not-needed"
HEALTH_RESULT=""

[ -n "${CONTAINER}" ] || { echo "orchestration: --container is required" >&2; exit 2; }
[ -n "${STATE_FILE}" ] || { echo "orchestration: --state-file is required" >&2; exit 2; }
[ -n "${LOG_FILE}" ] || { echo "orchestration: --log-file is required" >&2; exit 2; }
[ -n "${EXPECTED_IMAGE_ID}" ] || { echo "orchestration: --expected-image-id is required" >&2; exit 2; }

mkdir -p "$(dirname "${STATE_FILE}")" "$(dirname "${LOG_FILE}")" 2>/dev/null || true

log() { printf '%s\n' "$*" | tee -a "${LOG_FILE}"; }

write_state() {
  {
    echo "state=${STATE}"
    echo "release=${RELEASE}"
    echo "release_result=${RELEASE_RESULT}"
    echo "timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "expected_image_id=${EXPECTED_IMAGE_ID}"
    echo "rollback_image_id=${ROLLBACK_IMAGE_ID}"
    echo "rollback=${ROLLBACK_STATUS}"
    [ -n "${FAILED_CHECK}" ] && echo "failed_check=${FAILED_CHECK}"
    [ -n "${ERROR}" ] && echo "error=${ERROR}"
    [ -n "${HEALTH_RESULT}" ] && echo "health_result=${HEALTH_RESULT}"
  } > "${STATE_FILE}"
}

# --- health gate -------------------------------------------------------------
# Контейнер должен существовать, работать на ожидаемом image ID и стать
# healthy. Любое отклонение — провал релиза.
wait_healthy() { # $1 — ожидаемый image ID, $2 — таймаут в секундах
  local expected="$1" timeout="$2"
  local deadline=$((SECONDS + timeout))
  local running image status
  while [ "${SECONDS}" -lt "${deadline}" ]; do
    running="$(docker inspect "${CONTAINER}" --format '{{.State.Status}}' 2>/dev/null || echo "")"
    if [ -z "${running}" ]; then
      HEALTH_RESULT="container-missing"
      return 1
    fi
    image="$(docker inspect "${CONTAINER}" --format '{{.Image}}' 2>/dev/null || echo "")"
    if [ -n "${image}" ] && [ "${image}" != "${expected}" ]; then
      HEALTH_RESULT="unexpected-image-id:${image}"
      return 1
    fi
    status="$(docker inspect "${CONTAINER}" --format '{{.State.Health.Status}}' 2>/dev/null || echo "")"
    case "${status}" in
      healthy)
        HEALTH_RESULT="healthy"
        return 0
        ;;
      unhealthy)
        HEALTH_RESULT="unhealthy"
        return 1
        ;;
      *)
        ;;
    esac
    sleep 1
  done
  HEALTH_RESULT="timeout:${timeout}s"
  return 1
}

# --- blocking smoke ----------------------------------------------------------
# Смоук обязателен: ненулевой код означает провал релиза, а не «предупреждение».
run_smoke() { # $1 — скрипт, $2 — имя проверки, $3 — базовый URL
  local script="$1" label="$2" base="$3"
  if [ -z "${script}" ]; then
    return 0
  fi
  if [ ! -f "${script}" ]; then
    FAILED_CHECK="${label}"
    ERROR="smoke script not found: ${script}"
    return 1
  fi
  log "--- smoke: ${label} (${script}) ---"
  bash "${script}" "${base}" >>"${LOG_FILE}" 2>&1
  local code=$?
  if [ "${code}" -ne 0 ]; then
    FAILED_CHECK="${label}"
    ERROR="smoke ${label} failed with exit code ${code}"
    log "smoke ${label}: FAIL (exit ${code})"
    return 1
  fi
  log "smoke ${label}: PASS"
  return 0
}

# --- rollback ----------------------------------------------------------------
# Используется уже проверенная конфигурация отката: тот же override, который
# был проверен до переключения. БД не затрагивается.
rollback() {
  ROLLBACK_STATUS="attempted"
  if [ "${ROLLBACK_ENABLED}" != "1" ]; then
    ERROR="${ERROR}; rollback disabled by configuration"
    ROLLBACK_STATUS="failed"
    return 2
  fi
  if [ -z "${ROLLBACK_OVERRIDE}" ] || [ ! -f "${ROLLBACK_OVERRIDE}" ]; then
    ERROR="${ERROR}; rollback override missing: ${ROLLBACK_OVERRIDE}"
    ROLLBACK_STATUS="failed"
    return 2
  fi
  if [ -z "${ROLLBACK_IMAGE_ID}" ]; then
    ERROR="${ERROR}; rollback image id is unknown"
    ROLLBACK_STATUS="failed"
    return 2
  fi
  if ! docker image inspect "${ROLLBACK_IMAGE_ID}" >/dev/null 2>&1; then
    ERROR="${ERROR}; rollback image ${ROLLBACK_IMAGE_ID} is not available locally"
    ROLLBACK_STATUS="failed"
    return 2
  fi

  log "--- rollback: restoring ${ROLLBACK_IMAGE_ID} ---"
  local args=()
  local f
  for f in "${COMPOSE_FILES[@]}"; do
    args+=(-f "${f}")
  done
  ( cd "${COMPOSE_DIR}" && docker compose -p "${PROJECT}" "${args[@]}" \
      -f "${ROLLBACK_OVERRIDE}" up -d --no-deps --force-recreate app ) >>"${LOG_FILE}" 2>&1
  if [ $? -ne 0 ]; then
    ERROR="${ERROR}; rollback command failed"
    ROLLBACK_STATUS="failed"
    return 2
  fi

  # Итоговое состояние health-гейта — результат проверки нового образа:
  # результат проверки отката не должен затирать причину провала релиза.
  local saved_health="${HEALTH_RESULT}"
  HEALTH_RESULT=""
  if ! wait_healthy "${ROLLBACK_IMAGE_ID}" "${HEALTH_TIMEOUT}"; then
    ERROR="${ERROR}; rollback container is not healthy (${HEALTH_RESULT})"
    HEALTH_RESULT="${saved_health}"
    ROLLBACK_STATUS="failed"
    return 2
  fi
  HEALTH_RESULT="${saved_health}"

  # Базовый смоук отката: у прежнего образа нет новых security-заголовков,
  # требовать их от него нельзя. Причина провала релиза при этом сохраняется:
  # в state-файле должно остаться имя проверки, из-за которой релиз не прошёл.
  if [ -n "${SMOKE_ROLLBACK}" ]; then
    local saved_check="${FAILED_CHECK}" saved_error="${ERROR}"
    if ! run_smoke "${SMOKE_ROLLBACK}" "rollback-smoke" "${SMOKE_BASE_URL}"; then
      ERROR="${saved_error}; rollback smoke failed"
      ROLLBACK_STATUS="failed"
      return 2
    fi
    FAILED_CHECK="${saved_check}"
    ERROR="${saved_error}"
  fi

  ROLLBACK_STATUS="performed"
  return 0
}

fail_release() { # $1 — код выхода при отказе; состояние уже выставлено вызывающим
  write_state
  log ""
  log "=== RELEASE FAILED ==="
  log "  failed_check : ${FAILED_CHECK:-<none>}"
  log "  error        : ${ERROR:-<none>}"
  log "  state file   : ${STATE_FILE}"
  log "  log file     : ${LOG_FILE}"
  exit "$1"
}

# --- main --------------------------------------------------------------------
log "=== release orchestration: ${RELEASE} ==="
log "  container    : ${CONTAINER}"
log "  expected id  : ${EXPECTED_IMAGE_ID}"
log "  health gate  : ${HEALTH_TIMEOUT}s"
log "  state file   : ${STATE_FILE}"

STATE="DEPLOYING"
write_state

if ! wait_healthy "${EXPECTED_IMAGE_ID}" "${HEALTH_TIMEOUT}"; then
  ERROR="health gate failed: ${HEALTH_RESULT}"
  FAILED_CHECK="docker-health"
  if rollback; then
    STATE="ROLLED_BACK"
    RELEASE_RESULT="failed"
    write_state
    log "  rollback     : выполнен, прежний образ возвращён"
    fail_release 1
  fi
  ROLLBACK_STATUS="failed"
  STATE="BLOCKED"
  RELEASE_RESULT="failed"
  write_state
  log "  rollback     : НЕ ВЫПОЛНЕН — требуется вмешательство"
  fail_release 2
fi
log "  health       : healthy (${HEALTH_RESULT})"

if ! run_smoke "${SMOKE_PRODUCTION}" "verify-production.sh" "${SMOKE_BASE_URL}"; then
  if rollback; then
    STATE="ROLLED_BACK"
    RELEASE_RESULT="failed"
    write_state
    log "  rollback     : выполнен, прежний образ возвращён"
    fail_release 1
  fi
  ROLLBACK_STATUS="failed"
  STATE="BLOCKED"
  RELEASE_RESULT="failed"
  write_state
  log "  rollback     : НЕ ВЫПОЛНЕН — требуется вмешательство"
  fail_release 2
fi

if ! run_smoke "${SMOKE_SECURITY}" "verify-security-headers.sh" "${SMOKE_BASE_URL}"; then
  if rollback; then
    STATE="ROLLED_BACK"
    RELEASE_RESULT="failed"
    write_state
    log "  rollback     : выполнен, прежний образ возвращён"
    fail_release 1
  fi
  ROLLBACK_STATUS="failed"
  STATE="BLOCKED"
  RELEASE_RESULT="failed"
  write_state
  log "  rollback     : НЕ ВЫПОЛНЕН — требуется вмешательство"
  fail_release 2
fi

STATE="VERIFIED"
RELEASE_RESULT="verified"
ROLLBACK_STATUS="not-needed"
write_state
log ""
log "=== RELEASE VERIFIED ==="
log "  state file   : ${STATE_FILE}"
log "  log file     : ${LOG_FILE}"
exit 0
