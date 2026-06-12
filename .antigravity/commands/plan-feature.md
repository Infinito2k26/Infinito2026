# Plan Feature: GitHub Issue to Implementation Plan

## Objective

Convert a GitHub issue or feature request into a concrete implementation plan that another developer or agent can execute.

No code is written during planning unless the user explicitly asks for immediate implementation.

## Required Inputs

- GitHub issue number or clear feature request.
- Acceptance criteria.
- Target track: web, api, database, infra, docs, or qa.

If GitHub access is unavailable, create a local plan and state that issue/project sync is pending.

## Planning Process

1. Read `ANTIGRAVITY.md` and the relevant `reference/` files.
2. Inspect nearby code and existing patterns.
3. Identify affected modules, routes, pages, packages, and schema.
4. Identify dependencies and docs that must be checked.
5. Break the work into atomic tasks with validation commands.
6. Record risks, data migrations, API changes, and frontend states.

## Plan File

Write plans to:

```text
.antigravity/plans/<issue-number>-<kebab-case-title>.md
```

## Plan Template

````markdown
# Plan: <issue-number> <title>

## Issue

- GitHub: #<number>
- Track:
- Priority:
- Owner:
- Reviewer:

## Outcome

What will be true when this ships.

## Scope

In:

-

Out:

-

## Files to Read First

- `path`

## Files to Change

- `path` - reason

## Implementation Steps

1.
2.
3.

## Tests and Validation

```bash
npm run lint
npm run check-types
npm run build
```
````

## Acceptance Criteria

- [ ]

## Risks

-

```

```
