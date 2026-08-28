# Infinito 2K26 Architecture Specification

## 1. System Shape

Infinito uses a Turborepo monorepo with a Next.js frontend and NestJS backend. The backend is a modular monolith: one deployable API with strong internal module boundaries.

```text
apps/web       Next.js App Router frontend
apps/api       NestJS API and future worker entrypoints
packages/ui    Shared UI primitives
packages/types Shared TypeScript contracts
reference/     Durable architecture, API, database, testing docs
```

## 2. Runtime Architecture

```mermaid
flowchart TD
  Browser[Browser / Mobile PWA] --> Web[Next.js Web App]
  Web --> API[NestJS API]
  API --> Postgres[(PostgreSQL 16)]
  API --> Redis[(Redis 7)]
  API --> Cloudinary[(Cloudinary)]
  API --> Queues[BullMQ Queues]
  Queues --> Workers[NestJS Workers]
  Workers --> Postgres
  Workers --> Cloudinary
```

## 3. Backend Modules

| Module        | Responsibility                                      |
| ------------- | --------------------------------------------------- |
| Config        | Validate env and expose typed config                |
| Prisma        | Database client lifecycle and transactions          |
| Common        | response envelope, exceptions, logging, request IDs |
| Health        | readiness checks for API, DB, Redis, storage        |
| Auth          | register, login, refresh, logout, guards, RBAC      |
| Users         | profiles, roles, audit metadata                     |
| Events        | event catalog and admin event management            |
| Registration  | teams, participants, registration status            |
| Payments      | Razorpay orders, webhooks, reconciliation           |
| Identity      | signed QR credential generation and validation      |
| Notifications | email, push, in-app notifications                   |
| Schedule      | fixtures, venues, match timelines                   |
| Leaderboard   | standings, scores, live updates, redis cache fallbacks|
| Admin         | operational dashboards, brands, ca-tasks, task verification (compare-and-swap) |
| CA            | Campus Ambassador onboarding, referral links, tasks, proofs |
| Leads         | Waitlist capture and pre-registration CRM           |

## 4. Boundary Rules

- Controllers do not contain business logic.
- DTOs validate shape, not domain behavior.
- Services own domain behavior.
- Repositories/data access stays behind module services.
- Modules do not reach into another module's internals.
- Cross-module side effects use domain events or queues.
- Payments, QR generation, email, and notifications run asynchronously.

## 5. Critical Flows

### Registration

```mermaid
sequenceDiagram
  participant User
  participant Web
  participant API
  participant DB
  participant Queue

  User->>Web: Submit registration
  Web->>API: POST /registrations
  API->>DB: transaction: registration + payment intent
  API-->>Web: pending payment response
  Web->>API: payment callback
  API->>DB: mark verification pending
  API->>Queue: enqueue payment verification
  Queue->>DB: confirm idempotently
  Queue->>Queue: enqueue QR generation
```

### QR Check-In

```mermaid
sequenceDiagram
  participant Volunteer
  participant Scanner
  participant API
  participant DB

  Volunteer->>Scanner: Scan QR
  Scanner->>Scanner: Verify signature offline when possible
  Scanner->>API: POST /identity/scan
  API->>DB: Record scan event
  API-->>Scanner: Participant and registration status
```

### CA Portal Async Tracking & Validation

```mermaid
sequenceDiagram
  participant CA
  participant API
  participant Redis
  participant Queue
  participant DB

  CA->>API: POST /ca/referral/click
  API->>Redis: Deduplicate by IP & Code
  API->>Redis: Buffer increment (HINCRBY)
  Queue->>Redis: Cron every 60s (referral-flush)
  Queue->>DB: Atomic batch increment to clickCount

  CA->>API: Submit Task Proof
  API->>DB: Status -> SUBMITTED
  Admin->>API: Verify Proof
  API->>DB: Compare-and-swap (WHERE status = SUBMITTED)
  API-->>Admin: 409 Conflict if race condition
```

Role promotion to `CAMPUS_AMBASSADOR` happens either directly via `PATCH /admin/users/:id/role`, or through the application queue: `POST /ca/apply` creates a `PENDING` `CAApplication`, `PATCH /admin/ca-applications/:id/review` approves or rejects it — approval promotes the role in the same compare-and-swap transaction as the status update, using the identical CAS pattern shown above for task verification.

## 6. Deployment Assumptions

- Local development uses Docker Compose for PostgreSQL and Redis, and Cloudinary for object storage.
- Production should use managed PostgreSQL, managed Redis, Cloudinary storage, HTTPS, and environment-level secrets.
- CI should run lint, typecheck, build, tests, and migration checks before merge.
