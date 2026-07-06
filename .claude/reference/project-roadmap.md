# Infinito 2K26 — Master Project Roadmap

**Last updated:** 2026-06-13  
**Maintained by:** Lead Architect (@mdminhaj-2106)  
**Purpose:** Authoritative end-to-end task breakdown for planning, sequencing, and delegation. Update after each phase closes.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Completed / Merged |
| 🔄 | In Progress |
| ⏳ | Ready — can start now |
| 🔒 | Blocked — has unresolved sequential dependency |
| ⚡ | Can be worked on in parallel with sibling tasks at the same phase |
| 🔗 | Sequential — must complete before the next task in its chain |

**Dependency notation:** Tasks marked `🔗` in a phase must fully merge before tasks marked `🔒` in the next phase can begin. Tasks marked `⚡` at the same phase level have no hard dependency on each other and should be assigned concurrently to different team members.

---

## Phase Map (Bird's Eye)

```
Phase 0  Foundation                        ✅ DONE
Phase 1  Data Layer + Auth Shell           🔄 ACTIVE
Phase 2  Core Domain Modules               🔒 After Phase 1
Phase 3  Payments + Async Infrastructure   🔒 After Phase 2
Phase 4  Identity (QR) + Notifications     🔒 After Phase 3
Phase 5  Fest-Day Operations               🔒 After Phase 4
Phase 6  CA Program                        ⚡ Parallel from Phase 2 onwards
Phase 7  Admin Surface                     🔒 After Phase 2
Phase 8  Pre-Production Hardening          🔒 After all feature phases
Phase 9  Production Deployment             🔒 After Phase 8
Phase 10 Launch + Post-Fest                🔒 After Phase 9
```

---

## Phase 0 — Foundation ✅

> Goal: Local environment runs. API boots. Codebase scaffolded. CI in place.

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 0.1 | Docker Compose — PostgreSQL, Redis, MinIO | None | Lead | ✅ Issue #1, PR #4 |
| 0.2 | Turborepo monorepo setup (apps/api, apps/web, packages/ui, packages/types) | None | Lead | ✅ |
| 0.3 | Core API scaffolding — ConfigModule, CommonModule, GlobalExceptionFilter, ResponseEnvelopeInterceptor, HealthModule, PrismaModule stub | 0.1 | Lead | ✅ Issue #5, PR #7 |
| 0.4 | CI pipeline (lint, typecheck, build, API tests on every PR) | 0.2 | Lead | ✅ `.github/workflows/ci.yml` |
| 0.5 | CODEOWNERS, branch protection rules, PR template, issue templates | 0.2 | Lead | ✅ |
| 0.6 | Sprint 1 kickoff + team onboarding doc | 0.5 | Lead | ✅ Issue #6 |

---

## Phase 1 — Data Layer + Auth Shell 🔄

> Goal: Prisma schema live in DB with migrations. Auth endpoints working. UI shell renders.
> **This is the gate phase — nothing from Phase 2 onwards can start without Prisma being merged.**

### 1A — Database Baseline ⚡ 🔄

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 1A.1 | Write Prisma schema — all MVP models (User, Event, Team, TeamMember, Registration, Payment, Credential, ScanLog) | Phase 0 | ansariowais669-hub | 🔄 Issue #2 |
| 1A.2 | Add all required indexes per `database.md` | 1A.1 | ansariowais669-hub | 🔄 |
| 1A.3 | `prisma migrate dev` — initial migration | 1A.2 | ansariowais669-hub | 🔒 after schema |
| 1A.4 | Seed script — admin user, sample events, sample team | 1A.3 | ansariowais669-hub | 🔒 after migration |
| 1A.5 | Wire real PrismaService into existing PrismaModule stub | 1A.1 | ansariowais669-hub | 🔒 after schema |
| 1A.6 | PR review + merge (Saad-Manda reviews, Lead approves) | 1A.1–1A.5 | Saad-Manda / Lead | 🔒 |

