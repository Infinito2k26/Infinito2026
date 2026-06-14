# Execute: Implement a Prepared Plan

## Objective

Implement the plan faithfully. Changes must be scoped, tested, and reviewable.

## Before Starting

1. Read the plan fully before touching any file.
2. Read `CONSTITUTION.md` — particularly Architecture rules and the Validation Gate.
3. Read every file listed in the plan's "Files to Read First".
4. Run `git status --short` — identify and preserve all unrelated user changes.

## Process

1. Implement steps in the order written in the plan.
2. Re-read a file fully before editing it.
3. After each step, run the validation command listed for that step.
4. For any behavior change: add or update a test that would catch a regression.
5. For any architecture, API, schema, or testing contract change: update the relevant `.claude/reference/` doc.

## Editing Rules

- **Narrow edits**: change what the plan says, nothing more. Do not reformat, rename, or refactor unrelated code.
- **No new libraries** without checking CONSTITUTION and official docs. Flag it and ask if uncertain.
- **Business logic out of controllers**: services, handlers, use-cases — never controllers or route files.
- **Server state out of client state managers**: use server components, loaders, or query libraries. Not React Context.
- **Schema invariants in the database**: constraints, unique indexes, foreign keys — not only in application code.
- **Match the existing file's conventions**: naming, import order, comment style, error handling pattern.

## Validation Gate

Read the exact commands from `CONSTITUTION.md`. If not yet defined, use the default for the detected stack:

**Node.js:**
```bash
npm run lint && npm run check-types && npm run build && npm test
```
(substitute `pnpm` / `yarn` / `bun` as appropriate)

**Python:**
```bash
ruff check . && mypy . && pytest
```

**Rust:**
```bash
cargo fmt --check && cargo clippy -- -D warnings && cargo test
```

**Go:**
```bash
go vet ./... && go test ./...
```

**Mobile (React Native):**
```bash
npx tsc --noEmit && jest
```

**Mobile (Flutter):**
```bash
flutter analyze && flutter test
```

For UI changes, also verify in a browser:
- Mobile viewport: 375 × 812
- Desktop viewport: 1440 × 900

## Completion Report

Include all of the following:

- **Files changed** — list every file modified
- **Behavior implemented** — what the change does in plain language
- **Tests/commands run** — copy the output summary or note pass/fail
- **Commands not run** — and exactly why (no service available, scope mismatch, etc.)
- **Open gaps** — anything not addressed that should become a follow-up issue
- **PR / issue status** — is the PR open? Is the issue linked?
