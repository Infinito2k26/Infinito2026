# Plan: #21 — Redis + BullMQ Shared Infra + Real Health Checks

## Issue

- Tracker: GitHub #21
- Track: api / infra
- Priority: P0 — CA program launch, target on or before 2026-07-20
- Owner: mdminhaj-2106
- Reviewer: self-review (repo owner ships CA program solo per current decision)
- Target branch: `feature/redis-bullmq-infra`, fresh off `origin/develop` (Phase A / PR #20 is merged there as of 2026-07-12)

Ground-truth-verified against the codebase on 2026-07-13, post-Phase-A-merge. This supersedes the Phase B section of `.claude/plans/local-ca-program-launch.md` where the two differ (verified specifics below win).

## Outcome

When this ships:
- A singleton `ioredis` client is globally injectable via a `REDIS_CLIENT` token, mirroring the existing `REFRESH_TOKEN_STORE` DI-token pattern already used in `auth.module.ts`.
- Three BullMQ queues (`referral-flush`, `leaderboard-recalc`, `social-metrics-fetch`) are registered and connectable, with no processors yet — Phase C injects `@InjectQueue(...)` without owning infra setup.
- `GET /api/health` reports real per-dependency status (`db`, `redis`) instead of the current hardcoded `{status: 'ok'}` stub, and degrades gracefully (never 500s) when a dependency is down.

## Scope

**In:** `ioredis` + `bullmq` + `@nestjs/bullmq` deps, `RedisModule`, `QueueModule`, rewritten `HealthController`/`HealthModule`.
**Out:** any job processor logic (Phase C fills queues in). MinIO/S3 health check (skip — would need a new dependency or hand-rolled HTTP HEAD call for a check nothing currently depends on; add only if Phase C's upload work wants it).

## Verified Codebase Facts (differ from / sharpen the original Phase B write-up)

- `REDIS_URL` is **already** in `apps/api/src/config/env.schema.ts` (`z.string().url()`) and in `apps/api/.env.example` (`redis://localhost:6379`) — added during Phase A's scaffolding pass. **No env changes needed this phase.**
- `apps/api/package.json` currently has **no** `ioredis`, `bullmq`, or `@nestjs/bullmq` — confirmed via direct read, all three need adding.
- The response envelope is already global: `apps/api/src/common/common.module.ts` registers `ResponseEnvelopeInterceptor` via `APP_INTERCEPTOR`. `GET /api/health` will be auto-wrapped as `{success, data, meta}` — the controller should return the raw `{status, checks}` shape and let the interceptor wrap it. Do not manually construct an envelope.
- Existing DI-token-for-mockability pattern to copy: `apps/api/src/auth/refresh-token-store.interface.ts` + `REFRESH_TOKEN_STORE` token, wired in `auth.module.ts`. Use the same shape for `REDIS_CLIENT`.
- `PrismaModule` (`apps/api/src/prisma/prisma.module.ts`) is the existing `@Global()` module template — three lines, `providers`/`exports` the service. `RedisModule` should look identical in shape.
- Current `HealthModule` (`apps/api/src/health/health.module.ts`) has zero providers, just the controller — needs `PrismaService` (already `@Global`, no explicit import needed) and the new `REDIS_CLIENT` injected into the controller (or a thin `HealthService`, controller is trivial enough that either works — controller-only keeps it to one file, consistent with how small this module already is).
- `apps/api/src/main.ts` has no relevant changes needed — global prefix/pipes/cookie-parser already set, envelope/filter already wired via `CommonModule`.
- `api.md` has no health entry at all currently (confirmed via grep) — this phase adds the first one.

## Files to Read First

- `apps/api/src/prisma/prisma.module.ts`, `prisma.service.ts` — `@Global()` module + adapter-construction pattern to mirror
- `apps/api/src/auth/refresh-token-store.interface.ts`, `auth.module.ts` — DI token pattern to mirror for `REDIS_CLIENT`
- `apps/api/src/common/common.module.ts`, `common/interceptors/response-envelope.interceptor.ts` — confirms health response gets auto-wrapped
- `apps/api/src/config/env.schema.ts` — `REDIS_URL` already validated, confirm before assuming it needs adding
- `apps/api/src/health/health.controller.ts`, `health.module.ts` — current stub to replace
- `apps/api/src/app.module.ts` — import wiring
- `docker-compose.yml` — Redis service: `infinito_redis_dev`, port 6379, no auth configured
- `.claude/reference/api.md` — table format to follow when adding the health entry

## Files to Change / Create

```
apps/api/package.json                          add ioredis, bullmq, @nestjs/bullmq
apps/api/src/redis/redis.constants.ts           new — REDIS_CLIENT injection token
apps/api/src/redis/redis.module.ts              new — @Global, provides ioredis client from REDIS_URL
apps/api/src/queue/queue.module.ts              new — BullModule.forRootAsync + registerQueue x3
apps/api/src/health/health.controller.ts        rewrite — real DB ping + Redis ping, per-dependency status
apps/api/src/health/health.controller.spec.ts   new — unit test for the ok/degraded aggregation logic
apps/api/src/app.module.ts                      wire RedisModule, QueueModule
.claude/reference/api.md                        add GET /health entry
```

## Implementation Steps

### Step 1 — Deps + RedisModule

- **What:** Add `ioredis`, `bullmq`, `@nestjs/bullmq` to `apps/api/package.json`. Create `REDIS_CLIENT` token (plain `Symbol` or string const, matching `REFRESH_TOKEN_STORE`'s style) in `redis.constants.ts`. `RedisModule` is `@Global()`, constructs a singleton `new Redis(configService.get('REDIS_URL', {infer: true}))` in a factory provider under the `REDIS_CLIENT` token, exports it. Depending on a token (not the concrete `Redis` class) keeps it swappable/mockable in tests, same rationale as the refresh-token-store interface.
- **Files:** `apps/api/package.json`, `apps/api/src/redis/redis.constants.ts`, `apps/api/src/redis/redis.module.ts`
- **Validation:** `npm install`, `docker compose up -d`, `npm run start:dev --workspace=api` — app boots with no Redis connection errors in logs.

### Step 2 — QueueModule

- **What:** `BullModule.forRootAsync` reading `REDIS_URL` from `ConfigService` (BullMQ manages its own Redis connections per queue — no need to share the Step 1 `ioredis` instance). `BullModule.registerQueue({name: 'referral-flush'}, {name: 'leaderboard-recalc'}, {name: 'social-metrics-fetch'})`. No processors — just registration, so Phase C can `@InjectQueue(...)` directly.
- **Files:** `apps/api/src/queue/queue.module.ts`, `apps/api/src/app.module.ts` (import both `RedisModule` and `QueueModule`)
- **Validation:** app boots with BullMQ connected; temporary throwaway `queue.add()` + `queue.getJobCounts()` smoke test in a scratch script (not committed), confirm a job round-trips through Redis.

### Step 3 — Real health checks

- **What:** `HealthController` injects `PrismaService` (already global) and the `REDIS_CLIENT` token. Runs `prisma.$queryRaw\`SELECT 1\`` and `redisClient.ping()`, each wrapped in its own try/catch so one failing dependency doesn't take down the other's check. Returns `{status: 'ok' | 'degraded', checks: {db: 'ok' | 'error', redis: 'ok' | 'error'}}` — raw object, the global interceptor wraps it. HTTP status stays 200 even when degraded (a health probe that 500s on partial degradation is itself the bug this phase fixes).
- **Files:** `apps/api/src/health/health.controller.ts`
- **Validation:** `docker compose stop redis` → `GET /api/health` returns 200 with `checks.redis: 'error'`, `status: 'degraded'`; `docker compose start redis` → back to `ok`. Repeat for Postgres.

### Step 4 — Unit test for aggregation logic

- **What:** `health.controller.spec.ts` — mock `PrismaService.$queryRaw` and the injected Redis client's `ping()`, assert all four combinations (both up → `ok`; either down → `degraded` with the right `checks` field; both down → `degraded`, both fields `error`). This is the one non-trivial branch in this phase (ok/degraded aggregation) and is cheap to pin down without live infra.
- **Files:** `apps/api/src/health/health.controller.spec.ts`
- **Validation:** `npm run test --workspace=api`

### Step 5 — Reference doc update

- **What:** Add `GET /health` to `.claude/reference/api.md` following its existing table format (method/path/access/purpose), noting the `checks` field is new and unauthenticated/public (it's a liveness/readiness probe).
- **Files:** `.claude/reference/api.md`
- **Validation:** manual read-through against the actual response shape from Step 3.

## Tests and Validation (gate)

```bash
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
```

Manual: `docker compose up -d`, hit `GET /api/health` (expect `{success:true, data:{status:'ok', checks:{db:'ok', redis:'ok'}}, meta:{...}}`), then `docker compose stop redis` and re-hit (expect `status:'degraded'`, `checks.redis:'error'`, still HTTP 200), then `docker compose start redis` and confirm recovery.

## Acceptance Criteria

- [ ] `ioredis`, `bullmq`, `@nestjs/bullmq` installed; app boots clean
- [ ] `REDIS_CLIENT` token globally injectable (mirrors `REFRESH_TOKEN_STORE` pattern)
- [ ] Three BullMQ queues registered and connectable, no processors
- [ ] `GET /api/health` reflects real DB/Redis status, never 500s on a down dependency
- [ ] Unit test pins all four db/redis up/down combinations
- [ ] `api.md` documents the new health response shape

## Risks and Notes

- **Data migration:** none
- **API contract change:** additive — `/health` gains a `checks` field, newly documented in `api.md` (wasn't documented before at all)
- **Dependency on Phase A:** none functionally, but this branches fresh off `origin/develop` which now includes Phase A's Prisma-adapter fix (`PrismaPg`) — `HealthController`'s `$queryRaw` call works against that adapter unchanged, no special-casing needed.
- **Unknowns:** none — this phase has no external API dependencies (no YouTube/Twitter keys needed here, that's Phase C).
