# Create PRD: Product Requirements Document

## Objective

Turn product intent into a buildable, sprint-ready PRD that developers and agents can act on directly.

## Output

Default: `PRD.md` at the project root.
Alternate path only if the user explicitly asks.

## Required Sections

### 1. Executive Summary
- Product name and one-line description.
- Target users.
- Problem being solved.
- MVP success statement (measurable, not aspirational).

### 2. Product Principles
3–5 guiding decisions that settle future trade-offs.
Example: "Prefer async over blocking"; "Zero-config for the happy path".

### 3. User Roles and Personas
Table of who uses the system, their goals, and their frustrations.

### 4. MVP Scope
- **In scope**: explicit list of features and behaviors.
- **Out of scope**: explicit list of things that won't be built in MVP.
Scope clarity prevents scope creep more than any other technique.

### 5. Functional Requirements
Per user role or module. Each requirement must have:
- A behavior description.
- Acceptance criteria (checkboxes).
- The user role it serves.

### 6. System Architecture
- How apps, services, and packages connect.
- Data flow: who produces and who consumes what.
- Key architectural decisions and why.
- Mermaid flowchart only when it clarifies flow or architecture.

### 7. API and Data Contracts
- Key endpoints with method, path, auth, request, response.
- Core data entities and their relationships.
- Invariants: what must always be true.

### 8. Security and Authorization
- Authentication model (JWT, session, OAuth, API key, etc.).
- Authorization matrix: who can do what on which resource.
- Sensitive data: what it is, where it lives, how it's protected.
- Compliance requirements if any (GDPR, PCI, HIPAA, etc.).

### 9. Non-Functional Requirements
- Performance targets (response time, throughput, scale).
- Availability and uptime.
- Offline or degraded-mode behavior.
- Browser / device support.

### 10. Success Metrics
Measurable indicators that the MVP succeeded. Include baseline and target values.

### 11. Phased Roadmap
| Phase | Goal | Key Deliverables | Target Date |
| ----- | ---- | ---------------- | ----------- |
| MVP   |      |                  |             |
| v1.1  |      |                  |             |

### 12. Risks and Mitigations
Both technical and product risks. Each risk needs a mitigation or an owner.

### 13. GitHub Collaboration Model
- Label taxonomy.
- Issue types and templates.
- Sprint board structure.
- Who reviews what.

## Rules

- Concrete acceptance criteria beat broad descriptions.
- Clearly separate MVP from later phases.
- Use Mermaid diagrams only when they clarify flow or architecture.
- After completing the PRD, update `.claude/reference/` files where architecture, API, database, or testing contracts changed.
- Keep the PRD useful for issue creation — every section should produce actionable GitHub issues.
