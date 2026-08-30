# Plan: registration-day2-ui — Registration Form UI

## Issue

- Tracker: local (no GitHub issue for this vertical yet — tracked via `.claude/plans/master-roadmap-sept30-launch.md`, "Day 2 — Aug 29" → Saad-Manda's row). Note: today's actual calendar date is 2026-08-30.
- Track: web (with one small, flagged backend read extension — see Scope)
- Priority: high — Payments' `UpiPaymentSection` (already built, Day 1) has no caller yet; this vertical is what wires the whole register → pay loop together end to end.
- Owner: Saad-Manda
- Reviewer: Minhaj (standing same-day cross-review rule; flag the one Events-module touch below to him specifically since it's not "your" module)
- Base branch: `feature/registration-module-backend` — carries the merged Events/Teams/Payments/Identity modules plus this vertical's backend work: `Team.declaredSize` (roster size committed at team creation, replacing live-roster-count eligibility) and the mess-only accommodation add-on (`Event.messOnlyRate`, `Registration.messOnlyOpted`/`messOnlyHeadcount`). This branch (`feature/registration-module-ui`) is cut from its tip.
- **Revision note (2026-08-30):** this plan originally treated "captain has no visibility into roster fill-in progress, must guess-and-retry registration" as an accepted risk. `Team.declaredSize` (added after the first draft of this plan) resolves that entirely — registration eligibility is now fixed at team-creation time, not gated on teammates actually joining. That risk section has been removed below; the team step's UX is simpler than originally planned as a result.

## Outcome

- A logged-in user can, entirely through the UI: browse published events, open one, register for it (individual or team branch, event-specific custom fields, sub-option picks for events like Athletics, an accommodation/mess-only add-on, gender-based pricing where applicable), and land on the existing `UpiPaymentSection` to submit their payment proof — all wired through `lib/api.ts`, no direct `fetch` calls in page code.
- Team events: the captain declares a roster size and creates a team (multipart form incl. roster photo/ID), or a teammate joins one via invite code, from inside the registration flow — reusing `POST /teams` and `POST /teams/:id/join` as-is, no new Teams-module endpoints.
- `npm run lint && npm run check-types && npm run build --workspace=web` all pass. No workspace regressions (`npm run lint && npm run check-types && npm run build && npm run test --workspace=api` still green).
- `.claude/reference/api.md` updated for the one backend contract change (see below).

## Scope

**In:**
- `apps/web/app/dashboard/events/page.tsx` — replace the "Coming Soon" placeholder with a real `GET /events` listing (cards: name, category, dates, fee summary, registration-open badge), linking to a detail route.
- `apps/web/app/dashboard/events/[slug]/page.tsx` (new) — event detail via `GET /events/:slug`, rulebook/description, a "Register" CTA gated on `registrationOpen`.
- `apps/web/app/dashboard/events/[slug]/register/page.tsx` (new) — the registration flow itself, a client-side stepper:
  1. **Team step** (TEAM events only): create team (`POST /teams`, multipart, now including a `declaredSize` field guided by `event.teamSizeMin`/`teamSizeMax` — shown as inline hint text, e.g. "between 4 and 6", and set as the number input's `min`/`max` so most out-of-range values are caught before submit rather than round-tripping a 422) or join one (`POST /teams/:id/join`, multipart) — shows the resulting invite code prominently with a copy button so the captain can share it before continuing. Because `declaredSize` (not live roster fill-in) gates eligibility, the captain can move on to the Details step immediately after creating the team — no need to wait for teammates to join first.
  2. **Details step**: `genderDeclared` select (only if `feeStructure === 'GENDER_BASED'`), an accommodation/mess-only add-on (only if `event.hasAccommodation`) — a single "Need accommodation?" toggle, then a choice between "Full package" (lodging + mess) and "Mess only", plus a shared "number of days" field. Headcount is only asked for `TEAM` events (defaulting to and hidden entirely for `INDIVIDUAL` events, where it's implicitly 1) — this UI always sends exactly one of `accommodationOpted`/`messOnlyOpted` as true, never both, even though the backend supports stacking both across different subsets of a team; that split-headcount case is out of scope for this UI (see Scope, "Out"). Also a sub-option picker (only if `event.subOptions.length > 0`, grouped by `SubOptionType`, capped per `maxSelectionsPerReg`, relay picks collecting `relayMembers`), and a custom-field renderer driven by `Event.customFieldsDef` filtered to `scope === 'TEAM'` (the only scope `RegistrationsService` validates today).
  3. **Submit**: `POST /registrations`. Map specific status codes to specific inline messages rather than a generic error string (see Step 6).
  4. **Payment**: on `201`, render the existing `apps/web/components/registration/UpiPaymentSection.tsx` unchanged, passing `amountDue`, `registrationId`, `isIITP` from the response and `vpa`/`payeeName` from new `NEXT_PUBLIC_UPI_VPA` / `NEXT_PUBLIC_UPI_PAYEE_NAME` env vars.
- One backend read-only extension: `EventsService.findBySlug` currently doesn't include `subOptions`, so the detail/registration pages can't render Athletics-style pick lists. Add `include: { subOptions: { where: { isActive: true } } }` to that one query. This is the only Events-module file touched — flag it to Minhaj in the PR description since Events is his vertical, even though it's additive and doesn't change any existing response field.
- `.env.example` (root) — document `NEXT_PUBLIC_UPI_VPA` / `NEXT_PUBLIC_UPI_PAYEE_NAME` (no real values, matching the file's existing placeholder style).
- `.claude/reference/api.md` — note the `subOptions` addition to `GET /events/:slug`'s response under §Events.

**Out:**
- `POST /registrations/mine`, `/dashboard/registrations` status page, cancellation/waitlist UI — explicitly Day 3 per the roadmap.
- Any new Teams-module endpoint (e.g. a "my teams" list, a team-detail/roster-count GET). Not needed anyway now that `declaredSize` fixes eligibility at team-creation time rather than live roster count.
- Splitting one registration's accommodation headcount across both the accommodation and mess-only packages simultaneously — the backend supports it (`accommodationOpted` and `messOnlyOpted` can both be true), but per product decision this UI only ever offers one package per registration, chosen via a single toggle.
- Any change to `UpiPaymentSection.tsx`, `POST /payments`, or admin payment verification — Shikhar's vertical, already built and untouched.
- `PARTICIPANT`-scope custom fields — `RegistrationsService.validateCustomData` only ever validates `TEAM`-scope fields; participant-scope fields belong to the Teams module's roster forms, not here.
- Styling system changes — reuse `components/ui/{card,button,input,modal}.tsx` and the CA portal's `*.module.css` + `"use client"` + `react-hook-form`/`zod` conventions as-is.

## Files to Read First

- `apps/api/src/registrations/registrations.service.ts` — the exact validation rules the form must satisfy client-side (still worth double-checking server-side errors surface cleanly, since the server is the source of truth): team `eventId` match, `declaredSize` vs `teamSizeMin`/`teamSizeMax`, `validateAccommodation` (requires `hasAccommodation`, requires `accommodationDays` + the relevant headcount, caps combined headcount at `declaredSize`), custom field scope filter, sub-option caps.
- `apps/api/src/registrations/dto/create-registration.dto.ts` — exact request shape (`eventId`, `teamId?`, `genderDeclared?`, `accommodationOpted?`, `accommodationDays?`, `accommodationHeadcount?`, `messOnlyOpted?`, `messOnlyHeadcount?`, `customData?`, `subOptionSelections?`).
- `apps/api/src/teams/dto/teams.dto.ts` and `teams.controller.ts` — `CreateTeamDto`/`JoinTeamDto` fields (note `declaredSize`, required, `@Type(() => Number)`-coerced since it arrives as a multipart string field) and the multipart `photo`/`idFile` upload contract (both required, ≤5 MB, jpeg/png/webp). `apps/api/src/teams/teams.service.ts` validates `declaredSize` against `event.teamSizeMin`/`teamSizeMax` (422 if out of bounds) before creating the team.
- `apps/api/src/events/events.service.ts` and `events.controller.ts` — current `GET /events` / `GET /events/:slug` response shape, and where to add the one-line `subOptions` include.
- `apps/api/prisma/schema.prisma:196-297` — `Event`, `EventSubOption`, `Team` field names/types (`customFieldsDef` shape is documented inline as a JSON comment on `Event.customFieldsDef`).
- `apps/web/components/registration/UpiPaymentSection.tsx` — already complete; read its prop contract (`amountDue`, `vpa`, `payeeName?`, `qrImageUrl?`, `isIITP?`, `registrationId?`, `onSubmitted?`) since the register page just needs to render it correctly at the end of the flow, not modify it.
- `apps/web/lib/api.ts` — the only HTTP client; note it reads the JWT from `localStorage['infinito_token']` and force-redirects to `/login` on 401.
- `apps/web/app/dashboard/ca/tasks/page.tsx` — the house style to match: `"use client"`, `react-hook-form` + `zodResolver`, `Card`/`Input`/`Button` from `components/ui`, a sibling `*.module.css`, try/catch around `api.*` calls with `console.error` + inline error state (no toast library in use).
- `apps/web/app/dashboard/layout.tsx` — confirms every `/dashboard/*` route is already behind `AuthGuard`, so no auth wiring needed in the new pages.
- `.claude/reference/api.md` §Events, §Teams and Registrations, §Payments — the locked contract for all three calls this flow makes.

## Files to Change

- `apps/api/src/events/events.service.ts` — add `subOptions` include to `findBySlug`.
- `apps/api/prisma` — no schema change.
- `apps/web/app/dashboard/events/page.tsx` — real listing (was a placeholder).
- `apps/web/app/dashboard/events/[slug]/page.tsx` — new, event detail.
- `apps/web/app/dashboard/events/[slug]/register/page.tsx` — new, the registration stepper.
- `apps/web/app/dashboard/events/[slug]/register/register.module.css` (and similar per new page) — new, following CA portal's per-page module.css pattern.
- `apps/web/components/registration/CustomFieldRenderer.tsx` (new, small) — renders `Event.customFieldsDef` (TEAM scope) as controlled inputs (`TEXT`/`NUMBER`/`SELECT`/`FILE` per `CustomFieldType`), used by the Details step.
- `apps/web/components/registration/SubOptionPicker.tsx` (new, small) — renders `EventSubOption[]` grouped by `SubOptionType` with the per-type cap enforced client-side (mirrors `registrations.service.ts`'s `maxSelectionsFor`), collecting `relayMembers` text input for `RELAY` picks.
- `apps/web/components/registration/AccommodationSection.tsx` (new, small) — the single toggle + "Full package"/"Mess only" choice + days input (+ headcount input, `TEAM` events only) described in Scope; outputs the exact `{ accommodationOpted, messOnlyOpted, accommodationDays, accommodationHeadcount, messOnlyHeadcount }` shape the DTO expects, always with exactly one of the two `*Opted` flags true and the other flag/headcount pair omitted.
- `.env.example` (root) — add `NEXT_PUBLIC_UPI_VPA`, `NEXT_PUBLIC_UPI_PAYEE_NAME` placeholders.
- `.claude/reference/api.md` — document the `subOptions` addition under §Events.

## Implementation Steps

### Step 1: Backend — expose `subOptions` on event detail

Add the include to `EventsService.findBySlug`, confirm `events.service.spec.ts` still passes, add one assertion that `subOptions` comes back. Update `.claude/reference/api.md` §Events. This is a two-line change — do it first and get it committed on its own so Minhaj can review it in isolation from the frontend work.

### Step 2: Event listing page

Wire `apps/web/app/dashboard/events/page.tsx` to `api.get('/events')`, render the `pagination`-wrapped list as cards (reuse `Card`), each linking to `/dashboard/events/[slug]`. Loading/empty states via `components/ui/{section-spinner,empty-state}.tsx`.

### Step 3: Event detail page

`api.get('/events/:slug')`. Show name, category, dates, venue, fee summary (compute display string from `feeStructure`/`feeFlat`/`feePerHead`/`feeMale`/`feeFemale` — display only, never trust this for the actual charge), and a "Register" button disabled when `!registrationOpen` with an explanatory message.

### Step 4: `CustomFieldRenderer` and `SubOptionPicker` components

Build these as small, presentational, controlled components (props in, `onChange` out) so the register page's own state stays the single source of truth — no internal fetches. Unit-test the sub-option cap logic against a few fixtures (mirrors the backend cap test already in `registrations.service.spec.ts`) since it's the one piece with real logic.

### Step 5: Registration stepper page — team branch

For `event.registrationType === 'TEAM'`: render create-vs-join choice. The create form includes `declaredSize` (number input, `min`/`max` set from `event.teamSizeMin`/`teamSizeMax`, hint text showing the allowed range) alongside the existing team fields → the matching multipart form (`FormData`, since both endpoints require file uploads) → `api.post('/teams', formData)` or `api.post('/teams/:id/join', formData)` → store the resulting `team.id` (and `inviteCode` for display) in local component state, advance to the Details step immediately — `declaredSize` fixes eligibility at creation time, so there's no need to wait for or poll for teammates joining before continuing.

### Step 6: Registration stepper page — details + submit

Render `CustomFieldRenderer` + `AccommodationSection` + sub-option inputs conditioned on the fetched `Event`, assemble the exact `CreateRegistrationDto` shape (for `INDIVIDUAL` events, omit headcount fields entirely — the backend's `participantCount` is implicitly 1), `api.post('/registrations', dto)`. Map specific status codes to specific inline messages (`400` unknown/missing field, `404` event/team not found, `403` not the captain, `409` duplicate registration, `422` capacity/declared-size-out-of-bounds/gender-required/accommodation-not-offered/headcount-exceeds-team-size) rather than one generic error string, since each is actionable differently.

### Step 7: Payment handoff

On `201`, switch the stepper to a final "Payment" state and render `<UpiPaymentSection amountDue={...} registrationId={...} isIITP={...} vpa={process.env.NEXT_PUBLIC_UPI_VPA!} payeeName={process.env.NEXT_PUBLIC_UPI_PAYEE_NAME} />` — no other changes needed since that component is already complete and self-contained.

### Step 8: Verify and document

Run `npm run lint && npm run check-types && npm run build --workspace=web`, re-run the full API suite to confirm the Step 1 backend touch didn't regress anything (`npm run test --workspace=api`), manually walk both the individual and team happy paths against a local dev server (`docker compose up -d`, `npm run dev`), update `.claude/reference/api.md`, commit per-file/per-concern like Day 1, open the PR flagging the `events.service.ts` line for Minhaj's same-day review.

## Risks

- **`events.service.ts` touch is technically outside this vertical.** Keep it to the one include line, get it reviewed same-day, and don't use this as license to make further changes there.
- **Declared vs. actual roster size can drift.** A captain could declare 6, register, pay, and only 4 teammates ever actually join by event day. That's an accepted product tradeoff (explicitly chosen over gating on live roster count) and an ops/check-in concern, not something this UI needs to solve — flagging so it isn't mistaken for a bug later.
- **The single-toggle accommodation UI can't express "3 in the full package, 2 in mess-only" on one registration**, even though the backend supports it. Acceptable simplification per product decision; if a team genuinely needs a split, there's no UI path to it yet.
- **`UpiPaymentSection` requires `NEXT_PUBLIC_UPI_VPA`** which doesn't exist yet anywhere in the repo — coordinate with whoever owns the real UPI VPA/QR asset (Shikhar's Day-3 task per the roadmap is "final pass on the UPI QR/VPA asset itself") so a placeholder value doesn't accidentally ship to a real launch.
