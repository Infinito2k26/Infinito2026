# Campus Ambassador (CA) Portal — What It Is, What Exists, What's Left

**Written for:** the whole team (not just developers) — so everyone is looking at the same picture before we commit to a July 20 launch.
**Last updated:** 2026-07-15

---

## 1. What the CA Portal actually is

A small website area where a **Campus Ambassador** (a student who volunteers to promote Infinito 2K26 at their own college) can:

- Get their own personal referral code and shareable link (e.g. `infinito.iitp.ac.in/register?ref=CA-AMU-042`)
- See how many people clicked their link, and (later) how many of those actually registered
- Complete small promotional tasks the fest team sets up (e.g. "post this reel," "share this poster") and get points for them
- See themselves ranked against other CAs on a public leaderboard

Separately, a fest team member (**Admin**) can:

- Approve someone into the CA role
- Create tasks and review what CAs submitted as proof
- Award or reject points

That's the whole feature. It is one small piece of the much bigger Infinito 2K26 platform (which also needs to handle event registration, payment, and QR check-in — those are separate, larger, and mostly **not built yet**).

---

## 2. Who's building what

- **Backend (the server logic — accounts, referral tracking, points, leaderboard math):** Minhaj
- **Frontend (the pages people actually see and click):** Anjneya, with help from the rest of the frontend team

---

## 3. What's already done (as of today, July 15)

✅ **Login/signup system** — a user can create an account and log in. Solid, tested, merged.
✅ **Visual building blocks** — buttons, cards, badges, forms, pop-ups, loading/error screens, the site's navigation bar and menu. All merged and reusable.
✅ **Database design** — every table the CA program needs (CA profile, tasks, brands, submissions, referral tracking) is already designed and set up. Nothing to redesign here.
✅ **Background job system** — infrastructure that lets the site handle referral link clicks in a burst (e.g. a CA's link going around a WhatsApp group) without slowing down or crashing. Built, tested, just needs one final sign-off to merge in.
🟡 **CA dashboard visuals** — the boxes that would show a CA's referral code, stats, and the leaderboard have been built as standalone pieces, but they are **not connected to anything yet** — the actual dashboard page today shows fake, hardcoded numbers and doesn't use these pieces. This was intentionally scoped as "just the visual pieces, for future wiring" (see PR #22).

## 4. What does NOT exist yet — this is the real gap

❌ **All server-side CA logic.** Nothing on the backend can currently: create a CA profile, generate a referral code, count a link click, list/accept a promotional task, record a submission, award points, or calculate a leaderboard. **This is zero percent built.** It is the single biggest piece of work standing between us and launch.
❌ **A real login/signup page on the website.** The backend supports it, but there's no page yet where a person actually types in their email and password.
❌ **Connecting the dashboard visuals to real data** (once the backend above exists).
❌ **Automatic social media stat-checking** (e.g. auto-pulling a CA's YouTube view count) — nice-to-have, not started, not required for launch.
❌ **Linking a referral to an actual paid registration.** This can't fully work yet because the registration/payment system itself is a separate, much bigger piece of the platform that hasn't been built at all. (See §6.)
❌ **Public hosting.** The entire site currently only runs on developers' own laptops. Nobody outside the team can visit it right now — there is no live server, no domain pointed at anything, and no deployment pipeline set up yet, even though a hosting plan/budget document already exists.

---

## 5. The honest timeline math

Today is **July 15**. Target is **July 20** — 5 days.

Rough, realistic effort remaining if we build everything described above at full depth:
- Backend CA logic (accounts, referral tracking, tasks, points, leaderboard): **~4 focus days**
- Wiring the frontend to real data + building the missing login/signup pages: **~3 focus days**
- Getting the site actually live on the internet (server, domain, deploy pipeline): **~1–2 days**, done once and mostly one-time work

Those can overlap somewhat (frontend wiring can start once the backend's shape is agreed on day 1), but at full scope this is realistically **6–8 focus days of work squeezed into 5 calendar days**, for what is functionally a two-person team on this feature. It's tight but not impossible — **only if we cut scope deliberately, not accidentally.**

---

## 6. Decision (2026-07-15): full scope, ships by July 20

Everything gets built: referral clicks, task system with points, leaderboard, admin task management, all live and hosted on a free-tier stack (see §7). This is the aggressive option — realistically 6-8 focus-days of work in 5 calendar days for a two-person track — so it only holds if nothing else pulls Minhaj or Anjneya away this week, and if the one deliberate cut below is respected.

**One deliberate cut, to buy back time without losing user-facing capability:** auto-fetching YouTube/Twitter view/like counts on task submissions is deferred to a fast-follow. At launch, admin reviews and approves proof links manually — same end result for a CA, just a manual step for the admin instead of an automated one.

Tracking issues: #24 (CA backend module) and #25 (CA frontend wiring) — opened 2026-07-15, replacing the closed #19 which does not reflect a working funnel/dashboard.

---

## 7. What about the rest of the platform (registration, payments, QR, schedules)?

None of that exists yet either (it's 0% built, same as CA backend was before this week). Recommendation: **almost everything else pauses this week** so the whole team's attention goes toward getting the CA Portal live. Two exceptions that cost no dev time and have long lead times if we wait:

1. **Razorpay payment KYC paperwork** — takes 2–4 weeks for the bank to approve, completely independent of dev work. Should be started this week regardless of anything else, purely because waiting costs us calendar time later for free.
2. **Two already-finished pieces of work sitting idle** — the background job system (Redis/BullMQ) and a roadmap/budget document — both just need a quick review and merge. Costs almost nothing, unblocks later work.

Everything else on the master roadmap (registration, payments, QR check-in, schedules, admin dashboards) picks back up once the CA Portal is live.
