# Prime: Load Infinito Project Context

## Objective

Build enough context to work safely in the Infinito repository without guessing.

## Steps

1. Inspect the worktree:

   ```bash
   git status --short
   git branch --show-current
   git log -n 8 --oneline
   ```

2. Read durable context:
   - `CONSTITUTION.md`
   - `PRD.md`
   - `.claude/reference/architecture.md`
   - `.claude/reference/api.md`
   - `.claude/reference/database.md`
   - `.claude/reference/testing.md`

3. Inspect the repo shape:

   ```bash
   rg --files -g '!node_modules'
   ```

4. Read package and app entrypoints:
   - `package.json`
   - `turbo.json`
   - `docker-compose.yml`
   - `apps/api/src/main.ts`
   - `apps/api/src/app.module.ts`
   - `apps/web/app/layout.tsx`
   - `apps/web/app/page.tsx`

5. Check GitHub context when available:
   - Current issue or PR.
   - Project status.
   - Labels, assignee, acceptance criteria, and linked branches.

## Output

Return a concise context brief:

- Current phase and branch.
- Dirty files and whether they look related.
- Relevant modules/apps.
- Commands needed for validation.
- Known blockers such as missing GitHub auth, missing Docker, or missing dependencies.
