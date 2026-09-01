# Plan: local-merch-rulebooks-content-pages — Merch Store, Event Rulebooks, Team/Sponsors/Gallery Pages

## Issue

- Tracker: local (no GitHub issue exists yet — `gh issue list --state all` shows nothing covering merch, rulebooks, or these content pages). Source: a live audit of `mdminhaj-2106/Infinito2k26` (the actual 2024/25 site), requested directly by the user, verified by reading the real router/mounted routes/component code rather than the README.
- Track: api + web (full-stack, three independent verticals)
- Priority: medium-high. Per `[[project-readiness-status]]` the user's own ordering is "finish functional work → design pass → prod"; this is functional work, so it belongs before the design pass, not during it.
- Owner: TBD
- Reviewer: Saad-Manda (backend), Anjney-Lawaniya (frontend)
- Target branch: suggest one branch per phase off `develop` (`feat/content-pages`, `feat/event-rulebooks`, `feat/merch-store`) — each is independently shippable and CONSTITUTION scopes PRs to one unit of work at a time.

## Audit findings this plan is based on (so the "why" survives review)

Cloned and read the actual old repo, not just its README:

- **Merch was never really live.** `Product`/`MerchOrder` Mongoose models + a Razorpay `create-order`/`verify-order` controller exist and are mounted at `/api/v1/merch`, but the live `/merch` page (`Merchandise.jsx`) is a static image gallery linking out to a **Google Form** — it never calls that backend. A second route, `/merchandise` → `SampleMerch/Merch.jsx`, is a page literally titled *"Razorpay Payment Test"* that posts to `/payment/create`/`/payment/verify`, endpoints that don't exist in `app.js` at all. No admin UI ever called `createProducts` either. There is no working reference implementation to port — only a rough data-shape reference.
- **Rulebooks had zero backend**, ever — PDFs were bundled into the frontend build per sport and linked via a `rulebookUrl` prop. Our schema is already ahead: `EventRulebook` exists (`apps/api/prisma/schema.prisma:277-288`) but has no controller/service/admin-UI anywhere (confirmed via repo-wide grep, zero hits).
- **Team page** (`/aboutUs` → `Team.jsx`) is one flat, categorized list — ~30 people tagged by department (Fest Coordinator, Media & PR, Sponsorship, Registration, Hospitality, E-sports, Creatives & Design, TV Team, **Web Development** (2 people)). Not two separate "devs" vs "everyone" pages.
- **Sponsors** (`/sponsor`) and **Gallery/Updates** (`/gallery`, `/update`) are real, live pages with no equivalent anywhere in our current app.
- **Homepage** is much smaller than advertised — video hero, a fade-in about blurb, a 7-item hardcoded event-icon carousel, contact footer. `framer-motion`/`canvas-confetti` are used only on the Auth page; `vanilla-tilt` only on Sponsor/Gallery cards. Homepage is explicitly **out of scope for this plan** — it's the already-queued visual/design pass, not a new feature.

## Relationship to `feature/ui-design` (checked via `git log`/`git show`, not assumed)

A real, detailed visual redesign ("Ruins of Ragnarok", `.claude/plans/ui-design-ruins-of-ragnarok.md` on that branch) is in progress on `origin/feature/ui-design`, unmerged. It fast-forward-merged this branch's work through `bd6c872` already, so it is not stale. Its own build-order checklist shows exactly what's done:

- **Done (Saga tier — public/marketing):** tokens/fonts, ornament/icons, image pipeline, restyled `ui/` primitives, navbar/footer/shells, and full passes on `/`, `/sports`, `/events`, `/about`, `/leaderboard`, and the legal pages.
- **Not done (Forge tier — product surfaces) and explicitly flagged as follow-up in that plan:** auth screens, the registration wizard, credential pass, CA portal, and **all nine admin sections** — these still have hardcoded hex and no themed pass at all.
- **Not done:** step 10, "Polish" (motion, reduced-motion, accessibility audit, Lighthouse) — the whole thing is pre-polish.

