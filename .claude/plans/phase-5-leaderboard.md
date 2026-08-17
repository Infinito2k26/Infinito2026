# Plan: phase-5-leaderboard — Leaderboard & Polish

## Issue

- Tracker: local
- Track: api
- Priority: critical
- Owner: AI Agent
- Reviewer: Lead Developer
- Target branch: feature/CA-Portal-Phase5

## Outcome

The public leaderboard is available and highly performant via Redis caching and BullMQ cron jobs. The API has a robust global exception filter for unhandled errors acting as an MVP alerting system, and the architecture documentation is fully updated to reflect the robust features built during the campaign launch.

## Scope

**In:**
- `GET /leaderboard/ca` public endpoint.
- BullMQ cron job (`leaderboard-recalc`) running every 15 minutes.
- Global exception filter (`AllExceptionsFilter`) for 500-level errors.
- Documentation updates in `.claude/reference/api.md` and `.claude/reference/architecture.md`.

**Out:**
- Application code writing (this is just the implementation plan).
- Full integration with Sentry/Discord (using console log prefix `WEBHOOK_ALERT` as an MVP placeholder).

## Files to Read First

- `apps/api/prisma/schema.prisma`
- `.claude/reference/api.md`
- `.claude/reference/architecture.md`

## Files to Change

- `apps/api/src/leaderboard/leaderboard.controller.ts` (New)
- `apps/api/src/leaderboard/leaderboard.service.ts` (New)
- `apps/api/src/leaderboard/leaderboard.module.ts` (New)
- `apps/api/src/queue/jobs/leaderboard.processor.ts` (New)
- `apps/api/src/queue/queue.module.ts` (Modified)
- `apps/api/src/common/filters/all-exceptions.filter.ts` (New)
- `apps/api/src/app.module.ts` (Modified to register modules and global filter)
- `.claude/reference/api.md` (Modified)
- `.claude/reference/architecture.md` (Modified)

## Implementation Steps

### Step 1: Leaderboard Module & Endpoint
- **What:** Create the `leaderboard` module. Add the `GET /leaderboard/ca` public endpoint.
  - **Logic:** Attempt to fetch the `ca_leaderboard` key from Redis. If it exists, parse and return the JSON. If it is empty (cold start scenario), trigger the fallback logic: query `CAProfile` from Postgres, calculate the ranks based on `totalPoints` descending, include `clickCount` and `referralCount`, format the array, and return it. (Optionally cache it in this step, but primarily the cron job handles caching).
- **Files:** `apps/api/src/leaderboard/*`, `apps/api/src/app.module.ts`
- **Validation:** `npm run check-types`

### Step 2: Leaderboard BullMQ Cron Job
- **What:** Create `LeaderboardProcessor` mapped to the `leaderboard-recalc` queue.
  - **Logic:** Schedule the job to run every 15 minutes using the cron pattern `*/15 * * * *`.
  - **Execution:** Query the database to calculate the full ranked leaderboard (fetching `totalPoints`, `clickCount`, `referralCount`, and basic user info). Store the resulting JSON stringified array in Redis with a 15-minute TTL (`SETEX ca_leaderboard 900 <json>`).
- **Files:** `apps/api/src/queue/jobs/leaderboard.processor.ts`, `apps/api/src/queue/queue.module.ts`
- **Validation:** `npm run check-types`

### Step 3: Error Alerting (MVP)
- **What:** Create the `AllExceptionsFilter` class.
  - **Logic:** Implement NestJS's `ExceptionFilter` interface. Catch all exceptions. If the exception is an unhandled `InternalServerErrorException` or a non-HttpException (500 status), format the error and log it to the console using Nest's `Logger` prefixed explicitly with `WEBHOOK_ALERT:`. This will act as the tripwire for our log scraper.
  - **Registration:** Register the filter globally in `app.module.ts` via the `APP_FILTER` provider.
- **Files:** `apps/api/src/common/filters/all-exceptions.filter.ts`, `apps/api/src/app.module.ts`
- **Validation:** `npm run check-types`

### Step 4: Documentation Updates
- **What:** Thoroughly update the core reference documents to codify the work completed in Phases 3, 4, and 5.
  - `.claude/reference/api.md`: Document `/ca/onboard`, `/leads/waitlist`, `/ca/referral/click`, `/admin/brands`, `/admin/ca-tasks`, `/ca/tasks`, `/ca/tasks/:taskId/submit`, `/admin/ca-task-assignments/:id/verify`, and `/leaderboard/ca`.
  - `.claude/reference/architecture.md`: Document the Redis caching approach, the BullMQ async workers (`referral-flush`, `leaderboard-recalc`), the soft delete status enum strategy, the compare-and-swap concurrency lock for verifications, and the `WEBHOOK_ALERT` exception filter MVP.
- **Files:** `.claude/reference/api.md`, `.claude/reference/architecture.md`
- **Validation:** Manual review of markdown.

## Tests and Validation

```bash
# Validation gate from CONSTITUTION.md
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
```

## Acceptance Criteria

- [ ] `GET /leaderboard/ca` is public and returns a ranked array containing `clickCount` and `referralCount`.
- [ ] Leaderboard uses a Redis fallback to Postgres strategy on cold starts.
- [ ] BullMQ job runs every 15 minutes and successfully populates the Redis cache.
- [ ] Global exception filter intercepts unhandled 500 errors and logs them with the `WEBHOOK_ALERT:` prefix.
- [ ] API documentation comprehensively covers all newly built endpoints.
- [ ] Architecture documentation details the async workers, caching, compare-and-swap locking, and alerting strategies.

## Risks and Notes

- **Performance:** The DB fallback on a cold start could cause a slightly slower request for the first visitor if Redis was flushed, but this is an acceptable tradeoff for the MVP.
- **Scoring Logic:** The ranking order will primarily use `totalPoints` DESC, falling back to `referralCount` DESC in the case of a tie.
