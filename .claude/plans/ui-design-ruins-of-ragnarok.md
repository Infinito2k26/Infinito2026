# Plan: UI Design System — "Ruins of Ragnarok"

- Track: Frontend
- Branch: `feature/ui-design`
- Fest: Infinito 2026, IIT Patna · 9–11 October 2026
- Theme: **Ruins of Ragnarok** — "from the ruins we rise"
- **The site is light-themed.** Bone ground throughout; dark is an accent band, never the page.

## 1. The Art Is The Brief

The official key art now lives in `apps/web/public/`, and it settles every question this
plan previously had to guess at.

| File | Size | Use |
|---|---|---|
| `main-desktop.png` | 2592 × 1080 (2.4:1) | Landing hero, ≥1280px |
| `main-tablet.png` | 1584 × 660 (2.4:1) | Landing hero, 769–1279px |
| `main-mobile.png` | 1080 × 1350 (4:5) | Landing hero, ≤768px |
| `event-{sport}.jpg` × 12 | 1600 × 2000 (4:5) each | Per-event poster |

What the art establishes:

- **A pale bone sky, not a dark screen.** The ground is a warm ivory that runs from
  `#f5ede2` in the event posters to a slightly cooler `#e9e2d8` in the landing art. The
  darkness is entirely in the lower third — a ruined-arena band of charcoal and ember.
- **Crimson blackletter is the voice.** "Ruins Of Ragnarök" and every sport name are set in
  a heavy gothic blackletter in deep crimson with a peach halo behind the letterforms.
- **Engraved roman caps are the second voice.** "IIT PATNA PRESENTS", "11ᵗʰ EDITION",
  "9ᵗʰ – 11ᵗʰ OCTOBER 2026" are all small, wide-tracked, chiselled capitals.
- **Charcoal line art is the ornament.** Valknut roundels, hanging pendants, arrow rules —
  all thin dark line work on bone. There is no gold or bronze ornament anywhere.
- **Ember orange is the only warm accent**, and it appears exactly where there is fire.
- Purple and antique gold exist, but only inside the gladiators' armour. They are
  illustration colours. They must not become UI colours.

Three consequences that change the build, listed here because each one is easy to get
wrong and expensive to unwind:

1. **The landing art already contains the wordmark, the theme title, and the dates.** The
   hero must not overlay an `<h1>` on top of it. Render the image, and give the page a
   visually-hidden `<h1>` for SEO and screen readers.
2. **Each event poster already contains its sport name.** Event cards must not print the
   title over the artwork. The title belongs in the card's dark base strip.
3. **Three `main-*` crops are art direction, not responsive scaling.** They must ship
   through `<picture>` with `media` queries. Scaling one file will crop the dragon out or
   letterbox the mobile composition.

## 2. Where We Are

**The public teaser** (`jolly-figolla-671c6f.netlify.app`) is a single static HTML page. It
carries the identity and nothing else — hero, a 17-sport grid, contact cards, footer. Every
"register" link leaves the site for a Google Form. No auth, no payments, no teams, no data.
It is a poster, not a product.

**This repository** is the product. `apps/web` already ships auth, event browsing and
registration, team management, UPI payment capture, QR credentials, the Campus Ambassador
program, a leaderboard, and a nine-section admin console. Visually it is unstyled: ten
placeholder zinc tokens, Arial body text, a white page.

The work is to move the identity from the poster into the product, and extend it to the
~30 screens the poster never had to think about.

## 3. Principles

1. **Light ground, dark base.** The art's own structure — bone sky above, ruined earth
   below — becomes the page's structure. Sections open on bone and terminate in a dark
   ridge. Dark is a band, never the page.
2. **Ruined, not grimy.** Aftermath and rebuilding. Not horror, not Halloween.
3. **Legibility outranks atmosphere.** Blackletter is for display sizes only, never body
   text and never at small sizes. When the theme and readability conflict, readability wins.
4. **The art carries the theme so the UI doesn't have to.** Because every page can lean on
   a real illustration, the chrome around it should be quiet: bone, charcoal type, thin
   rules. Over-decorating the UI fights the art.
