> **Superseded 2026-08-31** by three standalone files, split out for independent work: [readiness-phase-1-backend-infra.md](readiness-phase-1-backend-infra.md), [readiness-phase-2-frontend-ui-ux.md](readiness-phase-2-frontend-ui-ux.md), [readiness-phase-3-event-operations.md](readiness-phase-3-event-operations.md). Kept here for history only; work from the phase files, not this one. See [README.md](README.md) for the full index.

# Production Readiness Audit — Full-System Pass

**Written:** 2026-08-31. **Scope:** everything between "the sprint's feature loop works" and "this is safe to put in front of real users and real money," across the whole system — not just the code-level fixes already logged in `pre-deployment-hardening.md`.

**Relationship to existing docs:** `master-roadmap-sept30-launch.md` scoped one sprint's feature build (Events/Teams/Registration/Payments/QR). `pre-deployment-hardening.md` scoped a follow-up code-correctness pass on that sprint's output. Neither looked at deployment infrastructure, session durability, observability, legal/compliance, or event-day operations — this pass does. It also re-verified the prior doc's P0 list live, in code, this session: **none of its three P0 items have landed yet.** Treat this document as additive, not a replacement.

---

## 0. Status check on the existing P0 list — still open

Verified directly against current code, not assumed from the prior doc:

- `apps/api/src/app.module.ts:24,50-51` still registers `AllExceptionsFilter` as `APP_FILTER`, and `apps/api/src/common/common.module.ts:3,8` still separately registers `GlobalExceptionFilter` the same way. Both filters still exist on disk. Unresolved.
- `ThrottlerGuard` is still only applied via `@UseGuards(ThrottlerGuard)` on `auth.controller.ts:27`. No `APP_GUARD` provider exists anywhere. `POST /registrations`, `POST /payments`, `GET /events`, `GET /identity/validate/:token`, `POST /identity/scan` are still unrate-limited. Unresolved.
- No `apps/api/src/registrations/admin-registrations.controller.ts` and no `apps/web/app/admin/registrations/` directory exist. Confirmed: `apps/web/app/admin/` only has `ca-applications`, `ca-tasks`, `payments`, `scans`. Unresolved.

These three block deployment on their own terms already — nothing below changes that. They're restated here only so this document is a complete picture, not because they've changed.

---

## 1. Blocks real users being on this system

### 1.1 Refresh-token sessions do not survive a restart — and cannot scale past one process

`apps/api/src/auth/in-memory-refresh-token-store.ts` holds every user's refresh token in a plain in-process `Map`. The file's own comment says it plainly: *"in-memory refresh store, single-instance only... sessions don't survive a restart."* Every deploy, crash, or `pm2 reload` force-logs-out every signed-in user, and the API can never run as more than one instance (no load balancing, no zero-downtime deploys) without breaking auth for whichever instance didn't handle a given user's login.

This is worse than a normal launch-week nit because deploys are exactly what P0 fixes above require — landing them means restarting the API, which means every already-registered participant gets logged out the moment the fix ships.

**Fix:** implement `RedisRefreshTokenStore` against the existing `RefreshTokenStore` interface (`apps/api/src/auth/refresh-token-store.interface.ts`) and swap it in `auth.module.ts`. Redis is already a running dependency (BullMQ) — this is a small, self-contained change, not new infrastructure.

### 1.2 No production deployment target exists yet

- No `Dockerfile` anywhere in the repo (checked for `Dockerfile*` at every path).
- `docker-compose.yml` defines only dev Postgres + Redis — no app containers, no prod compose file, no build step for the API image.
- `.github/workflows/ci.yml` runs lint/typecheck/build/test only. There is no deploy job, no CD pipeline, no environment-specific build.
- `.claude/reference/deployment-requirements.md` is a budget-sanction document from June (institute administration audience, ₹12,000 ask) describing a *recommended* stack — DigitalOcean VPS, Vercel, Cloudflare, Cloudinary, Resend. Nothing in the repo indicates any of it is actually provisioned: no `Dockerfile`, no CD workflow, no domain decision recorded, no Cloudflare/Vercel config checked in.
- That doc is also now stale in one concrete way: it still names **Razorpay** as the payment gateway and budgets its KYC lead time, while the current, shipped implementation is manual UPI-screenshot verification with Razorpay explicitly and permanently cut from scope per `master-roadmap-sept30-launch.md`. Anyone reading it cold (e.g., the administration it was written for) would be told the wrong payment model.

