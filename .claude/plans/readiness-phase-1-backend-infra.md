# Readiness Phase 1 — Backend & Deployment Hardening

**Status:** Active — start here for backend/infra work. **Written:** 2026-08-31.
**Supersedes:** `pre-deployment-hardening.md` in full, and sections 0/1/2/4 of `production-readiness-audit.md`. Both are kept for history but this file is now the single, self-contained source for backend/infra work — read this one, not those.

## What this phase is

Everything code- and infrastructure-side standing between "the sprint's feature loop works" and "this is safe to put in front of real users and real money." Events, Teams, Registration, Payments, and QR/Credential+Scan all shipped as working, tested modules — 112 unit tests and 45 e2e tests pass, lint/typecheck/build are green. This phase is what's left, ordered small-to-big within three tiers, re-verified live against current code as of this session (not assumed from either superseded doc).

---

## P0 — blocks deployment

### 1. Duplicate global exception filter breaks the envelope contract

`apps/api/src/app.module.ts:24,50-51` registers `AllExceptionsFilter` as `APP_FILTER`. `apps/api/src/common/common.module.ts:3,8` separately registers `GlobalExceptionFilter`, also as `APP_FILTER`. Both are active on every request right now.

Only `GlobalExceptionFilter` matches the envelope `.claude/reference/api.md` documents: `{success: false, error: {code, message}, meta: {requestId, timestamp}}`. `AllExceptionsFilter` produces a different, non-enveloped shape: `{statusCode, timestamp, path, message}`. Whichever filter wins on a given request is undefined without tracing Nest's module-resolution order by hand.

**Fix:** remove the `APP_FILTER` provider and `AllExceptionsFilter` import from `app.module.ts`. Delete `apps/api/src/common/filters/all-exceptions.filter.ts` — no spec file, nothing else references it.

### 2. New public endpoints have no rate limit

`ThrottlerModule.forRoot()` in `app.module.ts` only registers throttler options and storage — it does not attach a guard by itself. The only place `ThrottlerGuard` is actually applied is `@UseGuards(ThrottlerGuard)` on `auth.controller.ts:27`.

`POST /registrations`, `POST /payments`, `GET /events`, `GET /identity/validate/:token`, and `POST /identity/scan` are completely unrate-limited, right as this is about to take real fest traffic.

**Fix:** add `{ provide: APP_GUARD, useClass: ThrottlerGuard }` to `app.module.ts` so the guard applies globally. Add `@SkipThrottle()` to authenticated admin-listing controllers (`admin-payments`, `admin-scans`, `admin-events`, the new `admin-registrations` from item 3, and CA admin endpoints) so internal dashboard polling doesn't share a rate budget with public abuse traffic. Remove the now-redundant per-route guard on `auth.controller.ts`. Sanity-check the default limit (10 req/60s) is generous enough for a legitimate registrant retrying a form submission.

### 3. No admin visibility into registrations

Payments, scans, events, and the CA program all have an `admin-*.controller.ts` plus a matching `/admin/*` page in the web app. Registrations has neither — staff have no way to list or filter registrations without querying the database directly.

**Fix:**
- Backend: `apps/api/src/registrations/admin-registrations.controller.ts` — `GET /admin/registrations` with a status filter, mirroring `apps/api/src/payments/admin-payments.controller.ts`. Register it in `registrations.module.ts`. Guard with `RolesGuard` + `@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)`.
- Frontend: `apps/web/app/admin/registrations/page.tsx` + `admin-registrations.module.css`, mirroring `apps/web/app/admin/payments/page.tsx`'s list/filter/StatCard pattern.

### 4. Refresh-token sessions do not survive a restart — and cannot scale past one process

`apps/api/src/auth/in-memory-refresh-token-store.ts` holds every user's refresh token in a plain in-process `Map`. The file's own comment says it plainly: *"in-memory refresh store, single-instance only... sessions don't survive a restart."* Every deploy, crash, or process reload force-logs-out every signed-in user, and the API can never run as more than one instance without breaking auth for whichever instance didn't handle a given login.

This bites harder than a normal launch-week nit because deploying items 1–3 above *requires* restarting the API — landing them logs out every already-registered participant the moment the fix ships.