5. **Mobile-first.** Assume a 360px Android on campus Wi-Fi. Desktop is the enhancement.
6. **Ornament is a token, not a decision.** A fixed vocabulary, so seven people building
   different pages produce one website.

## 4. Two Tiers

Same light palette and type on both; what changes is intensity and density.

| | **Saga** (public/marketing) | **Forge** (product surfaces) |
|---|---|---|
| Routes | `/`, `/sports`, `/events`, `/about`, `/leaderboard`, legal | auth, `/dashboard/**`, `/admin/**`, registration flow |
| Ground | `--bone-100`, full-bleed art bands | `--bone-50` page, white-ish cards |
| Display | Blackletter, large, crimson | Cinzel caps at small sizes; blackletter only in page titles |
| Body | Inter | Inter |
| Art | Full-bleed posters, ruined-edge bands | Thin poster strips as context, never decoration |
| Ornament | Valknut roundels, arrow rules, hanging pendants | Hairline rules only |
| Motion | Ember flicker on hero, reveal on scroll | State transitions only, 120–180ms |
| Density | Airy | Compact, table- and form-friendly |
| Dark used for | Footer, section ridges | Footer, credential pass, gate scanner |

## 5. Tokens

Replace `apps/web/app/globals.css` wholesale. Every value is sampled from the artwork.

```css
:root {
  /* Bone — the sky. Page ground everywhere. */
  --bone-50:  #faf5ec;  /* lifted card */
  --bone-100: #f5ede2;  /* page ground, matches the event posters */
  --bone-200: #ece2d4;  /* alternating section */
  --bone-300: #d9ccb9;  /* hairline border */
  --mist-400: #b8ada0;  /* the smoke shapes; disabled text */

  /* Crimson — display type and primary action */
  --crimson-900: #5e0f11;
  --crimson-800: #7a1315;  /* the blackletter in the art */
  --crimson-700: #8b1a1a;  /* primary button */
  --crimson-600: #a3272a;  /* hover */

  /* Ember — accent, from the fire and the arena floor */
  --ember-600: #c1442a;
  --ember-500: #d4622f;
  --ember-300: #f0a06a;
  --glow-200:  #f7d9b8;  /* the halo behind blackletter titles */

  /* Charcoal — figures, ornament line art, dark bands */
  --char-900: #1b1715;  /* footer, credential pass */
  --char-800: #241f1e;  /* body text on bone */
  --char-700: #38302c;
  --char-500: #6b5f56;  /* muted text on bone */

  /* Text */
  --text:        var(--char-800);
  --text-muted:  var(--char-500);
  --text-on-dark:var(--bone-100);

  /* Status — desaturated into the palette */
  --ok: #4a6b3f;  --warn: #a3701c;  --err: #a3272a;  --info: #3f5a6b;

  /* Illustration only — never UI */
  --armour-purple: #4a3358;
  --armour-gold:   #b8873f;
}
```

There is **no dark mode**. Do not add one, and do not ship a toggle.

### Contrast

The light ground fixes the contrast problem the old bronze-on-parchment palette had. Only
one pairing needs a rule.

| Foreground | On | Ratio | Verdict | Use for |
|---|---|---|---|---|
| `char-800` | `bone-100` | 13.9:1 | AAA | All body text |
| `crimson-700` | `bone-100` | 8.1:1 | AAA | Headings, links, primary button label reversed |
| `char-500` | `bone-100` | 5.4:1 | AA | Muted and secondary text |
| `bone-100` | `char-900` | 15.5:1 | AAA | Text in dark bands |
| `ember-600` | `bone-100` | 4.4:1 | **Large text only** | Icons, ≥24px display, accents — not body |

Ember misses normal-text AA by a hair. Treat it as an accent colour with a size floor,
not as a text colour.

## 6. Type

The art shows the pairing directly: blackletter title, chiselled roman caps for metadata.
Three faces total, loaded through `next/font/google` with `display: swap`.

- **Grenze Gotisch** (600/700) — display. Blackletter-flavoured but far more readable than
  UnifrakturCook, which the teaser used and which cannot be read below about 40px. Use for
  page titles and section headings. Crimson, with an optional `--glow-200` text-shadow
  halo to match the posters.
- **Cinzel** (600/700) — eyebrows, labels, table headers, stat labels, buttons. Always
  uppercase, 0.14–0.24em tracking. This is the art's engraved-caps voice.
