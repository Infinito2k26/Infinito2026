# AI Workflow Scaffold

This directory contains the AI-agent development workflow scaffold for this project. It is designed to make every developer and agent a productive contributor, not just the lead.

## What This Scaffold Does

- Keeps project rules in `CONSTITUTION.md` (always up to date, evidence-based).
- Keeps durable technical context in `.claude/reference/`.
- Turns features into GitHub issues → implementation plans → reviewed PRs → verified merges.
- Gives agents repeatable commands for priming, planning, executing, debugging, testing, and committing.

## Directory Structure

```text
.claude/
  README.md                          — this file
  CONSTITUTION-template.md           — blank template for the project constitution
  commands/
    prime.md                         — start-of-session context loading
    create-rules.md                  — generate/refresh CONSTITUTION.md from codebase
    create-prd.md                    — create product requirements document
    plan-feature.md                  — convert issue to implementation plan
    execute.md                       — implement a prepared plan
    commit.md                        — package changes for an atomic commit
    init-workspace.md                — install this scaffold into another repo
  skills/
    agent-browser/SKILL.md           — browser UI verification (responsive + flows)
    e2e-test/SKILL.md                — end-to-end journey testing across all layers
    debug/SKILL.md                   — systematic debugging workflow
  plans/                             — feature implementation plans (per issue)
  reference/                         — live project technical documentation
    architecture.md                  — system shape, modules, boundaries, flows
    api.md                           — endpoints, contracts, error shapes
    database.md                      — schema, migrations, indexes, sensitive data
    testing.md                       — quality gates, test layers, conventions
    deployment.md                    — environments, deploy process, env vars, rollback
    security.md                      — auth model, sensitive data, OWASP mitigations
  templates/                         — blank templates for reference docs
    PRD-template.md
    reference/
      architecture-template.md
      api-template.md
      database-template.md
      testing-template.md
      deployment-template.md         — NEW
      security-template.md           — NEW
```

## Daily Workflow

```text
Start session   → /prime
Pick work       → select GitHub issue from Ready or In Progress
Plan            → /plan-feature (non-trivial work only)
Implement       → /execute
Verify          → run validation gate from CONSTITUTION.md
Debug           → /debug (when something breaks)
Browser check   → /agent-browser (after frontend changes)
E2E check       → /e2e-test (before risky merge or release)
Commit + PR     → /commit
```

## Command Reference

| Command | When to use |
| ------- | ----------- |
| `/prime` | Starting a session or switching context |
| `/create-rules` | Rebuilding `CONSTITUTION.md` from changed codebase |
| `/create-prd` | Turning product decisions into a durable PRD |
| `/plan-feature` | Breaking a GitHub issue into implementation steps |
| `/execute` | Implementing a prepared plan |
| `/commit` | Packaging changes into an atomic, reviewable commit |
| `/debug` | Diagnosing a bug or unexpected behavior systematically |
| `/agent-browser` | Verifying UI changes in a browser |
| `/e2e-test` | Running complete user journey tests |
| `/init-workspace` | Installing this scaffold into another repo |

## Global Skill-Creator

The skill `/init-ai-scaffold` is installed globally at `~/.claude/commands/init-ai-scaffold.md`.
Run it in **any** git-initialized project directory to install this entire scaffold, adapted to that project's detected stack.

## Core Principle

No knowledge lives only in one developer's head. If a decision changes how the project should be built, it must land in an issue, PR, `CONSTITUTION.md`, or a `.claude/reference/` file — not just in someone's memory.