### 1B — Auth Module ⚡ 🔗 (depends on 1A merge)

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 1B.1 | `POST /auth/register` — hash password, create user, return access token | 1A merge | Lead | ⏳ |
| 1B.2 | `POST /auth/login` — validate credentials, issue JWT access token, set HttpOnly refresh cookie | 1B.1 | Lead | 🔒 |
| 1B.3 | `POST /auth/refresh` — rotate refresh token (invalidate old, issue new) | 1B.2 | Lead | 🔒 |
| 1B.4 | `DELETE /auth/logout` — revoke refresh token from DB/Redis | 1B.3 | Lead | 🔒 |
| 1B.5 | `GET /auth/me` — return current user from JWT | 1B.2 | Lead | 🔒 |
| 1B.6 | JwtStrategy + JwtAuthGuard (Passport) | 1B.1 | Lead | 🔒 |
| 1B.7 | RBAC guard + `@Roles()` decorator | 1B.6 | Lead | 🔒 |
| 1B.8 | Rate limiting on auth endpoints (Throttler) | 1B.1 | Lead | 🔒 |
| 1B.9 | Unit tests + e2e tests for all auth flows | 1B.1–1B.8 | Lead | 🔒 |

### 1C — UI Shell ⚡ (fully parallel with 1A and 1B)

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 1C.1 | Design tokens — colors, typography, spacing (Tailwind config) | Phase 0 | Anjney-Lawaniya | 🔄 Issue #3 |
| 1C.2 | Core layout — root layout, nav, footer components | 1C.1 | Anjney-Lawaniya | 🔄 |
| 1C.3 | Shared UI primitives — Button, Card, Badge, Input, Spinner, Modal | 1C.1 | jamanrao-beep | ⚡ parallel with 1C.2 |
| 1C.4 | Mobile-first responsive nav (hamburger menu, mobile breakpoints) | 1C.2 | Himanshi-05 | 🔒 |
| 1C.5 | Loading, empty, and error state components | 1C.1 | jamanrao-beep | ⚡ parallel with 1C.2 |
| 1C.6 | packages/ui export — publish shared components for apps/web consumption | 1C.3 | Anjney-Lawaniya | 🔒 |

---

## Phase 2 — Core Domain Modules 🔒

> Gate: Phase 1A (Prisma) and Phase 1B (Auth) must be merged.
> All of Phase 2 modules can be developed in parallel by different team members.

### 2A — Users Module ⚡

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 2A.1 | UsersService — findById, findByEmail, updateProfile | Phase 1 | Saad-Manda | 🔒 |
| 2A.2 | `GET /users/me` alias or extend `GET /auth/me` | 2A.1 | Saad-Manda | 🔒 |
| 2A.3 | `PATCH /users/me` — profile update DTO + validation | 2A.1 | Mahendra-seervi | 🔒 |
| 2A.4 | Admin: `GET /admin/users` — paginated list with role filter | 2A.1 | Mahendra-seervi | 🔒 |
| 2A.5 | Admin: `PATCH /admin/users/:id/role` — role assignment | 2A.1 | Lead (auth-sensitive) | 🔒 |

### 2B — Events Module ⚡

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 2B.1 | EventsService — CRUD, publish toggle | Phase 1 | ansariowais669-hub | 🔒 |
| 2B.2 | `GET /events` — list published events (paginated) | 2B.1 | ansariowais669-hub | 🔒 |
| 2B.3 | `GET /events/:slug` — event detail | 2B.1 | ansariowais669-hub | 🔒 |
| 2B.4 | `POST /events` — admin create event (with Roles guard) | 2B.1 | ansariowais669-hub | 🔒 |
| 2B.5 | `PATCH /events/:id` — admin update event | 2B.1 | ansariowais669-hub | 🔒 |
| 2B.6 | `PATCH /events/:id/publish` — publish/unpublish toggle | 2B.1 | ansariowais669-hub | 🔒 |
| 2B.7 | Event capacity guard (reject registration if at capacity) | 2B.1 | ansariowais669-hub | 🔒 |

### 2C — Teams Module ⚡

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 2C.1 | TeamsService — create, join, list members | Phase 1 | Mahendra-seervi | 🔒 |
| 2C.2 | `POST /teams` — create team (creator becomes CAPTAIN) | 2C.1 | Mahendra-seervi | 🔒 |
| 2C.3 | `POST /teams/:id/invitations` — generate invite code | 2C.1 | Mahendra-seervi | 🔒 |
| 2C.4 | `POST /teams/:id/join` — join by invite code | 2C.1 | Mahendra-seervi | 🔒 |
| 2C.5 | Team size enforcement (teamSizeMax) | 2C.1 | Mahendra-seervi | 🔒 |