- **Inter** (400–800) — all body copy, forms, tables, dashboard and admin.

Blackletter never appears below 24px, never in a table, and never in a form label.

Scale (`clamp()`, mobile → desktop): display 36→72, h1 28→48, h2 22→34, h3 18→24,
body 15→16, small 13, micro 11 (Cinzel caps).

## 7. Form & Ornament

- Radius 2px default, 0 on full-bleed bands, 999px on pills. Carved, not soft.
- Elevation is a `--bone-300` hairline plus a very soft warm shadow
  (`0 1px 2px rgba(36,31,30,.06)`). No heavy Material shadows on a bone ground.
- Motion: 120ms state, 180ms enter, 240ms reveal, all behind `prefers-reduced-motion`.
- Grain: a fine charcoal dot overlay at 0.04 on bone surfaces only — enough to keep the
  ground from looking like flat CSS beige next to the illustrated art.

Ornament vocabulary, shipped as `components/ui/ornament.tsx` with a `variant` prop:

- `valknut` — the roundel from the hero corners; section marker.
- `arrow-rule` — the hero's horizontal arrow rule; heading underline.
- `pendant` — the hanging vertical ornament; page-edge accent, desktop only.
- `ridge` — an SVG ruined-skyline mask that ends a light section against a dark one. This
  is the single most theme-carrying device in the system.
- `ember-divider` — a hairline that fades through `--ember-500` at its centre.

**Sport icons must stop being emoji.** The teaser uses ⚽🏐🏏. Commission a 17-icon SVG
sprite in the art's own line style — thin charcoal stroke, crimson fill option — for use in
filters, tables, and dropdowns where the full poster does not fit.

## 8. Image Pipeline

This is now the largest technical risk in the frontend. The assets total roughly 20MB
unoptimised, and the landing page alone would ship 1.3MB of PNG.

- Every image goes through `next/image`. No raw `<img>`.
- Configure AVIF + WebP in `next.config.js`. Targets: hero ≤ 220KB, event card ≤ 90KB,
  event detail ≤ 180KB.
- `main-desktop.png` must be re-encoded — a 1.3MB PNG of an illustration is the wrong
  format. Ship WebP/AVIF.
- Hero uses `<picture>` with three `media` sources at the exact breakpoints in §1, marked
  `priority` and `fetchPriority="high"`. It is the LCP element.
- Event cards use `sizes` so phones never fetch the 1600px original.
- Every poster gets a real `alt` naming the sport. The landing hero's `alt` carries the
  fest name, theme, and dates, since that text is baked into the pixels and otherwise
  invisible to search and screen readers.
- Extract a 20px blurred base64 of each poster for `placeholder="blur"`; the bone ground
  makes the transition almost invisible.

**Coverage gap:** 12 posters exist; the fest lists 17 sports. Categories share art
(Volleyball Boys and Volleyball Women use `event-volleyball.jpg`), but the remaining sports
have none. Design must either supply the missing posters or approve a fallback — a bone
card with the sport icon and a `ridge` base — before `/sports` can ship.

## 9. Components

Existing primitives in `apps/web/components/ui/` keep their APIs; they need theming.

| Component | Change |
|---|---|
| `button` | `primary` crimson fill / bone label; `secondary` charcoal outline; `ghost`; `danger`. Crimson focus ring at 2px offset. 44px min target. |
| `card` | `bone` (default) and `poster` — the latter is art-top, dark base strip, per §10. |
| `input` | Bone-50 field, `bone-300` border, crimson focus ring. Error text carries an icon. |
| `badge` | Category pills (Boys / Girls / Open) and status pills. Colour plus a word, always. |
| `modal` | Bone sheet over a charcoal scrim at 0.55; bottom sheet below 640px. |
| `empty` · `error` · `not-found` | Copy in voice — "These ruins are empty", "The path is broken" — each with a real action. |
| `spinner` ×3 | A rotating valknut ring; keep the three sizes. |
| **new** `ornament` | The five variants in §7. |
| **new** `sport-icon` | Sprite lookup by slug, with a fallback glyph. |
| **new** `poster-card` | The event card in §10. Used on `/events`, `/sports`, dashboard, and admin. |
| **new** `stat` | Number-over-Cinzel-label block. Landing, dashboard, admin, leaderboard. |
| **new** `data-table` | One shared admin table: sticky header, 3% zebra, row actions, card-list fallback below 640px. |
| **new** `ridge` | The ruined-skyline section terminator. |

