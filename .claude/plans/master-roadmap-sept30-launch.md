# Master Execution Plan — Full Public Launch by September 30, 2026

**Written:** 2026-08-03. **Target:** full public launch (real registrations, real payments, QR check-in, live) by **2026-09-30**.
**Supersedes:** `.claude/reference/project-roadmap.md` (still on unmerged PR #17) for dates and sequencing. Phase numbering kept identical so the two docs stay cross-referenceable — merge PR #17 first, then apply this doc's dates/re-sequencing on top of it.

## Ground truth as of 2026-08-03 (verified against code, not docs)

| Phase | Status |
|---|---|
| 0 — Foundation | ✅ Done |
| 1A — Prisma schema (v2.2, 19 models) | ✅ Done |
| 1B — Auth | ✅ Done — register/login/refresh/logout/me, JwtAuthGuard, RolesGuard, ThrottlerGuard all present. More complete than the roadmap doc assumed. |
| 1C — UI shell/primitives | ✅ Done |
| Redis + BullMQ infra | ✅ Done, merged (PR #23) |
| 6 — CA Program (Phase C backend, Phase D frontend) | ❌ **0% code.** Was "locked" for July 20 launch with a fully hardened plan (`local-ca-program-launch.md`). No `feature/ca-backend` or `feature/ca-frontend` branch was ever created. **Two weeks overdue with zero output on a 5-day plan** — the biggest risk factor for this new plan is a repeat of this. |
| 2–5, 7 — Users/Events/Teams/Registration/Payments/QR/Notifications/Schedule/Leaderboard/Admin | ❌ 0% — no modules beyond auth/common/config/health/prisma/queue/redis exist in `apps/api/src` |
| 8/9/10 — Hardening/Deploy/Launch | ❌ Not started, no infra provisioned |
| PR #17 (master roadmap + budget doc) | Open, unmerged for ~4 weeks |
| External: Razorpay KYC, domain, budget sanction | Not started — pure ask-and-wait, zero dev cost, start Day 0 |

Team confirmed fully active: Minhaj (Lead), Saad-Manda (Sr. Backend), Mahendra-seervi + ansariowais669-hub (Jr. Backend), Anjney-Lawaniya (Sr. Frontend), jamanrao-beep + Himanshi-05 (Jr. Frontend/Design).

## Why this is tight, said plainly

8.5 weeks to build and ship everything from Phase 2 through Phase 10 — registration, payments, QR, notifications, schedule, leaderboard, admin, hardening, and deployment — starting from a program that just missed a 5-day CA Portal plan by two-plus weeks with no code at all. The schedule below has **no slack until the final 3-day buffer**. It only holds if:
1. CA Portal actually starts today, not "this week."
2. Nobody treats a written plan as done work — a `.claude/plans/*.md` file with no branch behind it is exactly what happened in July.
3. Razorpay/domain/budget asks go out today — their lead time is calendar time we cannot buy back later.

If week 1 or 2 slips the way the CA plan did, this whole date moves. Flag it early, don't discover it in week 7.

## Day 0 actions (2026-08-03, before anything else)

- [ ] Minhaj: send the Razorpay KYC request, domain request (institute subdomain or purchase), and budget sanction ask to their respective owners **today** — zero dev cost, pure lead-time risk if delayed.
- [ ] Minhaj: get the participating-college list from the outreach team (blocks CA Phase C Step 3).
- [ ] Merge PR #17 (roadmap/budget docs) — docs-only, no code risk, unblocks this doc superseding it cleanly. *(Ask before merging — shared PR state.)*
- [ ] Create `feature/ca-backend` branch off fresh `develop`. This is the literal first line of code.

## Week-by-week plan

### W1 — Aug 3–9: CA Portal catch-up + Core Domain kickoff (parallel)
CA Portal was supposed to be done in July; it runs now, in parallel with Phase 2 starting immediately (not gated behind CA finishing, per the original roadmap's parallel-stream design).

- **Minhaj:** CA backend Phase C Steps 1–5 (schema migration, onboarding w/ fixed college list, deduped+durable click tracking, waitlist capture, `recordConversion` stub). Full spec: `.claude/plans/local-ca-program-launch.md`.
- **Saad-Manda:** Phase 2A Users module (`findById`/`findByEmail`/`updateProfile`, `GET/PATCH /users/me`, admin user list + role assignment).
- **Mahendra-seervi:** Phase 2B Events module (CRUD, publish toggle, capacity guard).
- **ansariowais669-hub:** Phase 2C Teams module (create, invite code, join, size enforcement).
- **Anjney-Lawaniya:** CA frontend Phase D Steps 1–4 (`lib/api.ts`, referral middleware, `/login`, `/signup`, `/register` waitlist page) — contract is already locked in the CA plan doc, no need to wait on backend completion. Also: TanStack Query setup + auth context (roadmap 2D.5/2D.6), shared infra everything else needs.
- **jamanrao-beep / Himanshi-05:** Homepage, events listing/detail pages as Events API lands mid-week; continue wiring the disconnected CA components from closed PR #22 into place.

### W2 — Aug 10–16: CA Portal ships + Registration scaffolding starts
- **Minhaj:** CA backend Phase C Steps 6–10 (Brand/CaTask CRUD, task submission w/ signed-URL uploads, admin verification w/ compare-and-swap, leaderboard, Sentry). **Gate: Saad-Manda reviews Step 8 (points-award + file-upload) before merge** — widest attack surface, per the CA plan's own review requirement.
- **Anjney-Lawaniya + team:** CA frontend Phase D Steps 5–11 (dashboard wiring, task list/submission UI, public leaderboard ISR, minimal admin UI, Sentry, mobile QA at 375px). **CA Portal actually goes live this week** — three weeks late against the original ask, but live, hardened, and real.
- **Saad-Manda + juniors:** finish Users/Events/Teams; start Phase 3A Registration service scaffolding (create, status transition, idempotency, duplicate guard).
- **Frontend juniors:** finish public pages, team management UI (create/invite/join).

### W3 — Aug 17–23: Registration + Payments backend
- **Minhaj:** PaymentsService — Razorpay order creation, `POST /payments/orders`, `POST /payments/verify` (signature check, transactional success), `POST /webhooks/razorpay` (HMAC validation, fast 200, enqueue reconciliation).
- **Saad-Manda:** finish RegistrationService — waitlist logic, cancellation + status propagation, `GET /admin/registrations`.
- **Backend juniors:** `GET /registrations/mine`, idempotency key enforcement on payment mutations, supporting DTOs/tests.
- **Frontend:** registration form (individual/team selection), start Razorpay checkout SDK integration.

### W4 — Aug 24–30: Finish Payments + start QR/Notifications
- **Minhaj:** BullMQ payment reconciliation worker, refund flow, `POST /admin/payments/:id/reconcile`. Then start QR: BullMQ QR generation worker (triggered on payment confirmed), signed credential (HMAC/JWT) + PNG upload to R2, `GET /identity/mine`, `GET /identity/validate/:token` (offline-safe).
- **Saad-Manda:** `POST /identity/scan`, duplicate scan detection (`ScanLog.DUPLICATE`).
- **Mahendra-seervi:** Notifications — Resend integration, BullMQ email worker, registration confirmation email (QR attached).
- **ansariowais669-hub:** payment failure email, password reset email templates.
- **Frontend:** payment success/failure screens, `/dashboard/registrations` page, start scanner PWA shell (camera access, QR decode).

### W5 — Aug 31–Sep 6: Finish QR/Notifications + start Schedule/Leaderboard + Admin surface
- **Minhaj/Anjney-Lawaniya:** finish scanner PWA (offline-first credential cache for poor fest-day network), QR credential display + download page.
- **Mahendra-seervi:** fest-day reminder email (bulk, scheduled job) — last notification item.
- **ansariowais669-hub:** Schedule module — `Match`/`Venue`/`Round` Prisma models + migration, `GET /schedule`, admin fixture CRUD, `PATCH .../result`.
- **Saad-Manda:** Leaderboard module — score aggregation, Redis cache w/ invalidation, `GET /leaderboard`, `GET /leaderboard/:eventId`.
- **jamanrao-beep/Himanshi-05:** Admin surface kickoff — layout (role-gated), event management table, registration management, payment management (APIs are ready by now).

### W6 — Sep 7–13: Finish Schedule/Leaderboard/Admin + buffer
- Finish schedule + live leaderboard frontend pages, real-time score updates (SSE/polling), admin scan-log viewer, fixture/result management UI, remaining admin user-management screen.
- Explicit buffer slot for anything that slipped from W1–5 — treat this week as the "catch the CA-style slip before it compounds" checkpoint, not extra scope.
- CA fast-follow items (rate limiting on onboard/submit, suspension toggle, audit log) only if genuinely idle — these are explicitly deferred in the CA plan, don't let them displace Phase 8.

### W7 — Sep 14–20: Pre-production hardening
- E2E suite (Playwright): register → pay → QR → scan, full loop.
- Load test: 50–100 concurrent users at simulated registration deadline.
- Security review: OWASP top 10, auth tokens, webhook HMAC, injection/XSS surfaces.
- Rate limiting audit across every public + auth-adjacent endpoint.
- `npm audit` + dependency updates.
- Env var audit (no secrets in repo, `.env.example` complete), migration dry-run against a prod-shaped DB.
- Razorpay test→live switch prepared (not flipped yet).
- Mobile QA (real devices), Lighthouse pass, cross-browser check.

### W8 — Sep 21–27: Production deployment
- Provision VPS (DigitalOcean 2GB droplet per `deployment-requirements.md`), Cloudflare DNS/SSL, R2 bucket.
- Deploy API via Docker Compose, run Prisma migrations, prod seed (admin account only, no sample data).
- Deploy web to Vercel with production env vars.
- Full smoke test on production: health, login, event listing, payment sandbox.
- Razorpay live-mode activation + production webhook URL.
- Resend domain verification (DKIM/SPF).
- UptimeRobot monitoring on `/health`.

### Sep 28–30: Buffer + Launch
- Final smoke tests, fix anything broken.
- Registration-open announcement, CA/UTM link distribution activated.
- Volunteer scanner briefing + PWA distribution.

## Standing rules (unchanged from CONSTITUTION.md, restated because July broke them)

- A plan file is not progress. A branch with a commit is. Every phase above becomes a GitHub issue with an owner **before** work starts, tracked on the Infinito Atlas board, moved to In Progress the day work actually begins — not the day it's assigned.
- Weekly checkpoint every Monday: did last week's owners actually open the branches/PRs listed? If not, surface it immediately, don't wait for the next weekly.
- Phase C (points/file-upload) and any payments/QR/auth code: no self-review-only merges — matches CONSTITUTION.md's two-approval rule for these areas.
- `.claude/reference/api.md` / `architecture.md` / `database.md` updated in the same PR as any contract/schema change — not batched later.

## Risks carried forward, undiluted

- **Recurrence risk:** the single largest threat to Sept 30 is a repeat of the CA Portal's July slip — a hardened plan existing on disk is not the same as work happening. This plan assigns Day 0 actions specifically to break that pattern immediately.
- **Razorpay KYC (2–4 week lead time):** started Day 0 per this plan, lands comfortably before the W8 live-mode flip *only if actually sent today*.
- **No slack before W8:** any single-week slip compounds directly into the launch date; the W6 buffer is the only cushion in the entire plan.
- **Structural CA gap (from the CA plan, still true):** `recordConversion()` stays unwired until the Registration module (W3–4) exists — this plan's sequencing finally closes that gap, unlike the original CA-only plan which couldn't.
