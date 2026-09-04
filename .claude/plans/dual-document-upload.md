# Plan: Require a Second Document (College ID + one other) at Registration

Branch: `feature/dual-document-upload` (from `develop`)

## Background

Today each `Participant` (roster member, created via `POST /teams` or `POST /teams/join`) uploads exactly
one identity document: a client-chosen `idType` (`IdentityType` enum: `COLLEGE_ID`, `AADHAR`, `PAN`,
`DRIVING_LICENSE`, `PASSPORT`, `VOTER_ID`), an `idNumber`, and an `idFileUrl` (uploaded image, stored via
`UploadsService.uploadProof`). All three columns are `NOT NULL` on `Participant`.

Requirement: going forward, every participant must upload **two** documents —
1. **College ID** — compulsory, no type selection (it's always College ID).
2. **A second document** — participant picks its type from the existing `IdentityType` list, excluding
   `COLLEGE_ID`.

Constraint: the site is live and `main` auto-deploys to production. Nothing about existing data may be
altered or backfilled. Existing registrations (single document, possibly of any `IdentityType`, not
necessarily `COLLEGE_ID`) must keep working as-is — no forced re-upload, no retroactive re-tagging.

**Why a schema change is needed (not pure app logic):** `Participant.customData Json?` looks like free
storage but is already a live feature — it holds responses to event-defined `PARTICIPANT`-scope custom
fields (`Event.customFieldsDef`), validated by `RegistrationsService`. Repurposing it for the second
document would collide with that feature and its validation. A small, purely-additive column set is the
safer path.

## 1. Schema (`apps/api/prisma/schema.prisma`)

Add three **nullable** columns to `Participant` — additive only, no `ALTER` on any existing column, no
change to nullability/type of `idType`/`idNumber`/`idFileUrl`:

```prisma
secondaryIdType     IdentityType?
secondaryIdNumber   String?
secondaryIdFileUrl  String?
```

Generate the migration (`prisma migrate dev --name add_participant_secondary_document`). Existing rows get
`NULL` for all three — they are never touched, satisfying "grandfather old data as-is."

`idType`/`idNumber`/`idFileUrl` keep their existing meaning and column definition; from this change forward
they always represent the College ID (see DTO change below), but old rows that hold a different
`IdentityType` in that slot are left exactly as they are.

## 2. Backend DTOs (`apps/api/src/teams/dto/teams.dto.ts`)

`CreateTeamDto` and `JoinTeamDto`, identically:
- **Remove** `idType` as a client-supplied field — the College ID slot no longer takes a type choice from
  the client at all.
- Keep `idNumber` (now documented as "College ID number").
- Add `secondaryIdType`: required, validated against `IdentityType` values **excluding** `COLLEGE_ID` (a
  small `@IsIn([...Object.values(IdentityType).filter(...)])` or an equivalent custom validator — not a new
  Prisma enum).
- Add `secondaryIdNumber`: required `@IsString() @IsNotEmpty()`.

`UpdateTeamDto` is unaffected (ID docs aren't editable via team update today; unchanged).

## 3. Backend controller (`apps/api/src/teams/teams.controller.ts`)

- Extend `ROSTER_FILE_FIELDS` (`FileFieldsInterceptor`) with a third field: `{ name: 'secondaryIdFile',
  maxCount: 1 }`, same 5 MB limit.
- Extend `requireRosterFiles` to also require `secondaryIdFile`, same mimetype allowlist
  (`ALLOWED_ROSTER_FILE_TYPES` — jpeg/png/webp) as `idFile`.
- Applies to both `POST /teams` and `POST /teams/join`.

## 4. Backend service (`apps/api/src/teams/teams.service.ts`)

In both `createTeam` and `join`:
- Upload the College ID file as today (`uploadProof(idFile.buffer, idFile.mimetype, 'participant-id')`).
- Upload the new file: `uploadProof(secondaryIdFile.buffer, secondaryIdFile.mimetype,
  'participant-secondary-id')`.
- Persist on `Participant` create:
  ```ts
  idType: IdentityType.COLLEGE_ID,       // hardcoded, no longer from dto
  idNumber: dto.idNumber,
  idFileUrl: idUpload.key,
  secondaryIdType: dto.secondaryIdType,
  secondaryIdNumber: dto.secondaryIdNumber,
  secondaryIdFileUrl: secondaryIdUpload.key,
  ```

## 5. Frontend (`apps/web/app/dashboard/events/[slug]/register/page.tsx`)

Both `CreateTeamForm` and `JoinTeamForm`:
- Remove the `IDENTITY_TYPES` `<select>` for the first document. Replace with a static "College ID" label
  — no choice to make. Relabel its number input "College ID Number".
- Add a second block for the other document:
  - `<select>` populated from `IDENTITY_TYPES` filtered to exclude `COLLEGE_ID`.
  - A number input ("Document Number").
  - A second `RosterFileInput` ("Upload document *"), same client-side jpeg/png/webp + 5 MB validation as
    the existing one.
- Update form state (`secondaryIdType`, `secondaryIdNumber`, `secondaryIdFile`) and the `FormData` build to
  match the new DTO field names (drop `idType` from the payload; add the three new fields).
- Apply identically to both forms.

## 6. Docs

- `.claude/reference/api.md`: update the `POST /teams` and `POST /teams/join` request shape (remove
  `idType`; add `secondaryIdType`, `secondaryIdNumber`, `secondaryIdFile`).
- `.claude/reference/database.md`: document the three new `Participant` columns.

## 7. Tests

- `apps/api/src/teams/teams.service.spec.ts`: update existing create/join tests for the new required
  fields; add cases for missing `secondaryIdFile` (400) and `secondaryIdType === COLLEGE_ID` (rejected).
- `apps/api/test/*.e2e-spec.ts` covering team creation/join: update payloads to the new shape.
- Manual pass via dev server: create team (upload both docs), join team (upload both docs), confirm old
  seeded participants (single legacy document) still load fine everywhere they're displayed (team page,
  scan dashboard) with no errors.

## Non-breaking guarantees

- No existing column is altered, renamed, or backfilled; only new nullable columns are added.
- Existing `Participant` rows (including any whose sole historical document was not `COLLEGE_ID`) are
  never modified or re-validated.
- The only breaking change is the **request shape** of `POST /teams` / `POST /teams/join` (client no
  longer sends `idType`; must now also send the three secondary-document fields) — safe because frontend
  and backend for this change ship together in the same deploy.

## Out of scope (flag for a separate decision, not building now)

- Surfacing `secondaryIdFileUrl`/`secondaryIdType` on the gate-scan dashboard
  (`identity.service.ts` / `apps/web/app/scan/[token]/page.tsx`) — today only `photoUrl`/`idType`/`idNumber`
  are shown there; whether the second document should also appear at the gate is a separate product
  decision.
- Seed data (`apps/api/prisma/seed.ts`) — can optionally be updated to populate the new fields for local
  dev realism; not required for this change and has no production impact either way.

## Order of work

1. Schema + migration (isolated, reversible, additive).
2. Backend DTO + controller + service changes together (one cohesive API change).
3. Update backend tests.
4. Frontend form changes (both Create and Join forms).
5. Docs (`api.md`, `database.md`).
6. Manual verification via dev server (both flows, plus a check that legacy single-document participants
   still render correctly everywhere).