**Two consequences for this plan:**

1. **`/about` is already spoken for** — the design branch rebuilt it as a themed "fest story" page (voice + Ruins of Ragnarok framing + a stat band), not a team/committee roster. This plan must NOT repurpose `/about` for the Team page (an earlier draft of this plan said otherwise — corrected below); the Team page needs its own route, `/team`.
2. **None of Phase 1–3's new screens should get bespoke visual treatment now.** Every new page/admin screen in this plan ships using the current unstyled `ui/` primitives and CSS-module conventions as-is (matching how e.g. `/scan/[token]` was just built) — not because design doesn't matter, but because the real system already exists one branch over and is still being extended into exactly this territory (admin sections, new product surfaces). Final visual polish for all of it — the new Team/Sponsors/Gallery/Merch pages and their admin screens — happens when `feature/ui-design`'s Forge-tier and Polish steps reach them, not as part of this plan. Building bespoke styling here now would mean redoing it to the theme later, or conflicting with it outright.

## Outcome

- Admin can create/edit sponsors, committee/team members, and gallery items from the admin panel; two new public pages (`/team`, `/sponsors`) and one new page (`/gallery`) render them. `/about` is untouched — it already carries real, intentional content from `feature/ui-design`.
- Admin can attach a rulebook to any event, either by pasting an external link (e.g. Google Drive) or uploading a file directly to Cloudinary; the event detail page shows a "View Rulebook" link when one exists.
- A logged-in user can browse merch products, add sized items to a cart, and check out using the **same manual-payment flow as event registrations** (submit a UPI screenshot + transaction ID, admin reviews and approves/rejects) — no Razorpay, no new payment gateway. Admin can create/edit products and see/fulfil orders (mark shipped/delivered/cancelled).
- `npm run lint && npm run check-types && npm run build && npm run test --workspace=api && npm run test:e2e --workspace=api` all pass after each phase.
- `.claude/reference/architecture.md`, `.claude/reference/api.md`, `.claude/reference/database.md` updated for the two new modules (`content`, `merch`) and the `EventRulebook`/`Brand` endpoints.

## Scope

**In:**
- Phase 1 — Content module: `TeamMember`, `GalleryItem` models (new); extend existing `Brand` with a `tier` field instead of creating a duplicate `Sponsor` model. Admin CRUD + three public pages.
- Phase 2 — Event Rulebooks: controller/service for the existing `EventRulebook` model, admin UI (link-or-upload, mirroring the existing CA task proof pattern), public display.
- Phase 3 — Merch store: `Product`, `MerchOrder` models (new). Admin product CRUD + order fulfillment. Public storefront, cart, checkout via the existing manual-screenshot payment pattern (not the `Payment` table itself — see Risks for why).

**Out:**
- Homepage redesign, visual/theme pass, dark mode, mobile breakpoints — already queued separately per `[[project-readiness-status]]`.
- Any Razorpay/payment-gateway integration — architecture.md is explicit that Payments today is "Manual UPI screenshot submission + admin verification (no gateway)"; this plan does not change that for merch either, per the user's explicit instruction to reuse the registration flow "same as the registrations like only."
- Per-size inventory counts (e.g. "3 Mediums left") — old site only had a single `inStock` boolean per product; matching that, not inventing granular stock tracking that was never asked for.
- CA `Brand`'s existing CA-task relationship/behavior — only additive fields, no changes to `CaTask`/`CATaskAssignment` flows.

## Files to Read First

