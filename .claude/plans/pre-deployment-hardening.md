> **Superseded 2026-08-31** by [readiness-phase-1-backend-infra.md](readiness-phase-1-backend-infra.md) — its P0/P1/P2 items are folded in there, re-verified live against current code. Kept here for history only; work from the phase file, not this one. See [README.md](README.md) for the full index.

# Pre-Deployment Hardening — Fix & Patch Plan

**Written:** 2026-08-31. **Follows:** a full audit of `master-roadmap-sept30-launch.md` run the morning after that sprint's own Aug 30 deadline.

## Where things actually stand

The sprint's core goal shipped. Events, Teams, Registration, Payments, and QR/Credential+Scan all went from 0% code on Aug 28 to working, tested modules on `develop` — the full register → pay → verify → get a QR credential → scan-in loop exists and works. Lint, typecheck, and build are green on every package. 112 unit tests and 45 e2e tests pass (verified live this session, against real Postgres/Redis containers, including a from-scratch apply of all 7 Prisma migrations — which doubles as the "migration dry run" the roadmap's Day 3 list left unconfirmed).

What follows is everything still standing between that and putting this in front of real users at launch, ordered small to big within three priority tiers.

## P0 — blocks deployment

### 1. Duplicate global exception filter breaks the envelope contract

`apps/api/src/app.module.ts` registers `AllExceptionsFilter` as `APP_FILTER`. `apps/api/src/common/common.module.ts` separately registers `GlobalExceptionFilter`, also as `APP_FILTER`. Both are active on every request right now.

Only one of them matches the envelope this codebase's own contract requires. `.claude/reference/api.md` documents error responses as `{success: false, error: {code, message}, meta: {requestId, timestamp}}` — exactly what `GlobalExceptionFilter` produces. `AllExceptionsFilter` produces a completely different, non-enveloped shape: `{statusCode, timestamp, path, message}`. Every consumer of the API (the web app's error handling, any future client) is written against the documented envelope; whichever filter actually wins the race on a given request is undefined without tracing Nest's module-resolution order by hand.

**Fix:** remove the `APP_FILTER` provider and `AllExceptionsFilter` import from `app.module.ts`. Delete `apps/api/src/common/filters/all-exceptions.filter.ts` — it has no spec file and nothing else references it; it's dead code left over from a merge, not a second code path anyone is relying on.

### 2. New public endpoints have no rate limit

