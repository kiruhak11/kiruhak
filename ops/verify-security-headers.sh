#!/usr/bin/env bash
# K-Studio: проверка security-заголовков и ограничения частоты запросов.
#
# Usage: verify-security-headers.sh [base_url]
#
# Проверяет:
#   * наличие и корректность заголовков на HTML-странице и на API-ответе;
#   * отсутствие дублирующихся заголовков (конфликт Nginx/приложение);
#   * что CSP не блокирует Telegram Login SDK и не содержит unsafe-eval;
#   * что запрос входа с пустыми учётными данными НЕ считается успешной
#     авторизацией (проверяется структура ответа, а не только код 200);
#   * что ограничение частоты пропускает десять запросов и отклоняет
#     одиннадцатый, а также что в ответе 429 есть Retry-After.
#
# Все запросы синтетические: реальные пароли не используются, реальные
# пользователи не создаются. Расходуется только счётчик ограничения
# самого проверяющего клиента.

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

header_value() {
  # $1 — url, $2 — имя заголовка (в нижнем регистре)
  curl -s -o /dev/null -D - -m 25 "$1" | tr -d '\r' | awk -v h="$2" '
    BEGIN { IGNORECASE = 1 }
    tolower($1) == h":" { sub(/^[^:]*:[[:space:]]*/, ""); print; exit }
  '
}

header_count() {
  curl -s -o /dev/null -D - -m 25 "$1" | tr -d '\r' | awk -v h="$2" '
    BEGIN { IGNORECASE = 1; count = 0 }
    tolower($1) == h":" { count++ }
    END { print count }
  '
}

echo "=== K-Studio security headers & rate limit ($BASE) ==="
echo

echo "-- document response headers --"
check "X-Content-Type-Options" "nosniff" "$(header_value "$BASE/" "x-content-type-options")"
check "Referrer-Policy" "strict-origin-when-cross-origin" "$(header_value "$BASE/" "referrer-policy")"
check "X-Frame-Options" "DENY" "$(header_value "$BASE/" "x-frame-options")"
check "Strict-Transport-Security" "max-age=31536000" "$(header_value "$BASE/" "strict-transport-security")"
PERM="$(header_value "$BASE/" "permissions-policy")"
case "$PERM" in
  *"camera=()"*) printf '  PASS  %-52s %s\n' "Permissions-Policy: camera=()" "$PERM"; PASS=$((PASS + 1)) ;;
  *) printf '  FAIL  %-52s %s\n' "Permissions-Policy: camera=()" "$PERM"; FAIL=$((FAIL + 1)) ;;
esac

echo
echo "-- no duplicated headers (one value per header) --"
for h in x-content-type-options x-frame-options referrer-policy content-security-policy strict-transport-security permissions-policy; do
  count="$(header_count "$BASE/" "$h")"
  check "single $h" "1" "$count"
done

echo
echo "-- CSP sanity --"
CSP="$(header_value "$BASE/" "content-security-policy")"
case "$CSP" in
  *"frame-ancestors 'none'"*) printf '  PASS  %-52s ok\n' "CSP: frame-ancestors 'none'"; PASS=$((PASS + 1)) ;;
  *) printf '  FAIL  %-52s %s\n' "CSP: frame-ancestors 'none'" "$CSP"; FAIL=$((FAIL + 1)) ;;
esac
case "$CSP" in
  *"unsafe-eval"*) printf '  FAIL  %-52s %s\n' "CSP must not contain unsafe-eval" "$CSP"; FAIL=$((FAIL + 1)) ;;
  *) printf '  PASS  %-52s ok\n' "CSP must not contain unsafe-eval"; PASS=$((PASS + 1)) ;;
esac
case "$CSP" in
  *"https://oauth.telegram.org"*) printf '  PASS  %-52s ok\n' "CSP allows Telegram Login SDK"; PASS=$((PASS + 1)) ;;
  *) printf '  FAIL  %-52s %s\n' "CSP allows Telegram Login SDK" "$CSP"; FAIL=$((FAIL + 1)) ;;
esac

echo
echo "-- API response headers --"
check "API X-Content-Type-Options" "nosniff" "$(header_value "$BASE/api/does-not-exist" "x-content-type-options")"
check "API X-Frame-Options" "DENY" "$(header_value "$BASE/api/does-not-exist" "x-frame-options")"
API_CSP="$(header_value "$BASE/api/does-not-exist" "content-security-policy")"
check "API CSP is strict" "script-src 'none'; frame-ancestors 'none';" "$API_CSP"

echo
echo "-- authentication contract (structure, not only the status code) --"
LOGIN_BODY="$(curl -s -m 25 -X POST -H 'Content-Type: application/json' -d '{}' "$BASE/api/auth/login")"
LOGIN_FLAG="absent"
case "$LOGIN_BODY" in
  *'"success":false'*) LOGIN_FLAG="success:false" ;;
esac
check "login with empty credentials is not a success" "success:false" "$LOGIN_FLAG"

echo
echo "-- rate limit (synthetic requests, own counter) --"
ALLOWED=0
BLOCKED=0
RETRY_AFTER=""
for _ in $(seq 1 11); do
  HEADERS="$(curl -s -o /dev/null -D - -m 25 -X POST \
    -H 'Content-Type: application/json' \
    -H 'x-forwarded-for: 203.0.113.250, 81.177.135.137' \
    -d '{}' "$BASE/api/auth/telegram-login/verify" | tr -d '\r')"
  CODE="$(printf '%s' "$HEADERS" | awk 'NR==1{print $2}')"
  if [ "$CODE" = "429" ]; then
    BLOCKED=$((BLOCKED + 1))
    RETRY_AFTER="$(printf '%s' "$HEADERS" | grep -i '^retry-after:' | awk '{print $2}')"
  else
    ALLOWED=$((ALLOWED + 1))
  fi
done
check "rate limit allows ten requests" "10" "$ALLOWED"
check "rate limit blocks the next request" "1" "$BLOCKED"
if [ -n "$RETRY_AFTER" ] && [ "$RETRY_AFTER" -gt 0 ] 2>/dev/null; then
  printf '  PASS  %-52s %s\n' "Retry-After is present and positive" "$RETRY_AFTER"
  PASS=$((PASS + 1))
else
  printf '  FAIL  %-52s %s\n' "Retry-After is present and positive" "${RETRY_AFTER:-<missing>}"
  FAIL=$((FAIL + 1))
fi

echo
echo "=== RESULT: pass=$PASS fail=$FAIL ==="
[ "$FAIL" -eq 0 ] || exit 1
