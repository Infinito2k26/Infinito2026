# Plan: Auth — Minimal Email/Password Module (CA Launch Phase A)

## Issue

- Tracker: [#18](https://github.com/Infinito2k26/Infinito2026/issues/18) — `Closes #18` wired into the PR.
- Parent context: `.claude/plans/local-ca-program-launch.md` (CA Program Launch Readiness epic) — this is that epic's Phase A, promoted to its own standalone execution doc per repo convention (plan docs are the authoritative spec, not the epic subsection or the issue body).
- Track: Lead / Backend (Auth is explicitly Lead-owned territory per CONSTITUTION's ownership pattern)
- Priority: P0 — blocks Phase B/C/D of the CA launch (2026-07-16/17) and all of Phase 2+ on the master roadmap
- Owner: mdminhaj-2106
- Reviewer: self-review acceptable (same pattern as merged PR #16); branch protection requiring 2 approvals for auth changes is aspirational only (org on GitHub free tier, not yet enforced)
- Branch: `feature/auth-minimal` from fresh `origin/develop`

## Scope

**In:** register/login/refresh/logout/me per `.claude/reference/api.md`'s exact MVP endpoint map; `JwtStrategy`/`JwtAuthGuard`/`RolesGuard`/`@Roles()`/`@CurrentUser()`; fixed `PrismaService`; fixed `packages/types` `UserRole`; rate limiting on auth routes; refresh-token storage behind a small interface (in-memory now, Redis-backed swap in Phase B).

**Out:** OAuth of any kind, password reset flow (no email/notifications module exists — defer), account lockout/2FA, Redis-backed refresh storage (Phase B; this phase only defines the interface + in-memory implementation).

## Ground Truth Corrections (verified this session, supersede epic doc's original wording)

1. **PrismaService stub is unblocked, not speculative.** `apps/api/src/prisma/prisma.service.ts` is a plain class implementing `OnModuleInit`/`OnModuleDestroy`, does **not** extend `PrismaClient`, `$connect()`/`$disconnect()` are commented out. Its own comment says "replace stub after issue #2 merges" — issue #2 (Prisma schema) is already merged, so this fix has no remaining dependency.
2. **`UserRole` fix direction confirmed exactly.** Current `packages/types/src/auth.ts`: `SUPER_ADMIN, ADMIN, EVENT_MANAGER, VOLUNTEER, CAMPUS_AMBASSADOR, TEAM_CAPTAIN, PARTICIPANT`. Authoritative `apps/api/prisma/schema.prisma`: `SUPER_ADMIN, ADMIN, MODERATOR, VOLUNTEER, CAMPUS_AMBASSADOR, PARTICIPANT`. Fix = remove `EVENT_MANAGER` and `TEAM_CAPTAIN`, add `MODERATOR`.
3. **`.env.example` gap is bigger than the epic implied.** Currently **1 line** (`DATABASE_URL` only). `env.schema.ts` already requires 11 vars: `NODE_ENV, PORT, DATABASE_URL, REDIS_URL, S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY` (confirm exact 3 S3 var names from the file), `JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, QR_SIGNING_SECRET`. This phase's fix must rebuild the whole file, not just append.
4. **Dependency gap confirmed exactly.** Already present (reuse, don't reinstall): `bcrypt`, `@types/bcrypt`. Missing, must add: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `cookie-parser`, `@nestjs/throttler`, `@types/passport-jwt`, `@types/cookie-parser`.
5. **No conflicts.** `apps/api/src/auth/` does not exist yet. `.claude/reference/api.md`'s 5 auth endpoints (register/login/refresh/logout/me — path, method, access) already match this plan exactly — verify-only, no doc edit expected unless implementation deviates.
6. **Refresh-token ordering resolved.** The epic doc flagged that Auth's refresh storage needs Redis (Phase B) and suggested reordering phases. Decision: **do not reorder.** Build a small `RefreshTokenStore` interface now, backed by an in-memory implementation; Phase B swaps in a Redis-backed implementation behind the same interface with zero `AuthService` changes. Accepted trade-off: refresh sessions do not survive an API process restart until Phase B lands — acceptable for launch week, single-instance deployment.

## Files to Read First

- `CONSTITUTION.md` — architecture rules, GitHub workflow, module boundary rules
- `.claude/reference/architecture.md` — module responsibility table (Auth: "register, login, refresh, logout, guards, RBAC")
- `.claude/reference/api.md` — envelope contract, auth endpoint map (§3 Auth table), status code conventions
- `.claude/reference/testing.md` — required critical flow #1 "Register -> login -> get current user"
- `apps/api/prisma/schema.prisma` — authoritative `UserRole` enum and `User` model
- `apps/api/src/prisma/prisma.service.ts`, `prisma.module.ts` — current stub to be fixed
- `apps/api/src/common/envelope/envelope.types.ts`, `common/interceptors/response-envelope.interceptor.ts`, `common/filters/global-exception.filter.ts` — conventions every new controller/service must follow
- `apps/api/src/config/env.schema.ts`, `config.module.ts` — env validation pattern (zod, global `ConfigModule`)
- `apps/api/src/app.module.ts`, `main.ts` — current wiring: `[AppConfigModule, CommonModule, HealthModule, PrismaModule]`, global prefix `api`, global `ValidationPipe`, only `RequestIdMiddleware` applied — no cookie-parser, CORS, Helmet, or Throttler yet
- `packages/types/src/auth.ts`, `index.ts` — drifted `UserRole` enum + barrel export pattern
- `docker-compose.yml` — local service names/creds/ports (Postgres `infinito_dev`/`postgres`/`infinito_dev_pwd`:5432, Redis :6379, MinIO :9000/:9001, `minio_admin`/`minio_admin_password`, bucket `infinito-assets`)
- `apps/api/src/app.controller.ts`/`app.controller.spec.ts` — stock NestJS scaffold (`getHello()` → `'Hello World!'`), only existing test-style reference (structural Jest/Supertest boilerplate, no auth-relevant pattern)

## Files to Change / Create

```
apps/api/package.json                                     add deps (see Ground Truth Corrections #4)
apps/api/src/prisma/prisma.service.ts                      fix — extends PrismaClient, real $connect/$disconnect
packages/types/src/auth.ts                                 fix — UserRole to match schema.prisma exactly
apps/api/src/config/env.schema.ts                          add JWT_ACCESS_EXPIRY / JWT_REFRESH_EXPIRY (e.g. "15m"/"7d")
apps/api/.env.example                                       rebuild — all 11 existing env.schema.ts vars + the 2 new expiry vars (currently only has DATABASE_URL)
apps/api/src/main.ts                                        add cookie-parser middleware, ThrottlerGuard global registration
apps/api/src/app.module.ts                                  wire AuthModule (Redis/BullMQ is Phase B — do not add yet)
apps/api/src/auth/auth.module.ts                            new
apps/api/src/auth/auth.controller.ts                        new
apps/api/src/auth/auth.service.ts                           new
apps/api/src/auth/dto/register.dto.ts                       new
apps/api/src/auth/dto/login.dto.ts                          new
apps/api/src/auth/strategies/jwt.strategy.ts                new
apps/api/src/auth/guards/jwt-auth.guard.ts                  new
apps/api/src/auth/refresh-token-store.interface.ts          new — save(userId, tokenHash, expiresAt) / verify(userId, tokenHash) / revoke(userId)
apps/api/src/auth/in-memory-refresh-token-store.ts          new — Map-based impl, TTL sweep; // ponytail: single-instance only, swap for Redis in Phase B
apps/api/src/common/guards/roles.guard.ts                   new (shared, not auth-module-private — future modules need it)
apps/api/src/common/decorators/roles.decorator.ts           new
apps/api/src/common/decorators/current-user.decorator.ts    new
apps/api/test/auth.e2e-spec.ts                              new
apps/api/src/auth/auth.service.spec.ts                      new
```

## Implementation Steps

**Step 0 — GitHub issue**
- What: Create the issue (see Issue section above), assign to self, link this plan file in the issue body. Rename this file to include the issue number once known.
- Validation: issue exists, labeled correctly, linked

**Step 1 — Branch + deps**
- What: `git fetch origin && git checkout -b feature/auth-minimal origin/develop`; add `@nestjs/jwt @nestjs/passport passport passport-jwt cookie-parser @nestjs/throttler` (+ `@types/passport-jwt @types/cookie-parser` as devDeps) to `apps/api/package.json`; `npm install`. Do not reinstall `bcrypt`/`@types/bcrypt` — already present.
- Files: `apps/api/package.json`, `package-lock.json`
- Validation: `npm install` completes clean; `npm run build --workspace=api` still passes with no new code yet

**Step 2 — Fix PrismaService stub**
- What: `PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy`, real `await this.$connect()` / `await this.$disconnect()`. `schema.prisma`'s `datasource db { provider = "postgresql" }` has no driver-adapter config, so plain `extends PrismaClient` needs no adapter wiring.
- Files: `apps/api/src/prisma/prisma.service.ts`
- Validation: `docker compose up -d`, `npx prisma generate --schema=apps/api/prisma/schema.prisma`, `npm run start:dev --workspace=api`, confirm `GET /api/health` still returns 200 with no connection errors in logs

**Step 3 — Fix UserRole drift**
- What: Replace `packages/types/src/auth.ts` enum values with exactly `SUPER_ADMIN, ADMIN, MODERATOR, VOLUNTEER, CAMPUS_AMBASSADOR, PARTICIPANT` (remove `EVENT_MANAGER`, `TEAM_CAPTAIN`). Check `UserProfileResponse` interface fields match what `/auth/me` returns (add `name`, `phone`, `isIITP` only if genuinely needed now — keep minimal).
- Files: `packages/types/src/auth.ts`
- Validation: `npm run check-types`

**Step 4 — Env schema + example (full rebuild)**
- What: Add `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` (defaults `15m`/`7d`) to `env.schema.ts`. Rebuild `.env.example` from scratch to cover all 11 existing required vars plus these 2 — use real local docker-compose values as examples.
- Files: `apps/api/src/config/env.schema.ts`, `apps/api/.env.example`
- Validation: fresh `cp apps/api/.env.example apps/api/.env` boots the app without a zod validation error (DB/Redis pointed at local docker; JWT secrets any ≥32-char dev string, comment noting prod must regenerate)

**Step 5 — Refresh-token store interface + in-memory impl**
- What: `RefreshTokenStore` interface (`save(userId, tokenHash, expiresAt)`, `verify(userId, tokenHash)`, `revoke(userId)`). `InMemoryRefreshTokenStore` — `Map<string, {tokenHash, expiresAt}>` keyed by userId, a `setInterval` or lazy-check TTL sweep on `verify`. Mark with `// ponytail: in-memory refresh store, single-instance only; swap for RedisRefreshTokenStore in Phase B, same interface`. Bind via a `REFRESH_TOKEN_STORE` DI token in `AuthModule` so Phase B only changes the provider binding.
- Files: `apps/api/src/auth/refresh-token-store.interface.ts`, `apps/api/src/auth/in-memory-refresh-token-store.ts`, `apps/api/src/auth/auth.module.ts`
- Validation: covered by Step 6/8's tests (store correctness exercised through the service, not standalone)

**Step 6 — Auth DTOs + service**
- What: `RegisterDto` (`email`, `password` min 8 chars, `name`, `phone?`, `college?`), `LoginDto` (`email`, `password`), `class-validator` decorators (global `whitelist`/`forbidNonWhitelisted` already enforced). `AuthService.register()` — `bcrypt.hash`, create `User` row (`role` defaults to `PARTICIPANT`), `ConflictException` on duplicate email (409). `AuthService.login()` — `bcrypt.compare`, `UnauthorizedException` on mismatch (401), issue access JWT (`sub`, `role`, short expiry) + refresh JWT (`sub`, unique `jti`, longer expiry), write to `RefreshTokenStore` via the injected `REFRESH_TOKEN_STORE` token. `AuthService.refresh()` — verify refresh JWT, check store, rotate (revoke old, issue+save new pair). `AuthService.logout()` — revoke via store. `AuthService.me()` — return current user from `@CurrentUser()`.
- Files: `apps/api/src/auth/dto/*.ts`, `apps/api/src/auth/auth.service.ts`
- Validation: `apps/api/src/auth/auth.service.spec.ts` — hash/compare correctness, duplicate-email conflict, bad-password rejection, token payload shape, rotation revokes old token

**Step 7 — Guards, strategy, decorators**
- What: `JwtStrategy` (passport-jwt, `Authorization: Bearer`, validates `JWT_ACCESS_SECRET`, attaches `{id, role}` to `request.user`); `JwtAuthGuard extends AuthGuard('jwt')`; `RolesGuard` (`Reflector`, `@Roles()` metadata vs `request.user.role`, `ForbiddenException` 403 on mismatch); `@Roles(...roles: UserRole[])` (`SetMetadata`); `@CurrentUser()` (`createParamDecorator`). Guards/decorators live in `apps/api/src/common/` (shared, not `auth/`-private) — future modules (Phase C's admin/CA endpoints) need them.
- Files: `apps/api/src/auth/strategies/jwt.strategy.ts`, `apps/api/src/auth/guards/jwt-auth.guard.ts`, `apps/api/src/common/guards/roles.guard.ts`, `apps/api/src/common/decorators/roles.decorator.ts`, `apps/api/src/common/decorators/current-user.decorator.ts`
- Validation: covered by Step 8's e2e test

**Step 8 — Controller + cookie wiring + rate limit**
- What: `AuthController` — `POST /auth/register` (201), `POST /auth/login` (200, sets `res.cookie('refresh_token', token, {httpOnly: true, secure: NODE_ENV==='production', sameSite: 'lax', maxAge: ...})`), `POST /auth/refresh` (reads cookie, not body), `DELETE /auth/logout` (`@UseGuards(JwtAuthGuard)`, clears cookie + revokes store entry), `GET /auth/me` (`@UseGuards(JwtAuthGuard)`). Register `cookie-parser` in `main.ts`. Add `ThrottlerModule.forRoot(...)` + `@UseGuards(ThrottlerGuard)` on the auth controller (e.g. 10 req/min per IP on login/register).
- Files: `apps/api/src/auth/auth.controller.ts`, `apps/api/src/main.ts`, `apps/api/src/auth/auth.module.ts`, `apps/api/src/app.module.ts`
- Validation: `apps/api/test/auth.e2e-spec.ts` — testing.md flow #1 (register → login → me) plus: duplicate register → 409, wrong password → 401, missing token on `/auth/me` → 401, wrong role on a `@Roles()`-gated dummy route → 403, throttled 11th login attempt in a minute → 429, replayed old refresh token after rotation → 401

**Step 9 — Reference doc verification**
- What: Confirm `.claude/reference/api.md`'s 5 auth endpoints match implemented shapes exactly (status codes, envelope). No content change expected unless implementation deviates.
- Files: `.claude/reference/api.md` (verify only)
- Validation: manual diff read-through

## Tests and Validation (gate)
```
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
npm run test:e2e --workspace=api
```
Plus manual: `docker compose up -d`, `npm run start:dev --workspace=api`, curl register → login → me → refresh → logout → me (expect 401 after logout).

## Acceptance Criteria
- [ ] `POST /auth/register`, `/login`, `/refresh`, `DELETE /logout`, `GET /me` all match `.claude/reference/api.md` exactly (path, method, envelope)
- [ ] `PrismaService` is a real `PrismaClient`, no commented-out lifecycle hooks remain
- [ ] `packages/types` `UserRole` matches `schema.prisma` verbatim
- [ ] Refresh token rotation invalidates the old token (old refresh token replayed after rotation → 401)
- [ ] Auth endpoints are rate-limited
- [ ] `RefreshTokenStore` interface exists; `AuthService` depends only on the interface, never the concrete in-memory class directly
- [ ] All required e2e flows from testing.md item #1 pass

## Risks and Notes
- **Data migration:** none (no schema change)
- **API contract change:** additive (Auth endpoints are new, not previously implemented despite being in api.md)
- **Ordering dependency — resolved:** Auth's refresh-token storage previously needed Redis (Phase B) to exist first. Resolved via the `RefreshTokenStore` interface (Step 5) — Phase A ships independently with an in-memory implementation; Phase B swaps the DI binding to a Redis-backed implementation with zero `AuthService` changes.
- **Accepted trade-off:** refresh sessions do not survive an API process restart until Phase B lands. Acceptable for launch week on a single-instance deployment; flag if this changes before Phase B merges.
- **Unknowns:** none blocking; password reset / email verification intentionally deferred (no Notifications module exists — flag to user if launch requires it, currently assumed not required for CA-only launch scope)
