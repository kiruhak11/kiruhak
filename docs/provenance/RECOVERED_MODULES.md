# Provenance of the recovered K-Studio modules

Release: `api-fail-closed-20261115` · Branch: `recovery/api-fail-closed-20261115`

## What was lost

The developer's local checkout was destroyed by iCloud Drive eviction. Every
file under `server/`, `pages/legal/`, `pages/account/recovery/`, the Telegram
Login OIDC flow, the lead-delivery queue, the materials public DTO and the
extended Prisma schema existed **only as uncommitted files** in that checkout
and were gone. The `.git` directory was removed as well: no `HEAD`, no `refs`,
no `objects`, no worktree metadata.

What survived:

* `github.com/kiruhak11/kiruhak` — the clean official lineage up to
  `4256f5f` (2026-10-08). This is the base of the recovery branch.
* the compiled production artifact `kiruhak-app:materials-privacy-20261109`
  (183 sourcemaps) — the behavioural oracle used for reconstruction;
* the VPS working tree `/var/www/html/kiruhak` — an *older*, independent
  lineage (last commit 2026-05-08) that never received the Oct/Nov work.

## Sources used

| # | Source | What it provided |
| --- | --- | --- |
| S1 | `github.com/kiruhak11/kiruhak@4256f5f` | clean base, house style, original tests, build files |
| S2 | `kiruhak-app:materials-privacy-20261109` → `.output` | authoritative behaviour + module inventory (sourcemap `sources`) |
| S3 | compiled chunk `server/chunks/routes/**` | per-route logic of every API endpoint |
| S4 | compiled chunk `server/chunks/_/**` | per-module logic of shared server utils |
| S5 | `server/chunks/nitro/nitro.mjs` | inlined helpers, middleware, plugins, route manifest |
| S6 | client bundle `public/_nuxt/**.js` | front-end logic (login page, Telegram SDK flow) |
| S7 | client bundle `public/_nuxt/**.css` | scoped CSS, recoverable per page via the scope id |
| S8 | image `/app/prisma/**` | verbatim schema + the 5 applied migrations |

**No sourcemap contained `sourcesContent`** (0 of 183), so the original
TypeScript could not be recovered byte-for-byte anywhere. Every restored file
is a *behavioural reconstruction*: semantically equivalent to production,
textually different from the lost original.

## Map of the 24 modules that existed only in the lost checkout

`TS available` = was the original TypeScript obtainable from any surviving
source. `From sourcemap` = was the file reconstructed from sourcemap
metadata. `Manual changes` = were deliberate edits applied on top of the
reconstruction. `In production` = does the module exist in the currently
running image.

| # | Module | Reconstructed from | TS available? | From sourcemap? | Manual changes | In production? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `server/utils/optional-user.ts` | S4 `_/optional-user.mjs` | No | No (module split only) | Yes — split off `material-public.ts`; import paths rewritten | Yes |
| 2 | `server/utils/material-public.ts` | S4 (same chunk, map lines 1–142) | No | No (module split only) | Yes — split; allowlist DTO kept verbatim | Yes |
| 3 | `server/utils/lead-delivery.ts` | S5 (inlined helpers) | No | No | Yes — SQL/rate-limit constants re-expressed as TS | Yes (inlined) |
| 4 | `server/utils/lead-notification.ts` | S5 | No | No | Yes — Telegram notification body | Yes (inlined) |
| 5 | `server/utils/telegram-config.ts` | S5 | No | No | Yes — secret-file readers | Yes (inlined) |
| 6 | `server/utils/telegram-http.ts` | S5 | No | No | Yes — endpoint allow-list + proxy agent | Yes (inlined) |
| 7 | `server/utils/telegram-login.ts` | S3 `server__utils__telegram-login.ts.mjs` | No | No | Yes — types added | Yes |
| 8 | `server/utils/telegram-login-oidc.ts` | S3 (chunk also contained `verify.post.ts`) | No | No | Yes — split by sourcemap line ranges | Yes |
| 9 | `server/utils/telegram-oidc.ts` | S3 `server__utils__telegram-oidc.ts.mjs` | No | No | Yes — types added | Yes |
| 10 | `server/api/auth/logout.post.ts` | S3 | No | No | No | Yes |
| 11 | `server/api/auth/recovery/challenge.post.ts` | S3 | No | No | No | Yes |
| 12 | `server/api/auth/recovery/complete.post.ts` | S3 | No | No | No | Yes |
| 13 | `server/api/auth/recovery/telegram-callback.get.ts` | S3 | No | No | No | Yes |
| 14 | `server/api/auth/telegram-login/start.post.ts` | S3 | No | No | No | Yes |
| 15 | `server/api/auth/telegram-login/status.get.ts` | S3 | No | No | No | Yes |
| 16 | `server/api/auth/telegram-login/verify.post.ts` | S3 (chunk also contained `telegram-login-oidc.ts`) | No | No | Yes — split by sourcemap line ranges | Yes |
| 17 | `server/plugins/lead-delivery-worker.ts` | S5 | No | No | Yes — worker loop + backoff | Yes (inlined) |
| 18 | `server/plugins/recovery-security-headers.ts` | S5 | No | No | Yes | Yes (inlined) |
| 19 | `constants/legal-config.ts` | S3 (44 KB data chunk) | No | No | Yes — converted to typed TS, `\uXXXX` decoded to real Russian text; **texts unchanged** | Yes |
| 20 | `middleware/legal-publication.ts` | S3 | No | No | Yes — unused import removed | Yes |
| 21 | `pages/legal/index.vue` | S3 SSR chunk + S7 CSS | No | No | Yes — template rebuilt, scoped CSS recovered verbatim | Yes |
| 22 | `pages/legal/[slug].vue` | S3 SSR chunk + S7 CSS | No | No | Yes — template rebuilt, scoped CSS recovered verbatim | Yes |
| 23 | `pages/account/recovery.vue` | S3 SSR chunk + S7 CSS | No | No | Yes — template rebuilt, scoped CSS recovered verbatim | Yes |
| 24 | `pages/login.vue` | S3 SSR chunk + S6 client chunk + S7 CSS | No (master had the pre-OIDC page) | No | Yes — full Telegram Login OIDC UI rebuilt, SDK loader, challenge/nonce/id_token flow | Yes |

