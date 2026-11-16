#!/usr/bin/env bash
# Verify that the published recovery branch is usable by anyone:
# clone it from GitHub anonymously and run the whole suite.
set -uo pipefail
W=/var/tmp/kiruhak-gh-verify
rm -rf "$W"; mkdir -p "$W"
cd "$W"

echo "=== clone the published branch from GitHub (anonymous, no credentials) ==="
if git clone -q --branch recovery/api-fail-closed-20261115 \
     https://github.com/kiruhak11/kiruhak.git repo; then
  echo "  clone: ok"
else
  echo "  clone: FAILED"; exit 1
fi
cd repo
echo "  HEAD   : $(git rev-parse HEAD)"
echo "  commits: $(git rev-list --count HEAD)"
echo "  files  : $(git ls-files | wc -l)"

echo
echo "=== install, generate, test ==="
docker run --rm -v "$W/repo:/app" -w /app node:22-alpine sh -c '
  npm ci --no-audit --no-fund >/dev/null 2>&1 && echo "  npm ci          : ok" || echo "  npm ci          : FAILED"
  npx prisma generate >/dev/null 2>&1 && echo "  prisma generate : ok" || echo "  prisma generate : FAILED"
  TOTAL=0
  for s in test:security test:public test:admin test:telegram test:telegram-login test:lead; do
    OUT=$(npm run "$s" 2>&1 | grep -E "^# (tests|pass|fail)" | tr "\n" " ")
    printf "  %-22s %s\n" "$s" "$OUT"
  done
  echo "  typecheck errors: $(npm run typecheck 2>&1 | grep -cE "error TS")   (upstream baseline 216)"
'

echo
echo "=== GH CLONE VERIFICATION COMPLETE ==="