**Fix:** implement `RedisRefreshTokenStore` against the existing `RefreshTokenStore` interface (`apps/api/src/auth/refresh-token-store.interface.ts`) and swap it in `auth.module.ts`. Redis is already a running dependency for BullMQ — this is a small, self-contained change, not new infrastructure.

### 5. No production deployment target exists yet

- No `Dockerfile` anywhere in the repo.
- `docker-compose.yml` defines only dev Postgres + Redis — no app containers, no prod compose file.
- `.github/workflows/ci.yml` runs lint/typecheck/build/test only; no deploy job, no CD pipeline.
- `.claude/reference/deployment-requirements.md` is a budget-sanction document from June (institute administration audience, ₹12,000 ask) describing a *recommended* stack — DigitalOcean VPS, Vercel, Cloudflare, Cloudinary, Resend. Nothing in the repo indicates any of it is actually provisioned. It's also stale: it still names **Razorpay** as the payment gateway and budgets its KYC lead time, while the shipped implementation is manual UPI-screenshot verification — Razorpay is permanently cut from scope.

**Net effect:** "deploy to production" isn't a checklist item against existing infra — it's a from-scratch project (Dockerfile, domain decision, VPS/Vercel/Cloudflare provisioning, CD job, DNS) that hasn't started.

**Fix:** write a production `Dockerfile` for the API, decide the domain (see Phase 3), provision the VPS/Vercel/Cloudflare stack per `deployment-requirements.md` (updating its stale Razorpay reference while at it), and wire a CD job in `ci.yml`.

### 6. No graceful shutdown, and background workers share the API process

`apps/api/src/main.ts` never calls `app.enableShutdownHooks()`. `apps/api/src/queue/queue.module.ts` registers BullMQ processors (referral flush, leaderboard recalc, credential issuance) in the same Nest application as the HTTP API. Without shutdown hooks, a `SIGTERM` kills in-flight jobs mid-execution with no clean drain — including QR credential generation and payment-confirmation processing, the jobs most likely to be mid-flight during a registration rush.

**Fix:** add `app.enableShutdownHooks()` in `main.ts`; confirm BullMQ's stall/retry behavior safely requeues a job killed mid-processing rather than dropping it.

---

## P1 — dependency, security & compliance hygiene

### 7. Dependency vulnerabilities in the web tree

Ran `npm audit` against `apps/web` live this session: **6 vulnerabilities (5 high, 1 moderate)** — the Next.js/postcss/sharp chain (SSRF, XSS, path traversal, libvips CVEs) plus a moderate `valibot` issue.

**Fix:** run `npm audit fix` for the safe `valibot` fix immediately. Treat the Next.js bump (resolves to `next@16.3.3`) as its own isolated, easily-revertable commit — full `npm run build` plus an e2e/manual smoke pass afterward. Do this early in the pre-deploy window, not the night before.

### 8. Zero email delivery — no confirmations, no QR delivery, no password reset

No `notifications`, `email`, or `mail` module exists anywhere in `apps/api/src`. Resend is named in the budget doc but never integrated. No confirmation email on payment, no QR credential delivered by email — and, more pressing, **no password-reset flow exists at all**. No endpoint, no reset-token model, no page on either app.

Registration/QR email being dashboard-only was a deliberate sprint cut and can stay that way if the team still agrees under launch pressure. Password reset was never called out as cut — it appears to simply not exist. Needs an explicit decision now: build it, or document the admin-assisted manual-reset process, before registration volume turns it into a support fire.

### 9. No observability

No error-tracking integration. No log aggregation — NestJS's default console `Logger` is the only logging (though `request-id.middleware.ts` stamps a request ID, a solid primitive to build on). No uptime monitoring or alerting on the `GET /health` endpoint that already checks DB + Redis. No metrics on request volume, error rate, or queue depth.

**Minimal fix:** wire `/health` into a free uptime pinger (UptimeRobot/Cronitor) and add a free-tier error tracker (Sentry or equivalent) to `main.ts` — hours of work, not a project.

### 10. No security headers on the API

`main.ts` sets up CORS and a validation pipe but nothing else — no `helmet` or equivalent, so no CSP, no HSTS, no frame/content-type protections.

**Fix:** add `helmet()` to `main.ts`.

### 11. Legal surface is one page short of what the flow actually does

A privacy-policy page exists; there is no Terms & Conditions / registration-terms page and no stated refund/cancellation policy — despite real money changing hands via UPI transfer + admin-verified screenshot proof. No public, written answer today to "what happens if my payment is rejected" or "can I cancel and get a refund."

