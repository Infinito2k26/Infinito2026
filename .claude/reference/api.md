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

### Teams and Registrations

| Method | Path                     | Access              | Purpose              |
| ------ | ------------------------ | ------------------- | -------------------- |
| POST   | `/teams`                 | Authenticated       | Create team          |
| POST   | `/teams/:id/invitations` | Team Captain        | Create invite        |
| POST   | `/teams/:id/join`        | Authenticated       | Join team            |
| POST   | `/registrations`         | Authenticated       | Start registration   |
| GET    | `/registrations/mine`    | Authenticated       | My registrations     |
| GET    | `/admin/registrations`   | Admin/Event Manager | Filter registrations |

### Payments

| Method | Path                            | Access                | Purpose                           |
| ------ | ------------------------------- | --------------------- | --------------------------------- |
| POST   | `/payments/orders`              | Authenticated         | Create payment order              |
| POST   | `/payments/verify`              | Authenticated         | Client callback verification      |
| POST   | `/webhooks/razorpay`            | Public signed webhook | Verify and enqueue reconciliation |
| POST   | `/admin/payments/:id/reconcile` | Admin                 | Manual reconciliation             |

### Identity

| Method | Path                        | Access          | Purpose                            |
| ------ | --------------------------- | --------------- | ---------------------------------- |
| GET    | `/identity/mine`            | Authenticated   | Get QR credential                  |
| POST   | `/identity/scan`            | Volunteer/Admin | Scan and log credential            |
| GET    | `/identity/validate/:token` | Public          | Offline-safe credential validation |

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
  "genderDeclared": "MEN",
  "customData": { "Roll No.": "A123" },
  "subOptionSelections": [
    { "subOptionId": "uuid", "relayMembers": ["Name A", "Name B"] }
  ]
}
```

- `teamId` is required when `Event.registrationType` is `TEAM` and forbidden when it is `INDIVIDUAL` (400 otherwise). For `TEAM` events the caller must be `Team.captainId` (403 otherwise), and the team's existing `Participant` roster must already satisfy `Event.teamSizeMin`/`teamSizeMax` (422 otherwise) — Registration does not create the roster; that's a Team-module concern.
- `customData` answers `Event.customFieldsDef` entries scoped `TEAM`, keyed by `label`. Unknown keys, missing required fields, or wrong types return 400.
- `subOptionSelections` is only meaningful for events with `EventSubOption` rows (e.g. Athletics). Each selection must reference an active sub-option belonging to the event; `RELAY`-type selections require non-empty `relayMembers`. The total count of `INDIVIDUAL`-type and `RELAY`-type selections is capped by the highest `maxSelectionsPerReg` among that event's sub-options of the matching type (422 if exceeded).
- `genderDeclared` is required when `Event.feeStructure` is `GENDER_BASED` (422 if missing).
- 422 if the event isn't published/open for registration, or capacity is reached.
- 409 if a registration already exists for this event (per-user for `INDIVIDUAL`, per-team for `TEAM`).
- The registration fee is always computed server-side from `Event.feeStructure`/`feeFlat`/`feePerHead`/`feeMale`/`feeFemale` plus any accommodation surcharge — never trust a client-supplied amount. IITP-affiliated teams/users register for free (`amount: 0`).
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
