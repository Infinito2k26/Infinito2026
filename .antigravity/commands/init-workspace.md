# Init Workspace: Install the AI Workflow Scaffold

## Objective

Copy the workflow scaffold into another repository without touching application source code.

## Assets

| Asset            | Destination               | Purpose                                    |
| ---------------- | ------------------------- | ------------------------------------------ |
| `.antigravity/`  | `<target>/.antigravity/`  | Commands, skills, templates, plans         |
| `ANTIGRAVITY.md` | `<target>/ANTIGRAVITY.md` | Project constitution                       |
| `PRD.md`         | `<target>/PRD.md`         | Product requirements                       |
| `reference/`     | `<target>/reference/`     | Architecture, API, database, testing specs |
| `.github/`       | `<target>/.github/`       | Issue templates, PR template, CI scaffold  |

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
[ ] .antigravity/README.md
[ ] .antigravity/commands/prime.md
[ ] .antigravity/commands/plan-feature.md
[ ] .antigravity/commands/execute.md
[ ] .antigravity/commands/commit.md
[ ] .antigravity/skills/browser-qa/SKILL.md or equivalent browser QA skill
[ ] .antigravity/skills/e2e-test/SKILL.md
[ ] ANTIGRAVITY.md
[ ] PRD.md
[ ] reference/architecture.md
[ ] reference/api.md
[ ] reference/database.md
[ ] reference/testing.md
[ ] .github/pull_request_template.md
```

## After Installation

1. Run the prime workflow.
2. Refresh `ANTIGRAVITY.md` using `create-rules.md`.
3. Fill or refresh `PRD.md`.
4. Create GitHub labels, a Project, and initial sprint issues.
