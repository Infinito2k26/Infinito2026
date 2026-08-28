# Master Execution Plan — 3-Day Compressed Launch (Aug 28–30, 2026)

**Written:** 2026-08-28. **Target:** register → pay via UPI (manual, screenshot-verified) → QR credential live, in **3 calendar days**.
**Supersedes:** the previous version of this document (the Aug 3 → Sept 30, 8-week plan) **entirely**. That schedule is void — this is a full rewrite, not an amendment. Razorpay is removed from scope, not deferred.

## Why this replaces the old plan, not just its dates

The 8-week plan assumed Razorpay (2–4 week KYC lead time) and a full phase sequence (Registration → Payments → QR → Notifications → Schedule → Admin → Hardening → Deploy). Two things changed:
1. **Payment method:** no gateway. Every registration form shows a static UPI QR code to the fest's business account; the payer pays externally in their own UPI app, then uploads a screenshot + enters the transaction ID in the same form. Admin manually approves or rejects against that proof. This removes order creation, webhook HMAC verification, and reconciliation automation from scope completely — not "later," gone.
2. **Timeline:** 3 days, 4 people, starting today. That is not enough time to also do Notifications, Schedule, a hardening pass, or a polished deploy — those are cut or reduced to best-effort stretch goals below. Say so plainly now so nobody discovers it on day 3.

## Ground truth as of 2026-08-28 (verified against code, not docs)

| Area | Status |
|---|---|
| Auth | ✅ Done — register/login/refresh/logout/me, JwtAuthGuard, RolesGuard, ThrottlerGuard. |
| CA Portal (backend + most frontend) | ✅ Done — onboarding, application review, referral clicks, task list/submit, admin brand/task/assignment management, CA leaderboard. Built on `apps/api/src/ca/`, `apps/web/app/dashboard/ca/*`. |
| Admin module | 🟡 Partial — brands, CA-tasks, CA-task-assignment verification, CA-application review, user role updates. No registration/payment/event admin views yet. |
| Uploads | 🟡 Partial — `UploadsService` does presigned S3/R2 PUT+GET, but the object-key prefix is hardcoded to `ca-proof/`. Needs generalizing before payment screenshots can reuse it. |
| Leads/waitlist | ✅ Done — simple capture endpoint, no conversion wiring yet. |
| Redis + BullMQ infra | ✅ Done. |
| **Events module** | ❌ 0% code. Schema (`Event`, `EventSubOption`, `EventRulebook`) exists, no service/controller. |
| **Teams module** | ❌ 0% code. Schema (`Team`, `Participant`) exists, no service/controller. |
| **Registration module** | ❌ 0% code. Schema (`Registration`, `RegistrationSubOption`) exists, no service/controller. |
| **Payments (any mode)** | ❌ 0% code. Schema already models `PaymentMode.MANUAL_SCREENSHOT` with `screenshotUrl`/`transactionId` fields — the data model was built anticipating exactly this flow. No service/controller exists yet. |
| **QR/Credential + scan** | ❌ 0% code. Schema (`Credential`, `ScanLog`) exists, no service/controller. |
| Notifications (email) | ❌ 0% code, **cut from this sprint** (see below). |
| Schedule/Match/Venue | ❌ Not even modeled in schema, **cut from this sprint**. |

**The real gap this sprint closes:** Events, Teams, Registration, Payments, and QR/Credential — the actual core of "someone registers for an event and gets in" — currently do not exist as code at all, only as Prisma models.

Team for this sprint: **Minhaj** (Lead), **Saad-Manda** (Sr. Backend), **Shikhar Yadav** (Backend), **Anjney-Lawaniya** (Sr. Frontend). Mahendra-seervi is off this sprint; Shikhar Yadav takes his place.

This sprint is split **by feature, not by frontend/backend layer**. Each of the four people owns one vertical end-to-end — its schema/service/controller *and* its UI — for the whole 3 days, instead of one person building every backend route and another building every screen. That keeps handoffs out of the critical path: nobody is blocked waiting for someone else to finish "their half" of the same feature. All four reuse the CA-portal's established patterns (`lib/api.ts`, `AuthGuard`, `StatCard`/module.css conventions, Nest module/service/controller layout) to move fast without inventing new patterns — including on the backend side for Anjney-Lawaniya and on the frontend side for Minhaj/Saad-Manda/Shikhar Yadav, all of whom are now writing across both layers on their vertical.

