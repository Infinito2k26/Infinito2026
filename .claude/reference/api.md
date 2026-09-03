# Infinito API Reference

## 1. Global Standards

Base path: `/api`

Headers:

- `Content-Type: application/json`
- `Authorization: Bearer <accessToken>` for authenticated endpoints
- `X-Request-Id` returned by the API for traceability

Success envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

Error envelope:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Human-readable error",
    "details": {}
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

## 2. Status Codes

| Code | Use                                                          |
| ---- | ------------------------------------------------------------ |
| 200  | Successful read/update                                       |
| 201  | Created                                                      |
| 202  | Accepted async work                                          |
| 400  | Invalid request                                              |
| 401  | Missing/invalid authentication                               |
| 403  | Authenticated but not authorized                             |
| 404  | Resource not found                                           |
| 409  | Duplicate registration, idempotency conflict, state conflict |
| 422  | Valid JSON with invalid domain state                         |
| 429  | Rate limited                                                 |
| 500  | Unexpected server error                                      |

## 3. MVP Endpoint Map

### Health

| Method | Path      | Access | Purpose                                      |
| ------ | --------- | ------ | --------------------------------------------- |
| GET    | `/health` | Public | Liveness/readiness probe: DB + Redis status |

Response `data` shape:

```json
{
  "status": "ok",
  "checks": { "db": "ok", "redis": "ok" }
}
```

`status` is `"degraded"` (never a 5xx) when any dependency check fails; the corresponding `checks` entry becomes `"error"`.

### Auth

| Method | Path             | Access         | Purpose                               |
| ------ | ---------------- | -------------- | ------------------------------------- |
| POST   | `/auth/register` | Public         | Create account                        |
| POST   | `/auth/login`    | Public         | Issue access token and refresh cookie |
| POST   | `/auth/refresh`  | Refresh cookie | Rotate refresh token                  |
| DELETE | `/auth/logout`   | Authenticated  | Revoke session                        |
| GET    | `/auth/me`       | Authenticated  | Current user                          |
| POST   | `/auth/forgot-password` | Public | Request a 6-digit reset code by email (enumeration-safe: always 200) |
| POST   | `/auth/reset-password`  | Public | Consume the code, set new password |
| POST   | `/auth/verify-email` | Public | Consume a verification token, set `isEmailVerified = true` |
| POST   | `/auth/resend-verification` | Public | Re-send the verification email (enumeration-safe: always 200) |

`register` queues a verification email automatically (skipped for `isIITPVerified` users). `POST /payments` (registration payment submission) rejects with 403 for a payer who is neither `isEmailVerified` nor `isIITPVerified`.

`POST /auth/forgot-password`: body `{ email }`. `POST /auth/reset-password`: body `{ email, code, newPassword }` — `code` is the 6-digit string emailed by the first call, checked against the most recent unexpired, unused `PasswordResetToken` for that email. A wrong code increments `PasswordResetToken.failedAttempts`; 5 wrong codes locks that token out (400) even if the correct code is later supplied — request a new one via `forgot-password` again. This is link-free by design: an OTP typed back in sidesteps two failure modes a reset link has — email security scanners auto-clicking (and burning) a single-use link, and a link opened on a different device than the one mid-login-flow. Email verification (`verify-email`) stays link-based, since it's a one-time confirm-you-own-this-inbox action rather than something the user needs to transcribe.

### Site Settings

| Method | Path                       | Access | Purpose                                                |
| ------ | -------------------------- | ------ | ------------------------------------------------------- |
| GET    | `/settings`                | Public | Payment config + fest dates, editable without a deploy |
| PATCH  | `/admin/settings/payment`  | Admin  | Update UPI VPA/payee name and/or the QR image          |
| PATCH  | `/admin/settings/fest-dates` | Admin | Update fest start/end, registration-close, date-range label |

`GET /settings` returns nulls for every field until an admin first sets them
via the two `PATCH` endpoints below (see `SiteSettings` in `database.md`).
Frontend consumers (`UpiPaymentSection`'s callers, the landing page's
countdown) fall back to their previous hardcoded constants when a field comes
back null.

`PATCH /admin/settings/payment`: multipart form, `upiVpa?`, `upiPayeeName?`,
`qrImage?` (image file, max 5 MB, `image/jpeg`/`image/png`/`image/webp`, via
the shared `UploadsService`). Only the fields present in the body are
updated; omitting `qrImage` preserves the existing image.

`PATCH /admin/settings/fest-dates`: JSON body, `festStartAt?`/`festEndAt?`/
`registrationCloseAt?` (ISO 8601), `dateRangeLabel?` (display string).

