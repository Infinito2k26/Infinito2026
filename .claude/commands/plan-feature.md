# Plan Feature: Issue to Implementation Plan

## Objective

Convert a GitHub issue, Linear ticket, Jira card, or plain feature description into a concrete, executable implementation plan.

**No code is written during this step.**

## Required Inputs

Provide one of:
- GitHub issue number → `gh issue view <number>`
- Linear / Jira URL → paste the URL
- Plain feature description with explicit acceptance criteria

Also helpful:
- Target area: `api | web | mobile | cli | database | infra | docs | qa`
- Priority and deadline context
- Any known constraints or dependencies

## Planning Process

### 1. Read project context

- `CONSTITUTION.md`
- `.claude/reference/architecture.md`
- The reference doc for the target area (api, database, etc.)

### 2. Fetch the issue

```bash
gh issue view <number>   # GitHub
# Or read the provided description
```

Extract:
- Acceptance criteria
- Track / area
- Priority
- Dependencies or blockers

### 3. Investigate the codebase

- Find affected files, modules, routes, pages, schemas.
- Find existing patterns to follow (naming, structure, test style).
- Find files to read before making any change.
- Identify external docs, changelogs, or specs to check.
- Identify data migrations, API contract changes, or breaking changes.

### 4. Design the implementation

- Break work into atomic, independently testable steps.
- Each step must have: what to do, which files to change, validation command.
- Identify edge cases: empty state, error state, loading state, unauthorized state.
- Identify required tests and what they must prove.

### 5. Write the plan

```text
.claude/plans/<identifier>-<kebab-case-title>.md
```

Examples:
- `.claude/plans/42-user-auth.md`
- `.claude/plans/LIN-123-export-csv.md`
- `.claude/plans/local-add-dark-mode.md`

## Plan Template

```markdown
# Plan: <identifier> — <title>

## Issue

- Tracker: GitHub #<n> | Linear <id> | Jira <id> | local
- Track: api | web | mobile | cli | database | infra | docs | qa
- Priority: critical | high | medium | low
- Owner:
- Reviewer:
- Target branch:

## Outcome

What will be verifiably true when this ships (testable, not aspirational).

## Scope

**In:**
-

**Out:**
-

## Files to Read First

- `path/to/file.ts` — why this matters

## Files to Change

- `path/to/file.ts` — what changes and why

## Implementation Steps

### Step 1: <title>

- **What:** 
- **Files:** 
- **Validation:** `<command to run>`

### Step 2: <title>

- **What:** 
- **Files:** 
- **Validation:** `<command to run>`

## Tests and Validation

```bash
# Validation gate from CONSTITUTION.md
```

## Acceptance Criteria

- [ ] 
- [ ] 

## Risks and Notes

- **Data migration:** none | describe if needed
- **API contract change:** breaking | additive | none
- **Performance concern:** none | describe if needed
- **Unknowns:** list anything not yet clear
```

## Rules

- No code during planning.
- Unknowns go in the Risks section — never paper over them.
- Scope = the issue, nothing more. Resist the urge to clean up nearby code.
- If GitHub / issue tracker is unavailable, create the plan locally with `local` as the tracker.
