# TypeScript debt baseline

Generated with `npm run typecheck` on the current Nuxt 3 / Vue 3 / TypeScript 5
dependency graph. This is a debt inventory, not a passing gate. No strictness
checks or source files are excluded from the full command.

## Current count

- **246 errors in 43 files** after replacing the Nuxt ESLint runtime module with
  the config-only package.
- The first run with the full ESLint module reported **460 errors in 67 files**.
  That setup also introduced H3 2.x into Nuxt's build resolution and was
  discarded; use the current count as the actionable baseline.
- A scoped `vue-tsc` config was tested, but Nuxt-generated route/component types
  pulled the broader app graph back into the program. It was removed rather
  than presented as an isolated green check.

## Public portfolio surface

**34 errors across 9 files** (includes the shared public-project adapter under
`server/utils`):

- `pages/index.vue` — 1
- `pages/projects.vue` — 7
- `components/HamburgerMenu.vue` — 2
- `components/ProjectModal.vue` — 2
- `components/ProjectPreview.vue` — 1
- `composables/useApi.ts` — 1
- `composables/useAuth.ts` — 9
- `composables/useProjects.ts` — 10
- `server/utils/public-project.ts` — 1

The largest themes are project API serialization/nullable fields and error
responses inferred as unions, plus strict handling of caught `unknown` values.
The public lint/test/build gate is available separately; this does not claim
these TypeScript errors are solved.

## Internal platform and server

- **Content/platform pages:** 127 errors in `pages/materials.vue` (70),
  `pages/tutorials.vue` (30), and `pages/ui-components.vue` (27). Dominant
  patterns are untyped API results and their inferred `never` collections.
- **Server API:** 34 errors across 20 server files, excluding the public adapter
  listed above. Most are request-body narrowing, optional route params,
  Prisma input types, and caught `unknown` errors.
- **Admin:** 28 errors in 3 files: `pages/admin/ui-components.vue` (23),
  `components/EditProfileModal.vue`, and `components/TopUpBalanceModal.vue`.
- **Other UI components:** 13 errors across 7 files, mostly DOM element and
  modal/event typing.
- **Tests:** 10 errors in `tests/public-journey.test.ts`, where static fixture
  narrowing currently produces `never` for project details.

## Suggested order for later debt work

1. Public `useProjects` response contract and shared project case types.
2. Public header/modal DOM element and event typing.
3. Admin/content API request and response DTOs.
4. Remaining platform components and tests.

Do not lower TypeScript strictness or add broad suppressions to reduce these
counts. Re-run the full typecheck after each focused migration slice and update
this report with the new baseline.