`login` and `refresh` both reject (403) when the user's `bannedAt` is set (see `User` in `database.md`); `refresh` also revokes the session before rejecting, so a banned user's refresh token stops working immediately. An already-issued access token still works until it naturally expires (default 15m) — there's no per-request DB check in the JWT strategy.

### Admin User Management

| Method | Path                       | Access | Purpose                                                |
| ------ | -------------------------- | ------ | ------------------------------------------------------- |
| GET    | `/admin/users`               | Admin (ADMIN_USERS read)  | Search/filter/paginate all users                       |
| GET    | `/admin/users/:id`           | Admin (ADMIN_USERS read)  | Full cross-entity detail: registrations, teams, CA profile/applications, credentials + scan history, merch orders |
| PATCH  | `/admin/users/:id/role`      | ADMIN/SUPER_ADMIN only    | Change a user's base `UserRole`                        |
| PATCH  | `/admin/users/:id/custom-role` | SUPER_ADMIN only        | Assign/unassign a `CustomRole` (`{ customRoleId: string \| null }`) |
| PATCH  | `/admin/users/:id/status`    | Admin (ADMIN_USERS write) | Ban or unban a user (`{ banned: boolean }`)             |

`GET /admin/users`: query `page`/`limit` (default 20, max 100), `search`
(matches name/email/college, case-insensitive substring), `role` (one of
`UserRole`, 400 if invalid). Each row includes `customRole: { id, name } | null`
so the admin UI can show a user's assigned custom role alongside their base
`UserRole` — without it, a custom-role assignment has no visible effect on
this list (the base `role` column never changes).

`role` and `status` `PATCH` endpoints share the same guards: an admin cannot
act on their own account (403), every change writes an `AdminAuditLog` row
(actor, target, before/after), and the target's refresh-token session is
revoked immediately (`RefreshTokenStore.revoke`) so the change takes effect
without waiting for their access token to expire. `PATCH .../role`
additionally rejects (403) demoting the last remaining `SUPER_ADMIN` —
checked by counting other `SUPER_ADMIN` rows before applying the change.
`PATCH .../custom-role` is intentionally restricted to `SUPER_ADMIN` — see
"Admin Roles & Permissions" below.

### Admin Roles & Permissions

`SUPER_ADMIN`/`ADMIN` always have unrestricted access to every admin
endpoint below — the permission system is additive, not a replacement.
A `CustomRole` grants any user (including a `PARTICIPANT`) scoped
read/write/delete access to one or more admin services without promoting
them to `ADMIN`. A user holds at most one `CustomRole` at a time
(`User.customRoleId`).

| Method | Path                | Access       | Purpose                                    |
| ------ | ------------------- | ------------ | ------------------------------------------- |
| GET    | `/admin/roles`      | SUPER_ADMIN  | List roles with their permissions           |
| GET    | `/admin/roles/:id`  | SUPER_ADMIN  | Role detail                                 |
| POST   | `/admin/roles`      | SUPER_ADMIN  | Create a role + its permission set          |
| PATCH  | `/admin/roles/:id`  | SUPER_ADMIN  | Update name/description/permissions         |
| DELETE | `/admin/roles/:id`  | SUPER_ADMIN  | Soft-delete a role (409 if still assigned to any user) |

