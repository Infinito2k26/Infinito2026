---
name: e2e-test
description: Plan and run end-to-end verification for complete user journeys across web, API, database, and async flows.
---

# E2E Testing Skill

## Objective

Verify that complete user journeys work correctly across all layers: frontend, API, database, async queues, and storage.

## Environment Setup

```bash
# Install dependencies
<package manager> install

# Start backing services (adapt to your stack)
docker compose up -d

# Verify backing services are healthy
# PostgreSQL example:
docker exec <postgres_container> pg_isready -U postgres -d <dbname>
# Redis example:
docker exec <redis_container> redis-cli ping

# Start dev servers
<dev command from CONSTITUTION>
```

## Journey Matrix

> Fill this section based on `PRD.md` and `CONSTITUTION.md`.
> List all user journeys that must work end-to-end. Mark required-before-launch ones.

| Journey | Required Before Launch |
| ------- | ---------------------- |
| <from PRD — e.g. "User registers and logs in"> | Yes |
| <add your journeys here> | |

## Validation Layers

Run validation in this order:

1. **Unit tests** — pure functions, isolated modules.
2. **Integration / API tests** — HTTP endpoints, service interactions, database writes.
3. **Database assertions** — verify that records were actually created, updated, or deleted correctly.
4. **Async / queue checks** — verify background jobs fired and completed (email, payment, notifications).
5. **Browser checks** — key flows at mobile and desktop viewports.

## Test Commands

Read from `CONSTITUTION.md`. Common patterns:

```bash
# Node.js
npm test                  # unit + integration
npm run test:e2e          # playwright / cypress

# Python
pytest                    # all tests
pytest tests/e2e/         # e2e subset

# Go
go test ./...
```

## Report Format

After running E2E checks, produce a report with:

- **Environment**: branch, node/runtime version, database version.
- **Test data created**: what was seeded, inserted, or stubbed.
- **Journeys passed / failed**: list each journey and its status.
- **Evidence for failures**: error message, stack trace, request ID, or screenshot.
- **Follow-up issues**: gaps that should become new GitHub issues.

## When to Use

- Before merging any PR that touches API routes, database schema, or critical user flows.
- Before cutting a release branch.
- After any infrastructure or dependency update.
- When debugging a reported production issue.