**Net effect:** "deploy to production" is not a checklist item against existing infra — it is a from-scratch project (write a Dockerfile, decide the domain, provision the VPS/Vercel/Cloudflare, wire a CD job, point DNS) that has not been started. Given the roadmap already pushed deployment to "best-effort stretch," this is the actual reason it never happened — there's no path to it yet, not just no time.

### 1.3 No graceful shutdown, and background workers share the API process

`apps/api/src/main.ts` never calls `app.enableShutdownHooks()`. `apps/api/src/queue/queue.module.ts` registers BullMQ processors (`ReferralFlushProcessor`, `LeaderboardProcessor`, `CredentialIssueProcessor`) in the same Nest application as the HTTP API. Without shutdown hooks, a `SIGTERM` (every deploy, every container restart, every `docker compose down`) kills in-flight jobs mid-execution with no clean drain — including QR credential generation and payment-confirmation processing, the two jobs most likely to be mid-flight during a registration/payment rush.

**Fix:** add `app.enableShutdownHooks()` in `main.ts`; confirm BullMQ's default job-lock/stall behavior will safely retry a job killed mid-processing rather than silently dropping it.

---

## 2. Needed at or before public launch — not started

### 2.1 Zero email delivery — no confirmations, no QR delivery, no password reset

No `notifications`, `email`, or `mail` module exists anywhere in `apps/api/src` (confirmed by search). Resend is named in the budget doc but never integrated. Concretely, right now:
- A registrant who pays gets no confirmation email — status is dashboard-only.
- Nobody receives their QR credential by email — they must return to the dashboard to find it.
- **There is no password-reset flow at all** — no `forgot-password` endpoint, no reset-token model, no page on the frontend (confirmed by search across both `apps/api/src` and `apps/web/app`). A user who forgets their password today has no self-service recovery path.

The roadmap's cut of "email notifications" was a deliberate, stated sprint-scope decision for the registration/QR flow — that part is fine to leave dashboard-only if the team still agrees under real launch pressure. But password reset was never called out as cut; it appears to simply not exist. That needs an explicit decision (build it, or define the admin-assisted manual-reset support process instead) rather than being discovered by a user locked out during registration week.

### 2.2 No observability — the team has no way to know the system is unhealthy except users telling them

- No error-tracking integration (Sentry or equivalent) — unhandled exceptions in production are visible only in whatever console output the host happens to retain.
- No log aggregation/shipping — NestJS's default console `Logger` is the only logging in place. `apps/api/src/common/middleware/request-id.middleware.ts` at least stamps a request ID (good primitive to build on), but nothing collects or ships logs anywhere durable.
- No uptime monitoring or alerting on the `GET /health` endpoint that already exists (`apps/api/src/health/health.controller.ts` — checks DB + Redis, which is a solid basis to alert on).
- No metrics/dashboards for request volume, error rate, or queue depth.

At the traffic pattern this system is built for — registration-deadline spikes, fest-day check-in bursts — this is exactly when something will go wrong, and right now the team's detection mechanism is students complaining.

**Minimal fix:** wire the existing `/health` endpoint into a free uptime pinger (UptimeRobot/Cronitor/etc.) and add a free-tier Sentry (or similar) SDK to the API's `main.ts` — both are hours of work, not a project.

### 2.3 Dependency vulnerabilities — still open, reverified live this session

Ran `npm audit` against `apps/web` directly this session: **6 vulnerabilities (5 high, 1 moderate)** — Next.js/postcss/sharp chain (SSRF, XSS, path traversal, libvips CVEs) and a moderate `valibot` issue. This is the same finding `pre-deployment-hardening.md` P1 already logged; it is confirmed still unfixed, not a new discovery. Restated here because "still open" matters for a document about what blocks deployment specifically.

### 2.4 No security headers on the API

`apps/api/src/main.ts` sets up CORS and a validation pipe but nothing else — no `helmet` (or equivalent), so there's no CSP, no HSTS, no `X-Frame-Options`/`X-Content-Type-Options`. Low effort, standard practice, currently absent entirely (confirmed: no `helmet` import anywhere in `apps/api`).