### The poster card

One component, because it appears on four surfaces and consistency here is most of the
site's visual quality.

- 4:5 art on top, `object-fit: cover`, anchored `object-position: center top` so the baked-in
  sport name survives the crop.
- No text overlays the art. Ever.
- A `--char-900` base strip below it holds: sport name (Cinzel caps, bone), category badge,
  format, date, and slots remaining.
- Hover raises the strip 2px and warms its top border to `--ember-500`. That is the whole
  interaction — the art is already doing the work.
- The strip is what makes the card legible in a grid; without it, twelve bone-ground
  posters side by side wash into each other.

## 10. Screens

### Saga

**`/` Landing.** Hero is the `main-*` art, art-directed, full-bleed, with a
visually-hidden `<h1>`. Because the art contains the title and dates, the only thing placed
over or under it is the CTA pair — "Register" (crimson) and "View sports" (outline) —
sitting in the dark lower ridge of the image where contrast is guaranteed. Then: a stat
band (17 sports / 3 categories / 3 days) on bone; a six-poster sport teaser; a three-card
day schedule; the legacy band; sponsors; contact; dark footer. Live countdown to 9 Oct 2026.

**`/sports`.** All 17 as poster cards. Filters for team/individual and boys/girls/open,
held in the URL so a link is shareable. Register CTAs route into the real flow, not Google
Forms.

**`/events`.** Poster-card grid off the events API — date, fee, slots left, status. Search
and filter, with the shared empty/loading/error states.

**`/about`.** Fest story in voice, IIT Patna context, past-edition numbers, organising team.

**`/leaderboard`.** Inter-college points and the CA board, ranked, with a podium for the
top three.

**Legal.** Bone, one 68ch column, Inter. Themed but plain.

### Forge — auth

`/login`, `/signup`, `/forgot-password`, `/reset-password`. A shared split layout: form on
bone at left, a cropped poster at right that collapses to a slim banner on mobile. Inline
validation, a password-strength meter on signup, and errors that say what to do next.

### Forge — participant

**`/dashboard`.** Name, credential QR shortcut, next event, registrations with status
pills, team invites, payment state. This screen gets opened at the venue — the QR must be
one tap away.

**`/dashboard/events/[slug]`** — the poster full-bleed at the top, then rules, schedule,
fee, slots, and a sticky register CTA on mobile.

**`/dashboard/events/[slug]/register`** — becomes an explicit three-step wizard, Details →
Team & Accommodation → Payment, with a persistent step indicator. Today
`CustomFieldRenderer`, `SubOptionPicker`, `AccommodationSection` and `UpiPaymentSection`
stack into one long unstructured form.

**`/dashboard/teams`.** Roster cards, invite by email, pending states, captain-only
controls visibly disabled rather than hidden.

**`/dashboard/credential`.** The one deliberately dark screen: a `--char-900` pass with a
bone QR, name, sport, and day. It reads as a physical artefact and it scans reliably.
Offline-safe.

**`/dashboard/settings`, `/analytics`.** Charts take their series from the crimson → ember
ramp, never library defaults.

### Forge — Campus Ambassador

`/dashboard/ca` and `apply`, `onboard`, `tasks`, plus the existing `CAHeroSection`,
`StatCard`, `ReferralCodeDisplay`, `LeaderboardWidget`, `PendingStateView`,
`RejectedStateView`. A sub-brand within Forge: ember-forward instead of crimson-forward, so
ambassadors feel they are somewhere of their own. Referral code needs a copy button with a
confirmation state; pending and rejected views need real copy and a next step.

### Forge — admin

`/admin` and its nine sections. Lowest theme intensity in the system: bone ground, Inter
throughout, Cinzel only in table headers, crimson only for primary and destructive actions.
Everything runs through the shared `data-table`. **`/admin/scans`** is used on a phone at a
gate — build it as a dedicated dark scanner screen with large targets and unmistakable
pass/fail feedback, not as a desk-bound admin page.

