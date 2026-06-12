# Infinito Agent Workflow

This directory contains reusable operating instructions for AI-assisted development on Infinito 2K26. It is designed to make the lead developer an orchestrator instead of the only person who can ship code.

## What This Scaffold Does

- Keeps project rules in `ANTIGRAVITY.md`.
- Keeps durable technical context in `reference/`.
- Turns features into GitHub issues, implementation plans, reviewed PRs, and verified merges.
- Gives agents repeatable commands for priming, planning, execution, testing, and commit preparation.

## Directory Structure

```text
.antigravity/
  README.md
  ANTIGRAVITY-template.md
  commands/
    prime.md
    create-rules.md
    create-prd.md
    plan-feature.md
    execute.md
    commit.md
    init-workspace.md
  skills/
    agent-browser/SKILL.md
    e2e-test/SKILL.md
  templates/
    PRD-template.md
    reference/
      api-template.md
      architecture-template.md
      database-template.md
      testing-template.md
  plans/
```

## Daily Workflow

```text
Start session      -> read ANTIGRAVITY.md and run prime workflow
Pick work          -> select a GitHub issue from Ready/In Progress
Plan               -> create a feature plan for non-trivial work
Implement          -> execute the plan with narrow edits
Verify             -> lint, typecheck, build, tests, browser checks where needed
Review             -> open/update PR with linked issue and validation notes
Merge              -> merge only after checks, review, and acceptance criteria
```

## GitHub Operating Model

Use GitHub as the source of truth for collaboration:

- Issues define work.
- Projects show status, sprint, owner, priority, and track.
- Pull requests show reviewable implementation history.
- GitHub Actions enforce repeatable quality gates.
- Templates make every issue and PR actionable.

The `.github/` folder in this repo contains issue forms and a PR template aligned to this process.

## When To Use Each Command

| Command             | Use it when                                         |
| ------------------- | --------------------------------------------------- |
| `prime.md`          | Starting a new session or switching context         |
| `create-rules.md`   | Rebuilding `ANTIGRAVITY.md` from a changed codebase |
| `create-prd.md`     | Turning product decisions into a durable PRD        |
| `plan-feature.md`   | Breaking a GitHub issue into implementation steps   |
| `execute.md`        | Implementing a prepared plan                        |
| `commit.md`         | Packaging changes into an atomic commit             |
| `init-workspace.md` | Installing this workflow scaffold into another repo |

## Core Principle

Do not let knowledge live only in one developer's head. If a decision changes how the project should be built, update an issue, PR, `ANTIGRAVITY.md`, or the relevant `reference/` file.
