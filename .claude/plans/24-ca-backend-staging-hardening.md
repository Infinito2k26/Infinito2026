# Plan: 24 — CA Backend: One-Pass Fix for Staging Readiness

## Issue

- Tracker: GitHub #24 (CA: CampusAmbassador backend module, area:api, priority:p0, track:lead)
- Track: api
- Priority: critical — staging/deploy blocker
- Owner: ansariowais669-hub (Owais)
- Reviewer: mdminhaj-2106 (Minhaj) — **required**, plus Saad-Manda **required** specifically on Step 4 (`recordConversion`) and Step 6 (upload hardening). This matches `master-roadmap-sept30-launch.md`'s own standing rule: *"Phase C (points/file-upload) and any payments/QR/auth code: no self-review-only merges — matches CONSTITUTION.md's two-approval rule for these areas."* Minhaj reviewing alone does not satisfy that rule — it needs a second, independent set of eyes on those two steps specifically.
- Target branch: `feature/ca-backend`, branched off `feature/CA-Portal-Schema` — PR merges into `develop`. `feature/ca-backend` is the branch name `master-roadmap-sept30-launch.md`'s Day-0 actions actually specified ("Create `feature/ca-backend` branch off fresh `develop`. This is the literal first line of code."); it was never created, and the work happened on `feature/CA-Portal-Schema` instead. Branching off `feature/CA-Portal-Schema` now (rather than fresh off `develop`) preserves the 3 commits this plan repairs — treat this as the branch reconciling itself with the plan's intended name, not a second divergence. **Do not confuse this with `feature/ca-portal`** (PR #27, open, frontend-only — Anjney/jamanrao/Himanshi's track) — that is a separate, legitimate branch for issue #25 and should not be touched by this plan.
- **Deadline: today, 2026-08-12, 11:59 PM IST. Hard EOD.**

## Why this plan exists

`feature/CA-Portal-Schema` was built against `.claude/plans/phase-2..5-*.md` but never reconciled with the more detailed, later, authoritative plan at `.claude/plans/local-ca-program-launch.md` — which explicitly supersedes the phase docs and closes 20 gaps found in a prior review pass. The branch also has a mechanical defect: `schema.prisma` was hand-edited but `prisma migrate dev` was never run, so the branch **does not currently typecheck**, and even if it did, the **database it targets does not have the tables/columns the code writes to**. This is not a "some polish needed" branch — it will throw 500s on first real use of `/leads/waitlist`, `/admin/brands`, `/admin/ca-tasks`, `/ca/tasks`, task verification, and the referral-flush cron job.

Everything below was found by actually running the typecheck, diffing the migration SQL against `schema.prisma`, and reading every CA-related controller/service/guard against both plan docs. Nothing here is speculative.

## Alignment with the master roadmap (`master-roadmap-sept30-launch.md`) — read before assigning

Cross-checking this plan against the Aug 3 master roadmap surfaced three things that don't block tonight's work but must not get silently lost:

1. **Ownership divergence.** The master roadmap assigns CA backend Steps 1–10 personally to Minhaj, with Saad-Manda reviewing the file-upload/points step. The actual commit was authored by Anjney-Lawaniya (frontend lead) on an unplanned branch name, unreviewed. This plan reassigns execution to Owais under EOD pressure — reasonable given the deadline, but it's a second divergence from the written plan, not a return to it. Reviewer requirements above are set to at least restore the roadmap's two-approval intent even though the executor differs.
2. **Owais's own roadmap-assigned track (Phase 2C, the Teams module) is not part of this plan and gets bumped tonight.** That's an explicit trade-off, not an oversight — flagging it so it's a decision Minhaj is making on purpose, not a side effect nobody notices until the Teams module is asked about later.
3. **Two items surfaced by this audit are real but out of this plan's scope — for Minhaj to action separately, not for Owais tonight:** PR #17 (the roadmap/budget doc itself) has been open since July 6 and was supposed to merge Day 0 (Aug 3); and `develop` currently has no Users/Events/Teams modules at all, despite those being W1 (Aug 3–9)-assigned to Saad-Manda/Mahendra-seervi/Owais — that window closed 3 days ago. Neither is CA-backend work, so neither is added as a step here, but both should get a status check this week before they compound the way the CA Portal's July slip did.

## Scope

**In:**
- Fix the schema/migration drift (blocking everything else)
- Close the RBAC gap: no way to promote a user to CA, and `/ca/onboard` has no role check at all
- Build `recordConversion()` — unwired, but real and tested, per the plan's own design
- Fix the CA-onboarding college list (currently a 5-entry placeholder that rejects most real applicants)
- **Real (if minimal) proof-file storage.** The frontend (`feature/ca-portal`, `apps/web/app/dashboard/ca/tasks/page.tsx`) already ships a working file-picker (`<input type="file" accept="image/*">`) with a `// TODO: Handle multi-part form data conversion for file uploads` — it expects to upload actual image bytes, not receive a pasted URL. `docker-compose.yml` already provisions a MinIO bucket (`infinito-assets`) and `env.schema.ts` already declares the S3 vars — the endpoint to actually use them was never built. Step 6 now builds it: `FileInterceptor` + content-type/size validation + UUID object key + the bucket flipped from public to private + a signed-GET path for admin viewing.
- **Admin assignment-review listing.** `GET /admin/ca-tasks/:id/assignments` does not exist anywhere in the backend, but the frontend's admin review page (`apps/web/app/admin/ca-tasks/[id]/assignments/page.tsx`) is built entirely around calling it (`// Mock Data (In reality, fetched via GET /admin/ca-tasks/:id/assignments)`). Without this endpoint, `PATCH /admin/ca-task-assignments/:id/verify` is uncallable in practice — nobody can discover which assignment IDs are pending. This is not optional polish; it's the other half of "how does our team verify proofs."
- Capture consent at the two PII-collection points (`/auth/register`, `/leads/waitlist`) — one migration, bundled with Phase 1
- Replace the bespoke `AdminGuard` with the codebase's existing generic `@Roles()` + `RolesGuard` (found already in `common/`, unused by this branch — straight reuse, not new code)
- Get `npm run lint && npm run check-types && npm run build && npm run test --workspace=api && npm run test:e2e --workspace=api` green
- Update `.claude/reference/api.md` and `architecture.md` to match what actually ships

**Out (explicitly deferred — do not build today, see Risks section for why each is safe to defer):**
- Production-grade object storage hardening beyond the minimal version in Step 6: no lifecycle policies, no virus/content scanning, no CDN in front of the bucket, no Cloudflare R2 migration (stays on local/staging MinIO for now — moving to R2 is a config change, not a code change, do it when provisioning real staging infra)
- Rate limiting on `/ca/onboard` and `/ca/tasks/:id/submit` — the original plan already deferred this to "Week 1 post-launch" (`local-ca-program-launch.md`, Fast-Follow Backlog); the public click endpoint already has its own Redis-based dedup, which is the actual abuse vector that matters at launch
- Sentry integration — the branch's `AllExceptionsFilter` + `WEBHOOK_ALERT:` console prefix is the plan's accepted MVP substitute, already shipped, not a gap
- Instagram/LinkedIn OAuth, YouTube/Twitter auto-verification, Brand self-service login — unchanged from original plan, post-launch
- `apps/api/prisma/import-ca-applicants.ts` (already on disk, untracked) — separate one-off script, not part of this branch's mergeable surface. Owais should leave it alone; it's reviewed separately.

## Files to Read First

- `apps/api/prisma/schema.prisma` — current state, source of truth for what the migration must produce
- `apps/api/prisma/migrations/20260807050031_init/migration.sql` — what's actually applied; diff this against schema.prisma mentally before touching anything
- `.claude/plans/local-ca-program-launch.md` — the authoritative hardened plan; Phase C is the section this plan repairs
- `apps/api/src/common/guards/roles.guard.ts` + `apps/api/src/common/decorators/roles.decorator.ts` — existing generic RBAC mechanism, reuse it, do not add another
- `apps/api/src/ca/ca.service.ts`, `apps/api/src/ca/ca.controller.ts`, `apps/api/src/ca/dto/ca.dto.ts`
- `apps/api/src/admin/admin.service.ts`, `apps/api/src/admin/admin.controller.ts`, `apps/api/src/admin/admin.guard.ts`
- `apps/api/src/leads/leads.service.ts`, `apps/api/src/leads/dto/leads.dto.ts`
- `apps/api/src/auth/auth.service.ts`, `apps/api/src/auth/dto/register.dto.ts`
- `apps/api/src/config/env.schema.ts` — `S3_ENDPOINT`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`/`S3_BUCKET` are already declared and already in `.env.example`; Step 6 does not need new env vars, only new code that finally reads them
- `docker-compose.yml` — MinIO's `minio-init-bucket` service currently runs `mc anonymous set public local_minio/infinito-assets`; Step 6 flips this
- `apps/web/app/dashboard/ca/tasks/page.tsx` (on `feature/ca-portal`, not this branch — read-only, to confirm the multipart contract this plan's endpoint must satisfy) and `apps/web/app/admin/ca-tasks/[id]/assignments/page.tsx` (same branch) — the frontend's own `// TODO` comments are the spec for Step 6 and Step 7

## Files to Change

- `apps/api/prisma/schema.prisma` — add `User.consentedAt`
- `apps/api/prisma/migrations/` — new migration (generated, not hand-written)
- `apps/api/src/admin/admin-users.controller.ts` — new — role promotion
- `apps/api/src/admin/admin.module.ts` — register the new controller
- `apps/api/src/admin/admin.controller.ts` — swap `AdminGuard` for `@Roles()` + `RolesGuard`
- `apps/api/src/admin/admin.guard.ts` — delete once nothing references it
- `apps/api/src/ca/ca.controller.ts` — add `@Roles(CAMPUS_AMBASSADOR)` + `RolesGuard` to `/ca/onboard`
- `apps/api/src/ca/ca.service.ts` — add `recordConversion()`
- `apps/api/src/ca/ca.service.spec.ts` — new — unit test for `recordConversion()`
- `apps/api/src/ca/dto/ca.dto.ts` — college list fix, `SubmitTaskDto` file validation
- `apps/api/src/ca/constants/colleges.ts` — new — pulled out of the DTO file, see Phase 4
- `apps/api/src/uploads/uploads.module.ts` — new
- `apps/api/src/uploads/uploads.service.ts` — new — `S3Client` wrapper (MinIO-compatible, `forcePathStyle: true`), `uploadProof()`, `getSignedGetUrl()`
- `apps/api/src/ca/ca.module.ts` — import `UploadsModule`
- `apps/api/src/admin/admin.module.ts` — import `UploadsModule` (for signed-URL viewing)
- `apps/api/src/admin/admin.controller.ts` + `admin.service.ts` — new `GET /admin/ca-tasks/:id/assignments`
- `apps/api/package.json` — add `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` (see Risks — this is a new dependency, flagging per CONSTITUTION's "no new libraries without an issue and approval"; this plan, attached to issue #24, is that approval)
- `apps/api/src/leads/dto/leads.dto.ts` — add `consent: true` requirement
- `apps/api/src/leads/leads.service.ts` — set `consentedAt`
- `apps/api/src/auth/dto/register.dto.ts` + `apps/api/src/auth/auth.service.ts` — add `consent: true` requirement, set `consentedAt`
- `.claude/reference/api.md`, `.claude/reference/architecture.md` — document everything above

## Implementation Steps

### Step 1: Schema fix + real migration (BLOCKING — do this first, nothing else compiles cleanly against a real DB until this lands)

- **What:**
  1. Add one field to `schema.prisma`: `User.consentedAt DateTime?` (nullable — set only when someone actually consents; existing users stay null, not a breaking default).
  2. Run `npx prisma migrate dev --name ca_portal_hardening` from `apps/api/`. This is the ONE command that fixes all of: missing `ca_referral_leads` table, missing `CAProfile.clickCount`, missing `RecordStatus` enum + `Brand.status`/`CaTask.status`, missing `CATaskAssignment.rejectionReason`, and the new `User.consentedAt`.
  3. Do **not** hand-edit `migration.sql` — the whole point of this step is that the last commit did exactly that (implicitly, by editing schema.prisma without running migrate) and it's why the branch is broken.
  4. Run `npx prisma generate` (migrate dev does this automatically, but confirm) and re-run `npm run check-types --workspace=api` — this must go from 11 errors to 0.
- **Files:** `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/<new>/migration.sql`
- **Validation:** `npm run check-types --workspace=api` passes with 0 errors. `npx prisma migrate status` (from `apps/api/`) reports no pending drift.

### Step 2: Role-promotion endpoint + fix the unguarded onboard endpoint

- **What:**
  1. New `apps/api/src/admin/admin-users.controller.ts`: `PATCH /admin/users/:id/role`, body `{ role: UserRole }` validated via `class-validator @IsEnum(UserRole)`, guarded by `@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)` + `RolesGuard` (see Step 3 for why this guard, not `AdminGuard`). Service method on `AdminService`: `prisma.user.update({ where: { id }, data: { role } })`, 404 if user doesn't exist.
  2. On `apps/api/src/ca/ca.controller.ts`, add `@Roles(UserRole.CAMPUS_AMBASSADOR)` (stacked with the existing `JwtAuthGuard`, using the same `RolesGuard`) to `POST /ca/onboard`. This closes the hole where any authenticated PARTICIPANT can currently call it. The flow becomes: admin promotes a user's role via the new endpoint → that user (now CAMPUS_AMBASSADOR) calls `/ca/onboard` themselves.
- **Files:** `apps/api/src/admin/admin-users.controller.ts` (new), `apps/api/src/admin/admin.module.ts`, `apps/api/src/ca/ca.controller.ts`
- **Validation:** `npm run check-types --workspace=api`. e2e: non-admin hitting `PATCH /admin/users/:id/role` → 403; PARTICIPANT hitting `/ca/onboard` → 403; promoted user hitting `/ca/onboard` → 201.

### Step 3: Replace `AdminGuard` with the existing `@Roles()` + `RolesGuard`

- **What:** The codebase already has a generic role-check mechanism at `apps/api/src/common/decorators/roles.decorator.ts` + `apps/api/src/common/guards/roles.guard.ts` — this branch's commit built a second, one-off `AdminGuard` instead of using it. Replace `@UseGuards(JwtAuthGuard, AdminGuard)` on `apps/api/src/admin/admin.controller.ts` with `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)`. Delete `apps/api/src/admin/admin.guard.ts` once nothing imports it.
- **Files:** `apps/api/src/admin/admin.controller.ts`, `apps/api/src/admin/admin.guard.ts` (delete)
- **Validation:** `npm run check-types --workspace=api`; existing admin e2e coverage (if any) still passes — non-admin still gets 403, admin still gets through.

### Step 4: `recordConversion()` — built, tested, deliberately unwired

- **What:** Add to `apps/api/src/ca/ca.service.ts`:
  ```
  async recordConversion(refCode: string, registrationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const ca = await tx.cAProfile.findUnique({ where: { refCode } });
      if (!ca) throw new NotFoundException('Referral code not found');
      const conversion = await tx.referralConversion.create({
        data: { caId: ca.id, registrationId },
      });
      await tx.cAProfile.update({
        where: { id: ca.id },
        data: { referralCount: { increment: 1 } },
      });
      // Reconciliation source: CaReferralLead, matched by email once the
      // Registration module can supply one. Not called from anywhere yet —
      // see .claude/plans/local-ca-program-launch.md Phase C Step 5.
      return conversion;
    });
  }
  ```
  Do not add a controller route for this. Do not call it from anywhere. It exists so the Registration module (whenever it's built) has one obvious, already-tested function to call instead of reinventing the transaction.
- **Files:** `apps/api/src/ca/ca.service.ts`, `apps/api/src/ca/ca.service.spec.ts` (new)
- **Validation:** `npm run test --workspace=api` — unit test: valid refCode → creates conversion + increments referralCount atomically; unknown refCode → throws, nothing written; duplicate registrationId → respects the `@@unique` on `ReferralConversion.registrationId` and throws cleanly.

### Step 5: Fix the CA-onboarding college list

- **What:** The current 5-entry `PARTICIPATING_COLLEGES` list (`IIT Patna, NIT Patna, BIT Mesra, AMU, Other`) doesn't match the real applicant pool already collected (15+ distinct colleges seen: NIT Patna, Darbhanga College of Engineering, Patna College, SIT Sitamarhi, IEC College of Engineering & Technology, Government Engineering College Buxar/Samastipur, JG University, KIIT, and more — several are the same college spelled differently, e.g. "IIT Patna" / "IITP" / "Iit patna" / "Indian Institute of Technology Patna").
  **Decision for today (flagging as a product call, defaulting to the safer option given the deadline):** drop the strict `@IsIn(PARTICIPATING_COLLEGES)` enum gate. Keep `@IsString() @IsNotEmpty() @MaxLength(200)` on the DTO, trim + collapse whitespace server-side before storing. Do not attempt fuzzy-matching/canonicalizing spelling variants today — `CAProfile.assignedCollegeName` is a plain string in the schema already (no DB-level enum), so this is a DTO-only change, zero migration cost. Move `PARTICIPATING_COLLEGES` out of `dto/ca.dto.ts` into `apps/api/src/ca/constants/colleges.ts` as a documented **non-blocking reference list** (kept for the frontend `<select>` UI later, not enforced server-side) so the real list can still be assembled by the outreach team without another backend change.
  Flag to Minhaj: this un-blocks onboarding today but means duplicate/misspelled college names will exist in the data (e.g. "IITP" vs "IIT Patna" as two different strings) — worth a light admin-side cleanup pass before the leaderboard's "filter by college" view ships, not before EOD.
- **Files:** `apps/api/src/ca/dto/ca.dto.ts`, `apps/api/src/ca/constants/colleges.ts` (new)
- **Validation:** e2e — onboarding with a college not in the old 5-entry list now succeeds; empty/whitespace-only college still 400.

### Step 6: Real proof-file storage (upgraded from a URL-paste stopgap — see Scope note)

- **What:** The frontend's file-picker UI needs an actual endpoint to call. Build the minimal version, not the full production hardening:
  1. `UploadsService` (`apps/api/src/uploads/uploads.service.ts`): `S3Client` configured from `S3_ENDPOINT`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`/`S3_BUCKET` (already declared), `forcePathStyle: true` (required for MinIO). `uploadProof(buffer, mimeType)` — generates a key as `ca-proof/{uuid()}.{ext}` (ext derived from mimeType, not from client-supplied filename — don't trust that), `PutObjectCommand`, returns the key. `getSignedGetUrl(key, ttlSeconds = 900)` — `GetObjectCommand` + `getSignedUrl` from `@aws-sdk/s3-request-presigner`.
  2. `POST /ca/tasks/:taskId/submit`: add `@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))`. In `ca.service.ts submitTask()`, if a file is present: validate `file.mimetype` against an allowlist (`image/jpeg`, `image/png`, `image/webp`) — reject anything else with 400 before it reaches storage. Call `uploadsService.uploadProof(file.buffer, file.mimetype)`, store the returned **key** (not a public URL) in `proofUrl`. If `proofUrl`/`fileUrl` string is present instead (no file), keep the existing http/https scheme + length validation from the original stopgap design — some tasks are still URL-type (Instagram links etc.), only FILE-type tasks go through the upload path.
  3. `docker-compose.yml`: change `mc anonymous set public local_minio/infinito-assets` to `mc anonymous set none local_minio/infinito-assets` — the bucket must not be public-read once it holds proof photos that may contain other people's faces (per `ca-program.md`'s own security note). Anyone with a valid reason to view an object now goes through `getSignedGetUrl()`, not a guessable public path.
  - **Still explicitly not done:** presigned direct-to-bucket upload from the browser (file bytes currently transit the NestJS process — fine at this volume, revisit if/when submission volume grows), virus/content scanning, CDN in front of the bucket. Named in Scope's "Out" list, not silently skipped.
- **Files:** `apps/api/src/uploads/uploads.module.ts` (new), `apps/api/src/uploads/uploads.service.ts` (new), `apps/api/src/ca/ca.module.ts`, `apps/api/src/ca/ca.controller.ts`, `apps/api/src/ca/ca.service.ts`, `apps/api/src/ca/dto/ca.dto.ts`, `docker-compose.yml`, `apps/api/package.json`
- **Validation:** e2e — upload a valid JPEG under 5MB → 201, `proofUrl` stored as a `ca-proof/...` key, not a raw URL; upload a `.exe` renamed to `.jpg` (wrong mimetype) → 400; upload a 10MB file → 400 (Multer limit); a URL-type submission still works via the existing scheme/length checks. Manual: confirm `curl` against the bucket's public HTTP endpoint for a stored key now fails (was public, now isn't).

### Step 7: Admin assignment-review listing (the other half of "how do we verify proofs")

- **What:** `GET /admin/ca-tasks/:id/assignments` — Admin-only (`@Roles(ADMIN, SUPER_ADMIN)` + `RolesGuard`), paginated (`?page=&limit=`, default limit 20), optional `?status=` filter. Returns each `CATaskAssignment` for the given task joined to the CA's name/college (`caProfile.user.name`, `caProfile.assignedCollegeName`) so the admin isn't looking at raw UUIDs. For each row: if `proofUrl` looks like an internal object key (starts with `ca-proof/`, not `http`), resolve it to a fresh `uploadsService.getSignedGetUrl(key, 900)` on the way out — never return the raw key, never a permanent public URL. If it's a URL-type submission, return it as-is (already sanitized to http/https at submit time). This is what the frontend's admin review page is already built to call — without it, `PATCH /admin/ca-task-assignments/:id/verify` has no way to be reached from the UI at all.
- **Files:** `apps/api/src/admin/admin.controller.ts`, `apps/api/src/admin/admin.service.ts`, `apps/api/src/admin/admin.module.ts` (import `UploadsModule`), `apps/api/src/admin/dto/admin.dto.ts` (pagination query DTO)
- **Validation:** e2e — non-admin → 403; admin gets a paginated list with resolved signed URLs for FILE submissions and raw URLs for URL submissions; a signed URL returned actually resolves to the uploaded image within its TTL.

### Step 8: Consent capture

- **What:** `POST /auth/register` and `POST /leads/waitlist` both collect PII (email, phone, college) with zero consent tracking. Add `consent: boolean` (must be `true`) to `RegisterDto` and `WaitlistLeadDto` (`@IsBoolean() @Equals(true)` or equivalent — 400 if false/missing). On success, set `User.consentedAt` / — for leads, `CaReferralLead` doesn't need its own consent timestamp for an MVP; recording that the *lead* came through a consenting submission is enough context in the access log, don't add a second column for it today (YAGNI — `createdAt` on the lead row plus the fact the endpoint 400s without consent is sufficient audit trail for launch).
- **Files:** `apps/api/src/auth/dto/register.dto.ts`, `apps/api/src/auth/auth.service.ts`, `apps/api/src/leads/dto/leads.dto.ts`
- **Validation:** e2e — register/waitlist without `consent: true` → 400; with it → succeeds, `User.consentedAt` populated.

### Step 9: Full validation gate + docs

- **What:** Run the complete gate. Fix anything that breaks. Update `.claude/reference/api.md` with: `PATCH /admin/users/:id/role`, the role requirement now on `/ca/onboard`, the consent field on `/auth/register` + `/leads/waitlist`, the multipart contract on `/ca/tasks/:taskId/submit`, and the new `GET /admin/ca-tasks/:id/assignments`. Update `.claude/reference/architecture.md`'s CA sequence diagram if the onboarding flow changed meaningfully (it now requires an admin-promotion step first) and to note the Uploads module.
- **Files:** `.claude/reference/api.md`, `.claude/reference/architecture.md`
- **Validation:**
  ```bash
  npm run lint
  npm run check-types
  npm run build
  npm run test --workspace=api
  npm run test:e2e --workspace=api
  ```
  All green. This is the actual definition of "ready for staging" — not partial.

## Tests and Validation

```bash
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
npm run test:e2e --workspace=api
```

Manual smoke test before calling it done: admin promotes a test user to CAMPUS_AMBASSADOR → that user onboards with a non-fixed-list college → gets a refCode → hits the referral click endpoint twice from the same IP (second doesn't count) → admin creates a FILE-type task → CA uploads a real JPEG as proof → admin calls `GET /admin/ca-tasks/:id/assignments`, sees the submission with a working signed image URL → admin verifies it → CA's `totalPoints` updates → `GET /leaderboard/ca` reflects it. Confirm a second concurrent verify attempt on the same assignment gets 409, not a double-award. Confirm the uploaded object is not reachable via a direct public bucket URL.

## Acceptance Criteria

- [ ] `npx prisma migrate status` shows zero drift; `ca_referral_leads`, `CAProfile.clickCount`, `CaTask.status`/`Brand.status`, `CATaskAssignment.rejectionReason`, `User.consentedAt` all exist in an actual migration, not just `schema.prisma`
- [ ] `npm run check-types --workspace=api` passes with 0 errors
- [ ] `PATCH /admin/users/:id/role` exists, Admin-only
- [ ] `/ca/onboard` rejects non-CAMPUS_AMBASSADOR roles with 403
- [ ] `AdminGuard` is deleted; admin routes use the shared `@Roles()`/`RolesGuard`
- [ ] `recordConversion()` exists, is unit-tested, is not called from any controller
- [ ] CA onboarding accepts real college names (not limited to the old 5-entry list)
- [ ] `POST /ca/tasks/:taskId/submit` accepts a real multipart file upload, validates content-type + size, stores it under a UUID key — matches the contract the frontend's file-picker UI already assumes
- [ ] MinIO bucket `infinito-assets` is private (no `anonymous public` policy); objects are only reachable via `getSignedGetUrl()`
- [ ] `GET /admin/ca-tasks/:id/assignments` exists, Admin-only, paginated, resolves FILE-type proofs to signed URLs — matches the contract the frontend's admin review page already assumes
- [ ] `/auth/register` and `/leads/waitlist` both require `consent: true` and record `consentedAt`
- [ ] Full validation gate (lint/typecheck/build/unit/e2e) is green
- [ ] `.claude/reference/api.md` and `architecture.md` reflect every change above
- [ ] PR opened from `feature/ca-backend` against `develop`, linked to #24, requesting both mdminhaj-2106 and Saad-Manda as reviewers (Saad-Manda specifically approves Step 4 + Step 6)

## Risks and Notes

- **Data migration:** yes — one migration, Step 1, prerequisite for every other step. Must be generated (`prisma migrate dev`), never hand-written.
- **API contract change:** additive except `/ca/onboard` (now role-gated — anyone who was relying on the current unguarded behavior in local testing will need to promote their test user first) and `/auth/register` + `/leads/waitlist` (now require `consent: true` — any existing frontend calling these without it will start getting 400s; confirm with Anjneya's side, issue #25, before this merges if the frontend already calls these).
- **Performance concern:** none new.
- **Security:** this plan closes the RBAC gap (unguarded onboard, bespoke admin guard) and ships real (if minimal) signed-URL storage — the bucket goes from public to private, objects only reachable through `getSignedGetUrl()`. Not shipped: presigned direct-to-bucket upload, content scanning, CDN — named explicitly in Scope's "Out" list.
- **New dependency:** `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`. CONSTITUTION.md requires "no new libraries without an issue and approval" — this plan, attached to issue #24, is that approval; flagging so it isn't missed as an unreviewed dependency add in the PR diff.
- **Deadline pressure — revised now that Step 6/7 got bigger:** if the college-list fix (Step 5) ends up contested and time runs out, that alone is safe to drop for tonight (it degrades onboarding UX, not correctness or security). Step 6 (real upload) and Step 7 (admin listing) are **not** in that droppable category anymore — without them, the CA task-verification loop doesn't work at all through the built UI, which defeats the point of tonight's push. The actual non-negotiable subset is now Step 1–4, 6, 7, 9 (migration, RBAC, recordConversion, upload storage, admin listing, full validation gate). If even that looks at risk by mid-evening, Owais should message Minhaj immediately rather than let it surface at 11:59 PM.
- **Unknowns:** none blocking — every item above was confirmed by reading the actual code and running the actual typecheck this session, not inferred from docs.
- **Branch strategy:** merging to `develop` now (rather than keeping CA isolated on its own long-lived branch until "main portal" is ready) was a deliberate call — `feature/CA-Portal-Schema` already touches shared files (`CONSTITUTION.md`, `app.module.ts`, `architecture.md`), and a modular monolith means unused CA routes on `develop` cost the rest of the app nothing. If CA features shouldn't be publicly visible on the staging URL yet, that's a frontend-side concern (issue #25 — gate the CA nav/pages behind a flag or simply don't link to them) rather than a reason to fork the backend's git history.
- **Process risk (not this plan's to fix, but not to lose either):** the master roadmap's central warning — *"a `.claude/plans/*.md` file with no branch behind it is exactly what happened in July"* — is exactly what's being corrected tonight for CA backend, but it may be actively recurring elsewhere right now: PR #17 (roadmap doc, open since Jul 6, meant to merge Aug 3) and the W1-assigned Users/Events/Teams modules (no code on `develop` as of this audit) both need a status check this week. Not part of tonight's acceptance criteria — surfaced here so it's a tracked decision, not a forgotten one.
- **Reviewer note:** Saad-Manda should be looped in before Owais starts, not after the PR is up — the two-approval rule works best when the second reviewer has context going in, especially on Step 4's transaction logic and Step 6's validation boundary.
