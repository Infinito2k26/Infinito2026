# Plan: Shared UI Primitives (1C.3)

## Issue

- Owner: `jamanrao-beep`
- Track: Frontend
- Priority: P0
- Branch: `feature/ui-primitives`
- Target: `develop`

## Outcome

`apps/web` has a set of reusable, typed, design-token-aware UI primitive components that all future pages can consume without re-implementing common patterns. No business logic. No API calls. Pure presentation.

## Current Context

- Design tokens are live in `apps/web/app/globals.css` as CSS custom properties.
- `packages/ui/src/button.tsx` and `packages/ui/src/card.tsx` exist but are Turborepo boilerplate — `Button` calls `alert()`, `Card` has Turborepo UTM links. Both must be replaced.
- `packages/ui` exports via `"exports": { "./*": "./src/*.tsx" }` — the export wiring already exists.
- Layout components live in `apps/web/components/layout/`. Primitives go in `apps/web/components/ui/`.
- CSS Modules is the styling approach. No Tailwind.

## Scope

In scope:
- Button component (variants: primary, secondary, ghost, danger; sizes: sm, md, lg; loading state)
- Card component (clean container surface)
- Badge component (status labels: default, success, warning, danger, info)
- Input component (text input with label, error message, disabled state)
- Spinner component (loading indicator, size variants)
- Modal component (overlay dialog, close on backdrop click, accessible)
- Replace `packages/ui/src/button.tsx` and `packages/ui/src/card.tsx` with the real versions

Out of scope:
- Select, Checkbox, Radio, Textarea — defer to later issues
- Form library integration (React Hook Form, Zod) — handled when actual forms are built
- Animation beyond CSS transitions
- Dark mode variants (tokens don't have dark palette yet)

## Files to Read First

- `apps/web/app/globals.css` — understand available CSS variables before writing a single class
- `apps/web/components/layout/layout.module.css` — understand the existing CSS Modules patterns
- `apps/web/components/layout/navbar.tsx` — understand the coding style to match
- `packages/ui/src/button.tsx` — see what you are replacing
- `packages/ui/package.json` — understand the export structure

## Files to Create / Change

```text
apps/web/components/ui/button.tsx
apps/web/components/ui/button.module.css
apps/web/components/ui/card.tsx
apps/web/components/ui/card.module.css
apps/web/components/ui/badge.tsx
apps/web/components/ui/badge.module.css
apps/web/components/ui/input.tsx
apps/web/components/ui/input.module.css
apps/web/components/ui/spinner.tsx
apps/web/components/ui/spinner.module.css
apps/web/components/ui/modal.tsx
apps/web/components/ui/modal.module.css
packages/ui/src/button.tsx     (replace boilerplate)
packages/ui/src/card.tsx       (replace boilerplate)
```

## Implementation Steps

### 1. Button

Props interface:
```ts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}
```

Requirements:
- `variant="primary"` uses `--color-accent-primary` as background
- `variant="secondary"` uses `--color-bg-secondary` background, `--color-text-primary` text
- `variant="ghost"` transparent background, border from `--color-border`
- `variant="danger"` red background for destructive actions
- `loading={true}` shows a spinner inline and sets `disabled` automatically
- Forwards all native button attributes (type, onClick, disabled, etc.)
- `"use client"` is NOT needed — no state, pure props

### 2. Card

Props interface:
```ts
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}
```

Requirements:
- Surface background: `--color-surface`
- Border: `--color-border`
- Border radius: `--radius-md`
- Not a link, not interactive — just a container

### 3. Badge

Props interface:
```ts
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}
```

Requirements:
- Inline pill shape
- Each variant uses a muted background + matching text color (don't use raw design tokens for this — define badge-specific color pairs in the CSS module)
- No click handler

### 4. Input

Props interface:
```ts
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
```

Requirements:
- Label renders above the input when provided
- Error message renders below with red text when `error` is provided
- Input border changes to red when in error state
- `hint` renders below as muted helper text (lower priority than error)
- Forwards all native input attributes (type, value, onChange, disabled, placeholder, etc.)

### 5. Spinner

Props interface:
```ts
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}
```

Requirements:
- CSS animation, not a GIF or external asset
- Uses `--color-accent-primary` for the spinner color
- Sizes: sm = 16px, md = 24px, lg = 40px

### 6. Modal

Props interface:
```ts
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
```

Requirements:
- `"use client"` — uses `useEffect` for body scroll lock
- Backdrop click calls `onClose`
- Escape key calls `onClose` (keydown event listener in useEffect)
- Locks body scroll when open (`document.body.style.overflow = "hidden"`)
- Restores scroll on close
- Renders via a React portal (`document.getElementById("modal-root")`) — add `<div id="modal-root" />` to `apps/web/app/layout.tsx` body

### 7. Replace packages/ui boilerplate

Replace `packages/ui/src/button.tsx` with a re-export or a simple version of the Button above (without CSS Modules — use className passthrough so the package remains style-agnostic):

```ts
// packages/ui/src/button.tsx
export { default as Button } from "../../apps/web/components/ui/button";
```

Actually — simpler approach: copy a minimal unstyled version into packages/ui and leave the styled version in apps/web. The packages/ui components are for cross-app sharing; apps/web components are app-specific styled versions. Discuss with Lead if unclear.

### 8. Validate

```bash
npm run lint --workspace=web
npm run check-types --workspace=web
npm run build --workspace=web
```

## Acceptance Criteria

- [ ] Button: all variants and sizes render correctly
- [ ] Button: loading state shows spinner and disables interaction
- [ ] Card: renders as a surface container with correct tokens
- [ ] Badge: all 5 variants render with distinct colours
- [ ] Input: label, hint, and error states all render
- [ ] Input: forwards native attributes (disabled, placeholder, onChange work)
- [ ] Spinner: 3 sizes render with CSS animation
- [ ] Modal: opens and closes correctly
- [ ] Modal: backdrop click and Escape key close it
- [ ] Modal: body scroll is locked while open
- [ ] packages/ui boilerplate button and card replaced
- [ ] No hardcoded hex colours — only CSS variable references
- [ ] Web lint, typecheck, and build pass with zero errors

## Review Notes for Lead

- Reviewer: Anjney-Lawaniya → then Lead approves
- These primitives are the building blocks for 1C.5 (loading/empty/error states) and all Phase 2D pages — keep the interfaces clean and don't over-engineer
- Modal portal requires `modal-root` in layout.tsx — flag if this conflicts with anything