`POST`/`PATCH` body: `{ name: string; description?: string; permissions: { service: AdminService; canRead: boolean; canWrite: boolean; canDelete: boolean }[] }`.
`AdminService` values: `EVENTS`, `REGISTRATIONS`, `PAYMENTS`, `MERCH`,
`TEAMS`, `CONTENT` (the "Team" org-bio page — not the whole Content module),
`GALLERY`, `IDENTITY` (Gate Scans), `SETTINGS`, `CA` (CA tasks/applications),
`SPONSORS` (the Brand model — sponsor tiers/public listing), `LEADS`,
`LEADERBOARD`, `UPLOADS`, `ADMIN_USERS`. `CONTENT`/`GALLERY` and `CA`/`SPONSORS`
were deliberately split even though `GalleryItem` lives in the same module as
team bios, and `Brand` is shared between the CA program and the public
Sponsors page — each pairing is a distinct concern an admin may want to grant
separately (e.g. a role that edits Gallery but not the org's Team bios).

Enforcement: `PermissionsGuard` + `@RequirePermission(service, action)`
decorate individual handlers (GET→read, POST/PATCH/PUT→write, DELETE→delete)
in place of the old controller-wide `@Roles(ADMIN, SUPER_ADMIN)`. `SUPER_ADMIN`
and `ADMIN` bypass the check entirely; any other user must hold a `CustomRole`
with the matching service permission or the request is rejected with 403.
Role management itself (`admin/roles/*` and `PATCH .../custom-role`) is not
delegable — it stays hard-gated to `SUPER_ADMIN` via `@Roles`, independent of
the permission system. `GET /auth/me` includes the caller's `customRole`
(id, name, permissions) so the frontend can grant admin-panel entry to a
non-ADMIN user holding one — API calls remain enforced server-side either way.

### Events

| Method | Path                  | Access              | Purpose               |
| ------ | --------------------- | ------------------- | --------------------- |
| GET    | `/events`             | Public              | List published events |
| GET    | `/events/:slug`       | Public              | Event detail          |
| POST   | `/events`             | Admin/Event Manager | Create event          |
| PATCH  | `/events/:id`         | Admin/Event Manager | Update event          |
| PATCH  | `/events/:id/publish` | Admin/Event Manager | Publish/unpublish     |

`GET /events` / `GET /events/:slug` only ever return `isPublished: true` events — there's no admin variant that also returns drafts; admins use the `id` returned from `POST /events` to `PATCH` an unpublished event directly. "Admin/Event Manager" maps to `UserRole.ADMIN` / `SUPER_ADMIN`, or any user holding a `CustomRole` with `EVENTS` read/write — see "Admin Roles & Permissions" above.

`GET /events/:slug` additionally includes `subOptions` (only the `isActive: true` rows) so the registration form can render Athletics-style discipline pickers without a second request. `GET /events` (the list) does not include `subOptions`.

`PATCH /events/:id` rejects (`400`) lowering `capacity` below the event's current non-cancelled `Registration` count. This is an admin-side safety guard only — full at-registration-time capacity enforcement belongs to the Registration module.

#### Event Rulebooks

| Method | Path                              | Access | Purpose                                          |
| ------ | --------------------------------- | ------ | ------------------------------------------------- |
| GET    | `/events/:slug/rulebooks`         | Public | List rulebooks for a published event               |
| GET    | `/admin/events/:eventId/rulebooks`| Admin  | List rulebooks for any event, including drafts     |
| POST   | `/admin/events/:eventId/rulebooks`| Admin  | Attach a rulebook (multipart — link or PDF upload) |
| DELETE | `/admin/rulebooks/:id`            | Admin  | Remove a rulebook                                  |

`POST /admin/events/:eventId/rulebooks` body: `title`, `version?`, and **exactly one of** `fileUrl` (pasted external link, `http`/`https` only) or `file` (multipart PDF upload, max 10 MB). `400` if neither is given; a malformed or non-http(s) `fileUrl` is also rejected. Response `fileUrl` is the raw stored value for an external link, or a time-limited signed URL when it was an uploaded file — same treatment on every list response.

### Teams and Registrations

| Method | Path                     | Access              | Purpose              |
| ------ | ------------------------ | ------------------- | -------------------- |
| POST   | `/teams`                 | Authenticated       | Create team          |
| GET    | `/teams/mine`            | Authenticated       | Teams I captain (or joined) |
| PATCH  | `/teams/:id`             | Team Captain        | Edit team details (pre-registration only) |
| POST   | `/teams/:id/invitations` | Team Captain        | Create invite        |
| POST   | `/teams/:id/join`        | Authenticated       | Join team            |
| DELETE | `/teams/:teamId/participants/:participantId` | Team Captain | Remove a team member |
| POST   | `/registrations`         | Authenticated       | Start registration   |
| GET    | `/registrations/mine`    | Authenticated       | My registrations     |
| GET    | `/admin/registrations`   | Admin/Event Manager | Filter registrations |

#### `POST /teams`

- `multipart/form-data`: `eventId` (UUID), `declaredSize` (int, ≥1), `name`, `collegeName`, `collegeAddress?`, `isIITP?`, `viceCaptainName?`, `viceCaptainPhone?`, `coachName?`, `coachPhone?`, `idType` (`IdentityType`), `idNumber`, plus files `photo` and `idFile` (both required, max 5 MB, `image/jpeg`/`image/png`/`image/webp`, stored under `participant-photo/` and `participant-id/` via `UploadsService`).
- `declaredSize` is the roster size the captain commits to now, not the number of `Participant` rows created by this call (that's always 1, the captain) — teammates join later via `POST /teams/:id/join`. `422` if it falls outside `Event.teamSizeMin`/`teamSizeMax`. This declared number, not the live roster count, is what `POST /registrations` checks against `teamSizeMin`/`teamSizeMax` and uses for `PER_HEAD` fee calculation and accommodation/mess-only headcount caps — the actual roster is allowed to still be incomplete when the team registers and pays.
- `404` if `eventId` doesn't resolve to an event; `400` if that event isn't published.
- Creates the `Team` (caller becomes `captainId`) and its first `Participant` row (`role: CAPTAIN`) in one transaction. The captain's `Participant.name`/`phone` are copied from their `User` record, not re-entered.
- Invite code is a 6-character random hex string (same generator convention as `CAProfile.refCode`), retried once on the rare unique-constraint collision.

#### `PATCH /teams/:id`

- JSON body, all fields optional: `name`, `declaredSize`, `collegeName`, `collegeAddress`, `isIITP`, `viceCaptainName`, `viceCaptainPhone`, `coachName`, `coachPhone`.
- Only the team's `captainId`, else `403`. `409` once the team has a `Registration` — details are locked as soon as the team registers; use this only to fix a mis-entered detail before then.
- `declaredSize`, if given, is revalidated against `Event.teamSizeMin`/`teamSizeMax` (`422`) and cannot drop below the current live `Participant` count (`422`) — same rule as `POST /teams`, plus the new floor.
- `eventId`, `captainId`, and `inviteCode` are not editable here (event/captain are fixed for the team's lifetime; use `POST /teams/:id/invitations` to rotate the code).

#### `POST /teams/:id/invitations`

- Only the team's `captainId`, else `403`.
- No separate `Invitation` model exists — this rotates `Team.inviteCode` in place (old code stops working immediately) and returns the updated team. Use this to reissue a code that leaked.

#### `GET /teams/mine`

- Returns teams the caller captains or has joined (`captainId` match, or a `Participant` row with `userId` matching the caller). Each team is tagged `role: "CAPTAIN" | "MEMBER"`; `inviteCode` is only populated for the captain (`null` for members) — showing it to everyone would leak a credential that lets anyone claim a roster slot.
- Includes the full editable field set (`collegeName`, `collegeAddress`, `isIITP`, `viceCaptainName`, `viceCaptainPhone`, `coachName`, `coachPhone`) plus `event.teamSizeMin`/`teamSizeMax`, so a captain-facing UI can prefill a `PATCH /teams/:id` form without a second request.
- `registration`, when present, also includes its most recent `payments` entry (`id`, `amount`, `mode`, `status`) — enough for a client to resume straight to the payment/review step for a team that already has a `PENDING_PAYMENT`/`CONFIRMED`/`WAITLISTED` registration, instead of re-showing the create-team form (which would 409). Only `CANCELLED`/`REFUNDED` registrations don't block a fresh team, matching `POST /teams`'s own duplicate-team guard.

#### `POST /teams/:id/join`

- `multipart/form-data`: `inviteCode`, `idType`, `idNumber`, plus `photo` and `idFile` (same rules as `POST /teams`).
- `:id` is the team's UUID. `inviteCode` in the body must match `Team.inviteCode` exactly, else `403` — this is what actually authorizes the join (a guessed team UUID alone isn't sufficient).
- `409` once the roster (`Participant` count for the team) reaches `Event.teamSizeMax`. `teamSizeMin` is **not** checked here — that's a Registration-submission-time gate, not a join-time one.
- Adds a `Participant` row with `role: PLAYER`. Role reassignment (`VICE_CAPTAIN`/`SUBSTITUTE`) is not exposed via API yet — fast-follow.

#### `DELETE /teams/:teamId/participants/:participantId`

- Only the team's `captainId`, else `403`. `400` if `participantId` is the `CAPTAIN` row — a captain cannot remove themselves (no captaincy-transfer path exists).
- No status gate — allowed before or after the team registers/pays, unlike `PATCH /teams/:id`. A dropped-out member can be removed at any time.
- Deletes the `Participant` row. If a `Credential` (QR) had already been issued to them, it's deleted too (its `ScanLog` rows are cleared first, since they reference the credential with no cascade) so the removed member's QR stops scanning as valid.
- Does not change `Team.declaredSize` and does not enforce `Event.teamSizeMin` — removal just frees the roster slot; the captain re-shares the invite link to refill it.

### Payments

No payment gateway — every registration is paid via UPI outside the platform, then proven with a screenshot + transaction ID. Admin manually approves or rejects against that proof (see `.claude/plans/master-roadmap-sept30-launch.md`).

| Method | Path                          | Access        | Purpose                                                          |
| ------ | ----------------------------- | ------------- | ----------------------------------------------------------------- |
| POST   | `/payments`                   | Authenticated | Submit screenshot + transaction ID for a registration's payment |
| GET    | `/admin/payments`             | Admin         | List payments by status, paginated, for manual review            |
| PATCH  | `/admin/payments/:id/verify`  | Admin         | Approve or reject a manual payment submission                    |

#### `POST /payments`

- Multipart form: `registrationId` (UUID), `transactionId`, `idempotencyKey` (client-generated UUID, replayed unchanged on retry), `file` (the screenshot).
- Screenshot rules match CA task proof: max 5 MB, `image/jpeg` / `image/png` / `image/webp` only. Stored under `payment-proof/` via the shared `UploadsService`.
- Caller must be the registration's `userId`, or the `captainId` of its `team`, else `403`.
- The registration must currently be `PENDING_PAYMENT`, else `409`.
- Registration creates a stub `Payment` row (`mode = MANUAL_SCREENSHOT`, `status = INITIATED`, `amount` computed from `Event.feeStructure`) at registration time. This endpoint fills that stub in and moves it to `RECONCILIATION_PENDING` — it does not compute the fee itself. Returns `404` if no `INITIATED` stub exists for the registration yet.
- If a payment for the registration is already `RECONCILIATION_PENDING` or `SUCCESS`, returns `409` — no second submission until the first is rejected.
- Idempotent: replaying the same `idempotencyKey` returns the already-created result instead of erroring or duplicating.

#### `GET /admin/payments`

- Only `ADMIN` and `SUPER_ADMIN`.
- Query: `page` (default 1), `limit` (default 20, max 100), `status` (default `RECONCILIATION_PENDING`; one of `INITIATED` / `RECONCILIATION_PENDING` / `SUCCESS` / `FAILED` / `REFUNDED`, else `400`).
- Response `data` shape: `{ payments: Payment[], pagination: { page, limit, total, totalPages } }`. Each payment includes its `registration` (event name, individual `user` or `team`+captain) and a time-limited signed `screenshotUrl` (never the raw Cloudinary `public_id`) for admin preview.

#### `PATCH /admin/payments/:id/verify`

- Only `ADMIN` and `SUPER_ADMIN`.
- The payment must currently be `RECONCILIATION_PENDING` (atomic compare-and-set); a concurrent or already-processed payment returns `409`.
- Body: `{ status: 'SUCCESS' | 'FAILED', rejectionReason?: string }` — `rejectionReason` is required when rejecting, stored on `Payment.rejectionReason`.
- `SUCCESS`: transactionally moves `Registration.status` from `PENDING_PAYMENT` to `CONFIRMED`, then enqueues a `payment-confirmed` BullMQ job (consumed by the Identity/Credential module to issue the QR).
- `FAILED`: `Registration` stays `PENDING_PAYMENT` so the registrant can resubmit; no queue job is enqueued.

### Identity

| Method | Path                        | Access          | Purpose                            |
| ------ | --------------------------- | --------------- | ---------------------------------- |
| GET    | `/identity/mine`            | Authenticated   | Get QR credential                  |
| GET    | `/identity/scan/:token`     | Volunteer/Admin | Gate-scan dashboard for a credential |
| POST   | `/identity/scan`            | Volunteer/Admin | Scan and log credential            |
| GET    | `/admin/scans`               | Admin           | List scan logs, paginated, for gate audit |

#### `GET /identity/scan/:token`

- Only `VOLUNTEER`, `ADMIN`, `SUPER_ADMIN` — the QR itself now encodes a full URL (`<WEB_ORIGIN>/scan/:token`, see `IdentityService.issueCredential`), not a bare token, so a guard's stock camera app opens `apps/web/app/scan/[token]/page.tsx` directly. Login-gating this endpoint is what keeps a photographed QR from leaking participant PII to anyone who isn't a logged-in guard.
- `400` if the token's HMAC signature is invalid; `404` if the signature is valid but no credential matches.
- Response `data` shape: `{ credentialId, holder: { name, phone, photoUrl, college, isIITP, teamName, role, idType, idNumber }, event: { name, sportCategory, venue }, accommodationOpted, messOnlyOpted, scanCount, lastScannedAt, recentScans: [{ gate, direction, result, createdAt }] }`. `holder.photoUrl` is a time-limited signed URL (participant credentials only; individual/user credentials have no photo).

#### `POST /identity/scan`

- Only `VOLUNTEER`, `ADMIN`, `SUPER_ADMIN`.
- Body: `{ token: string, gate: string, direction: 'ENTRY' | 'EXIT' }`.
- Verifies the token's HMAC signature first; a tampered or malformed token is rejected (`400`) before any `ScanLog` write, since `ScanLog.credentialId` is a required foreign key and a structurally invalid token has no real credential to attach a log to. An unknown/revoked credential (valid signature, no matching `tokenHash` row) returns `404`, also without a write.
- On a known credential: writes exactly one `ScanLog` row. If the most recent prior scan for that credential was `VALID` in the *same* `direction` (e.g. two `ENTRY` scans with no `EXIT` between them), this scan is recorded as `DUPLICATE` and `Credential.scanCount` is not incremented. Otherwise it's recorded as `VALID` and `Credential.scanCount`/`lastScannedAt` are updated in the same transaction.
- `ScanResult.EXPIRED` is modeled in the schema but not yet produced by any code path — there's no credential expiry/revocation mechanism yet.

#### `GET /admin/scans`

- Only `ADMIN` and `SUPER_ADMIN`.
- Query: `page` (default 1), `limit` (default 20, max 100), `gate` (optional exact match).
- Response `data` shape: `{ scans: ScanLog[], pagination: { page, limit, total, totalPages } }`. Each scan includes `holderName` (resolved from the credential's linked `user` or `participant`) and `scannedBy` (the volunteer/admin who performed the scan).

### Content (Team / Sponsors / Gallery)

| Method | Path                | Access | Purpose                                    |
| ------ | ------------------- | ------ | ------------------------------------------- |
| GET    | `/team`             | Public | List team/committee members, grouped by department |
| GET    | `/gallery`          | Public | Paginated public photo gallery              |
| GET    | `/sponsors`         | Public | List publicly-listed, tiered sponsor brands |
| POST   | `/admin/team`       | Admin  | Create a team member (multipart, `photo` optional) |
| PATCH  | `/admin/team/:id`   | Admin  | Update a team member (multipart, `photo` optional) |
| DELETE | `/admin/team/:id`   | Admin  | Remove a team member                       |
| POST   | `/admin/gallery`    | Admin  | Add a gallery photo (multipart, `image` required) |
| PATCH  | `/admin/gallery/:id`| Admin  | Update a gallery item's caption            |
| DELETE | `/admin/gallery/:id`| Admin  | Remove a gallery item                      |

#### `GET /team`

Response `data` shape: `{ departments: [{ department, members: [{ id, name, department, role, photoUrl, displayOrder }] }] }`. `photoUrl` is a time-limited signed URL when set.

#### `GET /gallery`

Query: `page` (default 1), `limit` (default 20, max 100). Response `data` shape: `{ items: [{ id, imageUrl, caption, publishedAt }], pagination: { page, limit, total, totalPages } }`, newest (`publishedAt`) first.

#### `GET /sponsors`

Response `data` shape: `{ sponsors: [{ id, name, logoUrl, tier }] }`. Only `Brand` rows with `tier` set, `isPubliclyListed: true`, and `status: ACTIVE`; ordered by tier (`TITLE` first).

#### Sponsor tier management

Sponsor tier/listing is managed via the existing Brand admin endpoints, not a separate route: `POST /admin/brands` / `PATCH /admin/brands/:id` now also accept `tier` (`SponsorTier` enum) and `isPubliclyListed` (boolean).

### Merch

No payment gateway here either — same manual UPI-screenshot flow as event registrations, reusing the `PaymentStatus` enum directly on `MerchOrder` rather than the `Payment` table (see `.claude/reference/database.md`'s `MerchOrder` entry for why).

| Method | Path                              | Access        | Purpose                                    |
| ------ | ---------------------------------- | ------------- | ------------------------------------------- |
| GET    | `/merch/products`                  | Public        | List in-stock, published products           |
| GET    | `/merch/products/:id`              | Public        | Product detail (published only)             |
| POST   | `/merch/orders`                    | Authenticated | Place an order                              |
| GET    | `/merch/orders/mine`               | Authenticated | My order history                            |
| POST   | `/merch/orders/:id/payment`        | Authenticated | Submit screenshot + transaction ID          |
| GET    | `/admin/merch/products`            | Admin         | List all products, any stock/publish state  |
| POST   | `/admin/merch/products`            | Admin         | Create a product (always starts unpublished) |
| PATCH  | `/admin/merch/products/:id`        | Admin         | Update a product                            |
| PATCH  | `/admin/merch/products/:id/publish`| Admin         | Publish or unpublish a product              |
| GET    | `/admin/merch/orders`              | Admin         | List orders, paginated, filter by `status`  |
| PATCH  | `/admin/merch/orders/:id/verify`   | Admin         | Approve or reject an order's payment        |
| PATCH  | `/admin/merch/orders/:id/status`   | Admin         | Advance fulfillment status                  |

#### Product publishing

Mirrors `Event.isPublished`/`PATCH /events/:id/publish` exactly: `POST /admin/merch/products` always creates a draft (`isPublished: false`, regardless of any other field), and `PATCH /admin/merch/products/:id/publish` (`{ isPublished: boolean }`) is the only way to make it live. `GET /merch/products` and `GET /merch/products/:id` never return an unpublished product (`404` on the detail route); `POST /merch/orders` also rejects (`404`) an order referencing an unpublished product, so a stale product ID a buyer already has (e.g. from a shared link) can't be ordered after unpublishing.

#### `POST /merch/orders`

- Body: `{ shippingName, shippingPhone, shippingAddress, shippingPincode, items: [{ productId, size?, quantity }] }`.
- `totalAmount` is always computed server-side from each item's *live* `Product.price` at order time — a client-supplied amount is never trusted, same rule as event registration fees. `404` if any `productId` doesn't resolve or isn't published; `400` if it isn't `inStock` or the items array is empty.
- Creates the `MerchOrder` (`status: PENDING_PAYMENT`, `paymentStatus: INITIATED`) and its `MerchOrderItem` rows in one transaction. No credential/QR is issued for merch orders.

#### `POST /merch/orders/:id/payment`

- Multipart form: `transactionId`, `idempotencyKey` (client-generated UUID, replayed unchanged on retry), `file` (the screenshot, max 5 MB, `image/jpeg`/`image/png`/`image/webp`, stored under `merch-payment-proof/`).
- Caller must own the order (`order.userId`), else `403`. Order's `paymentStatus` must be `INITIATED`, else `409`. Idempotent: replaying the same `idempotencyKey` returns the already-recorded order instead of erroring or duplicating.
- Moves `paymentStatus` to `RECONCILIATION_PENDING` via compare-and-swap (`updateMany` + count check), identical pattern to `PaymentsService.submitPayment`.

#### `PATCH /admin/merch/orders/:id/verify`

- Body: `{ status: 'SUCCESS' | 'FAILED', rejectionReason? }` — `rejectionReason` required when rejecting.
- Compare-and-swap: the order's `paymentStatus` must currently be `RECONCILIATION_PENDING`, else `409`. On `SUCCESS`, also flips `MerchOrder.status` to `CONFIRMED` in the same update. No BullMQ job is enqueued (unlike registration payments) — a confirmed merch order doesn't trigger credential issuance.

#### `PATCH /admin/merch/orders/:id/status`

- Body: `{ status: 'SHIPPED' | 'DELIVERED' | 'CANCELLED' }`. Enforces a one-way transition guard: `CONFIRMED → SHIPPED → DELIVERED`, or `→ CANCELLED` from `PENDING_PAYMENT`/`CONFIRMED`. `400` on any other transition (e.g. `DELIVERED → PENDING_PAYMENT`), regardless of the order's current `paymentStatus`.

### CA Portal (Phase 3-5 Additions)

| Method | Path                                      | Access        | Purpose                                          |
| ------ | ----------------------------------------- | ------------- | ------------------------------------------------ |
| POST   | `/ca/onboard`                             | CAMPUS_AMBASSADOR | Onboard as a Campus Ambassador                   |
| GET    | `/ca/me`                                  | CAMPUS_AMBASSADOR | Get the caller's own CA profile (refCode, clickCount, referralCount, totalPoints, rank) |
| POST   | `/leads/waitlist`                         | Public        | Capture waitlist lead pre-registration           |
| POST   | `/ca/referral/click`                      | Public        | Track referral link clicks asynchronously        |
| GET    | `/leaderboard/ca`                         | Public        | Get ranked CA leaderboard                        |
| GET    | `/ca/tasks`                               | Authenticated | Fetch CA tasks and user assignments              |
| POST   | `/ca/tasks/:taskId/submit`                | Authenticated | Submit proof for a CA task                       |
| GET    | `/admin/brands`                           | Admin         | List all active brands                           |
| POST   | `/admin/brands`                           | Admin         | Create a brand                                   |
| PATCH  | `/admin/brands/:id`                       | Admin         | Soft-delete or update brand                      |
| GET    | `/admin/ca-tasks`                         | Admin         | List CA tasks                                    |
| POST   | `/admin/ca-tasks`                         | Admin         | Create a CA task                                 |
| PATCH  | `/admin/ca-tasks/:id`                     | Admin         | Soft-delete or update CA task                    |
| PATCH  | `/admin/ca-task-assignments/:id/verify`   | Admin         | Verify CA task submission
(compare-and-swap lock)|
| GET    | `/admin/ca-tasks/:id/assignments`         | Admin         | List CA task assignments                         |
| POST   | `/ca/apply`                               | Authenticated | Apply to become a Campus Ambassador              |
| GET    | `/ca/apply/me`                            | Authenticated | Get the caller's latest application status       |
| GET    | `/admin/ca-applications`                  | Admin         | List CA applications (paginated, status filter)  |
| PATCH  | `/admin/ca-applications/:id/review`       | Admin         | Approve or reject a CA application (compare-and-swap lock) |


#### CA Task Proof Rules

- Uploaded proof files are limited to 5 MB.
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
- URL proofs allow only `http:` and `https:` schemes.
- Internal proof files are stored under `ca-proof/` in private S3-compatible storage.
- Resubmission is allowed only while the assignment status is `PENDING`.

#### CA Task Verification

`PATCH /admin/ca-task-assignments/:id/verify`

- Only `ADMIN` and `SUPER_ADMIN` can verify task assignments.
- The assignment must currently be `SUBMITTED`.
- Final status can be `VERIFIED` or `REJECTED`.
- Verification uses an atomic compare-and-set update.
- A concurrent or already-processed assignment returns `409 Conflict`.

#### CA Application Intake

`POST /ca/apply` — any authenticated user who is not already `CAMPUS_AMBASSADOR`.

- Body: `{ targetCollege: string }`.
- Returns `409 Conflict` if the caller already has a `PENDING` application, or is already `CAMPUS_AMBASSADOR`.
- A previously `REJECTED` application does not block re-applying.

`GET /ca/apply/me` — returns the caller's most recent `CAApplication`, or `null` if none exists.

`GET /admin/ca-applications` — Admin-only, paginated (`?page=&limit=`, default limit 20), optional `?status=` filter (`PENDING`/`APPROVED`/`REJECTED`), joined to the applicant's name/email.

`PATCH /admin/ca-applications/:id/review`

- Only `ADMIN` and `SUPER_ADMIN` can review applications.
- The application must currently be `PENDING`.
- Body: `{ status: 'APPROVED' | 'REJECTED', rejectionReason?: string }` — `rejectionReason` is required when rejecting.
- Approval promotes the applicant's role to `CAMPUS_AMBASSADOR` atomically, in the same transaction as the compare-and-swap status update.
- A concurrent or already-processed application returns `409 Conflict`.

#### Registration Intake

`POST /registrations` — any authenticated user.

Body:

```json
{
  "eventId": "uuid",
  "teamId": "uuid",
  "accommodationOpted": false,
  "accommodationDays": 0,
  "accommodationHeadcount": 0,
  "messOnlyOpted": false,
  "messOnlyHeadcount": 0,
  "genderDeclared": "MEN",
  "customData": { "Roll No.": "A123" },
  "subOptionSelections": [
    { "subOptionId": "uuid", "relayMembers": ["Name A", "Name B"] }
  ]
}
```

- `teamId` is required when `Event.registrationType` is `TEAM` and forbidden when it is `INDIVIDUAL` (400 otherwise). For `TEAM` events the caller must be `Team.captainId` (403 otherwise), and the team's `declaredSize` (set at `POST /teams` time, not the live `Participant` roster count) must satisfy `Event.teamSizeMin`/`teamSizeMax` (422 otherwise) — Registration does not create the roster; that's a Team-module concern, and the roster is allowed to still be incomplete when the team registers and pays.
- `customData` answers `Event.customFieldsDef` entries scoped `TEAM`, keyed by `label`. Unknown keys, missing required fields, or wrong types return 400.
- `subOptionSelections` is only meaningful for events with `EventSubOption` rows (e.g. Athletics). Each selection must reference an active sub-option belonging to the event; `RELAY`-type selections require non-empty `relayMembers`. The total count of `INDIVIDUAL`-type and `RELAY`-type selections is capped by the highest `maxSelectionsPerReg` among that event's sub-options of the matching type (422 if exceeded).
- `genderDeclared` is required when `Event.feeStructure` is `GENDER_BASED` (422 if missing).
- `accommodationOpted` (lodging + mess) and `messOnlyOpted` (mess only, no lodging) are two independent, stackable add-ons — e.g. 3 teammates in the accommodation package and 2 in mess-only on the same registration. Both share `accommodationDays` as the length of stay. Either requires `Event.hasAccommodation` (422 otherwise), requires `accommodationDays` plus its own headcount field (400 if missing), and the two headcounts together cannot exceed the registration's `participantCount` (the team's `declaredSize`, or 1 for an individual registration) — 422 if they do.
- 422 if the event isn't published/open for registration, or capacity is reached.
- 409 if a registration already exists for this event (per-user for `INDIVIDUAL`, per-team for `TEAM`).
- The registration fee is always computed server-side from `Event.feeStructure`/`feeFlat`/`feePerHead`/`feeMale`/`feeFemale` plus any accommodation/mess-only surcharge (`Event.accommodationRate`/`messOnlyRate` × `accommodationDays` × the respective headcount) — never trust a client-supplied amount. For `TEAM` events, `PER_HEAD` fees are computed from the team's `declaredSize`, not the live roster count. IITP-affiliated teams/users register for free (`amount: 0`).
- Creates a `Registration` (`status: PENDING_PAYMENT`) and a stub `Payment` (`mode: MANUAL_SCREENSHOT`, `status: INITIATED`) atomically in one transaction.

Response `data` shape:

```json
{
  "id": "uuid",
  "eventId": "uuid",
  "status": "PENDING_PAYMENT",
  "payment": { "id": "uuid", "amount": 500, "mode": "MANUAL_SCREENSHOT", "status": "INITIATED" }
}
```

## 4. Contract Rules

- DTOs must reject unknown fields.
- All list endpoints need pagination.
- Admin list endpoints need filtering and sorting.
- Webhooks must return quickly and do heavy work through queues.
- Mutating endpoints must be idempotent where client retries are expected.
