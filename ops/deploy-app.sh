#!/usr/bin/env bash
# K-Studio app-only production deploy (no DB, no bot, no nginx, no DNS).
#
# Usage: deploy-app.sh <image_tag>
#   - builds the immutable image from the prepared release candidate
#   - verifies image identity, platform and runtime layout
#   - writes the release override + rollback checkpoint
#   - recreates ONLY the app service with --no-deps
#
# The PostgreSQL container, the bot container, nginx and DNS are never touched.

set -euo pipefail

TAG="${1:?usage: deploy-app.sh <image-tag>}"
SRC="${SRC:-/var/tmp/kiruhak-build/rc-e}"
COMPOSE_DIR=/var/www/html/kiruhak
OVERRIDES=/var/lib/kiruhak/release-overrides
IMAGE="kiruhak-app:${TAG}"
CHECKPOINTS=/var/lib/kiruhak/rollback-checkpoints

echo "=== 1. pre-flight ==="
echo "current image : $(docker inspect kiruhak_app --format '{{.Config.Image}}')"
echo "current id    : $(docker inspect kiruhak_app --format '{{.Image}}')"
echo "source dir    : ${SRC}"
test -f "${SRC}/Dockerfile" || { echo "no Dockerfile in ${SRC}"; exit 1; }
test -d "${SRC}/.output" && echo "note: .output present in source (ignored by .dockerignore)"

echo
echo "=== 2. source snapshot identity ==="
if [ -n "${SOURCE_SNAPSHOT_SHA256:-}" ]; then
  SNAPSHOT_SHA="${SOURCE_SNAPSHOT_SHA256}"
else
  SNAPSHOT_SHA=$(cd "${SRC}" && find . -type f \
    -not -path './node_modules/*' -not -path './.nuxt/*' -not -path './.output/*' \
    -not -path './.git/*' -not -name '._*' -print0 | sort -z | xargs -0 sha256sum | sha256sum | cut -d' ' -f1)
fi
echo "source snapshot sha256 = ${SNAPSHOT_SHA}"

echo
echo "=== 3. build immutable image ==="
docker build -f "${SRC}/Dockerfile" \
  --build-arg VCS_REF="${VCS_REF:-unknown}" \
  --build-arg IMAGE_VERSION="${TAG}" \
  --build-arg SOURCE_SNAPSHOT_SHA256="${SNAPSHOT_SHA}" \
  -t "${IMAGE}" "${SRC}"

IMAGE_ID=$(docker image inspect "${IMAGE}" --format '{{.Id}}')
IMAGE_DIGEST=$(docker image inspect "${IMAGE}" --format '{{if .RepoDigests}}{{index .RepoDigests 0}}{{else}}<no-repo-digest>{{end}}')
PLATFORM=$(docker image inspect "${IMAGE}" --format '{{.Os}}/{{.Architecture}}')
LABEL_SNAPSHOT=$(docker image inspect "${IMAGE}" --format '{{index .Config.Labels "org.kstudio.source.snapshot.sha256"}}')
echo "image id     = ${IMAGE_ID}"
echo "image digest = ${IMAGE_DIGEST}"
echo "platform     = ${PLATFORM}"
echo "label snapshot = ${LABEL_SNAPSHOT}"
test "${PLATFORM}" = "linux/amd64" || { echo "unexpected platform ${PLATFORM}"; exit 1; }
test "${LABEL_SNAPSHOT}" = "${SNAPSHOT_SHA}" || { echo "source snapshot label mismatch"; exit 1; }

echo
echo "=== 4. runtime layout checks ==="
docker run --rm --entrypoint sh "${IMAGE}" -c '
  set -e
  test -f /app/.output/server/index.mjs || { echo "missing .output/server/index.mjs"; exit 1; }
  test -f /app/package.json || { echo "missing package.json"; exit 1; }
  test -d /app/prisma || { echo "missing prisma"; exit 1; }
  test -d /app/node_modules/@prisma || { echo "missing @prisma/client"; exit 1; }
  test -d /app/node_modules/.prisma || { echo "missing generated prisma client"; exit 1; }
  test "$(id -u)" != "0" || { echo "image runs as root"; exit 1; }
  echo "runtime layout OK (user uid $(id -u), $(cat /etc/alpine-release 2>/dev/null || echo alpine))"
  echo "prisma engines:"; ls /app/node_modules/.prisma/client | grep -i "linux-musl" | head -3
'

echo
echo "=== 5. save release artifact ==="
docker save "${IMAGE}" | gzip -1 > "/var/lib/kiruhak/${TAG}-linux-amd64.tar.gz"
ls -la "/var/lib/kiruhak/${TAG}-linux-amd64.tar.gz"

echo
echo "=== 6. write release override + rollback checkpoint ==="
cat > "${OVERRIDES}/${TAG}.yml" <<YAML
services:
  app:
    image: ${IMAGE}
    build: null
    environment:
      TELEGRAM_LOGIN_MODE: owner_canary
      ADMIN_TELEGRAM_ID: "502773482"
YAML
cat "${OVERRIDES}/${TAG}.yml"

PREV_IMAGE=$(docker inspect kiruhak_app --format '{{.Config.Image}}')
PREV_ID=$(docker inspect kiruhak_app --format '{{.Image}}')
cat > "${CHECKPOINTS}/${TAG}-$(date -u +%Y%m%dT%H%M%SZ).txt" <<CHECKPOINT
checkpoint=$(date -u +%Y%m%dT%H%M%SZ)
release=${TAG}
app_image=${IMAGE}
app_image_id=${IMAGE_ID}
app_image_digest=${IMAGE_DIGEST}
source_snapshot_sha256=${SNAPSHOT_SHA}
previous_image=${PREV_IMAGE}
previous_image_id=${PREV_ID}
compose_project=kiruhak
compose_files=${COMPOSE_DIR}/docker-compose.prod.yml,${OVERRIDES}/app-secrets.override.yml,${OVERRIDES}/${TAG}.yml
rollback_command=cd ${COMPOSE_DIR} && docker compose -p kiruhak -f docker-compose.prod.yml -f ${OVERRIDES}/app-secrets.override.yml -f ${OVERRIDES}/materials-privacy-20261109.yml up -d --no-deps --force-recreate app
rollback_note=предыдущий образ содержит исправление Materials Privacy и работает в production; откат не меняет БД
db_invariants=5|10|14|21|3|1|1
CHECKPOINT

echo
echo "=== 7. deploy (app only, --no-deps) ==="
cd "${COMPOSE_DIR}"
docker compose -p kiruhak \
  -f docker-compose.prod.yml \
  -f "${OVERRIDES}/app-secrets.override.yml" \
  -f "${OVERRIDES}/${TAG}.yml" \
  up -d --no-deps --force-recreate app

echo
echo "=== 8. wait for health ==="
for i in $(seq 1 60); do
  status=$(docker inspect kiruhak_app --format '{{.State.Health.Status}}' 2>/dev/null || echo "starting")
  echo "  t+${i}s health=${status}"
  [ "${status}" = "healthy" ] && break
  sleep 1
done
docker inspect kiruhak_app --format '{{.Config.Image}} | {{.Image}} | {{.State.Status}} | {{.State.Health.Status}}'

echo
echo "=== DEPLOY DONE ==="