### 2D — Frontend: Public Pages ⚡ (parallel with backend Phase 2)

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 2D.1 | Homepage — hero, fest branding, CTA | Phase 1C | Himanshi-05 | 🔒 |
| 2D.2 | Events listing page (`/events`) — server rendered, paginated | 2B.2 API ready | Himanshi-05 | 🔒 |
| 2D.3 | Event detail page (`/events/:slug`) — description, registration CTA | 2B.3 API ready | jamanrao-beep | 🔒 |
| 2D.4 | Login + Register pages with form validation | Phase 1B API ready | Anjney-Lawaniya | 🔒 |
| 2D.5 | Auth context — access token state, refresh on expiry, logout | 2D.4 | Anjney-Lawaniya | 🔒 |
| 2D.6 | TanStack Query setup — base fetcher with envelope unwrapping | Phase 1C | Anjney-Lawaniya | 🔒 |

---

## Phase 3 — Registration + Payments 🔒

> Gate: Phase 2 (Auth, Events, Teams) must be merged.
> Registration and Payments are tightly coupled — work on them together.

### 3A — Registration Module 🔗

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 3A.1 | RegistrationService — create, status transition, idempotency | Phase 2 | Lead / Saad-Manda | 🔒 |
| 3A.2 | `POST /registrations` — start registration (creates PENDING_PAYMENT record in transaction) | 3A.1 | Lead | 🔒 |
| 3A.3 | `GET /registrations/mine` — authenticated user's registrations | 3A.1 | Saad-Manda | 🔒 |
| 3A.4 | `GET /admin/registrations` — admin list with filter/sort/pagination | 3A.1 | Saad-Manda | 🔒 |
| 3A.5 | Duplicate registration guard (409 on `(eventId, teamId)` and `(eventId, userId)` conflicts) | 3A.1 | Lead | 🔒 |
| 3A.6 | Waitlist logic (when capacity is full) | 3A.1 | Saad-Manda | 🔒 |
| 3A.7 | Registration cancellation + status propagation | 3A.1 | Saad-Manda | 🔒 |

### 3B — Payments Module 🔗 (works alongside 3A)

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 3B.1 | Razorpay KYC — start institute bank account verification (2–4 week lead time) | Phase 0 (admin action) | Lead (coordinate with admin) | ⏳ **Start immediately** |
| 3B.2 | PaymentsService — create Razorpay order, record in DB | 3A.2 | Lead | 🔒 |
| 3B.3 | `POST /payments/orders` — create order, return orderId to client | 3B.2 | Lead | 🔒 |
| 3B.4 | `POST /payments/verify` — verify Razorpay signature, mark payment SUCCESS in transaction | 3B.3 | Lead | 🔒 |
| 3B.5 | `POST /webhooks/razorpay` — validate HMAC, enqueue reconciliation job (must return 200 fast) | 3B.4 | Lead | 🔒 |
| 3B.6 | BullMQ payment reconciliation worker — confirm/fail registration from webhook event | 3B.5 | Lead / Saad-Manda | 🔒 |
| 3B.7 | Idempotency key enforcement on all payment mutations | 3B.2 | Lead | 🔒 |
| 3B.8 | `POST /admin/payments/:id/reconcile` — manual reconciliation endpoint | 3B.6 | Saad-Manda | 🔒 |
| 3B.9 | Refund flow (Razorpay refund API + status update) | 3B.4 | Saad-Manda | 🔒 |

### 3C — Frontend: Registration + Payment Flow ⚡

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 3C.1 | Registration form — individual or team selection | 3A API ready | Anjney-Lawaniya | 🔒 |
| 3C.2 | Razorpay checkout integration (razorpay.js SDK) | 3B.3 API ready | Anjney-Lawaniya | 🔒 |
| 3C.3 | Post-payment success/failure screen | 3C.2 | jamanrao-beep | 🔒 |
| 3C.4 | My registrations page (`/dashboard/registrations`) | 3A.3 API ready | Himanshi-05 | 🔒 |
| 3C.5 | Team management page — create, invite, join | Phase 2 (Teams API) | Himanshi-05 | 🔒 |

---

## Phase 4 — Identity (QR) + Notifications 🔒

> Gate: Phase 3 (Registration + Payments confirmed) must be merged.
> QR and Notifications can be developed in parallel with each other.