### 12. Backup and disaster recovery is aspirational, not implemented

The budget doc mentions DigitalOcean's weekly-snapshot add-on, but there's no server yet to snapshot (see item 5). Separately, there's no documented or tested Postgres backup/restore procedure — dump schedule, retention window, an actual restore drill.

---

## P2 — smaller correctness & process fixes

### 13. E2E suite leaks a worker on teardown

`npm run test:e2e --workspace=api` passes 45/45, but Jest also reports *"A worker process has failed to exit gracefully."* Almost certainly an unclosed Redis/BullMQ connection left open by one or more specs. Doesn't fail CI today, but left alone it eventually starts hanging CI runners.

**Fix:** audit `apps/api/test/*.e2e-spec.ts` for `afterAll` hooks — every spec should call `app.close()`; any spec opening a BullMQ `Queue`/`Worker` directly needs to close it explicitly too.

### 14. Repo hygiene

- Close [issue #24](https://github.com/Infinito2k26/Infinito2026/issues/24) ("CA: CampusAmbassador backend module") — it's shipped.
- Close or rebase [PR #17](https://github.com/Infinito2k26/Infinito2026/pull/17) — a docs-only PR from July 6, superseded by the roadmap document it originally proposed.
- Add `hind-shikhar` (Shikhar Yadav — owns the entire Payments vertical) to the team roster table in `CLAUDE.md`. Currently missing.
- Currently only 2 open GitHub issues exist total, neither tracking any item in this document — none of P0–P2 above has a tracked issue. File one per item (or per tier) before starting, so progress is visible on the project board.

### 15. Process: reinstate same-day cross-review

6 of the sprint's 7 PRs — the entire QR/Credential module and the entire Payments module — merged with zero review approvals recorded, despite the sprint plan's own rule that payments/QR/auth code needs a second set of eyes before merge. Apply that rule to whichever PR lands the P0/P1 items above, rather than let the pattern continue into the fixes for the pattern.

---

## Confirmed healthy — no action needed

- Lint, typecheck, and build all green across every package. 112/112 unit tests, 45/45 e2e tests passing.
- CORS is correctly scoped (`app.enableCors` with an explicit origin + `credentials: true`) and a global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) is applied.
- Money/registration writes are transactional — both `payments.service.ts` and `registrations.service.ts` wrap their core mutations in `prisma.$transaction`.
- No secrets committed — `.env` files are gitignored; only `.env.example`/`.env.test` fixture values are tracked.
- No stray `TODO`/`FIXME`/`HACK`/`XXX` markers in `apps/api/src` or `apps/web/app`.
- Environment variables are validated at boot via a Zod schema (`apps/api/src/config/env.schema.ts`) — fails fast on missing/short secrets.
- `GET /health` checks both Postgres and Redis and returns a degraded/ok status — a solid foundation for item 9's uptime monitoring.
- Object storage (`apps/api/src/uploads/uploads.service.ts`) uses Cloudinary with authenticated, time-limited signed URLs — matches the budget doc's recommended stack.
- Request-ID middleware exists and is wired globally — a real observability primitive, just not yet connected downstream.
- `npm audit` on `apps/api` is clean — all 6 open vulnerabilities live in `apps/web`'s tree only (item 7).

---

## Suggested order of work

1. **P0 items 1–3 first**, each as its own small reviewed PR rather than one giant one (see item 15) — small, already scoped, and unblocked by anything else here.
2. **Items 4 and 6 next** (Redis-backed refresh tokens, graceful shutdown) — both small and self-contained, and specifically protect the deploys that item 1 and the rest of this phase require.
3. **Pick a domain and stand up the deployment target (item 5)** — item 8's email sender domain, CORS finalization, and item 9's observability endpoints are all blocked behind this decision. Coordinate with Phase 3's domain-decision item.
4. **Items 9 and 10 opportunistically** — observability and security headers are hours-scale wins, don't wait for a dedicated hardening week.
5. **Decide item 8 explicitly** — build password reset, or document the admin-assisted manual-reset process, before registration volume makes it a support fire.
6. **Item 7's dependency bump needs its own runway**, separate from the rest, so a regression is easy to isolate.
7. P2 items (13–15) trail behind or land opportunistically once P0/P1 are out.
