# Plan: phase-2-schema — Database Schema Foundation

## Issue

- Tracker: local
- Track: database
- Priority: critical
- Owner: AI Agent
- Reviewer: Lead Developer
- Target branch: feature/CA-Portal-Schema

## Outcome

Prisma schema is updated with missing models (`ca_referral_leads`) and fields (`status`, `rejectionReason`) to support the CA Portal workflows and meet critical gap resolutions, ensuring soft-delete compliance and task submission guards.

## Scope

**In:**
- Verify and align Core CA Models: `CampusAmbassador` (currently `CAProfile`), `CASocialAccount`, `CaTask`, `CATaskAssignment`, and `ReferralConversion`.
- Add `CaReferralLead` model mapped to `ca_referral_leads` to capture pre-registration traffic.
- Implement soft delete requirement by adding a `status` field (e.g. `ACTIVE`, `ARCHIVED`) to `CaTask` and `Brand`.
- Add `rejectionReason` (String) to `CATaskAssignment`.

**Out:**
- Writing application or API code.
- Applying Prisma migrations to the database (this will happen in execution phase).

## Files to Read First

- `apps/api/prisma/schema.prisma` — Current database schema

## Files to Change

- `apps/api/prisma/schema.prisma` — Needs model additions and field updates.

## Implementation Steps

### Step 1: Add Waitlist Lead Model
- **What:** Add a new model `CaReferralLead` (with `@@map("ca_referral_leads")`). Add fields: `id` (UUID), `name` (String), `email` (String), `phone` (String), `college` (String), `referralCode` (String, nullable), `createdAt` (DateTime), `convertedAt` (DateTime, nullable), `registrationId` (String, nullable, UUID).
- **Files:** `apps/api/prisma/schema.prisma`
- **Validation:** `npx prisma format`

### Step 2: Implement Soft Delete fields for CaTask and Brand
- **What:** Define an enum `RecordStatus { ACTIVE ARCHIVED }` (or similar) and add a `status` field of this type to `CaTask` and `Brand` models, defaulting to `ACTIVE`.
- **Files:** `apps/api/prisma/schema.prisma`
- **Validation:** `npx prisma format`

### Step 3: Add Task Submission Guards
- **What:** Ensure `CATaskAssignment` has a `status` field. Update the `TaskStatus` enum to ensure it includes `PENDING`, `VERIFIED`, `REJECTED` (and retain any others if needed like `SUBMITTED`). Add a `rejectionReason` string field (nullable) to `CATaskAssignment`.
- **Files:** `apps/api/prisma/schema.prisma`
- **Validation:** `npx prisma format`

## Tests and Validation

```bash
# Validation gate from CONSTITUTION.md
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
```

## Acceptance Criteria

- [ ] Core CA models (`CAProfile`/`CampusAmbassador`, `CASocialAccount`, `CaTask`, `CATaskAssignment`, `ReferralConversion`) are present and complete.
- [ ] `ca_referral_leads` model exists with required fields.
- [ ] `CaTask` and `Brand` models include a `status` field to toggle between active and archived states.
- [ ] `CATaskAssignment` includes a `status` field (PENDING, VERIFIED, REJECTED) and a `rejectionReason` string field.

## Risks and Notes

- **Data migration:** None for now (schema only).
- **API contract change:** Additive database fields.
- **Performance concern:** None.
- **Unknowns:** The existing schema uses `CAProfile` instead of `CampusAmbassador`. The plan assumes we keep `CAProfile` to represent the Campus Ambassador or rename it if explicitly required during execution. We also assume `isActive` can be replaced or accompanied by the new `status` field on `Brand` and `CaTask`.
