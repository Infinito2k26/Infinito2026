---
name: agent-browser
description: Verify web UI behavior in a browser — responsive layout, forms, state transitions, and critical user flows.
---

# Browser QA Skill

Use after any meaningful frontend change before opening a PR.

## What to Verify

- Page loads without console errors or broken network requests.
- Main user flows are functional at all standard viewports.
- Text does not overlap, overflow, or get clipped.
- Forms show appropriate validation errors on invalid input.
- Loading, empty, error, and success states are all visible and correct.
- Navigation and interactive elements are keyboard-accessible.
- No layout shifts or visual regressions on unchanged pages.

## Standard Viewports

```text
Mobile:  375 × 812   (iPhone SE equivalent)
Tablet:  768 × 1024  (iPad portrait)
Desktop: 1440 × 900  (standard widescreen)
```

## Critical Journeys

> Fill this section by running `/create-rules` or referencing `PRD.md`.
> List the 5–10 end-to-end flows a user must be able to complete.
> Mark each as Required Before Launch or Can Ship Later.

| Journey | Priority |
| ------- | -------- |
| <from PRD or CONSTITUTION> | Required |

## Evidence Format

For every PR that touches UI, include a note covering:

- **Browser and viewport checked** (e.g., Chrome 125 at 375px and 1440px)
- **Pages or flows verified** (list them)
- **States verified** (loading / empty / error / success)
- **Known visual gaps** (what wasn't checked and why)
- **Screenshots** for any non-trivial visual change

## When to Use

- After any change to a page, layout, component, or CSS.
- After adding a new route or navigation item.
- After a data-loading or state management change that affects what the user sees.
- Before cutting a release branch.
