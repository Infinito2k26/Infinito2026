---
name: browser-qa
description: Verify Infinito web UI behavior in a browser, including responsive layout, forms, dashboard states, and scanner flows.
---

# Browser QA Skill

Use browser verification after meaningful frontend changes.

## What to Verify

- Page loads without console-level breakage.
- Main workflow is usable at desktop and mobile widths.
- Text does not overlap or overflow.
- Forms show validation errors.
- Loading, empty, error, and success states are visible where relevant.
- Navigation and buttons are keyboard accessible where practical.

## Standard Viewports

```text
Mobile: 375 x 812
Tablet: 768 x 1024
Desktop: 1440 x 900
```

## Infinito Critical Journeys

1. Public visitor views landing page and events list.
2. User registers/logs in.
3. Team captain creates or manages a team.
4. Participant starts registration and sees payment pending state.
5. Participant views QR credential after confirmation.
6. Volunteer opens scanner and validates a credential.
7. Admin filters registrations and payment status.

## Evidence

For PRs touching UI, attach screenshots or a short note covering:

- Browser/viewport checked.
- Pages checked.
- Known visual gaps.
