# CA Portal: Role-Guard Fix, Test Infra, and Doc Reconciliation

## Context

The CA (Campus Ambassador) portal's backend and frontend were built and merged into `develop` across PRs #27, #28, and #30. However, direct inspection found a live regression: `apps/web/app/dashboard/ca/layout.tsx` gates the CA dashboard with the stale role string `'CA'` instead of the actual role value `'CAMPUS_AMBASSADOR'` used everywhere else in the codebase (`AuthGuard.tsx`, `dashboard/page.tsx`, `login/page.tsx`, the API, and the Prisma schema all agree on `'CAMPUS_AMBASSADOR'`). Because `AuthGuard` redirects an unauthorized `CAMPUS_AMBASSADOR` user back to `/dashboard/ca` itself, a real Campus Ambassador who logs in is stuck in a redirect loop and can never reach their own dashboard, applications, onboarding, or tasks pages (all of which sit under this one layout).

This went unnoticed because `apps/web` has **no test runner configured at all** — no Vitest/Jest, no RTL, no e2e harness (confirmed via package.json and glob search). The backend has solid `CAMPUS_AMBASSADOR`-role coverage (`apps/api/test/auth.e2e-spec.ts`, `ca.service.spec.ts`), but nothing exercises the Next.js `AuthGuard` component or its route layouts, so this class of bug is invisible to CI.

Separately, `.claude/reference/ca-program.md` still carries a header of "Status: Planning (pre-implementation)" dated 2026-06-12, even though the schema, task engine, referral system, and leaderboard described in it are implemented and merged. Some pieces it describes (Instagram/LinkedIn OAuth verification, brand-scoped login) do **not** appear to be built yet, based on the tasks page only supporting manual `URL_SUBMISSION`/`SCREENSHOT`/`PHOTO` proof — this needs reconciling rather than blanket-deleting.

This plan branches off `develop`, fixes the role bug, adds frontend test infrastructure with a regression test that would have caught it, and brings the CA program doc in line with what's actually shipped.

`gh` CLI is unavailable in this environment, so no GitHub issue could be pre-linked. The user should either create/link an issue manually (per CONSTITUTION.md's "every unit of work starts as an issue" rule) or confirm working without one for this fix.

## Branch

Create off `develop`, following CONSTITUTION.md's `<type>/<kebab-case-description>` convention:

```
fix/ca-dashboard-role-guard
```

## Work Items

### 1. Fix the role-guard bug
- `apps/web/app/dashboard/ca/layout.tsx:9` — change `allowedRoles={['CA', 'ADMIN']}` to `allowedRoles={['CAMPUS_AMBASSADOR', 'ADMIN']}`.
- No other call sites need this fix — confirmed the only two `allowedRoles=` usages in `apps/web` are this one and `apps/web/app/admin/layout.tsx:12` (already correct). Other literal `'CA'` occurrences (`apps/web/lib/admin-services.ts:11`, `apps/api/test/roles.e2e-spec.ts:395`, a Prisma migration) belong to an unrelated `AdminService` enum, not `UserRole` — leave untouched.

### 2. Set up frontend test infrastructure
`apps/web` currently has zero test tooling. Add:
- Vitest + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` as devDependencies in `apps/web/package.json`.
- A minimal `apps/web/vitest.config.ts` (jsdom environment, path aliases matching `tsconfig.json`).
- A `test` script in `apps/web/package.json` (e.g. `"test": "vitest run"`), and add it to the root `npm run test` orchestration if the root `package.json` wires per-workspace test scripts together (check root `package.json`/`turbo.json` for how `npm run test --workspace=api` is defined today and mirror that pattern for `web`).

### 3. Add a regression test for the role guard
- New test file, e.g. `apps/web/components/auth/AuthGuard.test.tsx`, covering `components/auth/AuthGuard.tsx`:
  - A user with `role: 'CAMPUS_AMBASSADOR'` and `allowedRoles={['CAMPUS_AMBASSADOR', 'ADMIN']}` renders children (authorized).
  - A user with `role: 'CAMPUS_AMBASSADOR'` and `allowedRoles={['CA', 'ADMIN']}` (the old broken config) is redirected, demonstrating the exact failure mode being fixed.
  - An `ADMIN` user is authorized under the CA guard config (matches current intended behavior).
- Mock whatever auth/user context `AuthGuard.tsx` reads from (check its imports — likely a context hook or prop) rather than hitting real API calls.

### 4. Reconcile `.claude/reference/ca-program.md`
Rewrite into two clearly separated sections without discarding useful reference material:
- **Implemented**: update the status header; mark schema (§3.3), task engine, referral/leaderboard system, and the priority/phase table (§7) as done, cross-checked against the actual `apps/api/prisma/schema.prisma` models (`CAProfile`, `CAApplication`, `CaTask`, `CATaskAssignment`, `SocialReferral`, `ReferralConversion`, `CaReferralLead`) so field/model names in the doc match reality.
- **Not yet implemented / future work**: explicitly flag Instagram/LinkedIn OAuth verification (§4.3–4.4), YouTube/Twitter auto-verification (§4.1–4.2), and brand-scoped login (§5.3) as unbuilt, rather than presenting them as already-delivered or silently dropping them.
- Keep §1 (rationale), §2.3–2.4 (task categories/points formula), §6 (scalability/Redis), and §8 (security) largely as-is, re-labeled as living reference/audit-checklist content rather than a to-do list — verify §6 and §8 claims against `ca.service.ts` while editing.

## Verification

- `npm run lint` and `npm run check-types` at the root (covers `apps/web`).
- `npm run build --workspace=web` to confirm the layout change and new test deps don't break the build.
- `npm run test --workspace=web` (new script) — confirm the new `AuthGuard.test.tsx` passes, and specifically that it fails against the old `['CA', 'ADMIN']` config (sanity-check by temporarily reverting the layout fix locally, confirming the test catches it, then re-applying the fix).
- Manual check: log in as a seeded `CAMPUS_AMBASSADOR` user (check `apps/api/prisma/seed.ts` for a seeded CA account, or promote one via the admin application-review flow) and confirm `/dashboard/ca` loads instead of looping.
- Re-read the edited `ca-program.md` end-to-end for internal consistency (no leftover "TODO: build this" language for things now marked Implemented).
