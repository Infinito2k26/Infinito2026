# Init Workspace: Install the AI Workflow Scaffold

## Objective

Copy the workflow scaffold into another repository without touching application source code.

## Assets

| Asset             | Destination                | Purpose                                    |
| ----------------- | -------------------------- | ------------------------------------------ |
| `.claude/`        | `<target>/.claude/`        | Commands, skills, templates, plans, reference |
| `CONSTITUTION.md` | `<target>/CONSTITUTION.md` | Project constitution                       |
| `CLAUDE.md`       | `<target>/CLAUDE.md`       | Claude Code session bootstrap              |
| `PRD.md`          | `<target>/PRD.md`          | Product requirements                       |
| `.github/`        | `<target>/.github/`        | Issue templates, PR template, CI scaffold  |

## Process

1. Resolve source and target directories.
2. Detect mode:
   - Greenfield: empty or nearly empty project.
   - Brownfield: existing source code or package files.
3. Create missing workflow directories.
4. Copy scaffold files.
5. Do not overwrite existing project-specific files unless the user explicitly asks.
6. Report installed, skipped, and missing files.

## Verification Checklist

```text
[ ] .claude/README.md
[ ] .claude/commands/prime.md
[ ] .claude/commands/plan-feature.md
[ ] .claude/commands/execute.md
[ ] .claude/commands/commit.md
[ ] .claude/skills/agent-browser/SKILL.md
[ ] .claude/skills/e2e-test/SKILL.md
[ ] CONSTITUTION.md
[ ] CLAUDE.md
[ ] PRD.md
[ ] .claude/reference/architecture.md
[ ] .claude/reference/api.md
[ ] .claude/reference/database.md
[ ] .claude/reference/testing.md
[ ] .github/pull_request_template.md
```

## After Installation

1. Run the prime workflow.
2. Refresh `CONSTITUTION.md` using `create-rules.md`.
3. Fill or refresh `PRD.md`.
4. Create GitHub labels, a Project, and initial sprint issues.
