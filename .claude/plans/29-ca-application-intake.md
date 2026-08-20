# Plan: 29 — CA Application Intake (apply / admin review / role promotion)

## Issue

- Tracker: GitHub #29 (CA: Application intake backend, area:api, priority:p1, track:lead)
- Track: api
- Priority: high — blocks issue #25's `/dashboard/ca/apply` wiring (PR #27), not itself deadline-pinned
- Owner: Minhaj
- Reviewer: self-review acceptable — this is a direct reuse of the already-reviewed compare-and-swap pattern from `CATaskAssignment` verification (PR #28), not new-risk-surface code the way the original file-upload/points-award work was. A second pair of eyes on Step 4's review-and-promote transaction is a nice-to-have, not a gate.
- Target branch: `feature/ca-application-intake`, fresh off `develop` (current `develop` HEAD includes PR #28) — PR merges back into `develop`. Keep this branch separate from `feature/ca-portal` (PR #27, frontend-only, issue #25) — that branch will consume these endpoints once this PR merges, it should not build them itself.

## Why this exists

Audited on 2026-08-19/20: `apps/web/app/dashboard/ca/apply/page.tsx` (on `feature/ca-portal`) is a fake "self-serve apply → `setTimeout` → auto-redirect to dashboard" flow with no backend behind it. The real RBAC model shipped in PR #28 only supports a unilateral admin action (`PATCH /admin/users/:id/role`) — there's no concept of a pending application anywhere in the schema or API. `apps/web/components/ca/PendingStateView.tsx` ("Your application is currently under review") already exists in the frontend, unused — confirming a review-queue UX was the intent at some point, just never built on the backend. This plan builds it for real: a participant applies, an admin reviews from a queue, approval promotes the role — replacing the placeholder page's premise with something the backend can actually do.

## Outcome

When this ships:
- Any authenticated non-CA user can `POST /ca/apply` with a target college and get a `PENDING` application; a second attempt while one is still pending is rejected, not silently duplicated.
- `GET /ca/apply/me` tells the caller (and, on the frontend side, the reused `PendingStateView` component) exactly where their application stands: no application, pending, or rejected-with-reason.
- Admins see a paginated, filterable queue at `GET /admin/ca-applications`, joined to the applicant's name/email so nobody's looking at raw UUIDs — matching the shape `GET /admin/ca-tasks/:id/assignments` already established.
- `PATCH /admin/ca-applications/:id/review` approves or rejects. Approval promotes the applicant's `role` to `CAMPUS_AMBASSADOR` in the same transaction as the compare-and-swap status update — a race between two admins reviewing the same application concurrently cannot double-promote; the loser gets a 409. Rejection requires a non-empty reason, same rule as `CATaskAssignment` rejection.
- `.claude/reference/api.md` and `architecture.md` document all four endpoints in the same PR that ships them.
- The full validation gate (lint/check-types/build/unit/e2e) is green.

## Scope

**In:**
- `CAApplication` model + `ApplicationStatus` enum, one migration
- `POST /ca/apply`, `GET /ca/apply/me` on the existing `CaController`
- `GET /admin/ca-applications`, `PATCH /admin/ca-applications/:id/review` on the existing `AdminController`
- Atomic approve-and-promote (compare-and-swap + role update, one transaction)
- Required rejection reason
- Unit tests for the service methods (matching `ca.service.spec.ts`'s existing style) and e2e coverage (matching the CA/admin e2e suite's existing style)
- `api.md` / `architecture.md` updates in this same PR

**Out:**
- Any frontend work — `/dashboard/ca/apply` and the new `/admin/ca-applications` page are issue #25 / `.claude/plans/25-ca-portal-completion-and-deploy.md`'s job, this plan only makes the endpoints exist and be correct
- A DB-level uniqueness constraint on "one active application per user" — enforced at the service level instead (see Risks)
- A cooldown/rate-limit on re-applying after rejection — same "fast-follow, not launch-blocking" call the original CA plan made about rate limiting elsewhere
- Any change to `PATCH /admin/users/:id/role` — it still exists unchanged for ad-hoc promotions, this plan just adds a second path that doesn't require using it

## Files to Read First

- `apps/api/src/admin/admin.service.ts` §`verifyTask` — the exact compare-and-swap idiom to match: `updateMany({where: {id, status: 'SUBMITTED'}, data: {...}})`, check `result.count === 0` → `ConflictException`. This plan's `reviewApplication` needs the same shape, extended to also touch `User.role` on approval, which is why it needs `prisma.$transaction` rather than `verifyTask`'s single `updateMany` (that method only ever touches one row on one table; this one touches two).
- `apps/api/src/admin/admin.service.ts` §`getTaskAssignments` — the exact pagination/filter/join shape to match for `listApplications`: `page`/`limit` query params clamped (`Math.max(1, page)`, `limit` clamped to 1–100), a `$transaction([findMany, count])` pair, `select` (not raw `include`) to shape the response.
- `apps/api/src/admin/dto/admin.dto.ts` §`VerifyTaskDto` — the `@ValidateIf` + `@IsNotEmpty` pattern for a conditionally-required `rejectionReason`, reuse verbatim for `ReviewApplicationDto`.
- `apps/api/src/ca/ca.controller.ts` and `apps/api/src/ca/dto/ca.dto.ts` — controller/DTO style to match for the two new `CaController` routes (`@UseGuards(JwtAuthGuard, RolesGuard)` stacking, `@Req() req: AuthenticatedRequest` for `req.user.id`, `class-validator` decorators, `Transform` for trimming strings like `CaOnboardDto.college` already does).
- `apps/api/prisma/schema.prisma` §`User` — note the existing `@relation("Name")` convention for back-relations (`taskVerifications CATaskAssignment[] @relation("TaskVerifier")`, etc.) — this plan's two new `User` relations must follow the same naming style, not invent a different one.
- `apps/api/src/admin/admin.module.ts` / `apps/api/src/ca/ca.module.ts` — confirm no new providers need registering (both new methods live on already-injected `AdminService`/`CaService`, no new module wiring expected).
- `.claude/reference/api.md` §CA Portal section — table style to match when adding the four new rows.

## Files to Change

```
apps/api/prisma/schema.prisma                  add ApplicationStatus enum, CAApplication model, two new User back-relations
apps/api/prisma/migrations/                     new migration (generated via `prisma migrate dev`, never hand-written)
apps/api/src/ca/dto/ca.dto.ts                   add CreateApplicationDto
apps/api/src/ca/ca.controller.ts                add POST /ca/apply, GET /ca/apply/me
apps/api/src/ca/ca.service.ts                   add applyForCA(userId, targetCollege), getMyApplication(userId)
apps/api/src/ca/ca.service.spec.ts              add unit tests for both new methods
apps/api/src/admin/dto/admin.dto.ts             add ReviewApplicationDto
apps/api/src/admin/admin.controller.ts          add GET /admin/ca-applications, PATCH /admin/ca-applications/:id/review
apps/api/src/admin/admin.service.ts             add listApplications(page, limit, status), reviewApplication(id, dto, adminId)
apps/api/test/auth.e2e-spec.ts                  CORRECTION at execution time: real CA/admin e2e coverage does exist — filed as separate `describe('CA onboarding RBAC (e2e)', ...)` and `describe('Admin CA assignment listing (e2e)', ...)` blocks inside auth.e2e-spec.ts, not in a dedicated file. The earlier audit-time grep only searched filenames, missing this. New coverage for this plan was appended as a third `describe('CA application intake (e2e)', ...)` block in the same file, matching the existing convention exactly — no new file created.
.claude/reference/api.md                        add all four endpoints under the CA Portal section
.claude/reference/architecture.md                note the applicant step ahead of onboarding in the CA sequence diagram, if it reads as misleading without it
```

## Implementation Steps

### Step 1: Schema + migration

- **What:** Add to `schema.prisma`:
  ```prisma
  enum ApplicationStatus {
    PENDING
    APPROVED
    REJECTED
  }

  model CAApplication {
    id              String            @id @default(uuid()) @db.Uuid
    userId          String            @db.Uuid
    targetCollege   String
    status          ApplicationStatus @default(PENDING)
    rejectionReason String?
    reviewedById    String?           @db.Uuid
    reviewedAt      DateTime?
    createdAt       DateTime          @default(now())

    user       User  @relation("CAApplicant", fields: [userId], references: [id])
    reviewedBy User? @relation("CAApplicationReviewer", fields: [reviewedById], references: [id])

    @@index([status])
    @@index([userId])
  }
  ```
  On `User`, add the two back-relations following the existing naming convention (`taskVerifications CATaskAssignment[] @relation("TaskVerifier")` is the model to copy):
  ```prisma
  caApplications         CAApplication[] @relation("CAApplicant")
  caApplicationsReviewed CAApplication[] @relation("CAApplicationReviewer")
  ```
  Run `npx prisma migrate dev --name ca_application_intake` from `apps/api/`. Do not hand-edit the generated SQL — `.claude/plans/24-ca-backend-staging-hardening.md` documents at length what happens when that rule gets skipped (a branch that didn't typecheck and didn't match the live DB).
- **Files:** `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/<new>/migration.sql`
- **Validation:** `npm run check-types --workspace=api` clean; `npx prisma migrate status` (from `apps/api/`) reports no drift.

### Step 2: `POST /ca/apply`

- **What:** `CreateApplicationDto` in `ca.dto.ts`: `targetCollege: string`, `@IsString() @IsNotEmpty() @MaxLength(200)` + the same `@Transform` whitespace-trim `CaOnboardDto.college` already uses — reuse that exact validator stack, don't write a new one. On `CaController`, `@Post('apply')` + `@UseGuards(JwtAuthGuard)` (no `@Roles` restriction — any authenticated user who isn't already a CA can apply, that's the point). `CaService.applyForCA(userId, targetCollege)`: look up the caller's `User.role` — if already `CAMPUS_AMBASSADOR`, `ConflictException`. Look up an existing `CAApplication` for this user with `status: 'PENDING'` — if found, `ConflictException`. Otherwise `prisma.cAApplication.create({data: {userId, targetCollege, status: 'PENDING'}})`.
- **Files:** `apps/api/src/ca/dto/ca.dto.ts`, `apps/api/src/ca/ca.controller.ts`, `apps/api/src/ca/ca.service.ts`
- **Validation:** e2e — fresh `PARTICIPANT` applies → 201; applies again while still `PENDING` → 409; an already-`CAMPUS_AMBASSADOR` user applies → 409. Unit test `applyForCA` in isolation for both 409 branches.

### Step 3: `GET /ca/apply/me`

- **What:** `@Get('apply/me')` + `@UseGuards(JwtAuthGuard)` on `CaController`. `CaService.getMyApplication(userId)`: `prisma.cAApplication.findFirst({where: {userId}, orderBy: {createdAt: 'desc'}})` — returns the most recent application (covers the "rejected, then re-applied" case correctly by construction) or `null` if none exists.
- **Files:** `apps/api/src/ca/ca.controller.ts`, `apps/api/src/ca/ca.service.ts`
- **Validation:** e2e — no application → `null`; after Step 2 → returns the `PENDING` row; unit test the "most recent wins" ordering with two seeded applications for the same user (one old `REJECTED`, one newer `PENDING`).

### Step 4: `GET /admin/ca-applications` + `PATCH /admin/ca-applications/:id/review`

- **What:**
  - `ReviewApplicationDto` in `admin.dto.ts`: `status: 'APPROVED' | 'REJECTED'` via `@IsEnum(['APPROVED', 'REJECTED'])`, `rejectionReason` via the exact `@ValidateIf((o) => o.status === 'REJECTED') @IsString() @IsNotEmpty(...)` pattern `VerifyTaskDto` already uses.
  - `AdminController`: `@Get('ca-applications')` with `?page=&limit=&status=` (same parsing as `getTaskAssignments` — `Number(page) || 1`, clamp), `@Patch('ca-applications/:id/review')` with `@Req() req: AuthenticatedRequest` for `adminId`. Both inherit the controller-level `@UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)` already on `AdminController` — no per-route guard needed, matching every other route on that controller.
  - `AdminService.listApplications(page, limit, status)`: same `$transaction([findMany, count])` pairing as `getTaskAssignments`, `select` joined to `user: {select: {id, name, email}}`, optional `where: {status}` after validating it's one of `PENDING`/`APPROVED`/`REJECTED`.
  - `AdminService.reviewApplication(id, dto, adminId)`:
    ```ts
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.cAApplication.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: dto.status,
          rejectionReason: dto.rejectionReason,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Application could not be reviewed. It may not exist or is no longer PENDING.',
        );
      }

      if (dto.status === 'APPROVED') {
        const application = await tx.cAApplication.findUniqueOrThrow({ where: { id } });
        await tx.user.update({
          where: { id: application.userId },
          data: { role: 'CAMPUS_AMBASSADOR' },
        });
      }

      return { success: true };
    });
    ```
    Throwing inside a `prisma.$transaction` callback rolls back everything in it — same behavior `recordConversion` already relies on elsewhere in `ca.service.ts`, so this isn't a new pattern for the codebase, just applied here.
- **Files:** `apps/api/src/admin/dto/admin.dto.ts`, `apps/api/src/admin/admin.controller.ts`, `apps/api/src/admin/admin.service.ts`
- **Validation:** e2e — non-admin → 403; list returns paginated results joined to user name/email; approve promotes the role (confirm via a fresh `GET /auth/me` as that user, or a direct DB check); firing two concurrent review requests at the same `PENDING` application and asserting exactly one succeeds with the other getting 409 — written from scratch (see the `Files to Change` note: no existing CA e2e suite exists to copy this test's shape from, this is new ground despite `verifyTask`'s CAS pattern being proven in production code); reject without a reason → 400; reject with a reason → the reason is stored and retrievable via `GET /ca/apply/me` for that applicant.

### Step 5: Docs

- **What:** Add all four endpoints to `.claude/reference/api.md`'s CA Portal section, same table format as the existing rows. Update `architecture.md`'s CA sequence diagram only if leaving it as-is would actively mislead a reader about the promotion path — a short note ("promotion can also happen via `POST /ca/apply` → admin review, in addition to the direct `PATCH /admin/users/:id/role`") is enough, this doesn't need a new diagram.
- **Files:** `.claude/reference/api.md`, `.claude/reference/architecture.md`
- **Validation:** manual read-through — every new endpoint has a row; nothing already-documented was accidentally altered.

## Tests and Validation

```bash
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
npm run test:e2e --workspace=api
```
e2e requires `docker compose up -d` first (Postgres/Redis/MinIO) — confirm Docker Desktop is actually running before this step; it was not responding as of the 2026-08-19/20 audit session and needs a manual check, not an assumption.

Manual smoke test: apply as a fresh `PARTICIPANT` → see `PENDING` via `GET /ca/apply/me` → admin sees it in `GET /admin/ca-applications?status=PENDING` → admin rejects with a reason → applicant's `GET /ca/apply/me` shows `REJECTED` + the reason → applicant re-applies → admin approves → applicant's role is now `CAMPUS_AMBASSADOR` (confirm via `GET /auth/me`) → applicant can now call `POST /ca/onboard` (existing endpoint, unaffected by this plan).

## Acceptance Criteria

- [ ] `CAApplication`/`ApplicationStatus` migrated cleanly, `npx prisma migrate status` shows no drift
- [ ] `POST /ca/apply` — 201 on first apply, 409 on duplicate-pending, 409 if already `CAMPUS_AMBASSADOR`
- [ ] `GET /ca/apply/me` — `null` when none exists, otherwise the most recent application
- [ ] `GET /admin/ca-applications` — admin-only, paginated, `?status=` filter, joined to applicant name/email
- [ ] `PATCH /admin/ca-applications/:id/review` — CAS-guarded (409 on race/already-reviewed), approval promotes role atomically in the same transaction, rejection requires a non-empty reason (400 if missing)
- [ ] Unit tests for `applyForCA`, `getMyApplication`, `reviewApplication`'s two 409 branches
- [ ] e2e coverage for the full apply → review → promote loop, including the concurrent-review race
- [ ] `.claude/reference/api.md` / `architecture.md` updated in this PR, not batched later
- [ ] Full validation gate green: lint, check-types, build, unit, e2e
- [ ] PR opened from `feature/ca-application-intake` against `develop`, linked to #29

## Risks and Notes

- **Data migration:** yes — one migration, Step 1, prerequisite for everything else in this plan.
- **API contract change:** additive only — four new endpoints, nothing existing changes shape.
- **Performance concern:** none — application volume is bounded by how many people apply to be Campus Ambassadors, nowhere near the referral-click volume that justified Redis buffering elsewhere in this module.
- **Security:** the role-promotion side effect is the one part of this plan that's genuinely security-adjacent (an approval action grants elevated access), which is exactly why Step 4 reuses the codebase's proven CAS-plus-transaction idiom instead of a naive read-then-write. Self-review is fine at this scope per the reasoning in the Issue section above; flagging Step 4 specifically if a second reviewer has bandwidth.
- **Concurrency:** the two-admins-review-the-same-application race is the one edge case worth deliberately testing (see Step 4's validation) rather than assuming the `updateMany` count-check makes it safe — that assumption should be verified, not just asserted, the same way PR #28's own points-award race got an explicit concurrent-request test rather than a code-review-only sign-off.
- **No DB-level "one active application" uniqueness:** deliberate — a partial unique index (`WHERE status = 'PENDING'`) is more schema complexity than a service-level check justifies at this scale, and the service-level check is exercised directly by Step 2's e2e coverage. If this ever becomes a real race (two rapid-fire applies from the same user), the fix is adding that partial index later, not redesigning the flow.
- **Unknowns (resolved during execution):**
  - Docker Desktop's responsiveness — resolved: needed a full container/volume reset (an unrelated project's container was also squatting on port 6379; removed with explicit user authorization). Fresh stack came up clean.
  - CA/admin e2e coverage location — resolved: it exists, filed inside `auth.e2e-spec.ts` under topic-named `describe` blocks rather than a dedicated file. PR #28's "E2E tests: PASS" claim was accurate; the earlier audit's filename-only grep missed it. This plan's tests were appended to the same file, same convention.
