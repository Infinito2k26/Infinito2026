# Plan: phase-4-task-engine — Task Engine & Verification (MVP)

## Issue

- Tracker: local
- Track: api
- Priority: critical
- Owner: AI Agent
- Reviewer: Lead Developer
- Target branch: feature/CA-Portal-Phase4

## Outcome

Admin users can manage brands and CA tasks using secure CRUD endpoints (with soft-deletes). Campus Ambassadors can view active tasks and submit proof securely. Admins can verify submissions with strict concurrency controls, safely avoiding race conditions during task approvals.

## Scope

**In:**
- `/admin/brands` (GET, POST, PATCH)
- `/admin/ca-tasks` (GET, POST, PATCH)
- `GET /ca/tasks` (for authenticated CAs to view tasks and their assignment status)
- `POST /ca/tasks/:taskId/submit` (for proof submission with security guards)
- `PATCH /admin/ca-task-assignments/:id/verify` (Admin verification with compare-and-swap)

**Out:**
- Application code writing (this is just the implementation plan).
- "Moderator" role logic (explicitly cut from launch scope; Admin-only).

## Files to Read First

- `apps/api/prisma/schema.prisma`

## Files to Change

- `apps/api/src/admin/admin.controller.ts` (New)
- `apps/api/src/admin/admin.service.ts` (New)
- `apps/api/src/admin/admin.module.ts` (New)
- `apps/api/src/admin/dto/admin.dto.ts` (New)
- `apps/api/src/ca/ca.controller.ts` (Modified)
- `apps/api/src/ca/ca.service.ts` (Modified)
- `apps/api/src/ca/dto/ca.dto.ts` (Modified)
- `apps/api/src/app.module.ts` (Modified to import AdminModule)

## Implementation Steps

### Step 1: Admin Brands & Tasks CRUD
- **What:** Create the `admin` module. Implement `POST`, `GET`, `PATCH` for `/admin/brands` and `/admin/ca-tasks`.
  - **Roles:** Endpoints must be strictly restricted to the `ADMIN` role.
  - **Soft Deletes:** `PATCH` endpoints must only allow soft-deleting by setting the `status` field to `ARCHIVED`. Hard deletes (e.g. `prisma.brand.delete`) are strictly prohibited.
  - **Validation:** DTOs for Task creation must enforce that if `source` is `BRAND`, a `brandId` is required. If `source` is `MODERATOR` (or internal team), `brandId` must be strictly forbidden.
- **Files:** `apps/api/src/admin/*`, `apps/api/src/app.module.ts`
- **Validation:** `npm run check-types`

### Step 2: CA Task Fetching
- **What:** Add `GET /ca/tasks` to the `ca` module.
  - **Logic:** Fetch all active tasks (`status = 'ACTIVE'`). Join/include the authenticated CA's `CATaskAssignment` records to return their current submission status alongside each task.
- **Files:** `apps/api/src/ca/ca.controller.ts`, `apps/api/src/ca/ca.service.ts`
- **Validation:** `npm run check-types`

### Step 3: CA Task Submission
- **What:** Add `POST /ca/tasks/:taskId/submit` to the `ca` module.
  - **Logic:** Allow proof URL or file upload.
  - **Security:** If the proof is a URL, it MUST be sanitized server-side against an `http/https` allow-list to prevent XSS or malicious schemes. If the proof is an uploaded file, the file must be stored using a random UUID object key to prevent guessable public URLs.
  - **Rules:** Resubmissions are allowed ONLY if the current assignment status is still `PENDING`.
- **Files:** `apps/api/src/ca/ca.controller.ts`, `apps/api/src/ca/ca.service.ts`, `apps/api/src/ca/dto/ca.dto.ts`
- **Validation:** `npm run check-types`

### Step 4: Admin Verification
- **What:** Add `PATCH /admin/ca-task-assignments/:id/verify` to the `admin` module.
  - **Logic:** Accept a verification decision, an optional `pointsOverride`, and a `rejectionReason`.
  - **Rule:** If rejecting, the `rejectionReason` string MUST be provided.
  - **CRITICAL Concurrency Guard:** Implement a compare-and-swap pattern. Since the prompt specifies checking for `PENDING` (or the equivalent pre-verification state), use a query like: `UPDATE CATaskAssignment SET status = :status WHERE id = :id AND status = 'PENDING'`. Use Prisma's `updateMany` for this atomic guard.
  - **Result:** If zero rows are affected (`count === 0`), throw a `409 Conflict`.
- **Files:** `apps/api/src/admin/admin.controller.ts`, `apps/api/src/admin/admin.service.ts`, `apps/api/src/admin/dto/admin.dto.ts`
- **Validation:** `npm run check-types`

## Tests and Validation

```bash
# Validation gate from CONSTITUTION.md
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
```

## Acceptance Criteria

- [ ] Admin CRUD endpoints use soft-deletes and are restricted to Admin users.
- [ ] Tasks correctly validate the `brandId` requirement based on task source.
- [ ] CAs can fetch active tasks with their specific assignment states included.
- [ ] Submissions sanitize URLs and enforce UUID keys for file uploads.
- [ ] Resubmissions are restricted properly (only when PENDING).
- [ ] Admin verification endpoints implement compare-and-swap.
- [ ] The API throws a 409 Conflict if the compare-and-swap update affects zero rows.
- [ ] Rejections strictly require a `rejectionReason`.

## Risks and Notes

- **Data migration:** None.
- **API contract change:** New admin routes and CA submission routes added.
- **Security:** Ensure Admin role guard is properly applied across the whole admin module. UUID mapping for files securely prevents enumeration attacks.
- **Concurrency:** The compare-and-swap mechanism robustly prevents double-awarding points if two admins verify a task simultaneously.
