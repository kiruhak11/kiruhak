#!/usr/bin/env bash
# Runs the session-revocation integration test against a THROWAWAY PostgreSQL
# instance with synthetic data. Never touches the production database.
#
# Usage: run-session-revocation-integration.sh [source_dir_on_vps]

set -euo pipefail
SRC="${1:-/var/tmp/kiruhak-build/rc-e}"
DB_NAME="kstudio_session_test"
DB_USER="kstudio_test"
DB_PASS="kstudio_test_pw"
CONTAINER="kstudio-session-test-db"

echo "=== starting isolated PostgreSQL (throwaway) ==="
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" \
  -e POSTGRES_DB="$DB_NAME" \
  -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_PASSWORD="$DB_PASS" \
  postgres:15-alpine >/dev/null

echo "=== waiting for readiness ==="
for i in $(seq 1 60); do
  if docker exec "$CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    echo "ready after ${i}s"
    break
  fi
  sleep 1
done

cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "=== applying schema (synthetic, isolated) ==="
docker run --rm --network container:"$CONTAINER" \
  -v "$SRC:/app" -w /app \
  -e DATABASE_URL="postgresql://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME" \
  node:22-alpine sh -c "npx prisma db push --skip-generate --accept-data-loss 2>&1 | tail -5"

echo "=== running session-revocation integration test ==="
docker run --rm --network container:"$CONTAINER" \
  -v "$SRC:/app" -w /app \
  -e DATABASE_URL="postgresql://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME" \
  node:22-alpine sh -c "npm run test:session-revocation 2>&1 | tail -25"