### 4A — Identity / QR Module ⚡ 🔗

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 4A.1 | BullMQ QR generation worker — triggered after payment confirmed | Phase 3 | Lead | 🔒 |
| 4A.2 | QR credential generation — signed token (HMAC or JWT), upload PNG to R2/MinIO | 4A.1 | Lead | 🔒 |
| 4A.3 | `GET /identity/mine` — return QR credential URL + token | 4A.2 | Lead | 🔒 |
| 4A.4 | `GET /identity/validate/:token` — offline-safe token validation (no DB required) | 4A.2 | Lead | 🔒 |
| 4A.5 | `POST /identity/scan` — record scan event, return participant info | 4A.4 | Saad-Manda | 🔒 |
| 4A.6 | Duplicate scan detection (mark `DUPLICATE` in ScanLog) | 4A.5 | Saad-Manda | 🔒 |
| 4A.7 | Scanner PWA — camera access, QR decode, POST to `/identity/scan` | 4A.5 | Anjney-Lawaniya | 🔒 |
| 4A.8 | Offline-first scanner mode — cache credential signatures locally for poor-network fest days | 4A.7 | Anjney-Lawaniya | 🔒 |

### 4B — Notifications Module ⚡ (parallel with 4A)

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 4B.1 | Resend email integration — transactional email client setup | Phase 3 | Mahendra-seervi | 🔒 |
| 4B.2 | BullMQ email worker — consumes notification queue | 4B.1 | Mahendra-seervi | 🔒 |
| 4B.3 | Registration confirmation email (with QR ticket attached) | 4A.2, 4B.2 | Mahendra-seervi | 🔒 |
| 4B.4 | Payment failure email | 4B.2 | Mahendra-seervi | 🔒 |
| 4B.5 | Password reset email | 4B.2 | Mahendra-seervi | 🔒 |
| 4B.6 | Fest-day reminder email (bulk send, scheduled job) | 4B.2 | Mahendra-seervi | 🔒 |

### 4C — Frontend: QR + Profile ⚡

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 4C.1 | QR credential display page (`/dashboard/credential`) | 4A.3 API ready | jamanrao-beep | 🔒 |
| 4C.2 | Download QR / share QR ticket | 4C.1 | jamanrao-beep | 🔒 |

---

## Phase 5 — Fest-Day Operations 🔒

> Gate: Phase 4 (Identity + Notifications) merged.

### 5A — Schedule Module ⚡

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 5A.1 | Fixture schema — Match, Venue, Round models added to Prisma | Phase 4 | ansariowais669-hub | 🔒 |
| 5A.2 | `GET /schedule` — public fixture list by event/day | 5A.1 | ansariowais669-hub | 🔒 |
| 5A.3 | `POST /admin/schedule` — create/update fixtures | 5A.1 | ansariowais669-hub | 🔒 |
| 5A.4 | `PATCH /admin/schedule/:id/result` — record match result | 5A.1 | ansariowais669-hub | 🔒 |
| 5A.5 | Schedule page frontend (`/schedule`) — filterable by sport/venue/day | 5A.2 API ready | Himanshi-05 | 🔒 |

### 5B — Leaderboard Module ⚡ (parallel with 5A)

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 5B.1 | Leaderboard score aggregation logic | Phase 4 | Mahendra-seervi | 🔒 |
| 5B.2 | `GET /leaderboard` — overall standings | 5B.1 | Mahendra-seervi | 🔒 |
| 5B.3 | `GET /leaderboard/:eventId` — per-event standings | 5B.1 | Mahendra-seervi | 🔒 |
| 5B.4 | Redis cache for leaderboard (invalidate on score update) | 5B.1 | Mahendra-seervi | 🔒 |
| 5B.5 | Live leaderboard page frontend (`/leaderboard`) | 5B.2 API ready | jamanrao-beep | 🔒 |
| 5B.6 | Real-time score updates (SSE or polling fallback) | 5B.4 | Anjney-Lawaniya | 🔒 |

---

## Phase 6 — Campus Ambassador (CA) Program ⚡