## Files that existed in master but were changed after it (production-era deltas)

| File | Reconstructed from | TS available? | Manual changes | In production? |
| --- | --- | --- | --- | --- |
| `server/utils/auth-token.ts` | S5 | Yes (older version) | Yes — per-session `jti`, `getAuthTokenTimes`, revocation helpers | Yes |
| `server/utils/session-control.ts` | S5 | Yes (older version) | Yes — `auth_revoked_sessions` instead of `auth_session_controls` only | Yes |
| `composables/useAuth.ts` | S3 | Yes (older version) | Yes — server-side logout revocation, `completeTelegramLogin`, `clearLocalSession` | Yes |
| `pages/index.vue` | S6 | Yes (older version) | Yes — lead form uses `Idempotency-Key` + flat payload | Yes |
| `server/api/telegram.post.ts` | S3 | Yes (older version) | Yes — legacy discount handler replaced by the lead endpoint | Yes |
| `server/api/materials.get.ts` | S3 | Yes (leaky version) | Yes — allowlist DTO, `no-store`, correct status codes | Yes |
| `server/api/materials/[id].get.ts` | S3 | Yes (leaky version) | Yes — same DTO for the detail route | Yes |
| `server/api/auth/login.post.ts` | S3 | Yes | Yes — `getAuthTokenTimes` | Yes |
| `prisma/schema.prisma` | S8 (verbatim) | Yes (older version) | No — copied verbatim | Yes |
| `prisma/migrations/2026100{9,11}*/migration.sql` (5 files) | S8 (verbatim) | No | No — copied verbatim; already applied in production | Yes |

## Files deliberately not carried over

| File | Reason |
| --- | --- |
| `server/api/health/db.get.ts` | present in master, absent from the production build (never exposed). Removed so the API surface matches production exactly (56 routes). |
| `server/error.ts` | existed in the lost checkout but was **tree-shaken** in production (0 generated lines in `nitro.mjs.map`). It has no runtime effect, so it was not reconstructed. |
| `components/{OrderModal,DiscountContactModal,DonationModal,AboutMe,…}.vue` | unreachable in production (tree-shaken) and in this branch. `OrderModal`/`DiscountContactModal` still use the pre-lead `/api/telegram` contract; that dead code was left untouched to preserve parity with production. |

## Verification of the reconstruction

| Check | Result |
| --- | --- |
| API route manifest, candidate vs production | 56 / 56, zero differences |
| Production source inventory vs candidate | only `server/error.ts` missing (tree-shaken, no runtime effect) |
| Materials public DTO | no `userId`, no raw `ratings`/`downloads`, aggregates preserved, `no-store` |
| Telegram Login owner_canary | `/api/auth/telegram-login/status` → `{"enabled":true,"ownerCanary":true}` |
| Lead queue | `POST /api/telegram` without `Idempotency-Key` → 400; with a key → accepted by the DB queue |
| Legal documents | `/legal` and `/legal/privacy` render the recovered documents (18 sections) |
| Recovery | `/account/recovery` renders, challenge/complete endpoints present |

### Compiled-output equivalence with the running production

The recovered branch was built from the **backup bundle** on the same host
(`ops/reproduce-from-backup.sh`) and the resulting `.output/server/chunks`
were compared file by file with the chunks of the image that is running in
production right now:

```
identical chunks: 181   differing: 2
 differs: build/styles.mjs
 differs: nitro/nitro.mjs
```

* `nitro/nitro.mjs` differs **by design** — it is the server bundle that
  contains the fail-closed authorization. The production bundle still
  contains `if (!needsAuth) return;`; the rebuilt bundle does not, and
  contains `classifyApiRoute` and the 404 deny instead.
* `build/styles.mjs` differs because the scoped CSS of the restored pages
  was recovered from the production client bundle while the visual redesign
  of 2026-10-14 → 2026-11-09 was never published to GitHub.

Every other chunk — including `routes/api/materials.get.mjs`,
`_/optional-user.mjs`, `routes/api/auth/telegram-login/verify.post.mjs`,
`routes/api/bot/quick-login.post.mjs` and `routes/api/auth/logout.post.mjs` —
is **byte-identical** to production. The reconstructed TypeScript therefore
compiles to exactly the same JavaScript as the lost originals for the
restored modules.

## Known limitations

1. The restored files are **not** the original TypeScript. Anyone continuing
   the project must treat them as a re-implementation and prefer the recovered
   behaviour over assumptions about the lost originals.
2. The production **test sources** were not part of the Docker artifact, so
   they could not be recovered. The suites were re-written against the
   restored modules; the previous release reported 69 test cases, the restored
   suite reports 69 as well (58 + 10 admin + 1 restored public-surface test).
   The identity of the individual lost test case could not be established.
3. The front-end of the lost checkout (visual-polish 2026-10-14 →
   legal-motion-2.0 → Nov) was never published to GitHub. The restored pages
   cover the functional surface; the visual redesign of that period is not
   present in this branch.
