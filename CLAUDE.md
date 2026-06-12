# CLAUDE.md — Claude Code Session Bootstrap

This file is Claude Code's fast-boot instructions for this repository. It is intentionally thin — the full project constitution lives in `CONSTITUTION.md`.

## Start Every Session By Reading

1. `CONSTITUTION.md` — project constitution, architecture rules, GitHub workflow, team model
2. `.claude/reference/architecture.md` — module boundaries and runtime diagram
3. `.claude/reference/api.md` — envelope contract and endpoint map
4. `.claude/reference/database.md` — schema and indexing rules
5. Relevant `.claude/plans/<issue>.md` for the active issue

Then run:
```bash
git status --short
git branch --show-current
gh issue list --limit 10
```

## Quick Commands

```bash
# Backing services
docker compose up -d

# Dev servers
npm run dev                            # all
npm run start:dev --workspace=api      # API only
npm run dev --workspace=web            # web only

# Validate before every commit
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
npm run test:e2e --workspace=api
```

## Pre-Commit Checklist

- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Build passes
- [ ] Tests pass
- [ ] No secrets committed
- [ ] Scope matches the issue — nothing more
- [ ] `.claude/reference/` docs updated if architecture/API/schema changed

## Agent Rules (Summary)

Full rules are in `CONSTITUTION.md`. The non-negotiables:

- Controllers are thin. Business logic lives in services.
- No cross-module service imports — use EventEmitter2 or queues.
- Payments, email, QR, notifications are always async (BullMQ).
- Money and registration ops use `prisma.$transaction` and are idempotent.
- Every response uses the envelope defined in `.claude/reference/api.md`.

## Current Sprint

| Issue | Track | Assignee | Branch |
|-------|-------|----------|--------|
| #5 Core API Scaffolding | Lead/API | mdminhaj-2106 | `feature/core-api-scaffolding` |
| #2 Prisma Schema + Seed | Backend/DB | ansariowais669-hub | `feature/database-baseline` |
| #3 Design Tokens + Layout | Frontend | Anjney-Lawaniya | `feature/ui-shell` |

Sprint board: **Infinito Atlas** GitHub Project.
