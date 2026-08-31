# Readiness Phase 2 — Frontend UI/UX

**Status:** Audit complete, work not started — waiting on visual direction. **Written:** 2026-08-31.
**Supersedes:** the "Phase 2" section of `production-readiness-audit.md` — that file is kept for history but this is now the standalone source.

## What this phase is

A route-by-route audit of `apps/web`, verified live (dev server started, pages screenshotted, every route under `apps/web/app` read directly) — not just a design/theme gap assessment. **Visual direction — theme, palette, typography — will be provided separately when this phase begins.** What follows is the current-state audit needed to scope that work: some of it is functional breakage that has nothing to do with theme and should be fixed *before* any re-skin, since a new theme painted over broken or disconnected markup is still broken.

---

## Critical — broken today, independent of any future theme

### 1. Tailwind utility classes are used throughout the app, but Tailwind is not installed

`apps/web/package.json` has no `tailwindcss` dependency, no PostCSS config, no Tailwind config file anywhere. Yet Tailwind classNames (`text-3xl`, `bg-card`, `text-muted-foreground`, `md:grid-cols-2`, `bg-white/5`, etc.) appear across roughly a third of the app's pages and components — including the shared `EmptyState`, `ErrorState`, `NotFound`, `PageSpinner`, and `SectionSpinner` components: exactly the "no page should ever show a blank white screen" safety-net primitives `issue-loading-empty-error-states.md` scoped. None of these classes compile to real CSS; every element using them renders with zero applied styling.

**Verified live this session**: started the dev server and screenshotted the homepage (`/`) — headings render in default browser styling, the `text-blue-600` accent span renders plain black, spacing/layout classes have no effect. This directly violates the project's own stated rule (`issue-ui-primitives.md`: *"CSS Modules is the styling approach. No Tailwind."*) and is an engineering bug, not a design gap. It isn't uniform — see the route inventory below for exactly which pages are affected.

**Fix:** rewrite the affected files to CSS Modules, consistent with the rest of the app and the stated rule, as a prerequisite to theming — not by retrofitting Tailwind into the toolchain this late.

### 2. The homepage's primary CTA leads to a stale waitlist form, not the real registration flow

Screenshotted `/register`: it collects name/email/phone/college and submits to "Join the Waitlist," with copy reading *"No payment is required today."* This is the pre-sprint leads-capture form. The real registration + payment flow that shipped this sprint lives at `/dashboard/events/[slug]/register` — reachable only after logging in and picking a specific event. A first-time visitor following the homepage's own "Register Now" button today cannot reach the real flow at all.

**Fix:** point the homepage CTA (and the `/register` route itself) at the real event browsing → registration flow, or make `/register` redirect into it once a public event list exists (see finding 3).

### 3. Public marketing pages are static placeholders, disconnected from real data

`/events`, `/sports`, `/about`, and `/upcoming` (all four read directly; `/events` and `/sports` also screenshotted) render hardcoded "check back soon" copy — `/upcoming` literally titles itself *"Under Development"* with a robot icon, a dev placeholder shipped on a public route — despite the Events module being fully built and already serving real data to the dashboard via `GET /events`. A visitor can't browse a single event without creating an account first.

**Fix:** wire `/events` (at minimum) to `GET /events` for a public, no-login event list. `/about` can stay static copy once it's real copy, not a stub.

### 4. The frontend's own default API URL points at the wrong port

Both `apps/web/lib/api.ts` (every API call in the app routes through this file) and `app/leaderboard/page.tsx` fall back to `http://localhost:5000/api` when `NEXT_PUBLIC_API_URL` isn't set — but the API's own default port, per `apps/api/.env.example` and `main.ts`, is **3000**. `NEXT_PUBLIC_API_URL` isn't documented in any `.env.example` in the repo (root or `apps/web`) either. Out of the box, with no undocumented env var set, the frontend cannot reach the backend at all.

**Fix:** correct the fallback to `3000`, and document `NEXT_PUBLIC_API_URL` in `apps/web/.env.example` (create the file if it doesn't exist).

---

## High — content and functionality gaps

### 5. `/privacy-policy` ships committed Lorem Ipsum as its actual legal text

`privacy-policy/page.tsx:17` — a live legal page with placeholder Latin filler. A content problem, not a styling one.

### 6. Several dashboard routes are non-functional stubs

`dashboard/settings` renders entirely hardcoded fake profile data ("Campus Ambassador" / "ca@college.edu" / "AMU Aligarh") instead of the logged-in user's own data. `dashboard/teams` and `dashboard/analytics` are permanent empty-states with no data fetching wired up at all, despite the Teams module existing on the backend.

### 7. The CA dashboard's leaderboard can silently show fabricated data

`components/ca/LeaderboardWidget.tsx` fetches `/leaderboard/ca`, but on any fetch error *or* an unexpected response shape, it falls back to a hardcoded `MOCK_DATA` array of five invented names ("Aditi Sharma," "Rohan Mehta"...) with no visual indication the data isn't real. The source comment says *"temporary local fixture... replace with API data once backend integration is complete"* — the backend integration is in fact complete (confirmed in Phase 1's audit); the fallback was just never removed.

