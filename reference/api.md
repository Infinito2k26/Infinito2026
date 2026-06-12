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

## 4. Contract Rules

- DTOs must reject unknown fields.
- All list endpoints need pagination.
- Admin list endpoints need filtering and sorting.
- Webhooks must return quickly and do heavy work through queues.
- Mutating endpoints must be idempotent where client retries are expected.
