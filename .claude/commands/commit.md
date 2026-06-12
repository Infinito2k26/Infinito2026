# Commit: Package Changes for Review

## Objective

Create an atomic, reviewable commit or prepare commit notes for a PR.

## Process

1. Inspect changes:

   ```bash
   git status --short
   git diff --stat
   git diff
   ```

2. Confirm scope:
   - Only include files related to the issue.
   - Do not stage unrelated user changes.
   - Do not commit secrets, generated junk, logs, or local env files.

3. Run validation:

   ```bash
   npm run lint
   npm run check-types
   npm run build
   npm run test --workspace=api
   ```

4. Use Conventional Commits:

   ```text
   feat(api): add registration health checks
   fix(web): handle empty event list state
   docs(workflow): add GitHub issue templates
   chore(infra): add CI verification workflow
   ```

5. PR body must include:
   - Linked issue.
   - Summary.
   - Acceptance criteria status.
   - Validation commands.
   - Screenshots/evidence for UI changes.
