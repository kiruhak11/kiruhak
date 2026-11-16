#!/usr/bin/env bash
# Visual parity harness for the K-Studio recovery branch.
#
# Renders the ORIGINAL production image (kiruhak-app:materials-privacy-20261109)
# and the recovery-branch build side by side against an isolated throwaway
# PostgreSQL, then diffs the SSR HTML page by page with
# ops/compare-ssr-html.py.
#
# Touches neither the running production container nor the production database.
# Usage (on the deployment host):
#   bash ops/verify-visual-parity.sh
#   python3 ops/compare-ssr-html.py
# Visual parity harness: render the ORIGINAL production image and the recovery
# branch build side by side against an isolated throwaway PostgreSQL, then
# diff the SSR HTML page by page.
# Nothing here touches the running production container or the production DB.
set -uo pipefail

docker network inspect kstudio-parity >/dev/null 2>&1 || docker network create kstudio-parity >/dev/null

docker rm -f kstudio-parity-db kstudio-parity-orig kstudio-parity-branch >/dev/null 2>&1
docker run -d --name kstudio-parity-db --network kstudio-parity \
  -e POSTGRES_DB=paritydb -e POSTGRES_USER=parity -e POSTGRES_PASSWORD=parity \
  postgres:15-alpine >/dev/null
for i in $(seq 1 60); do
  docker exec kstudio-parity-db pg_isready -U parity -d paritydb >/dev/null 2>&1 && break
  sleep 1
done

# reuse the production environment, but point the DB at the throwaway instance
docker inspect kiruhak_app --format '{{range .Config.Env}}{{println .}}{{end}}' \
  | sed 's|^DATABASE_URL=.*|DATABASE_URL=postgresql://parity:parity@kstudio-parity-db:5432/paritydb|' \
  > /tmp/kiruhak-parity.env

echo "=== push schema to throwaway DB ==="
docker run --rm --network kstudio-parity -v /var/tmp/kiruhak-repro/repo:/app -w /app \
  -e DATABASE_URL="postgresql://parity:parity@kstudio-parity-db:5432/paritydb" node:22-alpine \
  sh -c 'npx prisma db push --skip-generate --accept-data-loss 2>&1 | tail -3'

echo
echo "=== start ORIGINAL production image (materials-privacy-20261109) ==="
docker run -d --name kstudio-parity-orig --network kstudio-parity \
  --env-file /tmp/kiruhak-parity.env -e PORT=3016 -p 127.0.0.1:3016:3016 \
  kiruhak-app:materials-privacy-20261109 >/dev/null

echo "=== start RECOVERY BRANCH build ==="
docker run -d --name kstudio-parity-branch --network kstudio-parity \
  --env-file /tmp/kiruhak-parity.env -e PORT=3017 -p 127.0.0.1:3017:3017 \
  -v /var/tmp/kiruhak-repro/repo/.output:/app/.output -w /app node:22-alpine \
  node .output/server/index.mjs >/dev/null

sleep 12
echo "orig   : $(curl -s -o /dev/null -w '%{http_code}' -m 10 http://127.0.0.1:3016/)"
echo "branch : $(curl -s -o /dev/null -w '%{http_code}' -m 10 http://127.0.0.1:3017/)"

PARITY_HTML="${PARITY_HTML:-/tmp/parity-html}"
mkdir -p "$PARITY_HTML"
for p in / /projects /contact /legal /legal/privacy /login /analytics /materials /account/recovery /tutorials /content /ui-components; do
  slug=$(echo "$p" | tr '/' '_' | sed 's/^_$/home/')
  curl -s -m 25 "http://127.0.0.1:3016$p" -o ""$PARITY_HTML"/orig${slug}.html"
  curl -s -m 25 "http://127.0.0.1:3017$p" -o ""$PARITY_HTML"/branch${slug}.html"
done
ls -la /tmp/parity-html | head -30
echo "=== PARITY HARNESS READY ==="
