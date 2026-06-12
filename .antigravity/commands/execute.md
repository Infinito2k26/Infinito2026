# Execute: Implement a Prepared Plan

## Objective

Implement the plan passed by the user, keeping changes scoped and reviewable.

## Process

1. Read the plan fully.
2. Re-read affected files before editing.
3. Check `git status --short` and preserve unrelated user changes.
4. Implement tasks in order.
5. Run the validation command attached to each task.
6. Add or update tests for behavior changes.
7. Update `reference/` docs when architecture, API, database, or testing contracts change.
8. Prepare PR notes with commands run and any known gaps.

## Editing Rules

- Use narrow, intentional edits.
- Do not rewrite files wholesale for minor changes.
- Do not introduce new libraries without checking package strategy and official docs.
- Keep backend domain logic out of controllers.
- Keep frontend server state out of React Context.
- Keep schema invariants in the database where possible.

## Validation

Default gate:

```bash
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
```

For UI work, also run or manually verify the relevant page in a browser.

## Completion Report

Include:

- Files changed.
- Behavior implemented.
- Tests/commands run.
- Commands not run and why.
- GitHub issue/PR status if available.
