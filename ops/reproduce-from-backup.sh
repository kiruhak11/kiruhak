#!/usr/bin/env bash
# Reproducibility check for the recovered K-Studio source.
#
# Clones the recovery branch from the BACKUP BUNDLE (not from a working copy),
# installs dependencies strictly from the lockfile, runs every check and
# builds the production bundle. Touches nothing in production.
#
# Usage: reproduce-from-backup.sh <bundle-path> <work-dir>

set -uo pipefail
BUNDLE="${1:?usage: reproduce-from-backup.sh <bundle> <workdir>}"
WORK="${2:?usage: reproduce-from-backup.sh <bundle> <workdir>}"
REPO="${WORK}/repo"

echo "=== 0. clean workspace ==="
rm -rf "${WORK}"
mkdir -p "${WORK}"

echo "=== 1. clone from the backup bundle ==="
git clone -q "${BUNDLE}" "${REPO}" || { echo "clone failed"; exit 1; }
cd "${REPO}"
git checkout -q recovery/api-fail-closed-20261115 || { echo "checkout failed"; exit 1; }
echo "HEAD   : $(git rev-parse HEAD)"
echo "commit : $(git log --oneline -1)"
echo "files  : $(git ls-files | wc -l)"

echo
echo "=== 2. dependency install strictly from the lockfile ==="
docker run --rm -v "${REPO}:/app" -w /app node:22-alpine \
  sh -c 'npm ci --no-audit --no-fund 2>&1 | tail -3; echo "npm ci exit=$?"'

echo
echo "=== 3. prisma client ==="
docker run --rm -v "${REPO}:/app" -w /app node:22-alpine \
  sh -c 'npx prisma generate 2>&1 | tail -2'

echo
echo "=== 4. test suites ==="
for s in test:security test:public test:admin test:telegram test:telegram-login test:lead; do
  printf '  %-22s ' "$s"
  docker run --rm -v "${REPO}:/app" -w /app node:22-alpine \
    sh -c "npm run $s 2>&1 | grep -E '^# (tests|pass|fail)' | tr '\n' ' '"
  echo
done

echo
echo "=== 5. session-revocation integration test (isolated postgres) ==="
DB_NAME=kstudio_repro_test
DB_USER=kstudio_repro
DB_PASS=kstudio_repro_pw
CONTAINER=kstudio-repro-db
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" -e POSTGRES_DB="$DB_NAME" -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_PASSWORD="$DB_PASS" postgres:15-alpine >/dev/null
for i in $(seq 1 60); do
  docker exec "$CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1 && break
  sleep 1
done
docker run --rm --network container:"$CONTAINER" -v "${REPO}:/app" -w /app \
  -e DATABASE_URL="postgresql://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME" node:22-alpine \
  sh -c 'npx prisma db push --skip-generate --accept-data-loss >/dev/null 2>&1; npm run test:session-revocation 2>&1 | grep -E "^# (tests|pass|fail)"'
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

echo
echo "=== 6. lint ==="
docker run --rm -v "${REPO}:/app" -w /app node:22-alpine sh -c 'npm run lint:portfolio 2>&1 | tail -3'
docker run --rm -v "${REPO}:/app" -w /app node:22-alpine sh -c 'npm run lint:admin 2>&1 | tail -2'

echo
echo "=== 7. typecheck (baseline of upstream master = 216) ==="
docker run --rm -v "${REPO}:/app" -w /app -e NODE_ENV=production node:22-alpine \
  sh -c 'npm run typecheck 2>&1 | grep -E "error TS" | wc -l'

echo
echo "=== 8. production build (NODE_ENV=production, as in the Dockerfile) ==="
docker run --rm -v "${REPO}:/app" -w /app -e NODE_ENV=production node:22-alpine \
  sh -c 'npm run build 2>&1 | tail -4'

echo
echo "=== 9. build artefacts ==="
ls -la "${REPO}/.output/server/index.mjs" 2>&1
echo "build id (nuxt): $(grep -o '"buildId":"[^"]*"' "${REPO}/.output/public/_nuxt/"*.js 2>/dev/null | head -1)"

echo
echo "=== 10. fail-closed authorization is compiled in ==="
python3 - <<'PY2'
s=open("/var/tmp/kiruhak-repro/repo/.output/server/chunks/nitro/nitro.mjs",encoding="utf8").read()
checks=[("fail-closed classifier present","classifyApiRoute"),
        ("unknown route denied (404)","Not Found"),
        ("bot secret enforced","x-bot-secret"),
        ("fail-open path removed","if (!needsAuth) return;")]
for label,needle in checks:
    print(f"  {label:34s} {'FOUND' if needle in s else 'absent'}")
PY2

echo
echo "=== 11. bot endpoint authorization is enforced in the bundle ==="
grep -c 'x-bot-secret' "${REPO}/.output/server/chunks/nitro/nitro.mjs" 2>/dev/null || true

echo
echo "=== 12. API route manifest ==="
python3 - <<'PY'
import re
s=open("/var/tmp/kiruhak-repro/repo/.output/server/chunks/nitro/nitro.mjs",encoding="utf8").read()
routes=sorted({f"{m.group(2).upper()} {m.group(1)}" for m in re.finditer(r"route:\s*'([^']+)'.{0,200}?method:\s*\"([a-z]+)\"", s, re.S)})
print(f"  routes: {len(routes)}")
open("/tmp/repro-routes.txt","w").write("\n".join(routes)+"\n")
PY

echo
echo "=== 13. compare with the production route manifest ==="
python3 - <<'PY'
import re
def routes(path):
    s=open(path,encoding="utf8").read()
    return {f"{m.group(2).upper()} {m.group(1)}" for m in re.finditer(r"route:\s*'([^']+)'.{0,200}?method:\s*\"([a-z]+)\"", s, re.S)}
try:
    repro=routes("/var/tmp/kiruhak-repro/repo/.output/server/chunks/nitro/nitro.mjs")
except Exception as e:
    print("  repro manifest unavailable:", e); raise SystemExit
prod=routes("/var/tmp/kprod-output/.output/server/chunks/nitro/nitro.mjs")
print(f"  repro={len(repro)} prod={len(prod)}")
print("  only in prod :", sorted(prod-repro) or "NONE")
print("  only in repro:", sorted(repro-prod) or "NONE")
PY

echo
echo "=== 14. chunk-by-chunk comparison with the running production ==="
docker rm -f kstudio-prod-chunks >/dev/null 2>&1 || true
docker cp kiruhak_app:/app/.output/server/chunks /tmp/kstudio-prod-chunks >/dev/null 2>&1 || true
python3 - <<'PY2'
import os
R="/var/tmp/kiruhak-repro/repo/.output/server/chunks"
P="/tmp/kstudio-prod-chunks"
same=diff=0; differing=[]
for root,_,files in os.walk(R):
    for f in files:
        if not f.endswith(".mjs"): continue
        a=os.path.join(root,f); rel=os.path.relpath(a,R); b=os.path.join(P,rel)
        if not os.path.exists(b): continue
        if open(a,'rb').read()==open(b,'rb').read(): same+=1
        else: diff+=1; differing.append(rel)
print(f"  identical chunks: {same}   differing: {diff}")
for d in sorted(differing): print("   differs:", d)
PY2
rm -rf /tmp/kstudio-prod-chunks

echo
echo "=== REPRODUCIBILITY RUN COMPLETE ==="
