# Create Rules: Generate or Refresh CONSTITUTION.md

## Objective

Generate or refresh `CONSTITUTION.md` from the current codebase. Every rule must be derived from evidence in the code, not assumed. No placeholders.

## Process

### 1. Inventory the repo

```bash
find . -maxdepth 4 -type f \
  -not -path '*/.git/*' \
  -not -path '*/node_modules/*' \
  -not -path '*/dist/*' \
  -not -path '*/.turbo/*' \
  -not -path '*/__pycache__/*' \
  -not -path '*/target/*' \
  | sort
```

### 2. Detect the full stack

Read manifests in this order and stop when a category is resolved:

**Language / Runtime:**
- `package.json` → Node.js; check `engines.node` for version
- `pyproject.toml` / `setup.py` / `requirements.txt` → Python; check `python_requires`
- `Cargo.toml` → Rust; check `edition` and `rust-version`
- `go.mod` → Go; check `go` directive for version
- `*.csproj` / `global.json` → .NET/C#
- `pom.xml` / `build.gradle` → JVM (Java/Kotlin/Scala)
- `pubspec.yaml` → Dart/Flutter
- `Gemfile` → Ruby

**Framework (after language):**
- Node.js: scan `dependencies` for `next`, `remix`, `nuxt`, `sveltekit`, `astro`, `@nestjs/core`, `express`, `fastify`, `hapi`, `koa`
- Python: scan for `django`, `fastapi`, `flask`, `starlette`, `litestar`
- Rust: scan `Cargo.toml` for `axum`, `actix-web`, `warp`, `poem`, `rocket`
- Go: scan `go.mod` for `github.com/gin-gonic/gin`, `echo`, `chi`, `fiber`
- Ruby: scan for `rails`, `sinatra`

**Database / ORM:**
- `schema.prisma` → Prisma; read it for the provider
- `drizzle.config.*` or `drizzle-orm` dep → Drizzle
- `typeorm` / `sequelize` / `mongoose` dep → those ORMs
- `alembic` in pyproject or `migrations/` folder → SQLAlchemy/Alembic
- `diesel` in Cargo.toml → Diesel (Rust)
- GORM in go.mod → GORM (Go)
- `docker-compose.yml` services for `postgres`, `mysql`, `mongodb`, `redis`, `sqlite`

**Testing:**
- Node.js: `jest`, `vitest`, `mocha`, `ava`; E2E: `playwright`, `cypress`, `puppeteer`
- Python: `pytest`, `unittest`; E2E: `playwright`, `selenium`
- Rust: built-in `#[test]` and `#[cfg(test)]`
- Go: `testing` package; E2E: `testcontainers-go`

**Package manager:**
- `pnpm-lock.yaml` → pnpm
- `yarn.lock` → yarn
- `package-lock.json` → npm
- `bun.lockb` → bun
- `poetry.lock` → poetry
- `pdm.lock` → pdm
- `uv.lock` → uv
- `Cargo.lock` → cargo
- `go.sum` → go modules

**Monorepo:**
- `turbo.json` → Turborepo
- `nx.json` → Nx
- `pnpm-workspace.yaml` → pnpm workspaces
- `lerna.json` → Lerna
- Multiple `apps/` or `packages/` dirs → monorepo pattern

**CI/CD and hosting:**
- `.github/workflows/*.yml` → GitHub Actions (read the workflow steps)
- `Dockerfile`, `docker-compose.yml` → containerized
- `vercel.json` → Vercel; `netlify.toml` → Netlify; `fly.toml` → Fly.io
- `render.yaml` → Render; `railway.json` → Railway

### 3. Read representative source code

Read 3–5 files per category to extract real conventions:

- **Entrypoint / bootstrap** — application startup
- **Controller or route handler** — how HTTP is handled
- **Service or business logic unit** — where logic lives
- **Test file** — test style, fixtures, assertions
- **Schema or model** — data shape conventions

Read CI workflow files to find the exact validation command sequence.

### 4. Extract rules

From the evidence gathered, document:

**Architecture:**
- Layer structure (controllers → services → repositories; components → hooks → stores)
- Module boundaries (what can import what)
- Cross-module communication (events, queues, direct imports)
- Where business logic must and must not live

**Naming conventions:**
- File names (kebab-case, PascalCase, snake_case)
- Class, function, variable names
- Test file names and locations
- Branch naming pattern

**Commands (exact, runnable):**
- Install
- Dev
- Build
- Lint
- Typecheck
- Unit test
- E2E test
- Database operations (migrate, seed)

**Testing rules:**
- Coverage expectations
- What must have tests
- Forbidden patterns (e.g., no mocking the database)
- Fixture or factory conventions

**GitHub workflow:**
- Branch naming
- PR requirements
- Required checks
- Merge strategy

**Validation gate:**
The exact sequence of commands that must pass before any commit.

### 5. Write CONSTITUTION.md

Use `.claude/CONSTITUTION-template.md` as the structure. Fill every field with concrete, evidence-based content. If something is genuinely unknown, write `UNKNOWN — needs human input` rather than a placeholder or guess.

Do not write rules that don't exist in the code — only document what is actually there.

## Output

Summarize:

- **Detected stack** with the evidence file for each decision
- **Sections written or updated**
- **Unknowns** that need the lead developer to fill in
