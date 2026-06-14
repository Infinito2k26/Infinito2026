# Init Workspace: Install the AI Workflow Scaffold

## Objective

Install the full AI-agent development workflow scaffold into any software project without touching application source code.

## Process

### 1. Detect the target

```bash
pwd
git status
ls .claude/ 2>/dev/null && echo "Scaffold exists" || echo "Fresh install"
ls CLAUDE.md 2>/dev/null && echo "CLAUDE.md exists"
ls CONSTITUTION.md 2>/dev/null && echo "CONSTITUTION.md exists"
```

Determine:
- **Greenfield**: empty or near-empty project.
- **Brownfield**: existing source code or package files.
- **Partial**: some scaffold files exist from a previous install.

### 2. Detect the project type

Read and record:
- Language/runtime from manifest files
- Framework from dependency list
- Database from ORM or docker-compose services
- Test runner from devDependencies or config files
- Monorepo structure (apps/, packages/)
- Package manager from lock file

### 3. Create directory structure

```bash
mkdir -p .claude/commands
mkdir -p .claude/skills/agent-browser
mkdir -p .claude/skills/e2e-test
mkdir -p .claude/skills/debug
mkdir -p .claude/plans
mkdir -p .claude/reference
mkdir -p .claude/templates/reference
mkdir -p .github/ISSUE_TEMPLATE
```

### 4. Install scaffold files

Write the following. **Do not overwrite existing project-specific files** unless the user explicitly asks.

**Root-level docs:**
- `CLAUDE.md` — session bootstrap (adapted to detected stack and commands)
- `CONSTITUTION.md` — project constitution (use template, fill detected fields)
- `PRD.md` — product requirements skeleton

**`.claude/` files:**
- `.claude/README.md`
- `.claude/CONSTITUTION-template.md`
- `.claude/commands/prime.md`
- `.claude/commands/create-rules.md`
- `.claude/commands/create-prd.md`
- `.claude/commands/plan-feature.md`
- `.claude/commands/execute.md`
- `.claude/commands/commit.md`
- `.claude/commands/init-workspace.md`
- `.claude/skills/agent-browser/SKILL.md`
- `.claude/skills/e2e-test/SKILL.md`
- `.claude/skills/debug/SKILL.md`
- `.claude/templates/PRD-template.md`
- `.claude/templates/reference/architecture-template.md`
- `.claude/templates/reference/api-template.md`
- `.claude/templates/reference/database-template.md`
- `.claude/templates/reference/testing-template.md`
- `.claude/templates/reference/deployment-template.md`
- `.claude/templates/reference/security-template.md`

**Reference docs (fill from detection — no placeholders):**
- `.claude/reference/architecture.md`
- `.claude/reference/api.md` (skip if no API detected)
- `.claude/reference/database.md` (skip if no database detected)
- `.claude/reference/testing.md`
- `.claude/reference/deployment.md`

**GitHub templates (skip any that already exist):**
- `.github/ISSUE_TEMPLATE/bug.yml`
- `.github/ISSUE_TEMPLATE/feature.yml`
- `.github/ISSUE_TEMPLATE/task.yml`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/pull_request_template.md`

### 5. Adapt CLAUDE.md

CLAUDE.md must reference:
- The actual project name.
- The actual startup commands (dev server, docker compose, etc.).
- The actual package structure (monorepo apps, or single app).
- The actual validation gate commands.
- Relevant `.claude/reference/` files for the stack.

### 6. Run create-rules after installation

After all files are written, run the `create-rules` workflow to fill `CONSTITUTION.md` from codebase evidence.

### 7. Report

```text
INSTALLED:
  - list of files created

SKIPPED (already existed):
  - list of files not overwritten

NEEDS HUMAN REVIEW:
  - CONSTITUTION.md: team roster, sprint board link, non-negotiables
  - PRD.md: executive summary, scope, roadmap
  - .github/ISSUE_TEMPLATE/config.yml: replace <owner>/<repo>
  - Any reference doc marked with "UNKNOWN"

NEXT STEPS:
  1. Run /prime to load the newly installed context.
  2. Run /create-rules to complete CONSTITUTION.md.
  3. Run /create-prd if PRD.md needs filling.
  4. Create GitHub labels matching the issue templates.
  5. Create a GitHub Project for sprint tracking.
  6. Open initial issues for the first sprint.
```

## Verification Checklist

```text
[ ] CLAUDE.md
[ ] CONSTITUTION.md
[ ] PRD.md
[ ] .claude/README.md
[ ] .claude/commands/prime.md
[ ] .claude/commands/create-rules.md
[ ] .claude/commands/create-prd.md
[ ] .claude/commands/plan-feature.md
[ ] .claude/commands/execute.md
[ ] .claude/commands/commit.md
[ ] .claude/commands/init-workspace.md
[ ] .claude/skills/agent-browser/SKILL.md
[ ] .claude/skills/e2e-test/SKILL.md
[ ] .claude/skills/debug/SKILL.md
[ ] .claude/reference/architecture.md
[ ] .claude/reference/testing.md
[ ] .github/pull_request_template.md
[ ] .github/ISSUE_TEMPLATE/bug.yml
[ ] .github/ISSUE_TEMPLATE/feature.yml
```