**Fix:** remove `MOCK_DATA`, or at minimum show an explicit "unable to load leaderboard" error state instead of silently substituting invented names.

### 8. `packages/ui` was never built out

`issue-ui-primitives.md` scoped replacing its Turborepo-boilerplate `Button`/`Card` (the one that calls `alert()` and links to Turborepo's docs) with real versions — that never happened, and `packages/ui` has zero imports anywhere in `apps/web` today. The real, good primitives live only in `apps/web/components/ui/`, so the package is dead weight.

### 9. Unused font assets

`apps/web/app/fonts/GeistVF.woff` and `GeistMonoVF.woff` are checked in but never loaded — no `next/font` usage anywhere, no `@font-face` in `globals.css`. The app actually renders in the `Arial, Helvetica, sans-serif` fallback stack today. Clean up once real typography is chosen.

---

## Medium — polish, worth tracking but not urgent

### 10. Design tokens are a known, deliberate placeholder

11 CSS variables in `globals.css`, generic zinc-grey hex values, explicitly no dark palette (`issue-ui-primitives.md` scoped dark mode out: "tokens don't have dark palette yet"). Expected to be replaced wholesale once real theme direction arrives — flagging only so the token surface (the six primitives' variant classes) is understood as the integration point, not something to rebuild.

### 11. No favicon, no social-share metadata

`layout.tsx`'s `metadata` export has only `title` and `description`. Matters for a fest whose links will circulate over WhatsApp and Instagram.

### 12. No `app/not-found.tsx` route

The in-page `NotFound` component exists and is used inside `dashboard/events/[slug]`, but wiring Next's actual 404 route was explicitly deferred in `issue-loading-empty-error-states.md` and never picked back up — a visitor hitting a bad URL sees Next's bare default 404 today.

### 13. Mobile responsiveness is thin and mostly untested

Only `layout.module.css` (the shared nav/footer shell) has meaningful breakpoint coverage (5 `@media` rules) — every other `.module.css` file in the app has 0 or 1. The only pages confirmed mobile-QA'd are `dashboard/credential` and `admin/scans`, per the most recent commit on this branch. Every admin table, every other dashboard page, and all public pages haven't had a deliberate mobile pass yet.

---

## Confirmed healthy — real craft already in place

- The `apps/web/components/ui/` primitives that do carry a `.module.css` — Button, Card, Badge, Input, Modal, Spinner — are well-built: typed props, token-driven, matching their original spec, and confirmed rendering correctly live this session.
- Image accessibility is actually solid: all 3 `<img>`/`<Image>` usages in the entire app have a matching `alt` attribute — full coverage, not a gap.
- The real registration form (`/dashboard/events/[slug]/register`) and its component family — `CustomFieldRenderer`, `SubOptionPicker`, `AccommodationSection`, `UpiPaymentSection` — are genuinely mature: CSS-Modules-based throughout, and the subject of the most recent dedicated mobile QA pass. This is the strongest part of the current frontend.
- The public `/leaderboard` page (distinct from the CA dashboard widget above) is a genuinely well-engineered Server Component: ISR with a 15-minute revalidate window specifically to survive traffic spikes, a graceful empty-array fallback if the API is unreachable at build time, and clean CSS Modules throughout.
- `/dashboard` itself is a clean, correctly-wired role dispatcher — routes admins to `/admin`, CAs to `/dashboard/ca`, everyone else to `/dashboard/events`, with a proper loading state and a fallback to `/login` on an invalid session.

---

## Route inventory

Every route under `apps/web/app` read directly this session. **Wired** means it fetches and renders real data from the API; **Tailwind-broken** means the page is functionally real but visually renders unstyled per finding 1.

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
| `/admin/registrations` | ❌ Missing | Tracked as Phase 1, P0 item 3 |
| `/admin/events`, `/admin/teams` | ❌ Missing | No admin frontend for either module despite both existing on the backend |

---

## Suggested order of work

1. **Findings 1–4 first**, independent of and before the visual theme — they're functional breakages a re-skin would paper over, not fix.
2. **The six unwired stub routes** (`about`, `events`, `sports`, `upcoming`, `dashboard/teams`, `dashboard/analytics`) need real data wiring regardless of theme — do this alongside 1–4, not after.
3. **Findings 5–9** (content/functionality gaps) can land opportunistically, in parallel with the above.
4. **Once visual direction arrives:** the token-driven primitives in `components/ui/` (Button, Card, Badge, Input, Modal, Spinner) are the right integration point for the new theme — nothing about them needs to be rebuilt, only re-valued. Apply the new tokens, then work through findings 10–13 (favicon/OG metadata, `not-found.tsx`, a real mobile pass) as part of the same visual work.
