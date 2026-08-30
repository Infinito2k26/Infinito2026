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

### Events

| Method | Path                  | Access              | Purpose               |
| ------ | --------------------- | ------------------- | --------------------- |
| GET    | `/events`             | Public              | List published events |
| GET    | `/events/:slug`       | Public              | Event detail          |
| POST   | `/events`             | Admin/Event Manager | Create event          |
| PATCH  | `/events/:id`         | Admin/Event Manager | Update event          |
| PATCH  | `/events/:id/publish` | Admin/Event Manager | Publish/unpublish     |

`GET /events` / `GET /events/:slug` only ever return `isPublished: true` events — there's no admin variant that also returns drafts; admins use the `id` returned from `POST /events` to `PATCH` an unpublished event directly. "Admin/Event Manager" maps to `UserRole.ADMIN` / `SUPER_ADMIN` — no distinct Event Manager role exists.

`GET /events/:slug` additionally includes `subOptions` (only the `isActive: true` rows) so the registration form can render Athletics-style discipline pickers without a second request. `GET /events` (the list) does not include `subOptions`.

`PATCH /events/:id` rejects (`400`) lowering `capacity` below the event's current non-cancelled `Registration` count. This is an admin-side safety guard only — full at-registration-time capacity enforcement belongs to the Registration module.

### Teams and Registrations

| Method | Path                     | Access              | Purpose              |
| ------ | ------------------------ | ------------------- | -------------------- |
| POST   | `/teams`                 | Authenticated       | Create team          |
| POST   | `/teams/:id/invitations` | Team Captain        | Create invite        |
| POST   | `/teams/:id/join`        | Authenticated       | Join team            |
| POST   | `/registrations`         | Authenticated       | Start registration   |
| GET    | `/registrations/mine`    | Authenticated       | My registrations     |
| GET    | `/admin/registrations`   | Admin/Event Manager | Filter registrations |

#### `POST /teams`

- `multipart/form-data`: `eventId` (UUID), `declaredSize` (int, ≥1), `name`, `collegeName`, `collegeAddress?`, `isIITP?`, `viceCaptainName?`, `viceCaptainPhone?`, `coachName?`, `coachPhone?`, `idType` (`IdentityType`), `idNumber`, plus files `photo` and `idFile` (both required, max 5 MB, `image/jpeg`/`image/png`/`image/webp`, stored under `participant-photo/` and `participant-id/` via `UploadsService`).
- `declaredSize` is the roster size the captain commits to now, not the number of `Participant` rows created by this call (that's always 1, the captain) — teammates join later via `POST /teams/:id/join`. `422` if it falls outside `Event.teamSizeMin`/`teamSizeMax`. This declared number, not the live roster count, is what `POST /registrations` checks against `teamSizeMin`/`teamSizeMax` and uses for `PER_HEAD` fee calculation and accommodation/mess-only headcount caps — the actual roster is allowed to still be incomplete when the team registers and pays.
- `404` if `eventId` doesn't resolve to an event; `400` if that event isn't published.
- Creates the `Team` (caller becomes `captainId`) and its first `Participant` row (`role: CAPTAIN`) in one transaction. The captain's `Participant.name`/`phone` are copied from their `User` record, not re-entered.
- Invite code is a 6-character random hex string (same generator convention as `CAProfile.refCode`), retried once on the rare unique-constraint collision.

#### `POST /teams/:id/invitations`

- Only the team's `captainId`, else `403`.
- No separate `Invitation` model exists — this rotates `Team.inviteCode` in place (old code stops working immediately) and returns the updated team. Use this to reissue a code that leaked.

#### `POST /teams/:id/join`

- `multipart/form-data`: `inviteCode`, `idType`, `idNumber`, plus `photo` and `idFile` (same rules as `POST /teams`).
- `:id` is the team's UUID. `inviteCode` in the body must match `Team.inviteCode` exactly, else `403` — this is what actually authorizes the join (a guessed team UUID alone isn't sufficient).
- `409` once the roster (`Participant` count for the team) reaches `Event.teamSizeMax`. `teamSizeMin` is **not** checked here — that's a Registration-submission-time gate, not a join-time one.
- Adds a `Participant` row with `role: PLAYER`. Role reassignment (`VICE_CAPTAIN`/`SUBSTITUTE`) is not exposed via API yet — fast-follow.

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
| POST   | `/identity/scan`            | Volunteer/Admin | Scan and log credential            |
| GET    | `/identity/validate/:token` | Public          | Offline-safe credential validation |
| GET    | `/admin/scans`               | Admin           | List scan logs, paginated, for gate audit |

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
| PATCH  | `/admin/users/:id/role`                   | Admin         | Promote or change a user's role                  |
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