## 11. Responsive & Accessibility

- Breakpoints 360 / 480 / 768 / 1024 / 1280 / 1440. The hero's art-direction switches at
  768 and 1280 to match the supplied crops exactly.
- QA at 360×640, 390×844, 768×1024, 1280×800, 1440×900.
- No horizontal overflow at 360px. Tables scroll in their own container.
- AA contrast everywhere; ember respects its size floor.
- Visible crimson focus ring on every interactive element; full keyboard traversal of nav,
  modals, and the wizard.
- Status is never colour-only.
- `prefers-reduced-motion` respected; the hero's ember flicker is the first thing disabled.
- Decorative ornaments `aria-hidden`; posters carry real `alt`; the hero's `alt` carries the
  text baked into it.

## 12. Build Order

This is one continuous build on `feature/ui-design`, not a distributed schedule. Nothing
below is assigned to anyone; the order exists only because each step depends on the ones
above it.

1. [x] **Tokens and fonts.** Rewrite `globals.css` per §5; load Grenze Gotisch, Cinzel and
   Inter through `next/font`. Everything else reads from this, so it lands first.
2. [x] **Ornament and icons.** `ornament` (valknut, arrow-rule, pendant, ridge, ember-divider),
   the grain overlay, and the `sport-icon` sprite.
3. [x] **Image pipeline.** `next.config.js` formats, re-encode `main-desktop.png`, the hero
   `<picture>` with its three art-directed sources, blur placeholders, size budgets. This
   sits early on purpose — every later step consumes images, and retrofitting it afterwards
   means touching every card.
4. [x] **Primitives.** Restyle the eight existing `ui/` components; add `poster-card`, `stat`
   and `data-table`.
5. [x] **Shells.** Navbar, footer, public layout, dashboard shell, admin shell.
6. [x] **Saga pages.** Landing, sports, events, about, leaderboard, legal.
   - Landing, sports: art-directed hero, filtered poster grid.
   - `/events`: rebuilt on `PosterCard`, matching live events to the sport catalogue by
     name; events with no poster art yet fall back to a bone card with the engraved
     `SportIcon`. Search plus open/closed filters, local state (not URL — matches the
     existing `/sports` filter convention, and keeps the page out of a Suspense boundary).
   - `/leaderboard`: now wrapped in `PublicLayout` (previously had no navbar/footer), added
     a top-3 podium, hardcoded gold/silver/bronze hex replaced with tokens.
   - `/about`: fest story in voice, Ruins of Ragnarok framing, a stat band (11th edition /
     17 sports / 3 categories / 3 days — all sourced from the plan or the existing sport
     catalogue; no invented college count).
   - Legal (`/privacy-policy`, `/terms-and-conditions`): wrapped in `PublicLayout`,
     simplified from a floating card to the plain bone `--measure` column per this section.
   - Landed together with a fast-forward merge of `fix/phase1-p0-backend-hardening`
     (6 commits: admin event create/edit UI, payments-review fix, team invite-code
     simplification, upload CORS fix, homepage nav fix). One conflict, in `navbar.tsx`,
     resolved in favor of the themed rebuild — it already carried both of that branch's
     nav fixes (no stray "Upcoming" badges, Register pointed at `/register`).
