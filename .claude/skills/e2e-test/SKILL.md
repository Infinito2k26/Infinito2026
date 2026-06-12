---
name: e2e-test
description: Plan and run end-to-end verification for Infinito user journeys across web, API, database, and operational flows.
---

# Infinito E2E Testing Skill

## Objective

Verify that complete user journeys work across frontend, API, database, queues, and storage.

## Environment Setup

```bash
npm install
docker compose up -d
npm run dev
```

Confirm backing services:

```bash
docker exec infinito_postgres_dev pg_isready -U postgres -d infinito_dev
docker exec infinito_redis_dev redis-cli ping
```

## Journey Matrix

| Journey                                         | Required Before Launch |
| ----------------------------------------------- | ---------------------- |
| Register -> login -> current user               | Yes                    |
| Admin creates event -> public listing updates   | Yes                    |
| Captain creates team -> member joins invite     | Yes                    |
| Registration -> payment order -> pending status | Yes                    |
| Webhook replay -> one confirmed registration    | Yes                    |
| Confirmed registration -> QR credential         | Yes                    |
| QR scan -> scan log written                     | Yes                    |
| Tampered QR -> rejected                         | Yes                    |
| Admin filters registrations by event/status     | Yes                    |

## Validation Layers

1. API tests with Jest/Supertest.
2. Database assertions for transaction and uniqueness behavior.
3. Browser checks for mobile and desktop UX.
4. Queue checks for async payment, QR, and notification jobs once workers exist.
5. Manual evidence in PRs for any UI workflow not yet covered by Playwright.

## Report Format

Each E2E report should include:

- Environment and branch.
- Test data created.
- Journeys passed/failed.
- Screenshots or request IDs for failures.
- Follow-up issues for uncovered gaps.