- `apps/api/prisma/schema.prisma:277-288` (`EventRulebook`), `:430-445` (`Brand`), `:590-625` (`Payment`, `Credential` — for the shape/pattern, not to be modified) — current schema this plan extends.
- `apps/api/src/payments/payments.service.ts` and `admin-payments.controller.ts` — the exact compare-and-swap + manual-screenshot-review pattern Merch checkout must mirror.
- `apps/api/src/ca/ca.service.ts:120-155` — the existing "URL or uploaded file, whichever is provided" validation pattern (`new URL(proofUrl)`, http/https scheme check, `finalProofUrl = proofUrl || fileUrl`) to reuse verbatim for rulebooks.
- `apps/api/src/uploads/uploads.service.ts` — `uploadProof(buffer, mimeType, folder)`, reused as-is for rulebook files and product images.
- `apps/api/src/events/events.service.ts`, `admin-events.controller.ts` — CRUD + admin-guard pattern to mirror for Products/TeamMembers/GalleryItems/Sponsors.
- `apps/web/app/admin/events/new/page.tsx`, `apps/web/app/admin/events/[id]/edit/page.tsx` — admin form + file-upload UI convention to mirror.
- `apps/web/components/layout/navbar.tsx` — `NAV_ITEMS` array. On *this* branch `/about` is still flagged `status: 'Upcoming'` (an 18-line stub) — but `feature/ui-design` has already replaced it with a real themed page, and that branch already fast-forward-merged this one's history. Do not touch the `About` nav entry or `apps/web/app/about/page.tsx` at all; add `Team`/`Sponsors`/`Gallery` as new entries alongside it and let the eventual branch merge reconcile whichever `about/page.tsx` wins.
- `apps/web/app/dashboard/events/[slug]/page.tsx` — public event detail page, where the rulebook link is added.
- `.claude/reference/architecture.md` §3 Backend Modules — module table to extend with `Content` and `Merch`.

## Files to Change

**Phase 1 (Content):**
- `apps/api/prisma/schema.prisma` — add `TeamMember`, `GalleryItem` models; add `tier SponsorTier?` (new enum: `TITLE | GOLD | SILVER | BRONZE | ASSOCIATE`) and `isPubliclyListed Boolean @default(true)` to `Brand`.
- `apps/api/prisma/migrations/<ts>_add_content_models/`
- `apps/api/src/content/content.module.ts`, `content.controller.ts` (public), `admin-content.controller.ts`, `content.service.ts`, `dto/content.dto.ts`, `content.service.spec.ts` — new.
- `apps/api/src/app.module.ts` — register `ContentModule`.
- `apps/web/app/team/page.tsx` (+ `team.module.css`) — new Team/committee page (not `/about` — see above).
- `apps/web/app/sponsors/page.tsx`, `apps/web/app/gallery/page.tsx` — new.
- `apps/web/app/admin/content/team/page.tsx`, `apps/web/app/admin/content/sponsors/page.tsx`, `apps/web/app/admin/content/gallery/page.tsx` — new admin CRUD screens.
- `apps/web/components/layout/navbar.tsx`, `admin-sidebar.tsx` — add nav entries, drop the `'Upcoming'` badge on About.

**Phase 2 (Rulebooks):**
- `apps/api/src/identity/...` — not touched; rulebooks live in `EventsModule`, not Identity (module-boundary correctness: rulebooks belong to Events, credentials to Identity).
- `apps/api/src/events/rulebooks.controller.ts`, `admin-rulebooks.controller.ts`, add rulebook methods to `events.service.ts` (or a small `rulebooks.service.ts` if `events.service.ts` is already large — check line count first), `dto/rulebooks.dto.ts`.
- `apps/api/src/events/events.module.ts` — register the new controller(s).
- `apps/web/app/admin/events/[id]/edit/page.tsx` — add the link-or-upload rulebook control.
- `apps/web/app/dashboard/events/[slug]/page.tsx` — render "View Rulebook" when present.
- `.claude/reference/api.md` §Events — document the new endpoints.