7. [x] **Auth and participant.** Done, 2026-09-01:
   - [x] `login`, `signup`, `forgot-password`, `register` (waitlist) moved onto the new
     `AuthLayout` split shell.
   - [x] `signup` has the password-strength meter (`lib/password-strength.ts`).
   - [x] `dashboard/credential` restyled as the dark `--char-900` pass (§10).
   - [x] `reset-password` — checked: it already reuses `AuthLayout` and
     `forgot-password.module.css`, no separate module needed. Confirmed done.
   - [x] `/dashboard` — corrected: this route has no UI of its own, it's a role-based
     redirect dispatcher (`/dashboard/events` for participants, `/dashboard/ca` for CAs,
     `/admin` for staff). Nothing to theme here.
   - [x] `/dashboard/events` (the participant's actual home) and
     `/dashboard/events/[slug]` — retokenized: dropped the fighting heading overrides and
     the stray full-bleed `.container` (padding/`background-color`/`min-height:100vh`),
     moved spacing onto the token scale.
   - [x] `/dashboard/teams`, `/dashboard/settings`, `/dashboard/analytics`,
     `/dashboard/orders` — same retokenization pass. `settings.module.css` also had a
     hardcoded `#fecaca` border on the sign-out button (§13's hex criterion) — replaced
     with `var(--err)`. `/dashboard/analytics` is still just an `EmptyState` stub, no
     chart implementation exists yet to theme.
   - [x] The registration wizard (`/dashboard/events/[slug]/register`) — turned out the
     `team` → `details` → `payment` state machine already existed (individual events skip
     straight to `details`); what was actually missing was the "explicit" part — no visible
     progress UI. Added a `StepIndicator` (numbered circles + connectors + Cinzel labels,
     current/done/upcoming states) rendered above the step content. Retokenized
     `register.module.css` and the four sub-components it composes —
     `CustomFieldRenderer`, `SubOptionPicker`, `AccommodationSection`,
     `UpiPaymentSection` — the last of which is shared with `merch/checkout`, so that page
     picked up the same retheme for free.
8. [x] **CA portal.** Done, 2026-09-01: `dashboard/ca` (hub), `apply`, `onboard`, `tasks`,
   and `CAHeroSection` / `StatCard` / `ReferralCodeDisplay` / `LeaderboardWidget` /
   `PendingStateView` / `RejectedStateView` all retokenized. Ember-forward, but not
   literally: ember-600 text is AA-safe only at large sizes (§5's own contrast table —
   4.4:1, "large text only"), so it carries the identity on things that qualify —
   page `<h1>`s, the hero title (with the blackletter glow), stat/leaderboard icons,
   badges, the referral code box's dashed border, button hover states — while small
   Cinzel labels and button fills stay on the already-proven-safe crimson-700/bone-100
   pair. `ReferralCodeDisplay`'s copy button now has a real confirmation state (icon +
   "Copied" for 2s, mirroring the pattern already used for the team invite-link copy in
   the registration wizard) — previously it just fired `console.log` with zero UI
   feedback. `PendingStateView` got a next step (a link to `/events` while waiting) —
   `RejectedStateView` already had real copy and a reapply button, nothing to add there.
   Also fixed hardcoded hex along the way: `LeaderboardWidget`'s two `#ffffff` rank-badge
   colors, and `tasks.module.css`'s status-badge colors (`#d97706`/`#059669`/`#dc2626`
   ×3) — those were pending/approved/rejected status colors, mapped onto the existing
   `--warn`/`--ok`/`--err` tokens rather than arbitrary hex.
9. [x] **Admin.** Done, 2026-09-01, at deliberately lower fidelity than Saga/CA — see the
   scope note below. All ~15 sections (the original nine plus `admin/content/team`,
   `admin/content/sponsors`, `admin/content/gallery`, `admin/merch/products`,
   `admin/merch/orders` from the merch merge), `event-form` and `rulebook-manager`
   (shared by the events create/edit pages), and `admin-index` retokenized. Fixed every
   hardcoded status-color hex along the way (`#059669`/`#d97706`/`#dc2626`/`#10b981`/
   `#ef4444`, repeated across payments, ca-applications, and ca-tasks-assignments —
   three near-identical review-card components independently reinvented the same
   approve/reject colors) onto `--ok`/`--warn`/`--err`/`--info`. `admin-sidebar.tsx`
   needed nothing — it already consumes the same tokenized classes as the participant
   `Sidebar`. Also added the five new sections to `admin-index`'s card grid, which had
   drifted out of sync with the sidebar nav since the merch merge.

   **The plan's own `/admin/scans` description is stale.** §10 names `/admin/scans` as
   the phone-at-a-gate scanning screen needing "large targets and unmistakable pass/fail
   feedback" — that was written before `develop`'s gate-scan redesign shipped. In the
   actual codebase, `/admin/scans` is a desk-bound audit log (a table of past scans, for
   admins reviewing history) and the phone-at-the-gate screen is `/scan/[token]` (built in
   that redesign, and already touched once this session to remove its auth gate — see
   below). Themed `/admin/scans` as an ordinary "lowest intensity" admin table instead,
   and gave `/scan/[token]` the dark-screen/large-target/loud-feedback treatment the plan
   actually wanted: `--char-900` ground (`components/ui/card` swapped for a plain `div`
   to sidestep a real cascade-order risk — its own `background` rule and mine are equal
   specificity, so which one wins isn't guaranteed by className order; the credential
   pass sidesteps this the same way), 60px direction-toggle buttons, 56px log button, and
   a result banner filled solid with `--ok`/`--warn` rather than a tinted badge.

   **Scope note.** Per §4/§10, admin is deliberately "lowest theme intensity" — bone
   ground, Inter, Cinzel only in table headers, crimson only for primary/destructive —
   which is a much smaller design surface than Saga or CA got. Given that and the sheer
   size here (~5,300 lines across 15 sections, closer to 3× the CA portal), this pass was
   a faster, more mechanical token/hex-cleanup sweep rather than the bespoke per-page
   polish Saga and CA got — correct and consistent, not hand-tuned. The plan's own
   `data-table` primitive (§9's component table lists it as built in step 4) does not
   actually exist anywhere in the repo; each admin table still hand-rolls its own
   `<table>` markup. They're now visually consistent with each other by convention (same
   `.headCell`/`.bodyRow`/`.cell` recipe copied across files), not by sharing code. A
   real `data-table` component (sticky header, zebra striping, row actions, card-list
   fallback below 640px, per §9) is still a real gap against the acceptance criteria and
   is follow-up work, not something this pass built.
