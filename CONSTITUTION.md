# CONSTITUTION.md

This file is the working constitution for AI agents and human contributors in the Infinito 2K26 repository. Follow it before writing code, creating issues, reviewing PRs, or changing architecture.

## Project Overview

Infinito 2K26 is the end-to-end platform for IIT Patna's annual sports fest. It is not just a landing page: it must support public discovery, registrations, team workflows, payments, QR identity, volunteer check-in, live scores, admin operations, and post-event reporting under real fest-day load.

Current phase: Phase 0 / early Phase 1. The local infrastructure baseline exists in `docker-compose.yml` with PostgreSQL 16, Redis 7, and MinIO. The implementation now moves into core NestJS and Next.js scaffolding.

## Architecture North Star

Use a modular monolith, not microservices. The team is small and speed matters, but module boundaries must be strict enough that future extraction is possible.

```text
Next.js App Router
  -> HTTPS / API calls
NestJS API modular monolith
  -> Prisma / PostgreSQL for durable relational data
  -> Redis for cache, rate limits, BullMQ broker, and realtime coordination
  -> BullMQ workers for email, payment, QR, and notification side effects
  -> MinIO/S3-compatible storage for QR assets, uploads, and media
```

Non-negotiable architectural rules:

- Controllers stay thin: validate transport input, call services, return envelope responses.
- Business logic lives in module services. Do not put domain decisions in controllers, DTOs, React components, or middleware.
- Modules do not import another module's internal service directly. Use explicit module exports, domain events, or queues.
- Payment, email, QR generation, and notification side effects do not block the request path.
- All money, registration, and identity operations must be idempotent and transaction-safe.
- PostgreSQL is the source of truth. Redis is a cache, queue broker, and coordination layer, not durable business storage.

## Tech Stack

| Area        | Technology                                 | Purpose                                                       |
| ----------- | ------------------------------------------ | ------------------------------------------------------------- |
| Monorepo    | Turborepo + npm workspaces                 | Coordinated builds across apps and packages                   |
| Web         | Next.js App Router, React                  | Public pages, dashboards, admin, scanner PWA                  |
| API         | NestJS                                     | Modular backend, dependency injection, guards, pipes, filters |
| Database    | PostgreSQL 16                              | Relational source of truth for users, teams, events, payments |
| ORM         | Prisma                                     | Typed schema, migrations, transaction API                     |
| Cache/Queue | Redis 7 + BullMQ                           | Caching, rate limits, async jobs, realtime coordination       |
| Assets      | MinIO locally, S3-compatible in production | QR images, documents, uploads, media                          |
| Testing     | Jest, Supertest, Playwright when added     | Unit, integration, API, and browser verification              |

## Commands

```bash
# Install dependencies
npm install

# Start backing services
docker compose up -d

# Run all dev servers
npm run dev

# Run only web
npm run dev --workspace=web

# Run only API
npm run start:dev --workspace=api

# Build all packages/apps
npm run build

# Lint all packages/apps
npm run lint

# Typecheck all packages/apps
npm run check-types

# API tests
npm run test --workspace=api
npm run test:e2e --workspace=api
```

## Project Structure

```text
apps/
  api/                    NestJS backend application
  web/                    Next.js frontend application
packages/
  ui/                     Shared React UI primitives
  types/                  Shared cross-app TypeScript contracts
  eslint-config/          Shared lint configuration
  typescript-config/      Shared TypeScript configuration
.claude/
  reference/              Living reference docs (architecture, API, database, testing)
  commands/               Agent operating playbooks
  plans/                  Feature implementation plans
  templates/              Reusable project scaffolds
  skills/                 Specialized local workflows
.github/
  ISSUE_TEMPLATE/         Structured GitHub issue forms
  pull_request_template.md PR quality gate
```

## Backend Module Plan

Initial NestJS modules should be created in this order:

1. `ConfigModule`: environment validation and typed config access.
2. `PrismaModule`: database client lifecycle and transaction helpers.
3. `HealthModule`: readiness/liveness checks for API, DB, Redis, and object storage.
4. `CommonModule`: response envelope, exception filter, request IDs, logger utilities.
5. `AuthModule`: registration, login, refresh rotation, guards, RBAC.
6. `UsersModule`: profiles, roles, audit metadata.
7. `EventsModule`: event catalog and admin CRUD.
8. `RegistrationModule`: team and participant registration engine.
9. `PaymentsModule`: Razorpay order, webhook verification, reconciliation.
10. `IdentityModule`: QR credential generation and validation.
11. `NotificationsModule`: email/push/in-app side effects.
12. `ScheduleModule` and `LeaderboardModule`: fest-day operations.

## Frontend Rules

