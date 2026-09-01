# Prime: Load Project Context

## Objective

Build enough context to work safely and correctly in this repository without guessing. Adapt to any stack.

## Steps

### 1. Inspect the worktree

```bash
git status --short
git branch --show-current
git log -n 8 --oneline
git remote -v
```

### 2. Detect the project type

Read whichever manifests exist and determine:

| Signal | Reads |
| ------ | ----- |
| Language | `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `*.csproj`, `pom.xml`, `pubspec.yaml`, `Gemfile` |
| Framework | Dependencies in the manifest; `next`, `nestjs`, `django`, `fastapi`, `axum`, `gin`, `rails`, etc. |
| Database | `schema.prisma`, ORM deps, `docker-compose.yml` services |
| Test runner | `jest`, `vitest`, `pytest`, `cargo test`, `go test` |
| Monorepo | `turbo.json`, `nx.json`, `pnpm-workspace.yaml`, `lerna.json` |
| Package mgr | Lock file: `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `poetry.lock`, `uv.lock` |
| CI/CD | `.github/workflows/*.yml`, `Dockerfile`, `docker-compose.yml` |

### 3. Read durable context

In priority order, read what exists:

1. `CONSTITUTION.md`
2. `PRD.md`
3. `.claude/reference/architecture.md`
4. `.claude/reference/api.md`
5. `.claude/reference/database.md`
6. `.claude/reference/testing.md`
7. `.claude/reference/deployment.md`
8. `.claude/reference/security.md`

### 4. Inspect the repo shape

```bash
find . -maxdepth 3 -type f \
  -not -path '*/.git/*' \
  -not -path '*/node_modules/*' \
  -not -path '*/.turbo/*' \
  -not -path '*/dist/*' \
  -not -path '*/__pycache__/*' \
  -not -path '*/target/*' \
  | sort
```

### 5. Read key entrypoints (adapt to detected stack)

**Node.js monorepo (Turborepo / Nx / pnpm workspaces):**
- `package.json`, `turbo.json` / `nx.json`
- `apps/*/package.json`
- API entry: `apps/api/src/main.ts` or equivalent
- Web entry: `apps/web/app/layout.tsx` or `apps/web/src/App.tsx`

**Node.js single app:**
- `package.json`, `src/index.ts` or `src/index.js`

**Python:**
- `pyproject.toml` or `setup.py`, `requirements.txt`
- `src/<package>/__init__.py` or `app/main.py`

**Rust:**
- `Cargo.toml`, `src/main.rs` or `src/lib.rs`

**Go:**
- `go.mod`, `cmd/*/main.go`, key files in `internal/`

**Mobile (React Native / Flutter):**
- `package.json` / `pubspec.yaml`
- `App.tsx` / `lib/main.dart`

**Ruby on Rails:**
- `Gemfile`, `config/routes.rb`, `config/application.rb`

### 6. Check active plans and GitHub context

```bash
ls .claude/plans/ 2>/dev/null
```

If `gh` CLI is authenticated:
```bash
gh issue list --limit 10 --state open
gh pr list --limit 5
```

## Output

Return a context brief:

```text
Branch:       <current branch>
Phase:        <MVP | Beta | Production> (from CONSTITUTION)
Stack:        <language> / <framework> / <database>
Monorepo:     <yes — tool | no>
Dirty files:  <list or "clean">
Related:      <do dirty files relate to the active issue?>
Active plans: <.claude/plans/*.md that are relevant>
Validation:   <exact commands from CONSTITUTION>
Blockers:     <missing auth, docker not running, missing deps, etc.>
```