10. [ ] **Polish.** Motion, reduced-motion pass, accessibility audit, Lighthouse, cross-device QA.

**Merged with `develop`, 2026-09-01.** This branch was 10 commits behind and has now been
merged (one conflict in `navbar.tsx` — develop had reintroduced the `status: 'Upcoming'`
badges on Sports/About that were already fixed here; kept the fix, added develop's new
Team/Sponsors/Gallery/Merch links). That brought in merch store, event rulebooks,
team/sponsors/gallery pages, and a gate-scan redesign (`/admin/scans` now works
differently — QR encodes a scan URL, dashboard gated by guard login).

**Legacy alias layer.** `globals.css` (§5, right after the layout tokens) now remaps the
pre-theme placeholder variable names (`--color-bg-primary`, `--color-text-primary`, etc.)
onto the new palette, and the global `h1`/`h2`/`h3` element rules already apply
Grenze Gotisch / Cinzel. This means every page merged in from `develop` inherited correct
*colours* immediately — none of it is visually broken — but several fought the global
heading rules by hardcoding `font-size`/`color`/`font-weight` on class-specificity
selectors, which silently overrides the element-level rules that would otherwise theme
them for free.

**Retheme pass on the four new Saga pages, 2026-09-01.** `team`, `sponsors`, `gallery`,
`merch` (+ `merch/checkout`) had their header/grid CSS rewritten onto the token scale
(matching `about.module.css`/`events.module.css`), the stray `.container` wrapper with
hardcoded padding/`min-height:100vh` removed (`PublicLayout`'s `<main>` doesn't constrain
width — every other Saga page centers its own sections), and heading overrides that fought
the global blackletter/Cinzel rules deleted so `h1`/`h2`/`h3` inherit them. `lint`,
`check-types`, and a manual `curl` against the dev server (port 3001; 3000 turned out to be
a stale API build) confirm all four 200 and render the themed classes. No browser
automation tool was available in this session, so this was verified structurally, not with
an actual screenshot — a real visual pass is still owed before ship.
`merch/checkout` is Forge-tier (behind `AuthGuard`) but was never wrapped in a layout
shell — it renders with no nav/sidebar at all, matching the focused-checkout pattern; left
that structure alone and only retokenized it.

**Retheme pass on the participant dashboard, 2026-09-01.** `/dashboard/events` (the
participant home — `/dashboard` itself is a redirect, see step 7 above),
`/dashboard/events/[slug]`, `/dashboard/teams`, `/dashboard/settings`,
`/dashboard/analytics`, `/dashboard/orders` — same retokenization treatment as the Saga
pages. Forge tier gets a deliberate deviation from Saga here: per §4, Forge component
titles (team names, order cards) use small Cinzel caps instead of inheriting the global
blackletter `h2`, since blackletter repeated across a dense card grid reads as noise, not
identity — only the page's own `h1` stays blackletter. `lint`, `check-types`, and
`next build` (45/45 routes) all pass.

