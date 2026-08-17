# Plan: CA Program Launch Readiness (local — split into GitHub issues before execution)

## Status Update — 2026-07-16 (addendum merged in)

- **Phase A (Auth):** ✅ Done. Merged via PR #20 → `develop`.
- **Phase B (Redis/BullMQ):** ✅ Code done (commit `21d0d1a`), PR #23 open against `develop`, issue #21 still open. **Action: merge PR #23 today** — everything below needs its queues and `REDIS_CLIENT`.
- **Phase C (CA backend module):** ❌ Not started. Issue #24. Rewritten below — this revision folds in 20 gaps found in the 2026-07-15 addendum review (waitlist capture, click dedup, signed file URLs, soft-delete-only, compare-and-swap race guards, Moderator cut, fixed college list, error monitoring). Almost none of it is net-new phases — it's the same endpoints, built hardened the first time instead of retrofitted.
- **Phase D (CA frontend):** 🟡 `StatCard`/`ReferralCodeDisplay`/`LeaderboardWidget`/`CAApplicationForm` exist as disconnected components on closed PR #22 (reusable, not wired). Issue #25. Rewritten below to match Phase C's hardened contract, plus the waitlist page, consent checkbox, privacy page, and leaderboard ISR the addendum adds.
- **Branch state:** deploy from `develop` for July 20; reconcile `main` after.
- **Source documents:** original spec (`docs/ca-portal-spec-scope-and-execution-plan.html`, 2026-07-15) + gap-resolution addendum (same date, 20 findings). Addendum is authoritative wherever it conflicts with the original — applies below.

## Decisions Locked This Pass (2026-07-15/16)

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Registration attribution before Registration module exists | Waitlist/lead-capture table + endpoint. See Phase C Step 5. |
| 2 | `/register` route naming collision | Addendum's "existing `/register` route" (referral destination) **wins the URL**. CA/admin account-creation moves to **`/signup`** instead — that page doesn't exist yet, zero migration cost. `/login` unchanged. Referral links point at `/register?ref=CODE` forever; the page's content is swapped later when the real Registration module ships. |
| 3 | Moderator role | Cut from launch scope entirely. Every "Admin/Moderator" endpoint becomes Admin-only. `UserRole.MODERATOR` stays in the schema (used elsewhere in the app) — just not granted on any CA-admin route. |
| 4 | College field at onboarding | Fixed list, not free text. No schema change — `CAProfile.assignedCollegeName` stays `String`, validated server-side against a hardcoded array. **Blocking input needed from the outreach team: the actual participating-college list**, before Phase C Step 3 can be finished — don't invent placeholder names. |
| 5 | Referral code format | Already random in the original spec (`crypto.randomBytes` suffix, not sequential) — no change needed, just confirming this wasn't a gap. |
| 6 | Click durability | Redis is a buffer, Postgres is the source of truth. New `CAProfile.clickCount` field, synced (not incremented) from Redis every 60s — see Phase C Step 4. |
| 7 | Delete semantics | Soft delete only. `Brand.isActive` / `CaTask.isActive` **already exist in the schema** — no migration needed, just never wire a DELETE endpoint. |
| 8 | Error monitoring | In scope for launch (was going to be silently skipped otherwise). Free-tier Sentry, both apps. See Phase C Step 9 / Phase D Step 8. |
| 9 | Privacy/consent | In scope for launch. One static page + a signup-time checkbox, backed by a new `User.consentedAt` column. |
| 10 | Audit log, CA suspension, submit/onboard rate limiting | Deferred to Fast-Follow Backlog (below) — not launch-blocking. Note `CAProfile.isActive` already exists in the schema, so suspension costs zero migration whenever it's picked up. |

## Day-by-Day Plan to July 20