> This phase is **largely parallel** from Phase 2 onwards. It does not depend on Payments or QR.
> Gate: Phase 1 (Auth) must be merged before CA registration starts.

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 6.1 | CA user role + profile extension (institute, year, social handles) | Phase 1B | Lead | 🔒 |
| 6.2 | UTM referral link generation (unique per CA, tracked in DB) | 6.1 | Lead | 🔒 |
| 6.3 | UTM attribution — link registration events to CA referral | 6.2, Phase 3A | Lead | 🔒 |
| 6.4 | Social media verification — YouTube subscriber count API | 6.1 | Saad-Manda | 🔒 |
| 6.5 | Social media verification — Twitter/X follower count API | 6.1 | Saad-Manda | 🔒 |
| 6.6 | Social media verification — Instagram follower count API | 6.1 | Saad-Manda | 🔒 |
| 6.7 | CA points/rewards engine (pending management decision on structure) | 6.3 | Lead | 🔒 **Pending spec** |
| 6.8 | CA dashboard frontend — referral stats, points, social verification status | 6.2–6.6 | Anjney-Lawaniya | 🔒 |
| 6.9 | CA registration landing page (public, with UTM-aware CTA) | 6.1 | Himanshi-05 | 🔒 |
| 6.10 | CA leaderboard — top referrers ranking | 6.7 | jamanrao-beep | 🔒 |

---

## Phase 7 — Admin Surface 🔒

> Gate: Phase 2 (Core modules). Can grow incrementally alongside Phase 3–5.

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 7.1 | Admin layout — separate from public layout, role-gated | Phase 2 | Anjney-Lawaniya | 🔒 |
| 7.2 | Admin: event management table (create/edit/publish) | 2B API ready | jamanrao-beep | 🔒 |
| 7.3 | Admin: registration management (list, filter, status override) | 3A API ready | Himanshi-05 | 🔒 |
| 7.4 | Admin: payment management (reconcile, refund trigger) | 3B API ready | Himanshi-05 | 🔒 |
| 7.5 | Admin: user management (list, role assignment) | 2A API ready | jamanrao-beep | 🔒 |
| 7.6 | Admin: scan log viewer (credential scan history) | 4A API ready | jamanrao-beep | 🔒 |
| 7.7 | Admin: fixture + result management | 5A API ready | jamanrao-beep | 🔒 |

---

## Phase 8 — Pre-Production Hardening 🔒

> Gate: All feature phases merged. Code freeze except critical fixes.

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 8.1 | End-to-end test suite — Playwright: register → pay → QR → scan flow | All features | Saad-Manda | 🔒 |
| 8.2 | Load test — simulate 50–100 concurrent users at registration deadline | 8.1 | Lead | 🔒 |
| 8.3 | Security review — OWASP top 10, auth tokens, webhook HMAC, SQL injection, XSS | All features | Lead | 🔒 |
| 8.4 | Rate limiting audit — all public and auth-adjacent endpoints | 8.3 | Lead | 🔒 |
| 8.5 | Dependency audit (`npm audit`) + update vulnerable packages | 8.3 | Saad-Manda | 🔒 |
| 8.6 | Environment variable audit — no secrets in repo, all required vars documented in `.env.example` | 8.3 | Lead | 🔒 |
| 8.7 | Database migration dry-run on production schema | 8.6 | Lead | 🔒 |
| 8.8 | Razorpay test mode → live mode switch + webhook URL update | 8.7 | Lead | 🔒 |
| 8.9 | Backup strategy — DigitalOcean snapshot schedule + pg_dump cron | 8.7 | Lead | 🔒 |
| 8.10 | Mobile QA pass — all public pages on real devices (iOS + Android) | 8.1 | Anjney-Lawaniya | 🔒 |
| 8.11 | Lighthouse audit — performance, accessibility, SEO on public pages | 8.10 | Himanshi-05 | 🔒 |
| 8.12 | Cross-browser check — Chrome, Safari, Firefox on public + scanner PWA | 8.10 | Himanshi-05 | 🔒 |

---

## Phase 9 — Production Deployment 🔒

> Gate: Phase 8 complete and signed off by Lead.

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 9.1 | Provision DigitalOcean 2 GB Droplet | Budget sanctioned | Lead | 🔒 |
| 9.2 | Configure Cloudflare DNS + SSL termination | 9.1, Domain acquired | Lead | 🔒 |
| 9.3 | Configure Cloudflare R2 bucket for QR/asset storage | 9.1 | Lead | 🔒 |
| 9.4 | Deploy API via Docker Compose on VPS | 9.1 | Lead | 🔒 |
| 9.5 | Run Prisma migrations on production DB | 9.4 | Lead | 🔒 |
| 9.6 | Run production seed (admin account only — no sample data) | 9.5 | Lead | 🔒 |
| 9.7 | Deploy Next.js web to Vercel + set production env vars | 9.2 | Anjney-Lawaniya | 🔒 |
| 9.8 | Smoke test production: health, login, event listing, payment sandbox | 9.6, 9.7 | Lead + Saad-Manda | 🔒 |
| 9.9 | Razorpay live mode activation + production webhook URL | 9.8 | Lead | 🔒 |
| 9.10 | Resend domain verification (DKIM/SPF for email deliverability) | 9.8 | Lead | 🔒 |
| 9.11 | Production monitoring setup (UptimeRobot or similar, free tier) | 9.8 | Lead | 🔒 |