**`/scan/[token]` auth removed, 2026-09-01 — a deliberate product decision, not a theming
change.** This screen (gate QR scan → participant profile) required a logged-in
VOLUNTEER/ADMIN/SUPER_ADMIN both client-side (`AuthGuard`) and server-side
(`identity.controller.ts`'s `GET scan/:token`), and the frontend guard had no return-path
handling — a gate volunteer scanning while logged out was dumped on a bare `/login` and
lost the scan entirely. Asked the user which to fix: the redirect, or drop the auth
requirement outright. They chose to drop it. `GET /identity/scan/:token` is now public —
anyone with the link sees the holder's name/phone/photo/ID with no login. `POST
/identity/scan` (the action that actually logs an entry/exit) is still guarded, since it
attributes the scan to a specific staff member. E2E coverage updated to match
(`identity.e2e-spec.ts`); 16/16 pass.

**Asset inventory, checked 2026-09-01.** `apps/web/public/` currently holds exactly the
files listed in §1's table and nothing else — the 3 `main-*` hero crops and the 12
`event-*.jpg` posters. No art exists yet for merch, rulebooks, team/sponsors/gallery, the
CA portal, or any admin screen. Steps 8–9 and the newly-merged develop pages will ship on
tokens/ornament/`sport-icon` alone (per §7/§9) unless new art is commissioned — don't
re-ask whether banner art is available, it isn't, beyond what's already in `public/`.

Steps 1–5 are the foundation: until they are done, anything built on top will need
reworking. 6 through 9 are independent of each other and can be taken in any order once 5
is in place.

**Known follow-up from the step-6 pass:** a repo-wide scan for hardcoded hex outside
`globals.css` (§13's first acceptance criterion) turned up a large batch still remaining —
all in Forge territory: `login`, `signup`, `forgot-password`, `register`, the CA portal
(`dashboard/ca/**`, `components/ca/**`), and most of the nine admin sections. These belong
to steps 7–9 below, not step 6, so they were left alone this pass.

## 13. Acceptance Criteria

- [ ] `globals.css` is the single source of colour, type, spacing, radius, motion. No
      hardcoded hex outside it — the inline `#f59e0b` badge in `navbar.tsx` goes first.
- [ ] No dark mode, no theme toggle, no `prefers-color-scheme` block.
- [ ] Grenze Gotisch / Cinzel / Inter load via `next/font`; no render-blocking `<link>`.
- [ ] Blackletter never renders below 24px, and never inside a form or table.
- [ ] No emoji used as a sport icon or UI icon anywhere.
- [ ] No text is overlaid on the landing art or on an event poster.
- [ ] Hero ships three art-directed sources; correct crop at 360, 900, and 1440.
- [ ] Every image goes through `next/image`; hero ≤ 220KB, event card ≤ 90KB on the wire.
- [ ] Every poster has a descriptive `alt`; the landing `<h1>` exists and is visually hidden.
- [ ] All 30+ routes have designed loading, empty, and error states.
- [ ] Zero horizontal overflow at 360px on every route.
- [ ] AA contrast throughout; ember never used for normal-size text.
- [ ] Lighthouse mobile ≥ 85 performance, ≥ 95 accessibility on `/` and `/dashboard`.
- [ ] `npm run lint`, `check-types`, `build` pass.

## 14. Open Questions

1. Tailwind stays out and we continue on CSS Modules plus tokens, per issue #3's
   resolution — confirm before step 1.
2. Five sports have no poster. New art, or the fallback card in §8?
3. Do category variants (Volleyball Boys / Women) each get their own poster eventually, or
   permanently share one?
4. Is the source artwork available at higher resolution or as layered files? Being able to
   pull the ridge silhouette and the valknut roundels straight from the source would make
   the ornament set exact rather than redrawn.
5. Teaser site at launch — retire, or keep as a redirect?
6. Are Google Form registrations already collected being migrated, or does the platform
   start clean?
7. Sponsors — do we have logos yet, or does the landing ship without that band?
