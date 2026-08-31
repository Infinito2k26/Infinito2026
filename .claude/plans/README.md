# Plans Index

Read this first. It exists so a new session can find the active work in one look instead of reading every file in this directory.

## Start here — active readiness phases

These three are the current, actionable, self-contained punch lists standing between the shipped feature set (Events/Teams/Registration/Payments/QR — all working, tested, on `develop`) and a safe public launch. Each is independently workable; pick the one matching the work at hand.

| Phase | File | Status | Covers |
|---|---|---|---|
| **1 — Backend & Deployment Hardening** | [readiness-phase-1-backend-infra.md](readiness-phase-1-backend-infra.md) | Active, not started | Envelope/rate-limit/admin-visibility P0s, session durability, no deployment target, no graceful shutdown, dependency vulns, no email/password-reset, no observability, no security headers, legal gap, backup/DR |
| **2 — Frontend UI/UX** | [readiness-phase-2-frontend-ui-ux.md](readiness-phase-2-frontend-ui-ux.md) | Audited, work not started — waiting on visual direction | Tailwind-without-Tailwind bug, disconnected/stale pages, a full route-by-route inventory of `apps/web` |
| **3 — Event-Day Operations** | [readiness-phase-3-event-operations.md](readiness-phase-3-event-operations.md) | Active, not started | Scan-failure runbook, on-call plan, issue tracking, domain decision, load testing — process work, no code |

None of Phase 1–3's items have a tracked GitHub issue yet (see Phase 3, item 3) — file one as you pick up each item.

## Superseded — kept for history, do not work from these

| File | Superseded by |
|---|---|
| `pre-deployment-hardening.md` | Phase 1 (its P0/P1/P2 are folded in, re-verified live) |
| `production-readiness-audit.md` | Phases 1, 2, and 3 (split out for independent work) |

`master-roadmap-sept30-launch.md` is also historical (the 3-day sprint it planned already shipped) but nothing supersedes it outright — it's the record of what was built and why, referenced by the phase files above.

## Other plans — per-feature implementation plans, not part of the readiness audit

Pre-date this audit; each was written for one issue/feature and mostly already shipped (see `master-roadmap-sept30-launch.md`'s ground-truth table for what's built). Not re-verified as part of Phases 1–3 — check the code before assuming one is still current.

`5-core-api-scaffolding.md`, `sprint-1-core-api-scaffolding.md`, `issue-2-database-baseline-prisma-schema-porting-and-seeding.md`, `issue-3-design-tokens-nextjs-core-layout.md`, `issue-18-auth-minimal-phase-a.md`, `issue-ui-primitives.md`, `issue-loading-empty-error-states.md`, `21-redis-bullmq-infra.md`, `24-ca-backend-staging-hardening.md`, `25-ca-frontend-wiring.md`, `25-ca-portal-completion-and-deploy.md`, `29-ca-application-intake.md`, `credentials-qr-scan.md`, `local-ca-program-launch.md`, `local-events-teams-module.md`, `registration-day2-ui.md`, `phase-2-schema.md`, `phase-3-referral-engine.md`, `phase-4-task-engine.md`, `phase-5-leaderboard.md`.

(The `phase-N-*` names among these predate and are unrelated to the "Readiness Phase" numbering above — they're from the original 8-week plan's own phase numbering, which `master-roadmap-sept30-launch.md` replaced entirely.)