| Day | Date | Backend (Minhaj) | Frontend (Anjneya) |
|-----|------|-------------------|---------------------|
| 0 | Jul 15 | Merge PR #23. Lock this API contract. Create free-tier accounts (Neon, Upstash, Render/Fly, Cloudflare R2, Sentry, Vercel). Get the participating-college list from outreach. | Read the locked contract. Start `/login`, `/signup`, `lib/api.ts` — no dependency on Phase C. |
| 1-2 | Jul 16-17 | Phase C Steps 1-9: schema migration, onboarding, click tracking + flush job, waitlist endpoint, Brand/CaTask CRUD (soft-delete, Admin-only), task submission + signed-URL file upload, admin verification (CAS + rejection reason), leaderboard (two counts), Sentry. | Referral-capture middleware. Rewire disconnected components into `/dashboard/ca` as each endpoint lands. |
| 3 | Jul 18 | Finish remaining Phase C endpoints. Start Phase E deploy setup. | Task list + submission UI, `/register` waitlist page, public leaderboard (ISR), privacy page, minimal admin UI, Sentry. |
| 4 | Jul 19 | Finish Phase E deploy end to end. Full click-through smoke test on live URLs, confirm Sentry catches a forced error. | Mobile QA (375px) on every new/changed page. Fix whatever the smoke test surfaces. |
| 5 | Jul 20 | Buffer. Final smoke test, fix anything broken, go live. | Same. |

## Issue

