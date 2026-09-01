# Plan: 25 — CA Frontend Wiring (Phase 1 of the CA Portal completion)

## Issue

- Tracker: GitHub #25 (CA: wire CA frontend to real API + missing auth pages, area:web, priority:p0, track:frontend)
- Track: web
- Priority: high — Phase 1 of `.claude/plans/25-ca-portal-completion-and-deploy.md`, split into its own dedicated plan the same way Phase 0 became `.claude/plans/29-ca-application-intake.md`. That parent doc's "Phase 1" section is now a pointer to this file — this is the source of truth for the frontend work.
- Owner: Minhaj
- Reviewer: self-review acceptable — frontend wiring + docs + a CI fix, no new security-sensitive logic (all RBAC/validation/CAS-guard work already shipped and reviewed on the backend in PR #28 and PR #30, this plan only calls those endpoints from the UI)
- Target branch: `feature/ca-portal` (existing branch, PR #27 open against `develop`)

## Dependency

**Blocked on PR #30 (`feature/ca-application-intake`, closes #29) merging to `develop` first.** PR #30's CI is green (`Lint • Typecheck • Build • Coverage` and `Lint, Typecheck, Build, Test` both pass) as of 2026-08-20 but it has not merged yet. Step 3 below (`/dashboard/ca/apply` + the new admin review page) has nothing real to call until it does — everything else in this plan (Steps 1, 2, 4–10) has no dependency on it and can start immediately.

## Ground Truth (carried over from the parent plan's audit, re-verified where cheap to do so)

- **Backend is done.** PR #28 (issue #24) and PR #30 (issue #29) between them cover every endpoint this plan wires to. `feature/ca-portal` already has `develop` merged in as of PR #28; it will need `develop` merged again once PR #30 lands, before Step 3 can be tested against a real running backend.
- **Frontend is not wired.** Every CA-related page holds `MOCK_*` data or a `TODO: Wire up POST ...` comment, with two exceptions already real and not to be touched: `apps/web/lib/api.ts` (fetch wrapper) and `apps/web/app/admin/ca-tasks/page.tsx` (task list/create/archive — already calls `api.get('/admin/brands')`, `api.get('/admin/ca-tasks')`, `api.post('/admin/ca-tasks', data)`, `api.patch(...)`).
- **Two real bugs**, independent of wiring:
  1. `apps/web/app/login/page.tsx` redirects on `role === 'CA'`; the actual `UserRole` enum value is `CAMPUS_AMBASSADOR`. This branch never fires.
  2. `apps/web/app/dashboard/ca/apply/page.tsx` is a fake `setTimeout`-then-redirect flow with no backend behind it. PR #30 now provides the real backend (`POST /ca/apply`, `GET /ca/apply/me`, admin review) — this plan wires the page to it for real.
- **No account-creation page exists anywhere** (`/signup` or `/register`-as-signup) — grepped, zero hits for `auth/register` calls in `apps/web`. `/register` already exists but is the waitlist page (`POST /leads/waitlist`), not signup — confirmed working UI, just unwired (Step 5). Building `/signup` (Step 4) is the actual top-priority item: nothing else in the funnel matters if nobody can create an account.
- **No referral-capture middleware** — `apps/web/middleware.ts` does not exist.
- **CA onboarding's college field is a fake 5-item dropdown** (`"College 1"`...`"College 5"`, enforced via `z.enum`). The backend accepts free text, no server-side enum (PR #28's own deliberate reversal of an earlier stricter design) — this dropdown currently rejects every real submission.
- **No admin nav/sidebar exists at all.** Checked `apps/web/app/admin/layout.tsx` — it's just an `AuthGuard` wrapper (`allowedRoles={['ADMIN', 'SUPER_ADMIN']}`), no nav links anywhere in the codebase point at `/admin/ca-tasks` either. Admins currently reach admin pages by typing the URL directly. **Correction from the parent plan's draft:** there is no nav component to add a link to for the new `/admin/ca-applications` page — it follows the exact same "direct URL, no nav entry" pattern `/admin/ca-tasks` already uses. Not a gap this plan introduces or needs to fix.
- **CI on PR #27 is failing** (both `Lint, Typecheck, Build, Test` and `Lint • Typecheck • Build • Coverage`), root cause already found and fixed in the working tree (uncommitted): `package-lock.json` is missing `@next/swc-linux-{x64,arm64}-{gnu,musl}` optional-dependency entries that the Linux CI runner needs; the macOS-generated lockfile never had them. Verified locally: `npm run build` passes clean with the fix in place.
- **PR #26** ("feature/user-auth", unrelated, conflicting, stale) and **Phase 2 (staging deploy)** are out of scope for this plan — tracked separately in the parent doc.
- **Resolved this session** (were open Unknowns in the parent plan draft):
  - `RegisterDto` (`apps/api/src/auth/dto/register.dto.ts`): `{ email, password (min 8 chars), name, phone?, college?, consent: boolean }`.
  - `POST /auth/register`'s return shape: the created user profile directly (`UserProfile` — no `accessToken`). Confirmed via `auth.controller.ts` (`register()` just returns `this.authService.register(dto)`) and matches how `auth.e2e-spec.ts` asserts on it (`registerBody.data.email`). **`/signup` must redirect to `/login` after a successful register, not attempt to auto-authenticate** — there is no token to store.

## Outcome

When this ships:
- A visitor can create an account at `/signup`, log in, and land on the right dashboard for their role (bug fixed).
- A logged-in participant can apply to become a Campus Ambassador at `/dashboard/ca/apply`, see their application's real status (pending / rejected-with-reason), and an admin can review the queue at `/admin/ca-applications`.
- Once approved, the CA can onboard with any real college name, see their live dashboard (real refCode, click count, points, rank), submit tasks (URL or file), and see the public leaderboard reflect it.
- An admin can review task submissions with working signed-URL image proof and a required rejection reason — already-built page, just wired to real data instead of mocks.
- Referral links (`/register?ref=CODE`) set a cookie and fire a click event; the waitlist page actually submits leads.
- PR #27's CI is green and it merges to `develop`.
- `.claude/reference/api.md` documents the one endpoint it was still missing (`PATCH /admin/users/:id/role`).

## Scope

**In:**
- Everything listed in Files to Change below
- Fixing the two standalone bugs
- Wiring every CA/auth page to the real backend via the existing `apps/web/lib/api.ts` (no TanStack Query, no new state library)
- Committing the already-fixed `package-lock.json`
- Committing the three untracked doc files sitting in the working tree (`docs/ca-portal-spec-and-status.md`, `docs/ca-portal-spec-scope-and-execution-plan.html`, `.claude/plans/21-redis-bullmq-infra.md`) — historical record, referenced by path from other plan docs but never actually added to git
- Getting the full validation gate green and merging PR #27

**Out:**
- Any backend change — PR #28 and PR #30 already cover everything this plan calls
- PR #26, Phase 2 (staging deploy) — separate, tracked in the parent plan doc
- `apps/api/prisma/import-ca-applicants.ts` — explicitly reserved elsewhere, do not touch
- Admin UI for `PATCH /admin/users/:id/role` — acceptable via direct API call at this scale; the new application-review flow (Step 3) is the actual promotion UI now anyway
- Any new dependency (TanStack Query, Sentry-on-web, etc.) — nothing already shipped uses them

## Files to Read First

- `apps/web/lib/api.ts` — the fetch wrapper every page below calls through; correct as-is, don't touch its interface
- `apps/web/app/admin/ca-tasks/page.tsx` — the one page already correctly wired; copy its exact pattern (`useEffect` + `useState` + `api.get/post/patch`, loading/empty states, no library) for every other page
- `apps/web/app/admin/ca-tasks/[id]/assignments/page.tsx` — the review-form pattern (`ReviewActionForm`: radio toggle, conditional reason field, required-reason validation) to reuse for the new admin CA-applications review page
- `.claude/reference/api.md` — CA Portal section, now includes the four Phase 0 endpoints and their exact response shapes (see below)
- `apps/api/src/ca/ca.service.ts` §`applyForCA`/`getMyApplication` and `apps/api/src/admin/admin.service.ts` §`listApplications`/`reviewApplication` — exact response shapes this plan's frontend code must match:
  - `POST /ca/apply` / `GET /ca/apply/me` → the raw `CAApplication` row or `null`: `{ id, userId, targetCollege, status: 'PENDING'|'APPROVED'|'REJECTED', rejectionReason, reviewedById, reviewedAt, createdAt }`
  - `GET /admin/ca-applications` → `{ applications: [{ id, targetCollege, status, rejectionReason, reviewedAt, createdAt, user: { id, name, email } }], pagination: { page, limit, total, totalPages } }`
  - `PATCH /admin/ca-applications/:id/review` → `{ success: true, count: 1 }` on success, throws (surfaces as a 409/400 via the envelope) otherwise

## Files to Change

```
apps/web/app/login/page.tsx                                  fix role === 'CA' -> 'CAMPUS_AMBASSADOR'
apps/web/app/signup/page.tsx                                  new — account creation, POST /auth/register incl. consent, redirects to /login on success (no token returned)
apps/web/middleware.ts                                        new — ?ref= capture, 30-day cookie, fire-and-forget POST /ca/referral/click
apps/web/app/register/page.tsx                                wire POST /leads/waitlist, add a success state, read ref cookie/param
apps/web/app/dashboard/ca/apply/page.tsx                       replace fake auto-approve flow: GET /ca/apply/me on load -> form / PendingStateView / rejection-reason view; POST /ca/apply on submit
apps/web/app/admin/ca-applications/page.tsx                    new — GET /admin/ca-applications + PATCH .../review, same list+inline-review pattern as the ca-tasks assignments page
apps/web/app/dashboard/ca/page.tsx                             replace useState mock with GET /ca/me on mount
apps/web/app/dashboard/ca/onboard/page.tsx                     wire POST /ca/onboard; college field -> free text input, drop the 5-item fake enum
apps/web/app/dashboard/ca/tasks/page.tsx                       replace MOCK_TASKS with GET /ca/tasks; wire handleUrlSubmit/handleFileSubmit to POST /ca/tasks/:taskId/submit (multipart for file)
apps/web/app/admin/ca-tasks/[id]/assignments/page.tsx          replace MOCK_TASK_INFO/MOCK_ASSIGNMENTS with GET /admin/ca-tasks/:id/assignments using params.id; wire ReviewActionForm to PATCH /admin/ca-task-assignments/:id/verify
apps/web/app/leaderboard/page.tsx                              replace MOCK_LEADERBOARD with a real server-side fetch to GET /leaderboard/ca (keep revalidate = 900)
.claude/reference/api.md                                       add PATCH /admin/users/:id/role row (the only remaining undocumented endpoint — Phase 0's four are already documented)
package-lock.json                                              commit the already-present working-tree fix (swc linux optional deps)
docs/ca-portal-spec-and-status.md                               git add (untracked, referenced by plan docs)
docs/ca-portal-spec-scope-and-execution-plan.html                git add (untracked, referenced by plan docs)
.claude/plans/21-redis-bullmq-infra.md                          git add (untracked, historical record)
```

## Implementation Steps

### Step 1: Commit the CI fix in isolation

- **What:** The `package-lock.json` fix already sits in the working tree (stashed and restored across the Phase 0 session — confirm it's still there with `git status` before starting). Verify it's exactly the swc-optional-deps addition (`git diff package-lock.json`, confirm every hunk is `@next/swc-*` or a lockfile-format side effect of that), commit it alone first so CI status flips independently of the feature work.
- **Files:** `package-lock.json`
- **Validation:** `npm run build`; push and confirm the next CI run on PR #27 gets past the `web#build` step it was failing on.

### Step 2: Fix the login redirect bug

- **What:** `login/page.tsx`: change the redirect condition from `role === 'CA'` to `role === 'CAMPUS_AMBASSADOR'`.
- **Files:** `apps/web/app/login/page.tsx`
- **Validation:** manual — log in as a seeded `CAMPUS_AMBASSADOR` user, confirm redirect to `/dashboard/ca`.

### Step 3: Wire the real apply flow (blocked on PR #30 merging)

- **What:** `dashboard/ca/apply/page.tsx` — on mount, `GET /ca/apply/me`. Three states: `null` → render `CAApplicationForm` (already exists, its `targetCollege` field matches `CreateApplicationDto`) wired to `POST /ca/apply`; `status === 'PENDING'` → render the existing, currently-unused `PendingStateView`; `status === 'REJECTED'` → show `rejectionReason` plus a "submit a new application" action that re-renders the form (the backend allows re-applying after rejection, no cooldown). Drop the old `setTimeout`/auto-redirect body entirely. New `apps/web/app/admin/ca-applications/page.tsx` — list from `GET /admin/ca-applications` (`?status=PENDING` default), same card-list + inline review-form pattern as `admin/ca-tasks/[id]/assignments/page.tsx`'s `ReviewActionForm` (radio toggle APPROVED/REJECTED, `rejectionReason` required and only shown for REJECTED), calling `PATCH /admin/ca-applications/:id/review`. No nav link to add — reached by direct URL, matching how `/admin/ca-tasks` already works.
- **Files:** `apps/web/app/dashboard/ca/apply/page.tsx`, `apps/web/app/admin/ca-applications/page.tsx` (new)
- **Validation:** manual — apply as a fresh participant, see `PendingStateView`; as admin, see it in the queue, reject with a reason, confirm the applicant sees the reason and can re-apply; re-apply and approve this time, confirm the applicant's role is now `CAMPUS_AMBASSADOR` (re-login or refresh `/auth/me`) and `/dashboard/ca/onboard` is reachable next.

### Step 4: Account creation — `/signup`

- **What:** New page, same form pattern as `login/page.tsx` (react-hook-form + zod). Fields: `email`, `password` (min 8), `name`, `consent` (required checkbox, `z.literal(true)`, links to `/privacy-policy` — same pattern as `register/page.tsx`'s waitlist form). `phone`/`college` are optional per the DTO — omit them from the form for a minimal signup, they're not needed until CA onboarding asks for college anyway. `POST /auth/register` via `api.post`. **No token comes back** (confirmed above) — on success, redirect to `/login` with a query param or state that shows a "account created, log in" message; on a duplicate-email error, surface the `ApiError` message inline.
- **Files:** `apps/web/app/signup/page.tsx` (new), `apps/web/app/signup/signup.module.css` (new, copy `login.module.css`'s structure)
- **Validation:** manual — create an account, confirm redirect to `/login` with a visible success message, then log in with those credentials and confirm it works; confirm consent-unchecked blocks submit; confirm a duplicate email surfaces a readable error, not a raw crash.

### Step 5: Referral-capture middleware

- **What:** `apps/web/middleware.ts`, `export function middleware(request: NextRequest)`, matcher on `/register`. Read `?ref=` query param; if present, set a cookie (`ca_ref`, 30-day maxAge) and fire-and-forget `POST /ca/referral/click` with `{ referralCode: ref }` (matches `ReferralClickDto`'s field name — confirm against `apps/api/src/ca/dto/ca.dto.ts` if it's changed since). Don't await/block on the response.
- **Files:** `apps/web/middleware.ts` (new)
- **Validation:** manual — visit `/register?ref=SOMECODE` in incognito, confirm a cookie is set and the click endpoint got hit; visit `/register` with no `ref`, confirm no error and no click fired.

### Step 6: Wire the waitlist page

- **What:** `register/page.tsx`'s `onSubmit` — replace the `console.log` with `api.post('/leads/waitlist', payload)`, reading `referralCode` from the `ca_ref` cookie or the `?ref=` search param it already reads via `useSearchParams`. Add a success state — the form currently has no post-submit UI at all.
- **Files:** `apps/web/app/register/page.tsx`
- **Validation:** manual — submit with and without `?ref=`, confirm a `CaReferralLead` row is created (with/without `referralCode`); confirm a bypassed-consent request still gets a 400 from the server even though the client already blocks it.

### Step 7: Wire CA dashboard, onboarding, and fix the college field

- **What:** `dashboard/ca/page.tsx` — replace the `useState(caData)` mock with `useEffect` + `useState` calling `GET /ca/me` on mount, with loading/error states (none exist today — the page will crash-render on `undefined` once the mock is removed if this isn't guarded). `dashboard/ca/onboard/page.tsx` — drop the 5-item `z.enum(COLLEGES)`, replace with `z.string().min(1)` and a plain `<input>` (the backend's actual free-text contract — do not reintroduce a fixed list). Wire `onSubmit` to `POST /ca/onboard`, handle the documented 409 (already-onboarded) with a message, redirect to `/dashboard/ca` on success.
- **Files:** `apps/web/app/dashboard/ca/page.tsx`, `apps/web/app/dashboard/ca/onboard/page.tsx`
- **Validation:** manual — via Step 3's apply/approve flow, get a test user promoted to CAMPUS_AMBASSADOR, onboard with an arbitrary college string, confirm the dashboard shows the real refCode/clickCount/points/rank, confirm a second onboard attempt surfaces the 409 message instead of crashing.

### Step 8: Wire task submission and admin verification

- **What:** `dashboard/ca/tasks/page.tsx` — replace `MOCK_TASKS` with `GET /ca/tasks` in a `useEffect`. `handleUrlSubmit` → `api.post('/ca/tasks/:taskId/submit', { proofUrl })`. `handleFileSubmit` → build a `FormData` (`lib/api.ts` already special-cases `body instanceof FormData`) and `api.post('/ca/tasks/:taskId/submit', formData)`. Refetch after either succeeds. `admin/ca-tasks/[id]/assignments/page.tsx` — replace both `MOCK_*` constants with `GET /admin/ca-tasks/:id/assignments` using `params.id` (currently voided out), render the real `proofUrl` field the endpoint already resolves to a signed URL server-side. Wire `ReviewActionForm`'s `onSubmit` to `PATCH /admin/ca-task-assignments/:id/verify` with `{ status: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED', pointsOverride, rejectionReason }` (field name is `pointsOverride`, matching `VerifyTaskDto` — not `pointsAwarded`, which is the DB column name only), refetch on `onComplete`.
- **Files:** `apps/web/app/dashboard/ca/tasks/page.tsx`, `apps/web/app/admin/ca-tasks/[id]/assignments/page.tsx`
- **Validation:** manual — submit one URL task and one file task as a CA, confirm both show `PENDING`; as admin, open the assignments page, confirm the file proof resolves to a working signed image URL, approve one and reject the other with a reason, confirm the CA's task list and dashboard points/rank reflect both outcomes.

### Step 9: Wire the public leaderboard

- **What:** `leaderboard/page.tsx` is already an `async` server component with `revalidate = 900` — replace `MOCK_LEADERBOARD` with the real `fetch` (already sketched in a comment) against `${process.env.NEXT_PUBLIC_API_URL}/leaderboard/ca`, `{ next: { revalidate: 900 } }`. Keep the existing empty-state handling.
- **Files:** `apps/web/app/leaderboard/page.tsx`
- **Validation:** manual — confirm it matches Step 8's seeded data; confirm the page doesn't refetch on every request.

### Step 10: Docs, doc-file commits, and the full validation gate

- **What:** Add the `PATCH /admin/users/:id/role` row to `.claude/reference/api.md` (same table as the CA Portal section — the four Phase 0 rows are already there from PR #30). `git add` the three untracked doc files in their own commit. Confirm Docker is up (`docker compose up -d` — confirmed working as of Phase 0, but re-check if this runs in a new session). Run the full gate.
- **Files:** `.claude/reference/api.md`, plus the three doc files staged as-is
- **Validation:**
  ```bash
  docker compose up -d
  npm run lint
  npm run check-types
  npm run build
  npm run test --workspace=api
  npm run test:e2e --workspace=api
  ```
  All green.

### Step 11: Merge PR #27

- **What:** Once CI is green (`gh pr checks 27`), merge to `develop`. Close #25 manually afterward — merges into `develop` don't auto-close linked issues in this repo.
- **Files:** none (process step)
- **Validation:** `gh pr checks 27` all green; `gh issue close 25` after merge with a summary comment.

## Tests and Validation

```bash
docker compose up -d
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
npm run test:e2e --workspace=api
```

Manual, full click-through: sign up → log in → apply to be a CA → admin rejects with a reason → re-apply → admin approves → onboard with a free-text college → dashboard shows real refCode/points/rank → visit `/register?ref=CODE` in incognito → click recorded → submit waitlist lead → CA submits one URL task + one file task → admin reviews both (signed-URL file view) → approve one, reject one with a reason → CA's task list and dashboard reflect it → `/leaderboard` shows the updated standing.

## Acceptance Criteria

- [ ] `package-lock.json` CI fix committed, PR #27's CI green
- [ ] `role === 'CAMPUS_AMBASSADOR'` bug fixed
- [ ] `/dashboard/ca/apply` wired to real Phase 0 endpoints (form / pending / rejected states), fake auto-approve gone
- [ ] New `/admin/ca-applications` review queue works (approve/reject with reason, role promotion visible)
- [ ] `/signup` exists, creates a real account, consent enforced, correctly redirects to `/login` (no token assumption)
- [ ] `apps/web/middleware.ts` captures `?ref=` and fires the click endpoint
- [ ] `/register`, `/dashboard/ca`, `/dashboard/ca/onboard`, `/dashboard/ca/tasks`, `/admin/ca-tasks/[id]/assignments`, `/leaderboard` all call real endpoints, zero `MOCK_*`/`TODO: Wire up` remaining
- [ ] Onboarding college field accepts free text
- [ ] `.claude/reference/api.md` documents `PATCH /admin/users/:id/role`
- [ ] Three untracked doc files committed
- [ ] Full validation gate green including e2e
- [ ] PR #27 merged to `develop`, issue #25 closed manually with a summary comment

## Risks and Notes

- **Data migration:** none — frontend-only plus a one-line docs update.
- **API contract change:** none — every endpoint wired to already exists and is documented.
- **Performance concern:** none new.
- **Security:** none new — all RBAC/validation/CAS-guard logic already shipped and tested in PR #28/#30; this plan only calls those endpoints from the UI.
- **Sequencing risk:** Step 3 is blocked on PR #30 merging to `develop` and `feature/ca-portal` pulling that merge in. Steps 1, 2, 4–10 have no such dependency and can proceed in any order relative to PR #30's merge timing.
- **Unknowns:** none outstanding — the two open items from the parent plan draft (`RegisterDto` shape, register's return shape) were resolved during this planning pass by reading the actual code.
