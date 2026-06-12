# Create Rules: Generate or Refresh CONSTITUTION.md

## Objective

Refresh the project constitution from the current codebase and durable docs.

## Inputs

- Existing source code.
- `PRD.md`, if present.
- `.claude/reference/` specs, if present.
- GitHub workflow expectations.

## Process

1. Inspect repo structure:

   ```bash
   rg --files -g '!node_modules'
   ```

2. Read configuration:
   - `package.json`
   - `turbo.json`
   - app-level package files
   - Docker and environment examples

3. Read entrypoints and representative code:
   - API bootstrap and root module.
   - Web layout/page files.
   - Shared packages.
   - Tests.

4. Extract rules:
   - Architecture.
   - Commands.
   - Folder ownership.
   - Naming and testing conventions.
   - GitHub workflow.
   - Validation gate.

5. Update `CONSTITUTION.md` with concrete guidance, not placeholders.

## Output

Summarize:

- Detected stack.
- Files used as evidence.
- Rules updated.
- Any unknowns that need human confirmation.