- Tracker: #18 (auth, done), #21 (redis/bullmq, PR #23 open), #24 (CA backend), #25 (CA frontend)
- Priority: P0 — July 20, 2026
- Owner: mdminhaj-2106
- Reviewer: self-review acceptable for A/B/D; **Saad-Manda reviews Phase C before merge** — points-award and file-upload logic, widest attack surface. Per addendum §7: name one read-only "shadow" backup for backend and one for frontend today, so a one-day absence costs a day, not the whole build.
- Target branches (sequential, fresh off `origin/develop`): `feature/auth-minimal` (merged) → `feature/redis-bullmq-infra` (PR #23) → `feature/ca-backend` (#24) → `feature/ca-frontend` (#25)

## Outcome

When this ships:
- A CA registers via `/signup`, gets promoted to `CAMPUS_AMBASSADOR`, onboards with a college picked from a fixed list, gets a random unguessable `refCode` + link, and sees a live dashboard (durable click count, points, rank).
- A visitor arriving via a referral link before the Registration module exists lands on `/register?ref=CODE`, sees an honest "registration opens July 20" message, and can leave a waitlist lead — no payment UI, no implied confirmation.
- Referral clicks are deduped per (code + IP) for an hour, buffered in Redis, and durably flushed to Postgres every 60s — never a synchronous write per click.
- An admin creates tasks (internal or brand-sponsored, Admin-only, soft-delete only), reviews submissions (proof URLs sanitized to http/https, files served via short-lived signed URLs, never public), and verifies with a compare-and-swap guard that makes double-awarding points structurally impossible.
- The public leaderboard shows clicks and verified-registrations separately, is ISR-cached for 15 minutes, and survives a cold cache.
- Unhandled exceptions in either app show up in Sentry, not via a user complaint.
- A privacy/consent notice exists and is agreed to before any PII is collected.
- `recordConversion()` is built, unit-tested, and unwired — its code comment points at Phase C Step 5 of this document, not a vague "later."

## Scope

**In (everything from the original plan, plus):**
- Waitlist lead capture (`ca_referral_leads` table + `POST /leads/waitlist` + `/register` page)
- Click dedup (Redis, per code+IP, 1hr) and durable click counts (`CAProfile.clickCount`, 60s idempotent flush)
- Proof-URL scheme sanitization (http/https only, rendered as inert links)
- Signed-URL file serving (UUID object keys, ~15min presigned GET, never a public bucket ACL)
- Soft-delete-only on Brand/CaTask (field already exists — just don't build DELETE)
- Compare-and-swap guards on verify + resubmit (no double-award, no silent overwrite of a reviewed submission)
- Required rejection-reason field, CA-visible, plus a stated contact channel for disputes
- Moderator cut — every CA-admin endpoint is Admin-only
- Fixed college list at onboarding (no schema change, DTO-level validation)
- Free-tier Sentry in both apps
- Static privacy/ToS page + consent checkbox at `/signup` and `/leads/waitlist`, backed by `User.consentedAt`
- Leaderboard shows clicks + verified-registrations separately, ISR-cached (15 min) on the frontend

**Out (explicitly deferred, tracked in Fast-Follow Backlog below, not silently dropped):**
- Rate limiting beyond the click endpoint (onboard/submit endpoints)
- CA suspension/offboarding (schema field already there — zero-cost whenever picked up)
- `admin_action_log` audit table
- Moderator role delegation (revisit only if real admin workload needs it)
- Microsoft/IITP OAuth, Instagram/LinkedIn `CASocialAccount` connect flow, `SocialReferral` behavioral verification, YouTube/Twitter auto-metric fetch — same as original plan, unchanged
- Brand self-service login, points redemption/prizes — unchanged from original plan

## Schema Migration (new — prerequisite for Phase C, one migration)

```prisma
model CaReferralLead {
  id            String    @id @default(uuid()) @db.Uuid
  name          String
  email         String
  phone         String
  college       String
  referralCode  String?   // nullable — visitor may land with no ?ref=
  consentedAt   DateTime
  createdAt     DateTime  @default(now())
  convertedAt   DateTime?
  registrationId String?  @unique @db.Uuid

  registration  Registration? @relation(fields: [registrationId], references: [id])

  @@index([referralCode])
  @@index([email])
}
```

```
CAProfile          + clickCount        Int      @default(0)   // durable, synced from Redis every 60s — distinct from referralCount (verified conversions, stays 0 until Registration module ships)
CATaskAssignment   + rejectionReason   String?                // required by the app when status → REJECTED, not enforced at DB level
User               + consentedAt       DateTime?              // set at /signup and at /leads/waitlist submission
```

No changes needed to `Brand`/`CaTask` (`isActive` already there) or referral-code generation (already random in the original spec).

## Files to Read First (all phases)

Same as before, plus:
- `apps/api/prisma/schema.prisma` §CAProfile/Brand/CaTask/CATaskAssignment/ReferralConversion/Registration/User — read the real field names before writing DTOs, several fields referenced below (`isActive`, `assignedCollegeName`) already exist and must not be re-added
- `docs/ca-portal-spec-scope-and-execution-plan.html` — source spec + addendum (this plan implements it)

---

## Phase A — Auth Module + Prisma Fix + Type Drift Fix

Unchanged. Done, merged via PR #20.

---

## Phase B — Redis + BullMQ Shared Infra + Real Health Checks

Unchanged. Code done, PR #23 open — merge before starting Phase C.

---

## Phase C — CampusAmbassador Backend Module (hardened)

Branch: `feature/ca-backend` from fresh `origin/develop`, **after PR #23 merges**.

### Scope
In: schema migration, onboarding (fixed college list), durable+deduped click tracking, waitlist capture, Brand/CaTask CRUD (Admin-only, soft-delete), task submission (sanitized URLs, signed-URL files), admin verification (CAS, rejection reason), leaderboard (two counts), Sentry.
Out: same global "Out" list, plus everything in the Fast-Follow Backlog.

### Files to Change / Create
```
apps/api/prisma/schema.prisma                                  add CaReferralLead, CAProfile.clickCount, CATaskAssignment.rejectionReason, User.consentedAt
apps/api/prisma/migrations/                                     new migration
apps/api/package.json                                           add @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, @sentry/nestjs
apps/api/src/config/env.schema.ts                                add SENTRY_DSN (optional — degrade gracefully if unset in dev)
apps/api/src/instrument.ts                                       new — Sentry.init(), imported first in main.ts per Sentry's Nest setup
apps/api/src/main.ts                                              import './instrument' as the first line
apps/api/src/campus-ambassador/campus-ambassador.module.ts        new
apps/api/src/campus-ambassador/campus-ambassador.service.ts       new — onboarding, click tracking + dedup, recordConversion(), submission, verification, points award (prisma.$transaction / updateMany-with-status-guard throughout)
apps/api/src/campus-ambassador/campus-ambassador.controller.ts    new — /ca/onboard, /ca/me, /ca/referral/click, /ca/tasks, /ca/tasks/:id/submit
apps/api/src/campus-ambassador/admin/ca-admin.controller.ts       new — /admin/ca-tasks, /admin/brands, /admin/ca-task-assignments/:id/verify, /admin/ca-tasks/:id/assignments — ALL @Roles(ADMIN) only, no MODERATOR
apps/api/src/campus-ambassador/constants/colleges.ts             new — fixed college list (blocked on outreach team input)
apps/api/src/campus-ambassador/dto/*.ts                            new — onboard, submit-task, create-task, create-brand, verify-assignment DTOs
apps/api/src/campus-ambassador/leaderboard/leaderboard.service.ts        new — rank computation (clicks + verified conversions), Redis snapshot
apps/api/src/campus-ambassador/leaderboard/leaderboard.processor.ts      new — BullMQ repeatable job on 'leaderboard-recalc', every 15 min, {concurrency: 1}
apps/api/src/campus-ambassador/leaderboard/leaderboard.controller.ts     new — GET /leaderboard/ca (public)
apps/api/src/campus-ambassador/referral/referral-flush.processor.ts      new — BullMQ repeatable job on 'referral-flush', every 60s, {concurrency: 5}, idempotent sync (not increment)
apps/api/src/leads/leads.module.ts                                new — POST /leads/waitlist (public)
apps/api/src/leads/leads.controller.ts                            new
apps/api/src/leads/leads.service.ts                               new
apps/api/src/leads/dto/create-lead.dto.ts                         new
apps/api/src/uploads/uploads.service.ts                          new — UUID object keys, forcePathStyle S3 client, generateSignedGetUrl(key, ttlSeconds=900)
apps/api/src/admin/admin-users.controller.ts                     new — PATCH /admin/users/:id/role
apps/api/src/auth/auth.controller.ts                              update — POST /auth/register sets consentedAt when body.consent === true, 400 if false/missing
.claude/reference/api.md                                          update — every new endpoint
.claude/reference/architecture.md                                  update — CampusAmbassador + Leads modules
apps/api/test/campus-ambassador.e2e-spec.ts                       new
apps/api/src/campus-ambassador/campus-ambassador.service.spec.ts  new
```

### Implementation Steps

**Step 1 — Schema migration + deps + Sentry**
- What: add the three schema changes above, `prisma migrate dev`. Add `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@sentry/nestjs`. `instrument.ts` calls `Sentry.init({dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1})` — no-op if `SENTRY_DSN` unset (local dev shouldn't require a Sentry account). Import it first in `main.ts`.
- Validation: `npm install`, migration applies cleanly against local Postgres, app boots.

**Step 2 — Minimal admin role-promotion endpoint**
- Unchanged from original: `PATCH /admin/users/:id/role`, `@Roles(ADMIN, SUPER_ADMIN)`.

**Step 3 — CA onboarding + profile, fixed college list**
- What: `POST /ca/onboard` — body `{assignedCollegeName}` validated against `colleges.ts`'s fixed array (`class-validator @IsIn(PARTICIPATING_COLLEGES)`), generates `refCode` (`crypto.randomBytes(4).toString('base36')`-style short unguessable suffix), creates `CAProfile`, 409 on duplicate. `GET /ca/me` — profile + `referralCount` (verified conversions, from Postgres) + `clickCount` (from Postgres, kept fresh by Step 4's flush job — **not** read live from Redis anymore, since durability is now required) + `totalPoints` + `rank`.
- **Blocked on:** the real college list from the outreach team — flag this to the user before this step starts, do not ship placeholder names.
- Validation: unit test refCode uniqueness; e2e onboard→me roundtrip, invalid college → 400, double-onboard → 409.

**Step 4 — Referral click tracking: dedup + durable flush**
- What: `POST /ca/referral/click` — public, body `{refCode}`, 404 if code doesn't exist. Dedup gate: `SET referral:dedup:{refCode}:{sha256(ip)} 1 EX 3600 NX` — if it already existed, absorb silently (200, no increment). Otherwise `INCR referral:clicks:{refCode}` (monotonic, never reset). `ReferralFlushProcessor` — repeatable job every 60s, `{concurrency: 5}`: for each `referral:clicks:*` key, read the value `R`, `UPDATE CAProfile SET clickCount = R WHERE refCode = ?` (a **set**, not an increment — idempotent by construction, a crash mid-flush just re-syncs correctly next tick, no delta bookkeeping needed).
- Validation: e2e — first click increments, repeat click within an hour from same IP doesn't, invalid code → 404; unit test the flush processor with a fabricated Redis value, confirm Postgres ends up equal to it regardless of how many times the job runs.

**Step 5 — Waitlist lead capture + `recordConversion` (unwired)**
- What: `POST /leads/waitlist` — public, body `{name, email, phone, college, referralCode?, consent: true}`, 400 if `consent !== true`. Creates `CaReferralLead` with `consentedAt = now()`. `CampusAmbassadorService.recordConversion(refCode, registrationId)` — `prisma.$transaction`: find `CAProfile` by refCode, create `ReferralConversion`, increment `CAProfile.referralCount`, set `CaReferralLead.convertedAt`/`registrationId` on the matching lead (matched by email once the Registration module exists and calls this). **Not called from anywhere.** Code comment: `// Reconciliation source: CaReferralLead, matched on email. See .claude/plans/local-ca-program-launch.md Phase C Step 5 / addendum §3.`
- Validation: e2e for the waitlist endpoint (consent gate, referralCode optional); unit test `recordConversion` in isolation against a fabricated lead + registration row.

**Step 6 — Brand + CaTask admin CRUD (Admin-only, soft-delete)**
- What: `POST/GET/PATCH /admin/brands`, `POST/GET/PATCH /admin/ca-tasks` — `@Roles(ADMIN)` only (no MODERATOR). "Delete" = `PATCH .../:id {isActive: false}` — **no DELETE route exists**. Brand-required-for-BRAND-source / brand-forbidden-for-MODERATOR-source validated at service level.
- Validation: e2e — create BRAND task without brandId → 422, MODERATOR task with brandId → 422, non-admin (incl. old-style moderator role) → 403, archive via PATCH isActive:false → task disappears from `/ca/tasks` but assignment history stays intact.

**Step 7 — Task list + submission (sanitized URLs, signed-URL files)**
- What: `GET /ca/tasks` — active tasks + caller's own assignment status. `POST /ca/tasks/:taskId/submit` — URL_SUBMISSION tasks: validate `new URL(proofUrl).protocol` ∈ `{http:, https:}`, else 400. SCREENSHOT/PHOTO tasks: `FileInterceptor`, content-type allowlist (image/*) + size cap, `UploadsService.upload()` stores under a random UUID key (`ca-proof/{uuid}.{ext}`, never `taskId-caId.ext`), `proofUrl` field stores the **object key**, not a public URL. Resubmission guarded: `updateMany({where: {caId_taskId, status: {in: ['PENDING','SUBMITTED']}}, ...})`, 0 rows affected → 409 (already verified or rejected, can't silently overwrite a reviewed submission).
- Validation: e2e — URL task with a `javascript:` scheme → 400, file task with a `.exe` → 400, oversized file → 400, resubmit before verification → updates, resubmit after verify/reject → 409.

**Step 8 — Admin verification + points award (compare-and-swap, rejection reason)**
- What: `GET /admin/ca-tasks/:id/assignments` — paginated, filterable, proof rendering data: for URL_SUBMISSION, the raw sanitized URL (frontend renders as inert anchor); for SCREENSHOT/PHOTO, `UploadsService.generateSignedGetUrl(key, 900)` — a fresh signed URL generated per request, never stored, never a public ACL. `PATCH /admin/ca-task-assignments/:id/verify` — body `{status: 'VERIFIED'|'REJECTED', pointsAwarded?, rejectionReason?}`, `rejectionReason` required when `status === 'REJECTED'` (400 if missing). Compare-and-swap: `updateMany({where: {id, status: 'SUBMITTED'}, data: {...}})`, 0 rows → 409. On VERIFIED, `prisma.$transaction([updateMany(...), CAProfile.update({totalPoints: {increment: amount}})])` — the CAS guard and the points increment happen in the same query set, so a race can't award twice.
- Validation: e2e — verify awards points exactly once, concurrent double-verify → second call gets 409 not a double-award (test via two near-simultaneous requests), reject without reason → 400, reject with reason → assignment carries it, CA-visible via `GET /ca/tasks`.

**Step 9 — Leaderboard (two counts)**
- What: `LeaderboardService.recalculate()` — `SELECT id, clickCount, referralCount, totalPoints FROM ca_profiles ORDER BY totalPoints DESC`, rank via one `$executeRaw` window-function query. Cache as JSON at `leaderboard:snapshot` in Redis. `LeaderboardProcessor` — repeatable job, every 15 min, `{concurrency: 1}`. `GET /leaderboard/ca` — public, reads the snapshot; cold cache → live query fallback. Response includes `clickCount` and `referralCount` (verified sign-ups, will read 0 for everyone until Registration module + Step 5's backfill exist — documented, not hidden) per CA.
- Validation: e2e — leaderboard reflects seeded totals after manual `recalculate()` call, cold-cache fallback returns correct live data, both counts present in the response shape.

**Step 10 — Reference doc updates**
- Unchanged in spirit: update `api.md`/`architecture.md` with every endpoint above, including the new Leads module and the two-count leaderboard shape.

### Tests and Validation (Phase C gate)
```
npm run lint && npm run check-types && npm run build
npm run test --workspace=api
npm run test:e2e --workspace=api
```
Manual: full loop — promote → onboard (rejected college → accepted college) → click referral link twice from same IP (second doesn't count) → wait for/trigger flush → `/ca/me` shows durable clickCount → visit `/register?ref=CODE` → submit waitlist lead → admin creates task → CA submits (one URL, one file) → admin views file via signed URL, verifies with points, verifies again → 409 → reject a second submission without a reason → 400 → `/leaderboard/ca` shows updated rank + both counts → force an unhandled error, confirm it appears in Sentry.

### Acceptance Criteria
- [ ] Referral clicks: never a sync DB write, deduped per (code+IP)/hour, durably flushed every 60s idempotently
- [ ] `recordConversion` exists, tested in isolation, unwired, comment points at this doc
- [ ] Brand tasks require a brand, moderator-sourced tasks forbid one, all CRUD is Admin-only
- [ ] No DELETE route on Brand/CaTask — archive via `isActive` only
- [ ] A submission cannot be verified twice; a resubmission cannot overwrite an already-reviewed one — both via compare-and-swap, not application-layer assumption
- [ ] File uploads: content-type + size validated server-side, UUID keys, served only via short-lived signed URLs, never a public ACL
- [ ] Proof URLs restricted to http/https, rendered as inert links only
- [ ] Every rejection carries a stored, CA-visible reason
- [ ] Leaderboard cache survives a cold start, reports clicks and verified registrations separately
- [ ] Unhandled exceptions reach Sentry
- [ ] A visitor arriving pre-Registration-module can leave waitlist details with an honest "opens July 20" message, no payment implication
- [ ] api.md / architecture.md reflect exactly what shipped

### Risks and Notes
- **Data migration:** yes — see Schema Migration section above, apply before any Phase C code lands
- **API contract change:** additive — new endpoints, new leaderboard response shape (clickCount/referralCount split)
- **Blocking external input:** participating-college list (Step 3) — get this from the outreach team on Day 0, not Day 2
- **Structural gap (repeat, load-bearing):** `recordConversion` stays unreachable until a Registration module exists — waitlist leads are the reconciliation source, not raw click logs
- **Security:** file upload is still the first user-supplied-binary surface in the codebase — the signed-URL change here is specifically because these may contain other people's faces, not just the submitter's own content

---

## Phase D — CA Frontend (hardened)

Branch: `feature/ca-frontend` from fresh `origin/develop`, after Phase C endpoints start landing (contract locked above) and Phase A merged.

### Scope
In: everything from the original plan, plus `/signup` (renamed from `/register`), `/register` as the waitlist page, consent checkbox, static privacy page, leaderboard ISR.
Out: unchanged (CSS Modules only, no Tailwind, no speculative state library).

### Files to Change / Create
```
apps/web/package.json                                   add @tanstack/react-query, @sentry/nextjs, @infinito/types as a real workspace dep
apps/web/lib/api.ts                                       new — fetch wrapper, envelope unwrap, bearer attach, one-shot refresh-and-retry
apps/web/lib/query-client.tsx                              new
apps/web/middleware.ts                                    new — ?ref= capture, 30-day cookie, fire-and-forget click POST
apps/web/sentry.client.config.ts / sentry.server.config.ts  new — per @sentry/nextjs wizard output
apps/web/app/layout.tsx                                    update — QueryClientProvider
apps/web/app/login/page.tsx                                new
apps/web/app/signup/page.tsx                               new — was "/register" in the original plan; renamed, see Decisions Locked #2. Consent checkbox required to submit.
apps/web/app/register/page.tsx                             new — WAITLIST page, not account creation. Copy: "registration incl. payment opens July 20 — leave your details." Consent checkbox required. No payment UI.
apps/web/app/legal/privacy/page.tsx                        new — static content, can be written by anyone on the team in parallel with engineering
apps/web/app/dashboard/page.tsx                            replace stub with role-aware redirect
apps/web/app/dashboard/ca/onboard/page.tsx                  new — college field is a <select>, not free text
apps/web/app/dashboard/ca/page.tsx                          new — refCode/link, durable click count, referralCount, points, rank
apps/web/app/dashboard/ca/tasks/page.tsx                    new — task cards, URL/file submission
apps/web/app/leaderboard/page.tsx                            new — server component, `export const revalidate = 900`, shows both counts
apps/web/app/admin/ca-tasks/page.tsx                         new
apps/web/app/admin/ca-tasks/[id]/assignments/page.tsx        new — proof URL as inert `<a rel="noopener noreferrer">`, or `<img>`/link using the signed URL the API returns; rejection requires a reason field before the reject button is enabled
packages/types/src/campus-ambassador.ts                     new
packages/types/src/index.ts                                  update
```

### Implementation Steps

**Step 1 — Deps + API client** — unchanged from original Phase D Step 1, add `@sentry/nextjs` alongside.

**Step 2 — Referral capture middleware** — unchanged from original Phase D Step 2. Still targets `/register?ref=CODE` — that URL doesn't change even though the page behind it does.

**Step 3 — `/login` + `/signup`**
- What: same as original Phase D Step 3's `/register`, renamed to `/signup` (Decisions Locked #2). Add a required consent checkbox ("I agree to the [privacy policy](/legal/privacy)") — submit disabled until checked; `POST /auth/register` body includes `consent: true`.
- Validation: manual — register, log in, confirm redirect; confirm submit is blocked with consent unchecked.

**Step 4 — `/register` waitlist page**
- What: name/email/phone + college (plain `<select>`, not the fixed dropdown enum enforced elsewhere since this is a different, unauthenticated audience — free text is fine here per addendum §10.2, only the CA-onboarding college field needs the strict list) + consent checkbox, posts to `POST /leads/waitlist`, reads any `ca_ref` cookie (Step 2) and includes it as `referralCode`. Copy states plainly: registration incl. payment opens July 20, this just reserves a spot for an email. No payment UI anywhere on this page.
- Validation: manual — visit with and without a `?ref=` cookie present, confirm the lead is created with/without a referralCode.

**Step 5 — Privacy page** — static content page at `/legal/privacy` covering what's collected, why, retention, contact. Not gated on engineering — anyone on the team can write the copy in parallel.

**Step 6 — CA dashboard + onboarding**
- What: same as original Phase D Step 4, plus: onboarding's college field is a `<select>` populated from the same fixed list the backend validates against (keep in sync — either hardcode the same array client-side or fetch it, hardcoding is fine at this scale per YAGNI, just keep both lists identical). Dashboard shows the durable `clickCount` from `GET /ca/me`, not anything computed client-side.
- Validation: manual — full flow, confirm loading/error/empty states.

**Step 7 — Task list + submission** — unchanged from original Phase D Step 5.

**Step 8 — Public leaderboard (ISR)**
- What: `export const revalidate = 900;` on the page (same 15-min window the backend cache already uses — reuses an interval, doesn't invent a new one). Table shows rank, name/college, **click count and verified-registration count separately** (never combined into one number — addendum's whole point was not implying a click equals a registrant).
- Validation: manual — matches Phase C's e2e-verified data, confirm the page doesn't refetch on every request (check response headers / Vercel function invocation count).

**Step 9 — Minimal admin UI**
- What: same as original Phase D Step 7, plus: assignment review page requires a non-empty rejection-reason field before the "Reject" button is enabled (client-side convenience only — the real gate is the backend's 400).
- Validation: manual — approve/reject loop, confirm points reflected on dashboard + leaderboard.

**Step 10 — Sentry init** — follow `@sentry/nextjs` wizard defaults, confirm a forced client error and a forced server error both appear in the Sentry project.

**Step 11 — Shared types** — unchanged from original Phase D Step 8.

### Tests and Validation (Phase D gate)
```
npm run lint && npm run check-types && npm run build
```
Manual, per `testing.md` §4: 375px + desktop, loading/empty/error/success states, no layout shift on validation errors, keyboard accessibility. Full click-through in a real browser: signup → CA promotion → onboard (fixed college list) → referral link visit in incognito → waitlist submission → task submission → admin approval (with signed-URL file view + rejection-reason gate) → leaderboard reflects both counts.

### Acceptance Criteria
- [ ] Referral link → cookie set → click recorded (deduped) → CA sees durable count on dashboard
- [ ] Task submission → admin approval → points/leaderboard update visibly
- [ ] Waitlist form works with and without a referral code present, never implies payment/confirmation
- [ ] Consent checkbox blocks submission at both `/signup` and `/register` (waitlist) until checked
- [ ] Privacy page exists and is linked from both consent checkboxes
- [ ] Leaderboard is ISR-cached at 15 min, shows click/registration counts separately
- [ ] Loading/empty/error states verified in-browser, every new page, at 375px
- [ ] Sentry catches a forced error in both client and server contexts
- [ ] No new dependency beyond `@tanstack/react-query`, `@sentry/nextjs`, `@infinito/types`

### Risks and Notes
- **API contract change:** none beyond consuming Phase C
- **Naming risk:** `/register` now means two different things across the original doc and this plan (waitlist vs. account creation) — Decisions Locked #2 is the resolution, make sure nobody on the team builds against the old meaning

---

## Phase E — Free-Tier Production Deployment

Branch: deploy from `develop`. Unchanged stack (Vercel / Render-or-Fly / Neon / Upstash / Cloudflare R2), with these additions from the addendum's hosting-limits review:

### Additional Steps (fold into the original Phase E steps, don't reorder them)
1. **BullMQ concurrency caps** — confirm `{concurrency: N}` is set on all three processors (referral-flush: 5, leaderboard-recalc: 1, social-metrics-fetch: N/A, fast-follow) before deploy, so a click-flush burst can't starve the API event loop on a single free instance.
2. **Upstash daily command-limit check** — 30-minute back-of-envelope: worst-case click burst (a link going properly viral, ~2-5k clicks/hour) × ~2 Redis commands per click (dedup SET + INCR) against Upstash's free-tier daily command cap. Do this before Day 4, not discovered live.
3. **Separate test infra** — a distinct Neon branch + R2 bucket for Day 4's end-to-end test pass, wiped before go-live, so testing doesn't eat into the quota real launch traffic needs.
4. Add `SENTRY_DSN` to both Render/Fly and Vercel env vars.
5. Smoke test now includes: waitlist submission, and confirming a forced error reaches Sentry from the live deployment (not just localhost).
6. UptimeRobot hitting `/health` — unchanged from original.

### Acceptance Criteria — same as original, plus:
- [ ] BullMQ concurrency is capped on every registered processor
- [ ] Upstash worst-case command volume has been sanity-checked against the free-tier daily limit
- [ ] Test traffic ran against a separate Neon branch / R2 bucket, not production
- [ ] Sentry receives events from the live deployment, both apps

---

## Global Tests and Validation Gate (every phase)
```bash
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
npm run test:e2e --workspace=api
```

## Global Acceptance Criteria
- [ ] Each phase is its own GitHub issue + PR against `develop`, `Closes #N` linked
- [ ] Each PR includes verification notes (commands run, screenshots for UI changes)
- [ ] `.claude/reference/api.md` / `architecture.md` updated in the same PR
- [ ] No cross-module service imports (CampusAmbassador/Leads talk to Auth only via the authenticated request)
- [ ] Phase C gets a second review pass before merge (points-award + file-upload logic) — not self-review-only, per addendum §7
- [ ] A named backup exists for both backend and frontend tracks

## Fast-Follow Backlog (deferred, dated, tracked — not silently dropped)

| Item | Why it can wait | Target window |
|------|-----------------|----------------|
| Rate limiting on `/ca/onboard`, `/ca/tasks/:id/submit` | Lower abuse surface than the public click endpoint; likely a small extension of the existing auth throttler | Week 1 post-launch |
| CA suspension/offboarding (`CAProfile.isActive` toggle wired into click/submit checks) | No CA has been onboarded yet to need offboarding; schema field already exists, zero migration cost | Week 1 post-launch |
| `admin_action_log` audit table | Valuable for the first real points dispute, not load-bearing for launch day | Week 1 post-launch, before any real dispute |
| Moderator role / delegated admin tier | Only worth building once real admin workload proves it's needed | Post-launch, no committed date |
| YouTube/Twitter/Instagram/LinkedIn auto-metric fetch, `SocialReferral` OAuth verification | Same as original plan — admins verify manually at launch | Post-launch |

## Global Risks and Notes
- **Timeline:** critical path is A+B (done/near-done) → C (hardened, 4-5 days now vs. 3-4 originally — the addendum's fixes add real but small increments to steps already being built, not new phases) → D (3-4 days). Slippage risk concentrated in Phase C Step 3 (blocked on the outreach team's college list) and Step 8 (the one place a race-condition bug would be genuinely bad to ship).
- **Structural gap (unchanged):** registration-linked referral attribution needs the Registration module to fully close the loop; the waitlist is the accepted stopgap for launch week, not a permanent substitute.
- **Naming decision to broadcast to the team immediately:** `/register` is the waitlist page, `/signup` is account creation — this differs from both the original spec's and the addendum's loose terminology, make sure Anjneya and anyone touching frontend routes sees Decisions Locked #2 before Phase D starts.
