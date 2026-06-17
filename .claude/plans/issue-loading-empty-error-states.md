# Plan: Loading, Empty, and Error State Components (1C.5)

## Issue

- Owner: `jamanrao-beep`
- Track: Frontend
- Priority: P0
- Branch: `feature/ui-states`
- Branch from: `feature/ui-primitives` (if 1C.3 is not yet merged to develop) or `develop` (if 1C.3 is merged)
- Target: `develop`

## Outcome

Every data-dependent page on the platform has consistent, reusable states for the three non-happy-path conditions: loading, empty, and error. No page should ever show a blank white screen or an unhandled thrown error.

## Dependency

**This issue depends on 1C.3 (UI Primitives) being merged or available on a feature branch.**

Specifically uses:
- `Spinner` from 1C.3 for the loading state
- `Button` from 1C.3 for the error retry action

If 1C.3 is not yet merged, branch off `feature/ui-primitives` and merge that in first or develop in parallel and resolve on PR.

## Scope

In scope:
- `PageSpinner` — full-page centered loading state
- `SectionSpinner` — inline loading state for a list or section
- `EmptyState` — zero-results or not-yet-populated state with optional CTA
- `ErrorState` — something went wrong state with optional retry action
- `NotFound` — 404-equivalent for missing resources (for use inside pages, not the Next.js 404 page)
- Next.js `app/error.tsx` global error boundary
- Next.js `app/loading.tsx` global route-level loading UI

Out of scope:
- Skeleton loaders (defer to Phase 2D when real data shapes are known)
- Toast / snackbar notifications (separate concern, defer)
- Form validation error states (handled in the Input component from 1C.3)
- Next.js `app/not-found.tsx` page (defer to public pages issue)

## Files to Read First

- `apps/web/app/globals.css` — CSS variables
- `apps/web/components/layout/layout.module.css` — CSS Modules patterns
- `apps/web/components/ui/spinner.tsx` — from 1C.3 (import this, don't rebuild it)
- `apps/web/components/ui/button.tsx` — from 1C.3 (import this for retry CTA)
- Next.js App Router docs pattern for `error.tsx` and `loading.tsx`

## Files to Create

```text
apps/web/components/ui/page-spinner.tsx
apps/web/components/ui/page-spinner.module.css
apps/web/components/ui/section-spinner.tsx
apps/web/components/ui/empty-state.tsx
apps/web/components/ui/empty-state.module.css
apps/web/components/ui/error-state.tsx
apps/web/components/ui/error-state.module.css
apps/web/components/ui/not-found.tsx
apps/web/components/ui/not-found.module.css
apps/web/app/loading.tsx
apps/web/app/error.tsx
```

## Implementation Steps

### 1. PageSpinner

Full-viewport centered loading indicator. Used while an entire page is loading.

```ts
interface PageSpinnerProps {
  message?: string;
}
```

Requirements:
- Centered horizontally and vertically in the viewport
- Uses `Spinner` from 1C.3 with `size="lg"`
- Optional `message` text below (e.g. "Loading events...")
- Background: `--color-bg-primary`

### 2. SectionSpinner

Inline loading state for a list, card grid, or content section. Used within a page that's already rendered its shell.

```ts
interface SectionSpinnerProps {
  message?: string;
  minHeight?: string;
}
```

Requirements:
- Centered within its parent container (not full viewport)
- `minHeight` defaults to `"200px"` so the section doesn't collapse
- Uses `Spinner` from 1C.3 with `size="md"`

### 3. EmptyState

Zero-results or not-yet-populated state.

```ts
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}
```

Requirements:
- Centered layout with icon (optional), title, description, and optional CTA button
- If no icon provided, use a simple placeholder (box with dashed border, or a generic SVG)
- CTA uses `Button variant="primary"` from 1C.3
- Calm visual — not alarming, just informative

### 4. ErrorState

Something went wrong. Recoverable errors only (unexpected data failure, API timeout).

```ts
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}
```

Requirements:
- Default title: "Something went wrong"
- Default description: "An unexpected error occurred. Try again."
- `onRetry` renders a "Try again" Button
- Visually distinct from EmptyState — use a warning colour from badge variables (not alarming red, but not neutral either)
- Does NOT show raw error stack traces

### 5. NotFound

In-page 404 state for when a specific resource doesn't exist (e.g. event not found).

```ts
interface NotFoundProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}
```

Requirements:
- Default title: "Not found"
- Optional back link rendered as `Button variant="ghost"`
- Calm visual, similar layout to EmptyState

### 6. Next.js app/loading.tsx

Route-level loading UI that Next.js shows automatically during navigation.

```tsx
// apps/web/app/loading.tsx
import PageSpinner from "@/components/ui/page-spinner";
export default function Loading() {
  return <PageSpinner message="Loading..." />;
}
```

### 7. Next.js app/error.tsx

Global error boundary. Next.js requires `"use client"` on this file.

```tsx
"use client";
import { useEffect } from "react";
import ErrorState from "@/components/ui/error-state";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState onRetry={reset} />;
}
```

### 8. Validate

```bash
npm run lint --workspace=web
npm run check-types --workspace=web
npm run build --workspace=web
```

## Acceptance Criteria

- [ ] `PageSpinner` renders centered with optional message
- [ ] `SectionSpinner` renders inline with configurable minHeight
- [ ] `EmptyState` renders title, description, optional CTA
- [ ] `EmptyState` CTA uses Button from 1C.3
- [ ] `ErrorState` renders with retry action
- [ ] `ErrorState` does not expose raw error stack traces
- [ ] `NotFound` renders with optional back link
- [ ] `app/loading.tsx` uses `PageSpinner`
- [ ] `app/error.tsx` uses `ErrorState` with the Next.js reset callback
- [ ] No hardcoded hex colours
- [ ] Web lint, typecheck, and build pass with zero errors

## Review Notes for Lead

- Reviewer: Anjney-Lawaniya → then Lead approves
- These components are consumed by every Phase 2D page — interfaces should stay minimal and stable
- `app/error.tsx` must be `"use client"` — Next.js requirement, not a mistake
- Do not add toast/snackbar here; that's a separate concern