The four verticals, by owner:

| Owner | Vertical | Why them |
|---|---|---|
| **Minhaj** (Lead) | Events + Teams — the foundation schemas everything else registers against | Lead unblocks the other three fastest by locking this contract first; carries the admin-dashboard and sprint-governance overhead (throttling, env audit, migration dry-run) that naturally falls to the lead |
| **Saad-Manda** (Sr. Backend) | Registration — individual/team branching, duplicate guard, status transitions, the registration form UI | Single largest, most logic-heavy module; matches seniority |
| **Shikhar Yadav** (Backend) | Payments — manual UPI screenshot submission + admin verification, both sides of that form | Self-contained vertical, good scope for ramping onto the codebase this sprint |
| **Anjney-Lawaniya** (Sr. Frontend) | QR/Credential + Scan — token/QR generation, credential display, volunteer scan endpoint | Depends on Payments confirming first, so it has the most slack on Day 1; stretching into backend here is offset by lighter Day-1 load |

Workload is balanced by giving each vertical one backend-heavy day, one frontend-heavy day, and a Day-3 hardening/QA pass — see below.

## Explicitly cut from this sprint (fast-follow after launch, not before)

- **Razorpay / any payment gateway** — removed from scope permanently for this launch, not just this sprint.
- **Email notifications (Resend)** — no confirmation/QR emails. Registrants see status on their dashboard only.
- **Schedule/live scores/Match module** — not modeled, not built, not attempted.
- **Volunteer scanner PWA (offline-first, camera UX)** — only the bare `POST /identity/scan` API + a minimal admin scan-log table get attempted, and only if Day 3 has slack.
- **Load testing, full OWASP pass, npm audit, dependency updates** — a fast sanity pass only (reuse existing `ThrottlerGuard`, extend it to the new endpoints).
- **Production deployment (VPS/Cloudflare/R2 provisioning)** — best-effort stretch on Day 3 evening; the sprint's success bar is the full loop working end-to-end on staging/local, not a public URL.

## Day 1 — Aug 28: Foundations + Registration + Payments scaffold

Lock the Event/Registration contract (fields, DTOs) early in the day — every downstream vertical (Registration, Payments, QR) depends on it, so it's the one thing that must not slip past midday.

