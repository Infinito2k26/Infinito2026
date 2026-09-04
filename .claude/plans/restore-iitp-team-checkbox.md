# Plan: Restore the IIT Patna team fee-waiver checkbox

Branch: `fix/restore-iitp-team-checkbox` (from `develop`)

## Background

`Team.isIITP` and its downstream effect — `RegistrationsService` charging ₹0 for a team whose
`isIITP` is `true` — were never removed. What got removed in `74a6cf0` ("remove self-declared IITP
fee-waiver checkbox") was only the UI/DTO path that let a captain *set* it: the checkbox was dropped
from Create Team and Edit Team, `isIITP` was dropped from `CreateTeamDto`/`UpdateTeamDto`, and
`TeamsService` now hardcodes `isIITP: false` on create and never writes it on update. That commit's
stated reasoning was fraud risk (pure honor system, no verification) — a legitimate concern, but per
your decision this is being reverted: every IIT Patna team was being wrongly charged, so the
self-declaration comes back exactly as it worked before, no added verification.

Individual (non-team) registrations are untouched by this plan — that fee waiver already runs through
`User.isIITP`, set via a verified `.iitp.ac.in` Microsoft OAuth login, a separate mechanism with no
checkbox and no honor-system risk.

## 1. Backend DTO (`apps/api/src/teams/dto/teams.dto.ts`)

Re-add to `CreateTeamDto` and `UpdateTeamDto`, matching the exact validator that was removed (multipart
fields arrive as the strings `"true"`/`"false"`, so a plain `@Type(() => Boolean)` would be wrong —
`Boolean("false")` is `true` in JS):

```ts
@Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value === 'true' : value,
)
@IsBoolean()
@IsOptional()
isIITP?: boolean;
```

Re-add the `Transform`/`IsBoolean` imports dropped in that commit.

## 2. Backend service (`apps/api/src/teams/teams.service.ts`)

- `createTeam`: change `isIITP: false` back to `isIITP: dto.isIITP ?? false`.
- `updateTeam`: add `isIITP: dto.isIITP` back to the update payload (only written when present, same as
  every other optional field there already).

## 3. Frontend — Create Team (`apps/web/app/dashboard/events/[slug]/register/page.tsx`)

- Re-add `isIITP` state to `CreateTeamForm`, the `formData.append("isIITP", String(isIITP))` line, and
  read `isIITP: data.team.isIITP` from the response the same way `secondaryIdType` etc. are handled
  today (this file has since been restructured for the two-document requirement — re-add against
  current form layout, not by reverting the diff).
- Checkbox label (per your answer): **"All players are IIT Patna students (B.Tech/M.Tech/PhD)"**,
  placed back where the old "IITP team (fee-waived)" row was — right after College Address, before
  Declared Team Size.

## 4. Frontend — Edit Team (`apps/web/app/dashboard/teams/page.tsx`)

- Re-add `isIITP` state to `EditTeamForm`, initialized from `team.isIITP`, included in the `PATCH
  /teams/:id` payload, and the same checkbox/label re-added to the edit form (restored in both places,
  per your answer).

## 5. Docs (`.claude/reference/api.md`)

- `POST /teams`: restore `isIITP?` to the field list; drop the "not accepted here" note added by the
  removal commit.
- `PATCH /teams/:id`: restore `isIITP` to the editable field list; drop the "not editable here either"
  note.
- `GET /teams/mine`: restore `isIITP` to the "full editable field set" line; drop the "read-only, always
  false" note.

## 6. Tests

- `apps/api/src/teams/teams.service.spec.ts`: the removal commit added tests asserting
  `isIITP: dto.isIITP` is ignored and `isIITP: false` is always written — these get flipped to assert
  `dto.isIITP` is honored (mirroring the tests that existed before the removal).
- Manual verification via dev server: create a team with the checkbox checked, confirm registration
  shows ₹0 and the explicit-submit/no-payment flow (added later, unrelated to this checkbox, and must
  keep working); create one without it checked, confirm normal fee applies; edit an existing
  not-yet-registered team to toggle it on, confirm `PATCH` persists it.

## Non-breaking guarantees

- No schema change — `Team.isIITP` already exists and defaults to `false`; this only restores who can
  set it and how.
- Every team created since the removal (`isIITP` forced `false`) is unaffected — restoring the checkbox
  doesn't retroactively change any existing team's `isIITP` value.
- Individual-registration IITP verification (`User.isIITP` / OAuth) is not touched.