### 2.5 Legal/compliance surface is one page short of what the flow actually does

`apps/web/app/privacy-policy` exists; there is no Terms & Conditions / registration-terms page and no stated refund or cancellation policy (confirmed: no `term*`-named route anywhere under `apps/web/app`). This matters concretely here because real money changes hands (UPI transfer + screenshot proof, admin-verified) — there is currently no public, written answer to "what happens if my payment is rejected" or "can I cancel/get a refund," which is normal to need for a paid event registration flow and is currently missing entirely, not just thin.

### 2.6 Backup/disaster-recovery is aspirational, not implemented

The budget doc mentions DigitalOcean's weekly snapshot add-on, but there is no server to snapshot yet (see §1.2), and separately from hosting choice, there is no documented or tested Postgres backup/restore procedure (dump schedule, retention window, an actual restore drill) anywhere in the repo. "We'll get snapshots from the host" is not the same as "we have verified we can restore this database."

---

## 3. Event-day operational readiness — the roadmap never modeled this at all

This category is entirely absent from both prior documents, which focused on code. A fest is a live, in-person event with a hard deadline and no do-over — these are process gaps, not code gaps, but they block "production" in the sense that matters (the event running smoothly), just as much as a missing endpoint would.

- **No runbook for scan failures at the gate.** `POST /identity/scan` exists and duplicate-scan detection is built, but the roadmap explicitly cut the "offline-first, camera UX" volunteer scanner PWA. Nobody has written down what a volunteer does when their phone has no signal at the venue, or how an admin performs a manual override check-in when the scan endpoint is unreachable. This is a same-day-of-event failure mode, not a hypothetical.
- **No on-call/incident plan.** If the API goes down during a registration deadline or during fest-day check-in, there's no documented who-gets-paged, no rollback procedure, no status-page or holding message for users.
- **The issue tracker isn't tracking any of this.** `gh issue list` currently shows exactly 2 open issues: #24 (already shipped, and already flagged in `pre-deployment-hardening.md` §6 as needing to be closed) and #6 (a stale sprint-kickoff/onboarding doc issue from June). None of the P0/P1 items in the existing hardening doc, and none of the findings in this document, have a tracked issue — meaning none of this is currently assigned to anyone or visible on the project board the team otherwise uses.
- **Domain is still undecided.** `deployment-requirements.md` frames institute-subdomain vs. a purchased `.in` domain as an open choice. This isn't just a hosting detail — it blocks finalizing CORS origins, Cloudflare setup, and (once §2.1's email gap is addressed) sender-domain verification (SPF/DKIM), all of which need a settled domain first.
- **Load testing has never been attempted**, cut explicitly in both prior docs. Given the budget doc's own estimate (50–100 peak concurrent users), this is likely fine to keep deferred — but it should get one real smoke run at realistic concurrency once §0's rate-limiting fix lands, since the default throttler limits were chosen, not measured.

---

## 4. Confirmed healthy — no action needed (re-verified this session, not just carried over)