- **Minhaj (Events + Teams):** Events module — CRUD, publish toggle, capacity guard, `GET /events` public listing, admin create/update — and Teams module — create, invite code, join, size enforcement against `Event.teamSizeMin/Max`. Publish the locked contract to the other three by midday.
- **Saad-Manda (Registration):** Registration module backend — `POST /registrations` (individual + team branches), duplicate guard (schema already enforces `@@unique([eventId, userId])`), status transitions, stub `Payment` row creation in `MANUAL_SCREENSHOT` mode only.
- **Shikhar Yadav (Payments):** UPI payment section scaffold on the registration form — static QR image + VPA + amount-due display (doesn't need the registration backend yet, so front-loaded here) — plus generalize `UploadsService`'s key prefix so it isn't `ca-proof/`-only (e.g. accept a `folder` param), unblocking his own Day 2 upload work.
- **Anjney-Lawaniya (QR/Credential + Scan):** Lightest day by design, since Credential issuance depends on Payments confirming first (not landing until Day 2). Spends it on the `Credential`/`ScanLog` token design (HMAC scheme, QR payload shape) and shoring up the shared frontend conventions (`lib/api.ts`, `AuthGuard`, module.css patterns) the other three are now also writing against on their verticals.

## Day 2 — Aug 29: Registration UI, payment verification, QR issuance

- **Minhaj (Events + Teams):** Event/team-facing frontend pieces (browsing/selection surfaces consumed by Saad-Manda's registration form) and admin event/team management screens if time allows; otherwise starts early on the Day 3 admin dashboard.
- **Saad-Manda (Registration):** Registration form UI — event selection, individual/team branch, custom-field renderer driven by `Event.customFieldsDef`, team create/join UI — wired through `lib/api.ts`.
- **Shikhar Yadav (Payments):** `POST /payments` (create the `MANUAL_SCREENSHOT` row, presigned upload for the screenshot), `PATCH /admin/payments/:id/verify` (approve → `Registration.CONFIRMED`, transactional; reject → back to `PENDING_PAYMENT` with a reason); wires the screenshot upload + transaction-ID input into the payment form UI he scaffolded Day 1.
- **Anjney-Lawaniya (QR/Credential + Scan):** QR/Credential module — BullMQ worker fired on payment-confirmed, signed token (HMAC) + QR PNG generation to storage, `GET /identity/mine`, `GET /identity/validate/:token` — plus the QR credential display/download page frontend.

## Day 3 — Aug 30: Admin surface, fast hardening pass, end-to-end smoke test, launch

- **Minhaj (Events + Teams):** Admin registration/payment dashboard wiring (list + filter by status), extend `ThrottlerGuard` to the new public endpoints (register, payment submit), env var audit, migration dry-run.
- **Saad-Manda (Registration):** `/dashboard/registrations` page (pending/confirmed/rejected states) and Registration edge cases (waitlist, cancellation) hardening.
- **Shikhar Yadav (Payments):** Admin "pending payments" review screen (screenshot preview + transaction ID + approve/reject buttons); final pass on the UPI QR/VPA asset itself (correct account, correct amount display).
- **Anjney-Lawaniya (QR/Credential + Scan):** `POST /identity/scan` (volunteer check-in) + duplicate-scan detection (`ScanLog.DUPLICATE`); a bare admin scan-log viewer if there's slack, cut without guilt if not; mobile QA at 375px across the registration form, payment form, and dashboard, fixing visual breakage.
- **All, together, once each vertical's own piece is done:** the manual end-to-end pass — register → pay (manual) → admin verify → QR issued → scan — is now a shared acceptance test, not one person's job, since each of the four owns a leg of that chain; fix whatever breaks in the handoffs between verticals as a group.
- **All, if the above lands with time to spare:** best-effort deploy to VPS/Vercel — do not let this block the core loop working reliably on staging.

## Standing rules (unchanged, restated because they matter more under pressure, not less)

- A plan file is not progress. A branch with a commit is.
- Payments/QR/auth code still needs a second set of eyes before merge — under this compressed timeline that means same-day review (e.g. Minhaj reviews Shikhar Yadav's `payments/:id/verify` endpoint the moment it's open), not a scheduled weekly gate. With each person now owning a full vertical solo, this cross-review is the only check another set of eyes gets on that code before merge — don't skip it under time pressure.
- `.claude/reference/api.md` / `architecture.md` / `database.md` get updated in the same PR as any contract change — skipping this now just creates confusion on day 2 and 3 when contracts are still being locked.

## Risks, said plainly

- **This is a 10–15x compression** of what the original 8-week plan allocated to the same scope (Registration, Payments, QR). It only survives by: (a) never touching a payment gateway at all, (b) the cut list above actually staying cut, (c) the Day-1 Event/Registration contract lock holding so the four vertical owners don't block each other mid-sprint, (d) deployment staying a stretch goal, not a gate on calling the sprint done.
- **Highest-risk single dependency:** if Minhaj's Events/Teams contract (Day 1) slips past midday, Saad-Manda's Registration, Shikhar Yadav's Payments, and Anjney-Lawaniya's QR/Credential all slip behind it in lockstep, since each vertical's backend depends on the one before it — flag that immediately if it's at risk, don't wait for end of day.
- **Vertical ownership is a single point of failure per feature.** With one person covering both backend and frontend on their vertical, there's no second person who could pick it up mid-sprint if that owner gets stuck or unavailable — lean harder on the same-day cross-review above as the safety net, and flag a stuck vertical immediately rather than quietly losing a day to it.
- **No buffer exists in this plan.** Unlike the old plan's W6 buffer week, there is no slack day here — a slip on Day 1 or 2 directly eats into Day 3's smoke test, which is the sprint's only correctness gate before calling this launched.
