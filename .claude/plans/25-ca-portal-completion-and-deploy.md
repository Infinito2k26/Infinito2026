# Plan: 25 — CA Portal: Frontend Wiring, CI Fix, and Staging Deploy

## Issue

- Tracker: GitHub #25 (CA: wire CA frontend to real API + missing auth pages, area:web, priority:p0, track:frontend) — this plan also closes out the PR #27 CI failure and adds a staging-deploy phase not covered by any open issue
- Track: web (primary) + infra (deploy phase)
- Priority: high — no fixed same-day deadline; sequenced properly over Phase 0 → Phase 1 → Phase 2, "we have time, we will do it right" per the user
- Owner: Minhaj
- Reviewer: self-review acceptable for Phase 1/2 (frontend + docs + CI fix + provisioning). Phase 0 reuses the already-reviewed CAS/points-award pattern from PR #28 — a second pair of eyes is a nice-to-have on Step 0.4, not a hard gate.
- Target branch: `feature/ca-portal` (current branch, PR #27 open against `develop`)

## Ground Truth (verified this session, 2026-08-19)

- **Backend is done.** PR #28 "feature/ca-backend" merged to `develop` 2026-08-17, closes #24. Full CA module: onboarding, `@Roles`/`RolesGuard` RBAC, `recordConversion()`, free-text college validation, private MinIO/S3 proof storage with signed URLs, compare-and-swap verify, admin assignment listing, consent capture, `referral-flush` + `leaderboard` BullMQ processors, `AllExceptionsFilter` as the accepted Sentry substitute. `feature/ca-portal` (this branch) has already merged `develop` and contains all of it — confirmed via `git log`, no divergence from `origin/feature/ca-portal`.
- **Frontend is NOT wired.** Grepped every CA-related page: most still call nothing and hold `MOCK_*` data or `TODO: Wire up POST ...` comments. Exceptions: `apps/web/app/admin/ca-tasks/page.tsx` (task list/create/archive) and `apps/web/lib/api.ts` (fetch wrapper) are already real and working — reuse both as-is, do not rewrite.
- **api.md gap:** `PATCH /admin/users/:id/role` exists in code (`apps/api/src/admin/admin-users.controller.ts`) but is undocumented in `.claude/reference/api.md`.
- **CI root cause found and already fixed in the working tree, uncommitted:** `package-lock.json`'s local diff (+3267/-405) adds the missing `@next/swc-linux-{x64,arm64}-{gnu,musl}` optional-dependency entries. The macOS-generated lockfile never had them, so the Linux CI runner's `next build` fails trying to auto-fetch the SWC binary via a broken corepack/yarn fallback (`packageManager: "yarn@npm@10.9.4"` parse error, unrelated to our correctly-set root `packageManager: "npm@10.9.4"`). Verified locally: after `rm -rf node_modules` (fixing an unrelated `ENOTEMPTY` corruption) and `npm install`, `npm run build` succeeds, `npm run lint` and `npm run check-types` pass clean.
- **Two real frontend bugs**, independent of the wiring work:
  1. `apps/web/app/login/page.tsx` redirects to `/dashboard/ca` on `role === 'CA'`, but the Prisma `UserRole` enum value is `CAMPUS_AMBASSADOR`. This branch never fires — a CA logging in never lands on their dashboard.
  2. `apps/web/app/dashboard/ca/apply/page.tsx` is a fake "self-serve apply → `setTimeout` → auto-redirect to dashboard" flow. The real backend has no concept of a pending application — promotion to `CAMPUS_AMBASSADOR` is admin-only via `PATCH /admin/users/:id/role`, done outside this flow entirely. The page's premise doesn't match anything the backend can do. `apps/web/components/ca/PendingStateView.tsx` (an unused "your application is under review" component) confirms this was the intended design at some point, but no backend supports it.
- **No account creation page exists anywhere.** Grepped `apps/web` for `auth/register` and `/signup` — zero hits. `/login` exists; nothing lets a new user create an account. This is the actual top-priority gap: nothing else in the CA funnel matters if nobody can sign up.
- **No referral-capture middleware.** `apps/web/middleware.ts` does not exist. The `?ref=CODE` cookie-capture + fire-and-forget click POST from `local-ca-program-launch.md` Phase D Step 2 was never built.
- **`apps/web/app/dashboard/ca/onboard/page.tsx`'s college list is 5 literal placeholders** (`"College 1"` … `"College 5"`) enforced via a Zod `z.enum`. The backend (per PR #28 / plan #24 Step 5) accepts **free-text** college names, no server-side enum. This dropdown will reject every real submission.
- **PR #26 "feature/user-auth"** (open, `CONFLICTING`, CI failing since 2026-08-08, author Mahendra-seervi) is an unrelated, overlapping auth rebuild (OTP verification, password setup, mail templates) that collides with already-merged auth (PR #20) and the Users module ownership assigned elsewhere. **Out of scope for this plan** — flagged for the user to close or salvage separately, not touched here.
- **Two untracked doc files should be committed**, referenced by path from `local-ca-program-launch.md` but never added to git: `docs/ca-portal-spec-and-status.md`, `docs/ca-portal-spec-scope-and-execution-plan.html`. `.claude/plans/21-redis-bullmq-infra.md` is also untracked (historical, Phase B is done) and should be committed for the record.
- **`apps/api/prisma/import-ca-applicants.ts` is untracked and explicitly out of scope** per `.claude/plans/24-ca-backend-staging-hardening.md` ("leave it alone; it's reviewed separately"). Do not touch it, do not stage it.
- **E2E could not be run this session.** Docker Desktop wasn't running; `open -a Docker` was issued but the daemon still wasn't responding after several minutes of polling. Must be confirmed working before this plan is considered done — see Step 8.
- **Deployment infra is essentially at zero**, despite `local-ca-program-launch.md` Phase E and the master roadmap's W8 assuming it'd exist by now:
  - No `Dockerfile` for the API, no `fly.toml`/`render.yaml`, no CD workflow (only `ci.yml` + `code-coverage.yml`, both lint/typecheck/build/test only).
  - A Vercel project named `infinito2k26` exists (checked via the Vercel connector) but is stale and effectively unusable: framework misdetected as `vite`, and every deployment on it is a docs-only commit from a **different GitHub repo** (`mdminhaj-2106/Infinito2k26`, the personal fork) — not `Infinito2k26/Infinito2026`, the org repo this session is working in.
  - No in-repo evidence of Neon, Upstash, Cloudflare R2, a VPS, Razorpay KYC completion, or Sentry. `.claude/reference/deployment-requirements.md` is a budget-sanction proposal for IIT Patna administration, not proof any of this is provisioned.
  - **None of this is discoverable further from the codebase — it requires the user to confirm what, if anything, has actually been provisioned outside of Git.**

## Outcome

When this ships:
- A new visitor can create an account, log in, apply to become a Campus Ambassador, get reviewed by an admin (approved or rejected with a reason), and — once approved — see a working CA dashboard with a real referral code, real click count, real points, and real rank. No mock data left in any CA-adjacent page.
- CA task submission (URL and file) and admin verification (approve/reject with points/reason) work end-to-end against the real API, matching what PR #28 already built and documented.
- The public leaderboard and the waitlist form are live against real endpoints.
- `?ref=CODE` links set a cookie and fire a click event.
- PR #27's CI is green (lint, typecheck, build, unit tests; e2e once Docker is confirmed working) and the PR is merged to `develop`.
- `.claude/reference/api.md` documents every endpoint the frontend now calls, including the role-promotion one.
- A clear, written answer exists for what "staging" and "deploy" mean today given the actual infra gap — not a silent assumption.

## Scope

**In:**
- Wire every CA/auth page listed below to the real backend using the existing `apps/web/lib/api.ts` (no TanStack Query, no new state library — matches what's already built, YAGNI)
- Build the missing account-creation page (`/register` per the `local-ca-program-launch.md` naming: **wait — see Decision 1 below**, this plan uses the names as they exist today, not the old plan's renamed scheme, since `/register` is already shipped as the waitlist page and renaming it now would break the one thing already working)
- Build `apps/web/middleware.ts` for referral-capture
- Fix the `role === 'CA'` bug
- Build the real application-intake backend (Phase 0) and wire `/dashboard/ca/apply` plus a new admin review page to it (Decision 2)
- Fix the onboarding college field (free text, not a 5-item fake enum)
- Commit the package-lock.json CI fix
- Update `.claude/reference/api.md` for the role-promotion endpoint
- Commit the two untracked doc files
- Get the full validation gate green, including e2e (blocked on Docker being confirmed up)
- Merge PR #27 to `develop`
- Write up the staging-deploy reality check as an explicit decision point, not code — actual provisioning needs the user

**Out:**
- Anything backend (PR #28 already shipped and documented it)
- PR #26 — separate, unrelated, flagged only
- `apps/api/prisma/import-ca-applicants.ts` — explicitly reserved, do not touch
- TanStack Query, Sentry-on-web, or any new dependency — none of the existing shipped code uses them, don't introduce mid-stream
- Admin UI for `PATCH /admin/users/:id/role` — acceptable to do via direct API call at this scale, not in the original frontend scope either
- Actual production deployment (Razorpay live mode, VPS purchase, domain, R2/Neon/Upstash account creation) — requires the user's external action, cannot be done from this session regardless of code readiness

## Decisions (resolved 2026-08-20)

1. **Naming:** account creation ships at a new `/signup` route; `/register` stays exactly as the waitlist page it already is. (Unchallenged default, keeping it.)
2. **`/dashboard/ca/apply` gets a real backend, not a static page.** User's call: build the actual application-intake flow — a `CAApplication` record, an admin review queue, and an approval action that promotes the applicant's role. This is new backend scope beyond issue #24/#25's original boundary, designed below as its own phase (Phase 0) that the frontend wiring phase (Phase 1) now depends on for `/dashboard/ca/apply`.
3. **Deploy: not a same-day rush — "we have time, we will do it right, no shortening anything."** This reframes the plan: Phase 2 (staging deploy) is sequenced *after* Phase 0 and Phase 1 are merged and green, not in parallel under time pressure. Still blocked on one open input: **which infra accounts already exist** (Neon/other managed Postgres, Upstash/other managed Redis, Cloudflare R2, a Render/Fly account or VPS for the API, Razorpay KYC status, a domain). Vercel re-link is approved and will happen in Phase 2 — see the tooling note there for why it's sequenced after code lands, not immediately.

## Phase 0 — CA Application Intake (new backend scope)

**Split into its own tracked issue and dedicated plan: GitHub #29, `.claude/plans/29-ca-application-intake.md`.** That doc is now the source of truth for Phase 0 — schema, endpoints, implementation steps, tests, acceptance criteria all live there in full detail, not duplicated here. Summary for context: a participant submits a targeted-college application via `POST /ca/apply`, an admin reviews it from a queue (`GET /admin/ca-applications`), approval (`PATCH /admin/ca-applications/:id/review`) promotes the user to `CAMPUS_AMBASSADOR` atomically — reusing the exact compare-and-swap pattern `CATaskAssignment` verification already established in PR #28, not inventing a new one. `PATCH /admin/users/:id/role` still exists unchanged for ad-hoc promotions; the applicant flow just doesn't need it anymore.

**Phase 1 (specifically its Step 3) depends on #29/PR #30 shipping first** — `/dashboard/ca/apply` has nothing real to call until it merges.

## Phase 1 — Frontend Wiring

**Split into its own dedicated plan: `.claude/plans/25-ca-frontend-wiring.md`.** That doc is the source of truth for Phase 1 — ground truth, files, all 11 implementation steps, tests, acceptance criteria. Summary for context: fixes the `role === 'CA'` bug, wires every CA/auth page to the real backend (including the new apply/admin-review flow from Phase 0), builds `/signup` and the referral-capture middleware, commits the CI fix, and merges PR #27. Blocked only on PR #30 merging first for its apply-page step; everything else in it is unblocked now.

## Phase 2 — Staging Deploy (sequenced after Phase 0 + Phase 1 are merged and green)

Not a same-day add-on — done properly, after there's real code on `develop` worth deploying. **Confirmed 2026-08-20: nothing is provisioned yet** — no Neon, no Upstash, no R2, no Render/Fly account, no VPS. Phase 2 starts from zero when it starts. This phase will get its own numbered steps (account creation checklist, `Dockerfile` for the API, a CD workflow, real env-var wiring) once Phase 0/1 are merged and it's time to begin it — not written now against work that isn't ready to deploy yet.

What's already confirmed and doesn't need re-asking:
- **Frontend host exists but is misconfigured.** The Vercel project `infinito2k26` is linked to the wrong repo (`mdminhaj-2106/Infinito2k26`, personal fork) with framework misdetected as `vite`. Re-link to `Infinito2k26/Infinito2026` is approved.
- **Tooling limitation found this session:** the available Vercel connector can create a project linked to a repo, or reuse an existing project *by name* — but for an **existing** project it cannot change root directory or framework settings (`rootDirectory` is documented as "only applied when creating the project"; no update-project-settings tool is exposed here, only deployment-protection). Two ways through this once Phase 1 code exists to deploy:
  1. Re-link the existing project and then fix Root Directory (`apps/web`) by hand in the Vercel dashboard — one-time, a few clicks, needs the user's dashboard access.
  2. Or let this session create a **fresh** project (`create_git_project` with `rootDirectory: "apps/web"` set at creation time) and abandon the stale one — cleaner, no dashboard step needed, but means a new project URL instead of reusing `infinito2k26`'s existing domains.
  Pick one when Phase 2 starts; either is fine, the fresh-project route is simpler from this session's toolset.
- **Backend has no host at all.** The original plan's own choice (Render or Fly free/starter tier) is the fastest path to a real staging API, but needs an account this session cannot create. Managed Postgres (Neon) and managed Redis (Upstash) likewise need accounts. MinIO-via-Docker-Compose only works on a host that can run Docker, so either provision R2/S3-compatible storage or run the whole stack (API+Postgres+Redis+MinIO) via Docker Compose on a single small VPS, matching `deployment-requirements.md`'s own recommendation — whichever way, this needs a `Dockerfile` for the API and a CD workflow, neither of which exist yet; both get written as real Phase 2 steps once the target host is chosen.
- **What this session genuinely cannot do:** create third-party accounts, handle payment/KYC, or authorize spend. That part is on the user regardless of how much time there is.

## Tests and Validation

```bash
docker compose up -d
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
npm run test:e2e --workspace=api
```

Manual, full click-through per `local-ca-program-launch.md`'s own smoke-test shape: sign up → log in → (admin promotes via curl) → onboard with a free-text college → dashboard shows real refCode/points/rank → visit `/register?ref=CODE` in incognito → click recorded → submit waitlist lead → CA submits one URL task + one file task → admin reviews both (file proof opens via signed URL) → approve one, reject one with a reason → CA's task list and dashboard reflect it → `/leaderboard` shows the updated standing.

## Acceptance Criteria

**Phase 0:**
- [ ] `CAApplication`/`ApplicationStatus` migrated, `POST /ca/apply`, `GET /ca/apply/me`, `GET /admin/ca-applications`, `PATCH /admin/ca-applications/:id/review` all shipped and e2e-tested
- [ ] Approval promotes the applicant's role atomically (CAS-guarded, no double-promotion race)
- [ ] Rejection requires a reason, applicant can re-apply after rejection
- [ ] `.claude/reference/api.md`/`architecture.md` reflect all four new endpoints

**Phase 1:**
- [ ] `package-lock.json` CI fix committed and confirmed green on PR #27's CI
- [ ] `role === 'CAMPUS_AMBASSADOR'` bug fixed, verified by a real login redirect test
- [ ] `/dashboard/ca/apply` wired to the real Phase 0 endpoints (form / pending / rejected states), fake auto-approve logic gone
- [ ] New `/admin/ca-applications` review queue exists and works (approve/reject with reason)
- [ ] `/signup` exists, creates a real account with consent enforced
- [ ] `apps/web/middleware.ts` captures `?ref=` and fires the click endpoint
- [ ] `/register` (waitlist), `/dashboard/ca`, `/dashboard/ca/onboard`, `/dashboard/ca/tasks`, `/admin/ca-tasks/[id]/assignments`, `/leaderboard` all call real endpoints, zero `MOCK_*`/`TODO: Wire up` left in any of them
- [ ] Onboarding college field accepts free text, not the 5-item fake list
- [ ] `.claude/reference/api.md` documents `PATCH /admin/users/:id/role`
- [ ] Three untracked doc files committed
- [ ] Full validation gate green including e2e (Docker confirmed working)
- [ ] PR #27 merged to `develop`, issue #25 closed manually with a summary comment

**Phase 2 (once infra checklist is answered):**
- [ ] Vercel project correctly linked (fresh or re-linked, per the choice made at Phase 2 start) and deploying `apps/web` on every push
- [ ] A backend host, managed Postgres, managed Redis, and object storage are provisioned and a `Dockerfile` + CD workflow exist for the API
- [ ] A real staging URL exists for both frontend and backend, smoke-tested against the same click-through as the manual gate below

## Risks and Notes

- **Data migration:** none — this is frontend-only plus a docs update; the one schema-adjacent item (college field) is a frontend validation change matching a backend contract that already shipped.
- **API contract change:** none — every endpoint being wired to already exists and is documented (except the one doc gap this plan closes).
- **Performance concern:** none new.
- **Security:** none new — auth/consent/RBAC/file-upload hardening was PR #28's job and is already done; this plan only calls those endpoints from the UI.
- **Unknowns:**
  - Exact `RegisterDto` shape for the new `/signup` page — read `apps/api/src/auth/dto/register.dto.ts` at execution time, don't assume.
  - Whether `POST /auth/register` returns a token immediately or requires a separate login — check `auth.controller.ts`/`auth.service.ts` before writing `/signup`'s success handler.
  - Docker Desktop unresponsiveness — resolved during Phase 0 execution (needed a full container/volume reset, plus freeing a port an unrelated project's container was squatting on). The dev/test Postgres port also turned out to be 5433, not 5432 as `apps/api/.env`/`.env.test` assumed — both files were fixed locally (gitignored, not a shared-config change).
  - Phase 2's infra checklist (which of Neon/Upstash/R2/Render-Fly/VPS/Razorpay/domain already exist) is still open — Phase 2 stays prose-level until that's answered, deliberately not turned into steps against a guess.
