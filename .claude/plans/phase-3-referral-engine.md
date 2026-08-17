# Plan: phase-3-referral-engine — The Referral & Waitlist Engine

## Issue

- Tracker: local
- Track: api
- Priority: critical
- Owner: AI Agent
- Reviewer: Lead Developer
- Target branch: feature/CA-Portal-Phase3

## Outcome

Backend endpoints and jobs for the CA Referral and Waitlist engine are fully operational. CAs can be onboarded, leads captured to the waitlist, and referral clicks counted asynchronously via Redis and BullMQ, strictly avoiding synchronous Postgres writes.

## Scope

**In:**
- `POST /ca/onboard` endpoint with fixed college list and randomized unguessable code generation.
- `POST /leads/waitlist` endpoint for pre-registration capture.
- `POST /ca/referral/click` endpoint with Redis-backed hourly deduplication and incrementing click counters.
- BullMQ cron job (every 60 seconds) to flush click counters from Redis to Postgres.

**Out:**
- Frontend integration (strictly backend API work).
- Modifying payment logic or user registration flows for the waitlist.

## Files to Read First

- `apps/api/src/redis/redis.service.ts` (or similar Redis provider)
- `apps/api/src/queue/queue.module.ts` (BullMQ configuration)
- `apps/api/prisma/schema.prisma`

## Files to Change

- `apps/api/src/ca/ca.controller.ts` (New)
- `apps/api/src/ca/ca.service.ts` (New)
- `apps/api/src/ca/ca.module.ts` (New)
- `apps/api/src/leads/leads.controller.ts` (New)
- `apps/api/src/leads/leads.service.ts` (New)
- `apps/api/src/leads/leads.module.ts` (New)
- `apps/api/src/queue/jobs/referral-flush.processor.ts` (New)
- `apps/api/src/app.module.ts` (Register new modules)

## Implementation Steps

### Step 1: CA Onboarding Endpoint (`POST /ca/onboard`)
- **What:** Create the `ca` module. Add `POST /ca/onboard`.
  - Input validation: `college` constrained to a predefined fixed list.
  - Logic: Generate referral code (e.g., `CA-AMU-7XQ2K`). The suffix MUST be short, random, unguessable, alphanumeric, and non-sequential.
  - Database: Check if `CAProfile` exists for the authenticated user, throw `409 Conflict` if so. Otherwise, save the new `CAProfile`.
- **Files:** `apps/api/src/ca/*`, `apps/api/src/app.module.ts`
- **Validation:** `npm run check-types`

### Step 2: Waitlist Lead Endpoint (`POST /leads/waitlist`)
- **What:** Create the `leads` module. Add `POST /leads/waitlist`.
  - Input Validation: Capture `name`, `email`, `phone`, `college`, and `referralCode` (nullable).
  - Logic: Save the DTO directly to `ca_referral_leads` using Prisma. Explicitly avoid touching any payment or User account logic.
- **Files:** `apps/api/src/leads/*`, `apps/api/src/app.module.ts`
- **Validation:** `npm run check-types`

### Step 3: Referral Click Async Tracking (`POST /ca/referral/click`)
- **What:** Add `POST /ca/referral/click` to `ca.controller.ts`.
  - Logic: Validate the `referralCode` exists in Prisma (return 404 if not found).
  - Deduplication: Hash the IP address (e.g., `SHA256(ip)`). Check Redis key `referral_click:{code}:{hashedIp}`. If it exists, return success but do nothing (deduplication). If new, set it: `SETEX referral_click:{code}:{hashedIp} 3600 1`.
  - Counting: Increment a Redis-buffered counter using a hash map: `HINCRBY referral_clicks_buffer {code} 1`.
  - STRICT REQUIREMENT: No synchronous Postgres writes here.
- **Files:** `apps/api/src/ca/ca.controller.ts`, `apps/api/src/ca/ca.service.ts`
- **Validation:** `npm run check-types`

### Step 4: BullMQ Referral Flush Job
- **What:** Implement a BullMQ cron job running every 60 seconds.
  - Logic: Fetch all keys from `referral_clicks_buffer`.
  - Idempotency: Use an atomic Redis operation (e.g., `RENAME` buffer to a temporary key, or a Lua script) to retrieve and clear the buffer simultaneously, ensuring no counts are lost if a mid-flush crash occurs.
  - Batch Update: Iterate through the collected `{code}: count` mapping and perform a bulk increment (or concurrent `update` queries) in Postgres on the relevant `CAProfile` field.
- **Files:** `apps/api/src/queue/jobs/referral-flush.processor.ts`, `apps/api/src/queue/queue.module.ts`
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

- [ ] `POST /ca/onboard` creates a profile with an unguessable referral code and prevents duplicate profiles.
- [ ] `POST /leads/waitlist` writes cleanly to `ca_referral_leads` without affecting users or payments.
- [ ] `POST /ca/referral/click` validates the referral code.
- [ ] `POST /ca/referral/click` enforces IP-based deduplication for 1 hour.
- [ ] `POST /ca/referral/click` buffers clicks in Redis with ZERO synchronous Postgres writes.
- [ ] BullMQ flush job runs every 60s and atomically updates database counters without losing counts on crash.

## Risks and Notes

- **Data migration:** None.
- **API contract change:** New endpoints added (`/ca/onboard`, `/leads/waitlist`, `/ca/referral/click`).
- **Performance concern:** High-scale traffic on the click endpoint is fully mitigated by the Redis buffer strategy.
- **Unknowns:** The `schema.prisma` has a `referralCount` field in `CAProfile`, which usually denotes successful registrations. If this engine tracks "clicks" specifically, we might need a separate `clickCount` field or use `referralCount`. We will assume incrementing `referralCount` for now unless clarified. 
