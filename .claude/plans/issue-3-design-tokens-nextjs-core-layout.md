# Plan: Issue #3 Design Tokens and Next.js Core Layout

## Issue

- GitHub: https://github.com/Infinito2k26/Infinito2026/issues/3
- Owner: `Anjney-Lawaniya`
- Track: Frontend
- Priority: P0
- Branch: `feature/ui-shell`
- Target: `develop`

## Outcome

The web app has a mobile-first visual foundation, reusable public and dashboard layout components, improved metadata, and responsive navigation shells that future pages can build on.

## Current Context

- `apps/web` is a minimal Next.js App Router app.
- `apps/web/app/globals.css` currently has only starter background/foreground tokens.
- The issue asks for Tailwind integration, but Tailwind is not currently installed or configured in `apps/web`.
- The repo currently uses CSS/global CSS and shared `packages/ui`; adding Tailwind must be an explicit architecture decision, not an accidental dependency.

## Scope

In scope:

- Define global CSS custom properties for the Infinito design system.
- Build public layout components.
- Build dashboard shell components.
- Use plain CSS Modules or global CSS unless the lead explicitly approves adding Tailwind.
- Update app metadata from starter text to Infinito-specific metadata.
- Validate responsive behavior at mobile and desktop widths.

Out of scope:

- Auth implementation.
- API integration.
- Real dashboard data.
- Full landing page redesign.
- Tailwind installation unless separately approved.

## Files to Read First

- `CONSTITUTION.md`
- `.claude/reference/architecture.md`
- `apps/web/package.json`
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `packages/ui/src/*`

## Files to Change

Recommended structure:

```text
apps/web/app/globals.css
apps/web/app/layout.tsx
apps/web/components/layout/navbar.tsx
apps/web/components/layout/footer.tsx
apps/web/components/layout/sidebar.tsx
apps/web/components/layout/bottom-nav.tsx
apps/web/components/layout/public-layout.tsx
apps/web/components/layout/dashboard-layout.tsx
apps/web/components/layout/layout.module.css
```

Use `apps/web/components/...` unless a local convention emerges that requires `src/components`.

## Implementation Steps

1. Update `apps/web/app/layout.tsx` metadata:
   - title: `Infinito 2K26`
   - description: `IIT Patna annual sports fest platform`

2. Replace starter CSS variables in `globals.css` with design tokens:
   - background colors
   - surface colors
   - accent colors
   - text colors
   - border colors
   - spacing scale
   - radius scale
   - shadow scale
   - font variables

3. Keep palette balanced. Avoid making the whole app only dark blue/slate or only purple.

4. Create typed navigation item constants:
   - Public nav: Home, Events, Sports, About
   - Dashboard nav: Dashboard, Events, Teams, Analytics, Settings
   - Mobile dashboard nav: Home, Events, Teams, Profile

5. Build `Navbar`:
   - sticky top
   - desktop inline links
   - mobile menu button
   - no API dependency

6. Build `Footer`:
   - responsive columns
   - mobile stacking
   - clear contrast

7. Build `PublicLayout`:
   - wraps navbar, main, footer
   - no nested card layout

8. Build `Sidebar`, `BottomNav`, and `DashboardLayout`:
   - desktop fixed sidebar
   - mobile bottom navigation with safe-area padding
   - active state prop support

9. Create a small demo composition only if needed to verify layout locally. Do not replace product content with a marketing-heavy landing page unless asked.

10. Validate:
    ```bash
    npm run lint --workspace=web
    npm run check-types --workspace=web
    npm run build --workspace=web
    ```

11. Browser QA:
    - 375 x 667
    - 390 x 844
    - 1440 x 900

## Acceptance Criteria

- [ ] Metadata is no longer starter text.
- [ ] Design tokens exist in `globals.css`.
- [ ] Public layout components are reusable and typed.
- [ ] Dashboard layout components are reusable and typed.
- [ ] Mobile navigation is touch-friendly and safe-area aware.
- [ ] No horizontal overflow at 375px width.
- [ ] No text overlap in navigation or footer.
- [ ] No hardcoded one-off colors in components beyond token references.
- [ ] Web lint, typecheck, and build pass.

## Review Notes for Lead

Resolve the Tailwind mismatch before implementation. Recommendation: do not add Tailwind in this issue. Use CSS variables plus CSS Modules now, and introduce Tailwind later only if the team explicitly wants that dependency.