**Phase 3 (Merch):**
- `apps/api/prisma/schema.prisma` — add `Product`, `MerchOrder`, `MerchOrderStatus` enum, `MerchPaymentStatus` enum (mirroring `PaymentStatus`'s subset actually needed: `INITIATED | RECONCILIATION_PENDING | SUCCESS | FAILED`).
- `apps/api/prisma/migrations/<ts>_add_merch_models/`
- `apps/api/src/merch/merch.module.ts`, `merch.controller.ts` (public catalog + own orders), `admin-merch.controller.ts` (product CRUD + order list/fulfillment), `merch.service.ts`, `dto/merch.dto.ts`, `merch.service.spec.ts` — new.
- `apps/api/src/app.module.ts` — register `MerchModule`.
- `apps/api/src/identity/jobs/` — no change (merch orders don't issue QR credentials).
- `apps/web/app/merch/page.tsx` (storefront + cart), `apps/web/app/merch/checkout/page.tsx` (shipping details + screenshot upload), `apps/web/app/dashboard/orders/page.tsx` (order history) — new.
- `apps/web/app/admin/merch/products/page.tsx`, `apps/web/app/admin/merch/orders/page.tsx` — new admin screens.
- `.claude/reference/api.md`, `.claude/reference/database.md`, `.claude/reference/architecture.md` — document the new module.

## Implementation Steps

### Phase 1 — Content (Team / Sponsors / Gallery)

#### Step 1: Schema — `TeamMember`, `GalleryItem`, extend `Brand`

- **What:** `TeamMember { id, name, department String, role String?, photoUrl String?, displayOrder Int @default(0), createdAt, updatedAt }` — `department` is the grouping key (e.g. "Web Development Coordinators"), matching how the old site actually organized the page; no separate "isDev" flag needed since department already distinguishes it. `GalleryItem { id, imageUrl String, caption String?, publishedAt DateTime @default(now()), createdAt }`. Add `tier SponsorTier?` and `isPubliclyListed Boolean @default(true)` to the existing `Brand` model rather than creating a new `Sponsor` model — `Brand` already has `name`/`logoUrl`/`isActive`, which is exactly a sponsor's public-facing shape; a second entity for the same real-world thing would be duplication CONSTITUTION doesn't call for.
- **Files:** `apps/api/prisma/schema.prisma`
- **Validation:** `npx prisma migrate dev --name add_content_models --schema=apps/api/prisma/schema.prisma && npx prisma generate --schema=apps/api/prisma/schema.prisma`

#### Step 2: Content DTOs + service

- **What:** `CreateTeamMemberDto`/`UpdateTeamMemberDto`, `CreateGalleryItemDto`, `UpdateBrandTierDto` (`{ tier, isPubliclyListed }`, PATCHed onto the existing admin Brand endpoints — check `admin.controller.ts` for whether brand CRUD already lives there before adding a duplicate route). `ContentService`: `listTeamMembers()` (public, grouped by `department`, ordered by `displayOrder`), `listGalleryItems()` (paginated, newest first), `listPublicSponsors()` (`Brand` where `isPubliclyListed: true`, ordered by `tier`), plus admin create/update/delete for each.
- **Files:** `apps/api/src/content/dto/content.dto.ts`, `apps/api/src/content/content.service.ts`
- **Validation:** `npm run test --workspace=api -- content.service`

#### Step 3: Content controllers

- **What:** `ContentController` — `GET /team`, `GET /gallery`, `GET /sponsors`, all public, paginated where it's a list. `AdminContentController` — `POST/PATCH/DELETE /admin/team`, `/admin/gallery`, guarded `ADMIN`/`SUPER_ADMIN` like every other admin controller.
- **Files:** `apps/api/src/content/content.controller.ts`, `apps/api/src/content/admin-content.controller.ts`, `apps/api/src/content/content.module.ts`, `apps/api/src/app.module.ts`
- **Validation:** `npm run test --workspace=api -- content`

#### Step 4: Public pages

- **What:** New `apps/web/app/team/page.tsx` fetching `GET /team` and rendering grouped-by-department cards (name, role, photo) — a new route, not `/about` (that route already carries real content on `feature/ui-design`; see the relationship note above). New `apps/web/app/sponsors/page.tsx` (tiered grid, `GET /sponsors`) and `apps/web/app/gallery/page.tsx` (photo grid, `GET /gallery`), following the CSS-module + `Card` component conventions used by `apps/web/app/dashboard/credential/page.tsx`. Plain/unstyled-baseline only — no bespoke visual design (see relationship note: final polish happens on `feature/ui-design`).
- **Files:** `apps/web/app/team/page.tsx`, `apps/web/app/team/team.module.css`, `apps/web/app/sponsors/page.tsx`, `apps/web/app/gallery/page.tsx` (+ their `.module.css`)
- **Validation:** `npm run build --workspace=web`, manual click-through per `[[feedback-click-test-navigation]]`

#### Step 5: Admin CRUD screens

- **What:** Three simple admin list+form pages (team members, gallery items, sponsor tier editing on the existing Brands admin view if one exists — check first), mirroring `apps/web/app/admin/events/new/page.tsx`'s form conventions and file-upload pattern for photos.
- **Files:** `apps/web/app/admin/content/team/page.tsx`, `apps/web/app/admin/content/gallery/page.tsx`, `apps/web/components/layout/admin-sidebar.tsx` (add nav entries)
- **Validation:** `npm run build --workspace=web`, manual admin walkthrough (create → appears on public page → edit → delete)

#### Step 6: Nav wiring

- **What:** Add `Team`, `Sponsors`, and `Gallery` to `NAV_ITEMS` in `navbar.tsx`. Leave the existing `About` entry exactly as-is (including its `'Upcoming'` badge) — it's stale only on this branch, not on `feature/ui-design`, and touching it here just creates another merge conflict on the same line that branch already resolved once.
- **Files:** `apps/web/components/layout/navbar.tsx`
- **Validation:** manual — every nav link resolves, mobile menu included (per `[[feedback-click-test-navigation]]`, don't just hit the URL directly)

---

### Phase 2 — Event Rulebooks

#### Step 7: Rulebook DTOs + service methods

- **What:** `CreateRulebookDto { title: string, version?: string, fileUrl?: string }` (file comes via `multipart/form-data` alongside this, same split as `CATaskAssignment.proofUrl` vs uploaded file). Add to `EventsService` (or a co-located small service if `events.service.ts` is already large): `addRulebook(eventId, dto, adminId, file?)` — validates `fileUrl` scheme exactly like `ca.service.ts:134-145` (`new URL()`, http/https only) when a link is pasted instead of a file, requires exactly one of `fileUrl` or `file` (mirroring `finalProofUrl = proofUrl || fileUrl`, `BadRequestException` if neither), uploads via `UploadsService.uploadProof(buffer, mime, 'rulebooks')` when a file is given. `listRulebooks(eventId)`, `deleteRulebook(id, adminId)`.
- **Files:** `apps/api/src/events/dto/rulebooks.dto.ts`, `apps/api/src/events/events.service.ts` (or new `rulebooks.service.ts`)
- **Validation:** `npm run test --workspace=api -- events`

#### Step 8: Rulebook endpoints

- **What:** `GET /events/:slug/rulebooks` (public, list), `POST /admin/events/:id/rulebooks` (admin, multipart — either `fileUrl` field or `file` upload), `DELETE /admin/rulebooks/:id` (admin). Guarded the same as every other admin-events route (`ADMIN`/`SUPER_ADMIN`).
- **Files:** `apps/api/src/events/events.controller.ts`, `apps/api/src/events/admin-events.controller.ts`
- **Validation:** `npm run test:e2e --workspace=api -- events` (or wherever the events e2e spec lives — check filename first)

#### Step 9: Admin UI — link-or-upload control

- **What:** On the event edit page, a small form: a text input for an external link (e.g. paste a Google Drive share URL) OR a file picker for direct upload — mutually exclusive, matching the backend's "exactly one of" rule. List existing rulebooks for the event with a delete button.
- **Files:** `apps/web/app/admin/events/[id]/edit/page.tsx`
- **Validation:** `npm run build --workspace=web`, manual: upload a file, paste a link, confirm both produce a working "View Rulebook" link, confirm submitting both or neither is rejected client-side too

#### Step 10: Public display

- **What:** On the event detail page, show a "View Rulebook" link (opens in new tab) when `GET /events/:slug/rulebooks` returns at least one row — pick the latest by `createdAt` if multiple, or list all if the admin attaches more than one version.
- **Files:** `apps/web/app/dashboard/events/[slug]/page.tsx`
- **Validation:** manual click-through on a real event with a rulebook attached

---

### Phase 3 — Merch Store

#### Step 11: Schema — `Product`, `MerchOrder`

- **What:**
  ```
  model Product {
    id          String   @id @default(uuid()) @db.Uuid
    name        String
    description String?
    price       Decimal  @db.Decimal(10, 2)
    sizesAvailable String[] // e.g. ["S","M","L","XL","XXL"]; empty = one-size
    inStock     Boolean  @default(true)
    imageUrls   String[]
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    deletedAt   DateTime?

    orderItems  MerchOrderItem[]
  }

  model MerchOrder {
    id                String            @id @default(uuid()) @db.Uuid
    userId            String            @db.Uuid
    shippingName      String
    shippingPhone     String
    shippingAddress   String
    shippingPincode   String
    totalAmount       Decimal           @db.Decimal(10, 2)
    status            MerchOrderStatus  @default(PENDING_PAYMENT)
    // Manual-payment fields, same shape as Payment (see Risks: why a parallel
    // set of fields instead of reusing the Payment table).
    paymentStatus     PaymentStatus     @default(INITIATED)
    screenshotUrl     String?
    transactionId     String?
    rejectionReason   String?
    idempotencyKey    String            @unique
    createdAt         DateTime          @default(now())
    updatedAt         DateTime          @updatedAt

    user  User @relation(fields: [userId], references: [id])
    items MerchOrderItem[]

    @@index([userId])
    @@index([paymentStatus])
  }

  model MerchOrderItem {
    id               String  @id @default(uuid()) @db.Uuid
    merchOrderId     String  @db.Uuid
    productId        String  @db.Uuid
    size             String?
    quantity         Int
    priceAtPurchase  Decimal @db.Decimal(10, 2)

    merchOrder MerchOrder @relation(fields: [merchOrderId], references: [id])
    product    Product    @relation(fields: [productId], references: [id])
  }

  enum MerchOrderStatus {
    PENDING_PAYMENT
    CONFIRMED
    SHIPPED
    DELIVERED
    CANCELLED
  }
  ```
  Reuses the existing `PaymentStatus` enum (already `INITIATED | RECONCILIATION_PENDING | SUCCESS | FAILED | REFUNDED`) rather than inventing a near-duplicate — see Risks for the one open question this raises.
- **Files:** `apps/api/prisma/schema.prisma`
- **Validation:** `npx prisma migrate dev --name add_merch_models --schema=apps/api/prisma/schema.prisma && npx prisma generate --schema=apps/api/prisma/schema.prisma`

#### Step 12: Product DTOs + admin service

- **What:** `CreateProductDto`/`UpdateProductDto` (name, description?, price, sizesAvailable?, inStock?, imageUrls). `MerchService.createProduct`, `updateProduct`, `listProducts()` (public: `inStock` products only unless admin; admin: all including soft-deleted filter).
- **Files:** `apps/api/src/merch/dto/merch.dto.ts`, `apps/api/src/merch/merch.service.ts`
- **Validation:** `npm run test --workspace=api -- merch.service`

#### Step 13: Order creation (mirrors `POST /registrations`)

- **What:** `createOrder(userId, dto)` — `dto.items: [{ productId, size?, quantity }]`. Server-computes `totalAmount` from live `Product.price` (never trust client-supplied amounts, same rule as registration fees), rejects if any `productId` is `!inStock`. Creates `MerchOrder` (`status: PENDING_PAYMENT`, `paymentStatus: INITIATED`) + its `MerchOrderItem` rows in one `$transaction`, exactly mirroring `RegistrationsService`'s "create registration + stub payment atomically" step.
- **Files:** `apps/api/src/merch/merch.service.ts`, `apps/api/src/merch/dto/merch.dto.ts`
- **Validation:** `npm run test --workspace=api -- merch.service`

#### Step 14: Payment submission (mirrors `POST /payments`)

- **What:** `submitOrderPayment(userId, orderId, dto, file)` — same shape as `PaymentsService.submitPayment`: ownership check (`order.userId === userId`), status must be `PENDING_PAYMENT`/`paymentStatus: INITIATED`, uploads screenshot via `UploadsService.uploadProof(..., 'merch-payment-proof')`, idempotent on `idempotencyKey`, moves `paymentStatus` to `RECONCILIATION_PENDING` via compare-and-swap (`updateMany` + count check, identical pattern to `payments.service.ts:105-119`).
- **Files:** `apps/api/src/merch/merch.service.ts`
- **Validation:** `npm run test --workspace=api -- merch.service`

#### Step 15: Admin order verification (mirrors `PATCH /admin/payments/:id/verify`)

- **What:** `verifyOrderPayment(orderId, dto, adminId)` — compare-and-swap `paymentStatus: RECONCILIATION_PENDING → SUCCESS|FAILED`; on `SUCCESS`, also flips `MerchOrder.status: PENDING_PAYMENT → CONFIRMED` in the same transaction. No BullMQ job needed here (unlike registrations, a confirmed merch order doesn't trigger QR issuance) — but do send a confirmation email async via the existing Notifications queue if one exists for this kind of event, otherwise skip (don't build a new email template unless asked). Separately: `updateOrderStatus(orderId, status)` for `CONFIRMED → SHIPPED → DELIVERED` (or `CANCELLED`), admin-only, simple transition guard (no shipping backward).
- **Files:** `apps/api/src/merch/merch.service.ts`
- **Validation:** `npm run test --workspace=api -- merch.service`

#### Step 16: Controllers

- **What:** `MerchController` (public: `GET /merch/products`, `GET /merch/products/:id`; authenticated: `POST /merch/orders`, `POST /merch/orders/:id/payment` (multipart, `FileInterceptor` like `PaymentsController`), `GET /merch/orders/mine`). `AdminMerchController` (`POST/PATCH /admin/merch/products`, `GET /admin/merch/orders` (paginated, filter by `paymentStatus`/`status`, mirroring `AdminPaymentsController.listPayments`), `PATCH /admin/merch/orders/:id/verify`, `PATCH /admin/merch/orders/:id/status`).
- **Files:** `apps/api/src/merch/merch.controller.ts`, `apps/api/src/merch/admin-merch.controller.ts`, `apps/api/src/merch/merch.module.ts`, `apps/api/src/app.module.ts`
- **Validation:** `npm run test:e2e --workspace=api -- merch`

#### Step 17: Storefront + cart (frontend)

- **What:** `/merch` — product grid (image, name, price, size selector, add-to-cart), cart state in `localStorage` or React context (no backend cart entity needed — cart only becomes real once `POST /merch/orders` is called, matching how registration has no "draft" state either).
- **Files:** `apps/web/app/merch/page.tsx` (+ `.module.css`), a small cart context/hook alongside it
- **Validation:** `npm run build --workspace=web`, manual: add items, adjust quantity/size, cart persists across reload

#### Step 18: Checkout (frontend)

- **What:** Shipping details form → `POST /merch/orders` → shows computed total + UPI QR/VPA (reuse whatever component the registration payment page already uses for this) → screenshot + transaction ID upload → `POST /merch/orders/:id/payment`.
- **Files:** `apps/web/app/merch/checkout/page.tsx`
- **Validation:** manual end-to-end: place order → submit proof → check it lands in admin queue

#### Step 19: Order history (frontend)

- **What:** `/dashboard/orders` — list the user's own orders with status, mirroring `apps/web/app/dashboard/credential/page.tsx`'s data-fetch/empty-state conventions.
- **Files:** `apps/web/app/dashboard/orders/page.tsx`
- **Validation:** manual

#### Step 20: Admin product + order management (frontend)

- **What:** Product create/edit form (mirroring `admin/events/new`), order list with the same Pending/Confirmed/Shipped/Delivered tabbed pattern used on `admin/payments` (see `[[project-readiness-status]]` — that page was recently fixed for exactly this "tabs, don't just show one status forever" bug; don't repeat it here), verify/reject action, status-transition buttons.
- **Files:** `apps/web/app/admin/merch/products/page.tsx`, `apps/web/app/admin/merch/orders/page.tsx`
- **Validation:** `npm run build --workspace=web`, manual admin walkthrough

## Tests and Validation

```bash
# Validation gate from CONSTITUTION.md — run after EACH phase, not just at the end
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
npm run test:e2e --workspace=api
```

Unit tests required per phase:
- Content: list/create/update/delete for each of the three entities; `Brand` tier update.
- Rulebooks: URL-scheme validation (reject non-http/https, reject malformed), "exactly one of fileUrl/file" guard, admin-only guard.
- Merch: fee computed server-side (client-supplied amount ignored), stock check on order creation, idempotent payment submission (replay returns same result), compare-and-swap on verify (concurrent verify attempts → one wins, one 409s), order-status transition guard (can't go DELIVERED → PENDING_PAYMENT).

E2E tests required: at minimum one full merch happy path (browse → order → submit payment → admin verifies → order shows CONFIRMED), mirroring the shape of `identity.e2e-spec.ts`/`payments` e2e specs already in the repo.

## Acceptance Criteria

- [ ] Admin can add/edit/remove team members, sponsors (tier), and gallery items; they appear on `/team`, `/sponsors`, `/gallery` respectively.
- [ ] Admin can attach a rulebook to an event via either a pasted link or a direct upload, not both/neither; it appears as "View Rulebook" on the public event page.
- [ ] A user can complete a full merch purchase using the same manual-screenshot payment flow as event registration, and see their order's status update after admin review.
- [ ] Admin can manage products and move orders through Confirmed → Shipped → Delivered (or Cancel).
- [ ] All validation gate commands pass.
- [ ] `.claude/reference/architecture.md`, `api.md`, `database.md` reflect the two new modules.

## Risks and Notes

- **Data migration:** three new models in Phase 1, one new model + two Brand fields in Phase 3, one new controller (no schema change) in Phase 2. All additive — no existing column changes, no backfill needed.
- **API contract change:** additive only (new endpoints). No existing endpoint's request/response shape changes.
- **Design decision — Merch payment is a parallel field set, not a reused `Payment` row.** `Payment.registrationId` is a required (non-nullable) FK — it cannot represent a merch order without either making it polymorphic (touching already-shipped, well-tested registration-payment code and its e2e suite) or adding a nullable second FK column to a table that's currently a clean 1:1 with `Registration`. This plan instead gives `MerchOrder` its own `paymentStatus`/`screenshotUrl`/`transactionId`/`idempotencyKey` fields, reusing the existing `PaymentStatus` **enum** (not the table) and copying the exact service-layer pattern (compare-and-swap, idempotency replay) from `PaymentsService`. This matches CONSTITUTION's module-boundary rule ("modules do not reach into another module's internals") at the cost of some field duplication. **Flagging for explicit sign-off before Phase 3 starts** — the alternative (polymorphic `Payment`) is real and someone senior should choose deliberately, not by default.
- **Design decision — `Brand` extended for Sponsors instead of a new `Sponsor` model.** Lower-risk, additive-only choice; flagging in case Brand's CA-task semantics are considered a reason to keep them fully separate.
- **Unknowns:**
  - Whether `events.service.ts` is already large enough to warrant a separate `rulebooks.service.ts` — check line count during Step 7, not now.
  - Whether Notifications module already has an order/payment-confirmation email template to reuse for Step 15, or whether email is out of scope for v1 (recommend: out of scope, don't build a new template unless asked — matches ponytail/YAGNI).
  - Exact UI for size selection when `Product.sizesAvailable` is empty (one-size items) — trivial, resolve during Step 17.
  - Shipping cost handling (old site had a flat `deliveryCharge`) — not in this plan's scope unless confirmed; flagging so it isn't silently dropped or silently added.