- Public pages use server rendering/static generation where possible for SEO and fast first load.
- Dashboards, admin surfaces, scanner workflows, and realtime screens can be client components.
- Use TanStack Query for server state once API integration starts.
- Use Zustand only for local client state such as auth session shell, scanner buffer, or UI mode.
- Do not use React Context for frequently changing server data.
- Mobile-first is mandatory. Most users will interact on phones during registration and fest days.
- Every list, dashboard card, and data panel needs loading, empty, error, and success states.

## API Standards

- API responses use the envelope defined in `.claude/reference/api.md`.
- Global validation must run with whitelist and forbidden non-whitelisted fields.
- Auth access tokens are short-lived. Refresh tokens are HttpOnly cookies with rotation.
- Rate limit auth and payment-adjacent endpoints.
- Use request IDs in logs and return them in error responses.
- Use `409 Conflict` for duplicate registrations, duplicate team/event constraints, and idempotency conflicts.

## Database Standards

- UUID primary keys for all business entities.
- `createdAt`, `updatedAt`, and `deletedAt` on auditable tables.
- Prefer normalized relational design. Denormalize only for measured read pressure.
- Use database-level unique constraints for invariant protection.
- Add indexes for every expected dashboard, lookup, and public listing query before launch.
- Never model one table per sport. Sports/events are data, not schema.

## GitHub Workflow

GitHub is the coordination layer. Every meaningful unit of work starts as an issue, gets tracked in a Project, and ships through a pull request.

Required flow:

1. Create or select a GitHub issue before coding.
2. Add labels for `area:*`, `type:*`, `priority:*`, and `track:*`.
3. Assign one owner and at least one reviewer.
4. Create a branch from `develop`: `feature/<issue-number>-short-name`, `fix/<issue-number>-short-name`, or `chore/<issue-number>-short-name`.
5. Open a PR early as draft when collaboration or review context is useful.
6. Link PRs with closing keywords when appropriate: `Closes #123`.
7. Merge only after checks pass, review is complete, and acceptance criteria are satisfied.

Recommended Project fields:

| Field      | Values                                                                     |
| ---------- | -------------------------------------------------------------------------- |
| Status     | Backlog, Ready, In Progress, In Review, Blocked, Done                      |
| Sprint     | Sprint 0, Sprint 1, Sprint 2, Launch Hardening                             |
| Track      | Web, API, Database, Infra, Design, QA, Docs                                |
| Priority   | P0, P1, P2, P3                                                             |
| Complexity | XS, S, M, L, XL                                                            |
| Owner Role | Lead, Senior Backend, Senior Frontend, Junior Backend, Junior Frontend, QA |

Recommended labels:

```text
type:feature
type:bug
type:chore
type:docs
type:research
priority:p0
priority:p1
priority:p2
area:web
area:api
area:db
area:infra
area:auth
area:payments
area:identity
area:events
area:registration
track:lead
track:backend
track:frontend
track:qa
blocked
good-first-issue
needs-design
needs-api-contract
```

Branch protection target:

- Protect `main` and `develop`.
- Require PR before merge.
- Require at least one approval for normal changes and two approvals for auth, payments, registration, QR identity, infra, or database migrations.
- Require status checks: lint, typecheck, build, API tests, and web checks once CI is added.
- Require conversation resolution before merge.

This workflow is based on GitHub's official guidance for Issues, Projects, templates, branch protection, CODEOWNERS, and Actions security:

- https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues
- https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects
- https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions

## Team Execution Model

The lead architect owns direction, sequencing, and final integration quality. The team owns scoped issues with clear acceptance criteria. Avoid creating a single point of failure by making every task reviewable, documented, and replaceable.

Ownership pattern:

- Lead: architecture, scaffolding, issue breakdown, PR review, high-risk integrations.
- Senior Backend: Auth, payments, queue workers, Prisma schema, security review.
- Senior Frontend: app architecture, design system, data fetching patterns, scanner PWA.
- Junior Backend: DTOs, CRUD modules, tests, admin endpoints under review.
- Junior Frontend: public pages, dashboards, forms, empty/loading/error states.
- QA/Reviewers: acceptance testing, regression checks, issue hygiene.

Rules:

- No unassigned work.
- No issue without acceptance criteria.
- No PR without verification notes.
- No architectural change without updating `.claude/reference/architecture.md`.
- No API shape change without updating `.claude/reference/api.md`.
- No schema migration without updating `.claude/reference/database.md`.

## Agent Operating Rules

Before coding:

1. Read `CONSTITUTION.md`.
2. Read relevant files in `.claude/reference/`.
3. Check `git status`.
4. Identify the GitHub issue or create a local plan if GitHub access is unavailable.
5. Read nearby implementation patterns before editing.

While coding:

- Keep changes scoped to the issue.
- Prefer existing package patterns over new abstractions.
- Add tests proportional to risk.
- Preserve user changes in the working tree.
- Do not commit secrets.

Before handoff:

```bash
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
```

If a command cannot run because dependencies, Docker, or GitHub authentication are unavailable, document the exact blocker in the PR.
