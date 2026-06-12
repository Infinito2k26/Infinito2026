# Create PRD: Product Requirements Document

## Objective

Create or refresh a PRD that turns product intent into buildable scope.

## Output

Default file:

```text
PRD.md
```

Use a different path only if the user asks.

## Required Sections

1. Executive summary.
2. Product principles.
3. User roles/personas.
4. MVP scope and explicit non-goals.
5. Functional requirements.
6. System architecture.
7. Security and configuration requirements.
8. API/database impact.
9. Success metrics.
10. Phased implementation roadmap.
11. Risks and mitigations.
12. GitHub collaboration requirements.

## Rules

- Prefer concrete acceptance criteria over broad descriptions.
- Separate MVP from later phases.
- Include Mermaid diagrams only when they clarify flow or architecture.
- Update `reference/` files when the PRD changes architecture, API, database, or testing strategy.
- Keep the document useful for issue creation and sprint planning.
