---
name: debug
description: Systematic debugging workflow for diagnosing errors, unexpected behavior, and performance regressions across any stack.
---

# Debug Skill

## Objective

Diagnose the root cause of a bug, crash, or unexpected behavior using evidence — not guessing.

---

## Step 1 — Reproduce

Before touching any code:

- Confirm the **exact** error message, stack trace, or wrong output.
- Identify the **minimum conditions** that trigger it: branch, environment, inputs.
- Confirm it is **deterministic** (always happens) or **intermittent** (sometimes).
- Check if it is a **regression**: `git log --oneline -20` to find when it appeared.

```bash
git log --oneline -20
git bisect start   # if a regression with known good commit
```

---

## Step 2 — Read the Error

For errors with stack traces:

- Start from the **bottom of the trace** (innermost, real cause) — not the top (generic wrapper).
- Identify the **file and line number** that is directly responsible.
- Read that file fully, not just the offending line.

For silent wrong behavior:

- Add targeted logging at the entry point and at the decision point.
- Print the actual value vs. the expected value.
- Do not change logic while adding logging.

---

## Step 3 — Check Recent Changes to That File

```bash
git log -n 15 -- <path/to/file>
git diff HEAD~3 -- <path/to/file>
```

If the file changed recently, the bug is likely in those changes.

---

## Step 4 — Form Hypotheses

State exactly **2–3 concrete hypotheses**, ranked by likelihood. For each:

- What would cause this behavior?
- What is the cheapest test of this hypothesis?

Do not proceed to fixing until you have at least one testable hypothesis.

---

## Step 5 — Test the Hypothesis

- Add targeted logging, a temporary assertion, or a minimal reproduction.
- Run the validation command for that area (from `CONSTITUTION.md`).
- Observe output. Does it confirm or refute the hypothesis?

Rules:
- Never delete production logic to "see if the bug goes away" — add, don't remove.
- Never guess-and-check with random changes. Each change must test something specific.

---

## Step 6 — Fix

- Change **only what the evidence points to**.
- Do not refactor or clean up nearby code while fixing a bug.
- Run the full validation gate from `CONSTITUTION.md`.
- Remove any debugging logs or temporary assertions added in earlier steps.

---

## Step 7 — Write a Regression Test

- Write a test that would have caught this bug before the fix.
- The test must fail on the unfixed code and pass on the fixed code.
- Place it in the same test file as related tests, following existing conventions.

---

## Step 8 — Confirm

- Reproduce the original scenario — confirm it is fixed.
- Run the full test suite — confirm no regressions.
- If the bug was reported by a user, verify in the environment where it was reported.

---

## Common Patterns by Stack

**Node.js / TypeScript:**
- Unhandled promise: look for missing `await`, `.catch()`, or try/catch in async functions.
- Type errors at runtime: check for `undefined` access, wrong generic type, or `as any` casts.
- Module not found: check import paths, `tsconfig` paths, and whether the package is installed.

**Python:**
- `AttributeError` / `KeyError`: usually `None` or missing dict key — add a guard or check the data shape.
- Import errors: check `__init__.py`, virtual env activation, and circular imports.
- Async bugs: missing `await`, mixed sync/async code, event loop issues.

**Rust:**
- Borrow checker errors: read the error message carefully — the compiler tells you exactly what to do.
- Panics: add `RUST_BACKTRACE=1` to get the full trace.
- Lifetime issues: often caused by returning references — consider owning the data instead.

**Go:**
- Nil pointer dereference: check that structs and pointers are initialized before use.
- Data races: run with `-race` flag: `go test -race ./...`
- Goroutine leaks: check that goroutines have exit conditions.

**Database / ORM:**
- Unexpected `null`: check the schema for nullable columns and ORM's `include` / `select`.
- N+1 queries: add query logging and look for the same query repeated in a loop.
- Migration drift: compare schema in code vs. actual database: `<ORM> migrate status`.