- `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) and scoped CORS (explicit origin + `credentials: true`) are both correctly in place in `main.ts`.
- Environment variables are validated at boot via a Zod schema (`apps/api/src/config/env.schema.ts`) — the app fails fast on missing/short secrets rather than silently running with bad config. This is good practice already in place.
- `GET /health` checks both Postgres and Redis and returns a degraded/ok status — a solid foundation for uptime monitoring once wired up (see §2.2).
- Object storage (`apps/api/src/uploads/uploads.service.ts`) uses Cloudinary with authenticated, time-limited signed URLs — matches the budget doc's recommended stack; no mismatch here despite `master-roadmap-sept30-launch.md`'s ground-truth table describing an older S3/R2 presigned-URL design (that was superseded during the sprint, not a live inconsistency).
- Request-ID middleware exists and is wired globally — a real observability primitive already in place, just not yet connected to anything downstream.
- `npm audit` on `apps/api` is clean (all 6 open vulnerabilities are in `apps/web`'s tree only).

---

## Phase 2 — Frontend UI/UX

**Written:** 2026-08-31, same session, on request — expanded past the design/theme angle to a full route-by-route pass, since the frontend's problems turned out to be as much about wiring and content as about visuals. **Status:** audit only — the actual redesign work is deliberately not scoped or started here. Visual direction (theme, palette, typography) will be provided separately when this phase is picked up; what follows is the current-state audit needed to scope that work, verified live against the running dev server this session (screenshots taken, every route in the app read, not just the handful that surfaced first).

### Critical — broken today, independent of any future theme

1. **Tailwind utility classes are used throughout the app, but Tailwind is not installed.** `apps/web/package.json` has no `tailwindcss` dependency, no PostCSS config, no Tailwind config file anywhere. Yet Tailwind classNames (`text-3xl`, `bg-card`, `text-muted-foreground`, `md:grid-cols-2`, `bg-white/5`, etc.) appear across roughly a third of the app's pages and components — including the shared `EmptyState`, `ErrorState`, `NotFound`, `PageSpinner`, and `SectionSpinner` components, which are exactly the "no page should ever show a blank white screen" safety-net primitives `issue-loading-empty-error-states.md` scoped. None of these classes compile to real CSS; every element using them renders with zero applied styling. **Verified live this session**: started the dev server and screenshotted the homepage (`/`) — headings render in default browser styling, the `text-blue-600` accent span renders plain black, spacing/layout classes have no effect. This directly violates the project's own stated rule (`issue-ui-primitives.md`: *"CSS Modules is the styling approach. No Tailwind."*) and is an engineering bug, not a design gap — re-skinning broken markup during the design phase won't fix broken markup underneath it. It isn't uniform, though — see the route inventory below for exactly which pages are affected and which aren't. Recommend rewriting the affected files to CSS Modules (consistent with the rest of the app and the stated rule) as a prerequisite to any theming work, rather than retrofitting Tailwind into the toolchain this late.

2. **The homepage's primary CTA and the public `/register` route lead to a stale waitlist form, not the real registration flow.** Screenshotted `/register`: it collects name/email/phone/college and submits to "Join the Waitlist," with copy reading *"No payment is required today"* — this is the pre-sprint leads-capture form. The actual registration + payment flow that shipped this sprint lives at `/dashboard/events/[slug]/register`, reachable only after logging in and picking a specific event. A first-time visitor following the homepage's own "Register Now" button today cannot reach the real flow at all.

3. **Public marketing pages are static placeholders disconnected from real data.** `/events`, `/sports`, `/about`, and `/upcoming` (all four read directly; `/events` and `/sports` also screenshotted) render hardcoded "check back soon" copy — `/upcoming` literally titles itself *"Under Development"* with a robot icon, a dev placeholder shipped on a public route — despite the Events module being fully built and already serving real data to the dashboard via `GET /events`. A visitor can't browse a single event without creating an account first.

4. **The frontend's own default API URL points at the wrong port.** Both `apps/web/lib/api.ts` (every single API call the app makes goes through this file) and `app/leaderboard/page.tsx` fall back to `http://localhost:5000/api` when `NEXT_PUBLIC_API_URL` isn't set — but the API's own default port, per `apps/api/.env.example` and `main.ts`, is **3000**. `NEXT_PUBLIC_API_URL` isn't documented in any `.env.example` in the repo (root or `apps/web`) either. Out of the box, with no undocumented env var set, the frontend cannot reach the backend at all.

### High — content and functionality gaps