`ThrottlerModule.forRoot()` in `app.module.ts` only registers throttler options and storage — it does not attach a guard anywhere by itself (confirmed by reading `@nestjs/throttler`'s own source: no `APP_GUARD` provider exists in the module). The only place `ThrottlerGuard` is actually applied is `@UseGuards(ThrottlerGuard)` on `auth.controller.ts`.

That leaves `POST /registrations`, `POST /payments`, `GET /events`, `GET /identity/validate/:token`, and `POST /identity/scan` completely unrate-limited, right as this is about to take real fest traffic.

**Fix:** add `{ provide: APP_GUARD, useClass: ThrottlerGuard }` to `app.module.ts` so the guard applies globally by default. Then add `@SkipThrottle()` to the authenticated admin-listing controllers (`admin-payments`, `admin-scans`, `admin-events`, the new `admin-registrations` from item 3, and the CA admin endpoints) so internal dashboard polling doesn't share a rate budget with public abuse traffic. Remove the now-redundant per-route guard on `auth.controller.ts` once the global one is in place. Sanity-check the default limit (10 req/60s) is generous enough for a legitimate registrant retrying a form submission — tune per-route with named throttlers if not.

### 3. No admin visibility into registrations

Payments, scans, events, and the CA program all have an `admin-*.controller.ts` plus a matching `/admin/*` page in the web app. Registrations has neither — staff have no way to list or filter registrations without querying the database directly, on the one day that matters most for exactly that.

**Fix:**
- Backend: `apps/api/src/registrations/admin-registrations.controller.ts` — `GET /admin/registrations` with a status filter, mirroring the shape of `apps/api/src/payments/admin-payments.controller.ts`. Register it in `registrations.module.ts`. Guard with `RolesGuard` + `@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)`, matching every other admin controller in this codebase.
- Frontend: `apps/web/app/admin/registrations/page.tsx` + `admin-registrations.module.css`, mirroring `apps/web/app/admin/payments/page.tsx`'s list/filter/StatCard pattern.

## P1 — dependency & security hygiene

### 4. 14 known vulnerabilities in the web dependency tree (10 high, 4 moderate)

`npm audit` surfaces: Next.js SSRF via rewrites to an attacker-controlled hostname, unauthenticated disclosure of internal Server Function endpoints, a denial-of-service in the image-optimization API via SVGs, and an unbounded Server Action payload in the Edge runtime — plus the transitively-pulled `postcss` (XSS via unescaped `</style>`, path traversal via `sourceMappingURL`) and `sharp` (inherited libvips CVEs), and a moderate issue in `valibot`.

**Fix:** run `npm audit fix` immediately for the safe, non-breaking `valibot` fix. Treat the Next.js bump (audit resolves to `next@16.3.3`) as its own isolated, easily-revertable commit — full `npm run build` plus an e2e/manual smoke pass afterward, since a Next version bump can shift routing or build behavior. Do this early in the pre-deploy window, not the night before, so there's room to react if it breaks something.

## P2 — smaller correctness & process fixes

### 5. E2E suite leaks a worker on teardown

Confirmed live this session: `npm run test:e2e --workspace=api` passes 45/45, but Jest also reports *"A worker process has failed to exit gracefully... tests leaking due to improper teardown."* Almost certainly an unclosed Redis/BullMQ connection left open by one or more specs. Doesn't fail CI today, but left alone it's the kind of thing that eventually starts hanging CI runners.

**Fix:** audit `apps/api/test/*.e2e-spec.ts` for `afterAll` hooks — every spec should call `app.close()`, and any spec that opens a BullMQ `Queue`/`Worker` directly (rather than through the Nest app) needs to close it explicitly too.

### 6. Repo hygiene

- Close [issue #24](https://github.com/Infinito2k26/Infinito2026/issues/24) ("CA: CampusAmbassador backend module") — it's shipped; the roadmap's own ground-truth table and the actual code (`apps/api/src/ca/`) both confirm this.
- Close or rebase [PR #17](https://github.com/Infinito2k26/Infinito2026/pull/17) — a docs-only PR from July 6, superseded by the very roadmap document it originally proposed.
- Add `hind-shikhar` (Shikhar Yadav — owns the entire Payments vertical: PR #32 "Add UPI feature," the admin payment-verification screen) to the team roster table in `CLAUDE.md`. Currently missing entirely.

### 7. Process: reinstate same-day cross-review

6 of the sprint's 7 PRs — #31, #32, #33, #35, #36, #37, which is the *entire* QR/Credential module and the *entire* Payments module — merged with zero review approvals recorded. This is despite the sprint plan's own standing rule that payments/QR/auth code specifically needs a second set of eyes before merge, because with each person owning a full vertical solo, that cross-review is the only check the code gets. This isn't a code fix — it's a call to actually apply the rule to whatever PR lands the P0/P1 items above, rather than let the pattern continue into the fixes for the pattern.

## Confirmed healthy — no action needed

- Lint, typecheck, and build all green across every package.
- 112/112 unit tests, 45/45 e2e tests passing (verified live against real containers this session).
- CORS is correctly scoped (`app.enableCors` with an explicit origin + `credentials: true`, not a wildcard) and a global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) is applied.
- Money/registration writes are transactional and match the CONSTITUTION's rule: both `payments.service.ts` and `registrations.service.ts` wrap their core mutations in `prisma.$transaction`.
- No secrets committed — `.env` and `apps/api/.env` are properly gitignored; only `.env.example`/`.env.test` (fixture values) are tracked.
- No stray `TODO`/`FIXME`/`HACK`/`XXX` markers anywhere in `apps/api/src` or `apps/web/app`.

## Suggested order of work

P0 items should land first, each as its own small reviewed PR rather than one giant one — see item 7. P1's dependency bump needs its own runway separate from the P0 fixes so a regression is easy to isolate. P2 items can trail behind or land opportunistically once P0/P1 are out.
