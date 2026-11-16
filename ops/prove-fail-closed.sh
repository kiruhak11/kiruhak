#!/usr/bin/env bash
# Isolated proof that the API authorization is fail-closed at the execution level.
#
# Creates a synthetic API route that EXISTS in the application (it is compiled
# into the Nitro route manifest) but is NOT listed in the authorization policy.
#
#   Variant A: policy unchanged  -> the route must be DENIED (404)
#   Variant B: same route, one extra policy line -> the route must be SERVED (200)
#
# Variant B is the control: it proves the route really exists and really is
# reachable by Nitro, so the 404 of variant A is produced by the authorization
# policy and not by a missing handler.
#
# Nothing here touches production: separate directories, separate port,
# throwaway PostgreSQL.

set -uo pipefail
BASE_SRC=/var/tmp/kiruhak-build/final
WORK=/var/tmp/kiruhak-fc
PORT=3099

echo "############ preparing variants ############"
rm -rf "$WORK"; mkdir -p "$WORK"

for V in A B; do
  cp -a "$BASE_SRC" "$WORK/$V"
  # synthetic route: exists as a real API endpoint, no auth of its own
  mkdir -p "$WORK/$V/server/api/probe"
  cat > "$WORK/$V/server/api/probe/leak.get.ts" <<'TS'
export default defineEventHandler(() => {
  return { leaked: true, note: "synthetic route with no authorization policy entry" };
});
TS
done

# Variant B: the ONLY difference is one policy line
python3 - "$WORK/B/server/utils/auth-route-policy.ts" <<'PY'
import sys
p=sys.argv[1]
s=open(p,encoding="utf8").read()
old='  // --- Служебный API бота (внутренний, требует x-bot-secret) -------------'
new=('  // --- Контрольный маршрут (только в изолированной проверке) ------------\n'
     '  { methods: GET, policy: "public", pattern: /^\\/api\\/probe\\/leak$/ },\n'
     + old)
assert old in s
open(p,"w",encoding="utf8").write(s.replace(old,new,1))
print("  variant B: policy line added")
PY

echo "############ throwaway postgres ############"
docker rm -f kstudio-fc-app kstudio-fc-db >/dev/null 2>&1 || true
docker network rm kstudio-fc-net >/dev/null 2>&1 || true
docker network create kstudio-fc-net >/dev/null
docker run -d --name kstudio-fc-db --network kstudio-fc-net \
  -e POSTGRES_DB=fc -e POSTGRES_USER=fc \
  -e POSTGRES_PASSWORD=fc_pw postgres:15-alpine >/dev/null
for i in $(seq 1 60); do
  docker exec kstudio-fc-db pg_isready -U fc -d fc >/dev/null 2>&1 && break
  sleep 1
done

build_and_run() {
  local V=$1
  echo
  echo "############ VARIANT $V ############"
  docker run --rm -v "$WORK/$V:/app" -w /app -e NODE_ENV=production node:22-alpine \
    sh -c 'npx prisma generate >/dev/null 2>&1; npm run build 2>&1 | tail -2'

  # route manifest: is the synthetic route really registered?
  echo "-- is /api/probe/leak in the compiled route manifest? --"
  grep -o "route: '/api/probe/leak'[^,]*" "$WORK/$V/.output/server/chunks/nitro/nitro.mjs" \
    | head -1 | sed 's/^/   /' || echo "   NOT FOUND"

  docker rm -f kstudio-fc-app >/dev/null 2>&1 || true
  docker run -d --name kstudio-fc-app \
    -w /app \
    --network kstudio-fc-net \
    -e NODE_ENV=production -e PORT=$PORT -e HOSTNAME=0.0.0.0 \
    -e DATABASE_URL="postgresql://fc:fc_pw@kstudio-fc-db:5432/fc" \
    -e AUTH_TOKEN_SECRET="isolated-test-secret-that-is-long-enough-0001" \
    -e NUXT_AUTH_TOKEN_SECRET="isolated-test-secret-that-is-long-enough-0001" \
    -e BOT_SECRET="isolated-test-bot-secret-0002" \
    -e TELEGRAM_LOGIN_MODE=owner_canary -e ADMIN_TELEGRAM_ID=502773482 \
    -e NUXT_PUBLIC_SITE_URL="https://kiruhak11.ru" \
    -v "$WORK/$V/.output:/app/.output:ro" \
    -v "$WORK/$V/.output/server/node_modules:/app/node_modules:ro" \
    -v "$WORK/$V/prisma:/app/prisma:ro" \
    -v "$WORK/$V/package.json:/app/package.json:ro" \
    node:22-alpine node .output/server/index.mjs >/dev/null

  sleep 6
  echo "-- requests from INSIDE the app container --"
  docker exec kstudio-fc-app node -e '
    const probe = async (method, path, extra) => {
      const r = await fetch("http://127.0.0.1:'"$PORT"'" + path, { method, headers: extra || {} });
      const body = await r.text();
      return { status: r.status, body: body.slice(0, 160) };
    };
    (async () => {
      const a = await probe("GET", "/api/probe/leak");
      console.log("   GET  /api/probe/leak  -> " + a.status + "   body: " + a.body);
      const h = await probe("GET", "/api/health");
      console.log("   GET  /api/health       -> " + h.status);
      const u = await probe("GET", "/api/user/me");
      console.log("   GET  /api/user/me      -> " + u.status + "  (no token)");
      const n = await probe("GET", "/api/does-not-exist");
      console.log("   GET  /api/does-not-exist -> " + n.status + "  (unknown route)");
    })();
  ' 2>&1 | sed 's/^/  /'
  echo "   -- container log --"; docker logs kstudio-fc-app 2>&1 | tail -4 | sed 's/^/      /' 
  docker rm -f kstudio-fc-app >/dev/null 2>&1 || true
}

build_and_run A
build_and_run B

docker rm -f kstudio-fc-app kstudio-fc-db >/dev/null 2>&1 || true

echo
echo "############ EXPECTED ############"
echo "  Variant A (policy unchanged) : /api/probe/leak -> 404  (denied by fail-closed policy)"
echo "  Variant B (control)          : /api/probe/leak -> 200  (route exists and is served)"
echo
echo "############ FC PROOF COMPLETE ############"