5. **`/privacy-policy` ships committed Lorem Ipsum as its actual legal text** (`privacy-policy/page.tsx:17`). A live legal page with placeholder Latin filler — a content problem, not a styling one.
6. **Several dashboard routes are non-functional stubs:** `dashboard/settings` renders entirely hardcoded fake profile data (*"Campus Ambassador" / "ca@college.edu" / "AMU Aligarh"*) instead of the logged-in user's own data; `dashboard/teams` and `dashboard/analytics` are permanent empty-states with no data fetching wired up at all, despite the Teams module existing on the backend.
7. **The CA dashboard's leaderboard silently substitutes fabricated data on any API hiccup.** `components/ca/LeaderboardWidget.tsx` fetches `/leaderboard/ca`, but on any fetch error *or* an unexpected response shape, it falls back to a hardcoded `MOCK_DATA` array of five invented names ("Aditi Sharma," "Rohan Mehta"...) with no visual indication the data isn't real — a real CA could see fabricated rankings and not know it. Comment in the source even says *"Temporary local fixture... replace with API data once backend integration is complete"* — the backend integration is in fact complete (confirmed live in the backend audit), the fallback was just never removed.
8. **`packages/ui` was never built out.** `issue-ui-primitives.md` scoped replacing its Turborepo-boilerplate `Button`/`Card` (the one that calls `alert()` and links to Turborepo's docs) with real versions — that never happened, and `packages/ui` has zero imports anywhere in `apps/web` today. The real, good primitives live only in `apps/web/components/ui/`, so the package is dead weight.
9. **Unused font assets.** `apps/web/app/fonts/GeistVF.woff` and `GeistMonoVF.woff` are checked in but never loaded — no `next/font` usage anywhere, no `@font-face` in `globals.css`. The app actually renders in the `Arial, Helvetica, sans-serif` fallback stack today. Clean up once real typography is chosen.

### Medium — polish, worth tracking but not urgent

10. Design tokens in `globals.css` are a deliberate, known placeholder — 11 CSS variables, generic zinc-grey hex values, explicitly no dark palette (`issue-ui-primitives.md` scoped dark mode out: *"tokens don't have dark palette yet"*). Expected to be replaced wholesale once real theme direction arrives; flagging only so the token surface (the six primitives' variant classes) is understood as the integration point, not something to rebuild from scratch.
11. No favicon and no Open Graph / social-share metadata anywhere — `layout.tsx`'s `metadata` export has only `title` and `description`. Matters for a fest whose links will circulate over WhatsApp and Instagram.
12. No `app/not-found.tsx` route. The in-page `NotFound` component exists and is used inside `dashboard/events/[slug]`, but wiring Next's actual 404 route was explicitly deferred in `issue-loading-empty-error-states.md` and never picked back up — a visitor hitting a bad URL sees Next's bare default 404 today.
13. **Mobile responsiveness is thin and mostly untested.** Only `layout.module.css` (the shared nav/footer shell) has meaningful breakpoint coverage (5 `@media` rules) — every other `.module.css` file in the app has 0 or 1. The only pages confirmed mobile-QA'd are `dashboard/credential` and `admin/scans`, per the most recent commit on this branch. Every admin table, every other dashboard page, and all public pages haven't had a deliberate mobile pass yet.

### Confirmed healthy — real craft already in place

- The `apps/web/components/ui/` primitives that do carry a `.module.css` — Button, Card, Badge, Input, Modal, Spinner — are well-built: typed props, token-driven, matching their original spec, and confirmed rendering correctly live (the register form and its Button render properly styled in the screenshot taken this session).
- Image accessibility is actually solid: all 3 `<img>`/`<Image>` usages in the entire app have a matching `alt` attribute — full coverage, not a gap.
- The real registration form (`/dashboard/events/[slug]/register`) and its component family (`CustomFieldRenderer`, `SubOptionPicker`, `AccommodationSection`, `UpiPaymentSection`) are genuinely mature — CSS-Modules-based throughout, and the subject of the most recent dedicated mobile QA pass. This is the strongest part of the current frontend.
- The public `/leaderboard` page (distinct from the CA dashboard widget above) is a genuinely well-engineered Server Component: ISR with a 15-minute revalidate window specifically to survive traffic spikes, a graceful empty-array fallback if the API is unreachable at build time, and clean CSS Modules throughout — no Tailwind pollution.
- `/dashboard` itself (the post-login landing route) is a clean, correctly-wired role dispatcher — routes admins to `/admin`, CAs to `/dashboard/ca`, everyone else to `/dashboard/events`, with a proper loading state and a fallback to `/login` on an invalid session.

### Route inventory

Every route under `apps/web/app` read directly this session. **Wired** means it fetches and renders real data from the API; **Tailwind-broken** means the page is functionally real but visually renders unstyled per finding 1 above.

| Route | Status | Notes |
|---|---|---|
| `/` | 🎨 Tailwind-broken | Also links to the wrong `/register` (finding 2) |
| `/about` | 🧱 Stub | Inline `style={{}}`, static "stay tuned" copy |
| `/events` | 🧱 Stub | Disconnected from the real Events API |
| `/sports` | 🧱 Stub | Same placeholder pattern |
| `/upcoming` | 🧱 Stub | Literally titled "Under Development" |
| `/leaderboard` | ✅ Wired | Best-engineered public page — ISR, graceful degrade |
| `/login` | ✅ Wired | Clean, no Tailwind pollution |
| `/signup` | ✅ Wired | Clean, no Tailwind pollution |
| `/register` | ⚠️ Wrong content | Functions, but is the pre-sprint waitlist form, not registration |
| `/privacy-policy` | ⚠️ Placeholder content | Page works; body text is Lorem Ipsum |
| `/dashboard` | ✅ Wired | Role-based dispatcher, clean |
| `/dashboard/events` | ✅ Wired | Clean |
| `/dashboard/events/[slug]` | ✅ Wired | Clean |
| `/dashboard/events/[slug]/register` | ✅ Wired | Most mature page in the app (687 lines) |
| `/dashboard/credential` | ✅ Wired | Clean, mobile-QA'd |
| `/dashboard/teams` | 🧱 Stub | No data fetching at all; Tailwind-broken |
| `/dashboard/analytics` | 🧱 Stub | No data fetching at all; Tailwind-broken |
| `/dashboard/settings` | 🧱 Stub | Hardcoded fake profile data; Tailwind-broken |
| `/dashboard/ca` | 🎨 Tailwind-broken | Functionally real (referral share/copy, real API); leaderboard section can silently show fabricated data (finding 7) |
| `/dashboard/ca/apply` | 🎨 Tailwind-broken | Wired to the API, but styled with dark-mode-only classes (`bg-white/5`) inconsistent with the rest of the light-only app |
| `/dashboard/ca/onboard` | ✅ Wired | Clean |
| `/dashboard/ca/tasks` | ✅ Wired | Clean, one stray Tailwind line |
| `/admin/ca-applications` | ✅ Wired | Minor Tailwind pollution on loading/empty text only |
| `/admin/ca-tasks` | ✅ Wired | Minor Tailwind pollution on loading/empty text only |
| `/admin/ca-tasks/[id]/assignments` | ✅ Wired | Minor Tailwind pollution on loading/empty text only |
| `/admin/payments` | ✅ Wired | Minor Tailwind pollution on loading/empty text only |
| `/admin/scans` | ✅ Wired | Clean, mobile-QA'd |
| `/admin/registrations` | ❌ Missing | Already tracked as a P0 in §0 |
| `/admin/events`, `/admin/teams` | ❌ Missing | No admin frontend for either module despite both existing on the backend |

### Note for when this phase is picked up

Fix findings 1–4 (the Tailwind-without-Tailwind bug, the stale waitlist CTA, the disconnected marketing pages, the wrong default API port) before applying any new visual theme — they're functional breakages that a re-skin would paper over, not fix. The token-driven primitives in `components/ui/` are the right integration point for the new theme once it arrives; nothing about them needs to be rebuilt, only re-valued. The route inventory above is the punch list for what still needs real wiring regardless of theme — six routes (`about`, `events`, `sports`, `upcoming`, `dashboard/teams`, `dashboard/analytics`) have no data behind them at all yet.

---

## Suggested order of work

1. Land the existing `pre-deployment-hardening.md` P0s first — they're small, already scoped, and still unblocked by anything here.
2. §1.1 (Redis-backed refresh tokens) and §1.3 (graceful shutdown) next — both are small, self-contained, and specifically protect the deploys that steps 1 and 3 require.
3. Pick a domain and stand up the actual deployment target (§1.2) — everything in §2 (email sender domain, CORS finalization, observability endpoints) is blocked behind this decision existing.
4. §2.2 (observability) and §2.4 (security headers) are both hours-scale wins — do them opportunistically rather than waiting for a dedicated "hardening week."
5. §2.1's password-reset gap needs an explicit decision now, not a fix necessarily — decide build-vs-defer-with-a-documented-manual-process before registration volume makes it a support fire.
6. §3's operational items (runbook, on-call, issue tracking) cost nothing but a working session to write down — do this well before the event, not the week of.
7. Phase 2 (Frontend UI/UX) starts with its own four critical items — the Tailwind-without-Tailwind fix, the two disconnected-flow bugs, and the wrong default API port — independent of and before the visual theme/design direction, which will be provided separately when this phase begins.
