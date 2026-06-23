# Commit: Package Changes for Review

## Objective

Create an atomic, reviewable commit and a PR-ready summary.

## Process

### 1. Inspect changes

```bash
git status --short
git diff --stat
git diff
```

### 2. Confirm scope

Only include files related to the current issue. Exclude:
- Unrelated user changes in the working tree
- Generated files (`dist/`, `build/`, `__pycache__/`, `target/`)
- Logs, temporary files, local env files (`.env`, `.env.local`)
- Secrets or credentials of any kind
- Lock file changes unless you explicitly updated a dependency

### 3. Run the validation gate

Read the exact commands from `CONSTITUTION.md`. Do not skip this.

### 4. Stage specific files

```bash
git add <file1> <file2> ...
# Prefer named files over "git add ." to avoid accidental inclusions
```

### 5. Write the commit message using Conventional Commits

```text
<type>(<scope>): <short imperative description under 72 chars>

<optional body: why this change, relevant constraints, trade-offs>

Closes #<issue-number>
```

**Type reference:**

| Type | Use when |
| ---- | -------- |
| `feat` | Adding new user-facing behavior |
| `fix` | Correcting incorrect behavior |
| `refactor` | Internal restructuring, no behavior change |
| `test` | Adding or fixing tests only |
| `docs` | Documentation or comments only |
| `chore` | Build, config, dependencies, tooling |
| `perf` | Performance improvement |
| `style` | Formatting, whitespace — no logic change |
| `ci` | CI/CD pipeline changes |

**Scope examples:** `api`, `web`, `db`, `auth`, `infra`, `payments`, `mobile`

### 6. PR body

```markdown
## Summary

<!-- What this PR does and why -->

## Changes

- `path/to/file` — what changed

## Acceptance Criteria

- [ ] 
- [ ] 

## Validation

Commands run and result:
```bash
<commands and output summary>
```

<!-- Screenshots or recordings for UI changes -->

Closes #<issue>
```

## Non-negotiables

- Never skip the validation gate.
- Never commit `.env`, secrets, API keys, or credentials.
- One logical change per commit.
- PR title must follow the same Conventional Commits format.
- Do not push directly to `main` or `master`.