---

## Phase 10 — Launch + Post-Fest 🔒

| # | Task | Dependency | Assignee | Status |
|---|------|-----------|---------|--------|
| 10.1 | Registration open announcement — CA program activation, UTM links distributed | Phase 9 live | Lead | 🔒 |
| 10.2 | Fest-day ops — volunteer scanner briefing + PWA distribution | 4A.7–4A.8 | Lead | 🔒 |
| 10.3 | Live score input — admin team enters results in real time | Phase 5 | Designated admin | 🔒 |
| 10.4 | Post-fest: export registration + payment data (CSV/report) | Phase 9 | Lead | 🔒 |
| 10.5 | Post-fest: DB backup + archive | Phase 9 | Lead | 🔒 |
| 10.6 | Post-fest: spin down VPS or reduce to smallest droplet | 10.5 | Lead | 🔒 |
| 10.7 | Post-mortem — document what worked, what broke, team retrospective | 10.6 | Lead | 🔒 |

---

## Critical Path (Sequential Backbone)

This is the dependency chain that gates the entire project. Nothing can compress this without parallel resource allocation.

```
Phase 0 (Foundation)
  → Phase 1A (Prisma schema + migrations)
    → Phase 1B (Auth module)
      → Phase 2 (Users, Events, Teams)
        → Phase 3A (Registration)
          → Phase 3B (Payments)
            → Phase 4A (QR Identity)
              → Phase 4B (Notifications)
                → Phase 8 (Hardening)
                  → Phase 9 (Production)
                    → Phase 10 (Launch)
```

## Parallel Work Streams

These workstreams run independently and should be staffed concurrently:

| Stream | Runs Parallel With | Owner |
|--------|-------------------|-------|
| Phase 1C — UI Shell | Phase 1A + 1B | Frontend team |
| Phase 2D — Public pages | Phase 2 backend | Frontend team |
| Phase 6 — CA Program | Phase 2 onwards | Lead + Saad-Manda |
| Phase 7 — Admin UI | Phase 2 onwards | Frontend team |
| Phase 5A — Schedule | Phase 5B — Leaderboard | Junior backend |
| Phase 4A — QR | Phase 4B — Notifications | Senior backend |

---

## External Dependencies (Start Early — Long Lead Times)

| Item | Lead Time | Action Owner | Urgency |
|------|-----------|-------------|---------|
| Razorpay KYC — institute bank account | 2–4 weeks | Lead (coordinate with finance) | **Start now** |
| Domain + DNS setup | 1–3 days (if independent domain) or 1–2 weeks (if institute subdomain) | Lead | Before Phase 9 |
| DigitalOcean budget sanction (₹20,000 total) | Depends on admin | Lead | Before Phase 9 |
| Facebook Developer account (Instagram API) | 1–2 weeks for app review | Saad-Manda | Before Phase 6.6 |
| Volunteer scanner device testing (real hardware) | Coordinate during fest | Lead | Before Phase 10.2 |

---

## Pending Management Decisions (Blockers Until Resolved)

| Decision | Impact | Who Decides |
|----------|--------|------------|
| CA points/rewards structure — what earns points, thresholds, redemption | Blocks Phase 6.7 (points engine) | Lead + management |
| Individual vs. team event pricing model — flat fee or per-person | Affects Registration and Payment flow design | Lead |
| Waitlist policy — auto-promote on cancellation or manual admin action | Affects Phase 3A.6 | Lead |
| Fest dates (registration open, fest day) — determines launch schedule | All Phase 9/10 sequencing | Management |

---

## Definition of Done (Per Task)

A task is complete when **all** of the following are true:
- Code is on a feature branch and a PR is open with `Closes #N`
- `npm run lint && npm run check-types && npm run build` passes locally
- Relevant tests written and passing
- PR reviewed by the designated reviewer
- PR approved and merged to `develop`
- Project board status updated to Done
- `.claude/reference/` docs updated if the task changes architecture, API shape, or schema
