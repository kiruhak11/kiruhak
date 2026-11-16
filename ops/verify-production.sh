#!/usr/bin/env bash
# K-Studio post-deploy smoke + security verification.
# Usage: verify-production.sh [base_url]
# Exits non-zero if any check fails.

set -uo pipefail
BASE="${1:-https://kiruhak11.ru}"
PASS=0
FAIL=0

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    printf '  PASS  %-52s %s\n' "$label" "$actual"
    PASS=$((PASS + 1))
  else
    printf '  FAIL  %-52s expected=%s got=%s\n' "$label" "$expected" "$actual"
    FAIL=$((FAIL + 1))
  fi
}

code() { curl -s -o /dev/null -w '%{http_code}' -m 25 "$BASE$1"; }
code_post() { curl -s -o /dev/null -w '%{http_code}' -m 25 -X POST "$BASE$1"; }

echo "=== K-Studio production verification ($BASE) ==="
echo
echo "-- public pages --"
for p in / /projects /contact /legal /legal/privacy /materials /login /account/recovery; do
  check "GET $p" 200 "$(code "$p")"
done

echo
echo "-- public API --"
for p in /api/health /api/projects /api/materials; do
  check "GET $p" 200 "$(code "$p")"
done

echo
echo "-- fail-closed authorization --"
check "GET /api/does-not-exist (unknown route denied)" 404 "$(code /api/does-not-exist)"
check "GET /api/admin/projects without token" 401 "$(code /api/admin/projects)"
check "GET /api/user/me without token" 401 "$(code /api/user/me)"
check "POST /api/brief without token" 401 "$(code_post /api/brief)"
check "GET /api/analytics/stats without token" 401 "$(code /api/analytics/stats)"

echo
echo "-- invalid token rejected --"
check "GET /api/user/me with garbage token" 401 \
  "$(curl -s -o /dev/null -w '%{http_code}' -m 25 -H 'Authorization: Bearer not.a.token' "$BASE/api/user/me")"

echo
echo "-- bot endpoints require the service secret --"
check "POST /api/bot/quick-login without secret" 403 \
  "$(curl -s -o /dev/null -w '%{http_code}' -m 25 -X POST -H 'Content-Type: application/json' -d '{"telegramId":"1"}' "$BASE/api/bot/quick-login")"
check "POST /api/bot/quick-login with wrong secret" 403 \
  "$(curl -s -o /dev/null -w '%{http_code}' -m 25 -X POST -H 'Content-Type: application/json' -H 'x-bot-secret: wrong' -d '{"telegramId":"1"}' "$BASE/api/bot/quick-login")"
check "POST /api/auth/create-account without secret" 403 \
  "$(curl -s -o /dev/null -w '%{http_code}' -m 25 -X POST -H 'Content-Type: application/json' -d '{"telegramId":"1","firstName":"x"}' "$BASE/api/auth/create-account")"

echo
echo "-- materials privacy (no userId / no raw relations) --"
BODY="$(curl -s -m 25 "$BASE/api/materials")"
if echo "$BODY" | grep -q '"userId"'; then
  printf '  FAIL  %-52s %s\n' "public materials response contains userId" "leak"
  FAIL=$((FAIL + 1))
else
  printf '  PASS  %-52s %s\n' "public materials response has no userId" "clean"
  PASS=$((PASS + 1))
fi
if echo "$BODY" | grep -q '"ratings"'; then
  printf '  FAIL  %-52s %s\n' "public materials response contains ratings rows" "leak"
  FAIL=$((FAIL + 1))
else
  printf '  PASS  %-52s %s\n' "public materials response has no ratings rows" "clean"
  PASS=$((PASS + 1))
fi
if echo "$BODY" | grep -q '"downloads"'; then
  printf '  FAIL  %-52s %s\n' "public materials response contains downloads rows" "leak"
  FAIL=$((FAIL + 1))
else
  printf '  PASS  %-52s %s\n' "public materials response has no downloads rows" "clean"
  PASS=$((PASS + 1))
fi
for field in avgRating ratingCount downloadCount userRating; do
  if echo "$BODY" | grep -q "\"$field\""; then
    printf '  PASS  %-52s %s\n' "aggregated field present: $field" "ok"
    PASS=$((PASS + 1))
  else
    printf '  FAIL  %-52s %s\n' "aggregated field missing: $field" "missing"
    FAIL=$((FAIL + 1))
  fi
done
check "GET /api/materials Cache-Control is no-store" "no-store" \
  "$(curl -s -o /dev/null -D - -m 25 "$BASE/api/materials" | tr -d '\r' | awk 'tolower($1)=="cache-control:"{print $2}')"

echo
echo "-- CORS preflight still allowed --"
check "OPTIONS /api/brief (preflight)" 204 \
  "$(curl -s -o /dev/null -w '%{http_code}' -m 25 -X OPTIONS -H 'Origin: https://kiruhak11.ru' -H 'Access-Control-Request-Method: POST' "$BASE/api/brief")"

echo
echo "-- lead endpoint contract (no side effects) --"
check "POST /api/telegram without idempotency key" 400 \
  "$(curl -s -o /dev/null -w '%{http_code}' -m 25 -X POST -H 'Content-Type: application/json' -d '{}' "$BASE/api/telegram")"

echo
echo "=== RESULT: pass=$PASS fail=$FAIL ==="
[ "$FAIL" -eq 0 ] || exit 1
