# Plan: local-events-teams-module — Events + Teams Backend (Day 1 vertical)

## Issue

- Tracker: local (no GitHub issue exists yet for this vertical — only #24/#6 are open, neither covers Events/Teams). Source: `.claude/plans/master-roadmap-sept30-launch.md`, "Day 1 — Aug 28: Foundations" → Minhaj's row. Running a day behind: this vertical has 0% code as of 2026-08-29, while Payments (Shikhar Yadav's vertical) is already at Day 2/3 work. It is the single highest-risk dependency in the plan — Registration, Payments, and QR/Credential all chain behind this contract.
- Track: api
- Priority: critical (blocks 3 other verticals)
- Owner: Minhaj
- Reviewer: Saad-Manda (standing cross-review rule for this compressed sprint — same-day, not scheduled weekly)
- Target branch: `feature-upi` (the shared integration branch this sprint's work is already landing on — Payments' commits are directly on it)

## Outcome

- `apps/api/src/events/` and `apps/api/src/teams/` exist as NestJS modules, registered in `app.module.ts`, following the CA/Payments module pattern (thin controllers, service owns logic, DTOs with `class-validator`).
- Admin can create/update/publish an Event. Public users can list published events and view one by slug.
- An authenticated user can create a Team against a specific Event, get/rotate its invite code, and other authenticated users can join via that code — each producing a schema-valid `Participant` row (photo + ID upload included, not stubbed).
- Team roster size is enforced against `Event.teamSizeMax` at join time.
- `npm run lint && npm run check-types && npm run build && npm run test --workspace=api` all pass.
- `.claude/reference/api.md` and `.claude/reference/database.md` reflect the one schema change this introduces (`Team.eventId`).

## Scope

**In:**
- Events: `GET /events`, `GET /events/:slug`, `POST /events`, `PATCH /events/:id`, `PATCH /events/:id/publish` (per `.claude/reference/api.md` §Events).
- Teams: `POST /teams`, `POST /teams/:id/invitations`, `POST /teams/:id/join` (per `.claude/reference/api.md` §Teams and Registrations).
- One schema addition: `Team.eventId` (see Risks — required, not optional, to make size enforcement possible at all).
- Unit tests for the guard/enforcement logic (capacity guard, roster size guard, CAS-style invite code rotation).

**Out:**
- Registration module itself (Saad-Manda's vertical) — Events/Teams only expose what Registration will read (`Event.teamSizeMin/Max`, `Team.eventId`, participant roster).
- Payments, QR/Credential — untouched.
- `EventSubOption`, `EventRulebook`, admin event *list* endpoint beyond what's in the endpoint map, `VICE_CAPTAIN`/`SUBSTITUTE` role assignment via API (roster starts everyone as `PLAYER`; role reassignment is a fast-follow) — not in the locked endpoint map, not building it now.
- Frontend event/team pages — that's explicitly Minhaj's Day 2 work per the roadmap, not today's.

## Files to Read First

- `apps/api/prisma/schema.prisma:196-318` — `Event`, `EventSubOption`, `EventRulebook`, `Team`, `Participant` models (already migrated, confirmed matching `.claude/reference/database.md`).
- `apps/api/src/payments/payments.service.ts` — the compare-and-swap (`updateMany` + count check inside `$transaction`) and pagination patterns to mirror.
- `apps/api/src/payments/dto/payments.dto.ts` and `apps/api/src/ca/dto/ca.dto.ts` — `class-validator` DTO style (global `ValidationPipe` already has `whitelist + forbidNonWhitelisted`, so DTOs don't need manual unknown-field rejection).
- `apps/api/src/ca/ca.controller.ts` — file upload pattern (`FileInterceptor` + `ParseFilePipeBuilder`, calling `UploadsService.uploadProof(buffer, mime, folder)`), needed for Participant photo/ID upload.
- `apps/api/src/common/guards/roles.guard.ts`, `common/decorators/roles.decorator.ts`, `common/decorators/current-user.decorator.ts`, `common/interfaces/authenticated-request.interface.ts` — auth/role wiring, identical for the new controllers.
- `apps/api/src/uploads/uploads.service.ts` — `uploadProof(buffer, mimeType, folder)` already takes a generic `folder` param (Shikhar's Day-1 generalization already landed in `01aaa60`), reuse directly with `folder: 'participant-photo'` / `'participant-id'`.
- `apps/api/src/app.module.ts` — where the two new modules get registered.
- `.claude/reference/api.md` §Events, §Teams and Registrations, §Contract Rules — the locked contract; Teams section is intentionally thin (no per-endpoint body/response detail like Payments has) — this plan fills that gap in the same PR per the standing rule.
- `.claude/reference/database.md` §Team, §Participant, §5 Required Indexes — current schema; this plan adds one field + one index here.

## Files to Change

- `apps/api/prisma/schema.prisma` — add `eventId` to `Team`.
- `apps/api/prisma/migrations/<timestamp>_add_team_event_id/` — generated migration.
- `apps/api/src/events/events.module.ts`, `events.controller.ts` (public), `admin-events.controller.ts` (admin), `events.service.ts`, `dto/events.dto.ts`, `events.service.spec.ts` — new.
- `apps/api/src/teams/teams.module.ts`, `teams.controller.ts`, `teams.service.ts`, `dto/teams.dto.ts`, `teams.service.spec.ts` — new.
- `apps/api/src/app.module.ts` — register `EventsModule`, `TeamsModule`.
- `.claude/reference/api.md` — flesh out §Teams and Registrations with request/response detail (mirroring the §Payments level of detail); add `Team.eventId` note.
- `.claude/reference/database.md` — document `Team.eventId` addition, update the `Team` table and the entity-map/index sections.

## Implementation Steps

### Step 1: Schema — add `Team.eventId`

- **What:** `Team` currently has no FK to `Event`, but "a group of players entering a single event" (per `database.md`) can't have its roster size validated against `Event.teamSizeMin/Max` without knowing which event it's for, and `Registration.teamId` isn't created until much later (Saad-Manda's module, Day 2+). Add `eventId String @db.Uuid` + relation + `@@index([eventId])`, required (`NOT NULL`) — a team is created for exactly one event, matching the model's own doc comment. This is a real schema gap, not scope creep; flagged in Risks below for your sign-off before merge since it's a contract change other verticals may read.
- **Files:** `apps/api/prisma/schema.prisma`
- **Validation:** `npx prisma migrate dev --name add_team_event_id --schema=apps/api/prisma/schema.prisma` (generates + applies migration), `npx prisma generate --schema=apps/api/prisma/schema.prisma`

### Step 2: Events DTOs

- **What:** `CreateEventDto` / `UpdateEventDto` (all `Event` fields from `database.md` except `id`/timestamps; `UpdateEventDto` = `PartialType(CreateEventDto)`), `PublishEventDto` (`{ isPublished: boolean }`). Validate `feeStructure`-dependent fields loosely (don't over-validate cross-field logic not asked for — that's a fast-follow, not blocking).
- **Files:** `apps/api/src/events/dto/events.dto.ts`
- **Validation:** `npm run check-types --workspace=api`

### Step 3: Events service

- **What:** `EventsService` with:
  - `listPublished()` — `where: { isPublished: true, deletedAt: null }`, paginated (page/limit, same shape as `PaymentsService.listPayments`).
  - `findBySlug(slug, requester?)` — 404 if not found or (`!isPublished` and requester isn't ADMIN/SUPER_ADMIN).
  - `create(dto)` — plain `prisma.event.create`.
  - `update(id, dto)` — **capacity guard**: if `dto.capacity` is being lowered, reject (`BadRequestException`) if `dto.capacity < current non-cancelled registration count` for that event (`prisma.registration.count({ where: { eventId, status: { not: 'CANCELLED' } } })` — querying the `Registration` table directly is the established cross-module pattern, see `PaymentsService.submitPayment` reading `Registration` directly). Full registration-time capacity enforcement belongs to Saad-Manda's Registration module — this is only the admin-side "don't shrink capacity under an existing roster" guard.
  - `setPublished(id, isPublished)` — simple update.
- **Files:** `apps/api/src/events/events.service.ts`
- **Validation:** `npm run test --workspace=api -- events.service`

### Step 4: Events controllers

- **What:** `EventsController` (`GET /events`, `GET /events/:slug`, no guard — but attach `JwtAuthGuard` optionally is out of scope; just check `req.user` if `AuthGuard` happens to have run, else treat as public). `AdminEventsController` (`POST /events`, `PATCH /events/:id`, `PATCH /events/:id/publish`, all `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)` — no distinct "Event Manager" role exists in `UserRole`; `architecture.md`'s "Admin/Event Manager" wording maps to this pair, same as every other admin-gated route in the codebase).
- **Files:** `apps/api/src/events/events.controller.ts`, `apps/api/src/events/admin-events.controller.ts`
- **Validation:** `npm run test --workspace=api -- events`

### Step 5: Teams DTOs

- **What:**
  - `CreateTeamDto`: `eventId` (UUID), `name`, `collegeName`, `collegeAddress?`, `isIITP?`, `viceCaptainName?`, `viceCaptainPhone?`, `coachName?`, `coachPhone?`, plus the captain's own roster fields — `idType` (enum), `idNumber` (string). `name`/`phone` on the resulting captain `Participant` row come from the authenticated `User`, not re-entered.
  - `JoinTeamDto`: `inviteCode` (string) — required even though the team is also addressed by `:id` in the path (see Step 7 note), `idType`, `idNumber`.
  - Both endpoints are `multipart/form-data` (photo + ID file, mirroring `SubmitTaskDto`'s pattern), so the file fields aren't DTO properties — they come via `@UploadedFiles()`.
- **Files:** `apps/api/src/teams/dto/teams.dto.ts`
- **Validation:** `npm run check-types --workspace=api`

### Step 6: Teams service

- **What:** `TeamsService` with:
  - `createTeam(userId, dto, photoFile, idFile)` — loads `Event` (404 if missing, `BadRequestException` if `!isPublished`), generates `inviteCode` (`crypto.randomBytes(4).toString('hex').toUpperCase()`, retry once on unique-constraint P2002), uploads photo/ID via `UploadsService.uploadProof(..., 'participant-photo' | 'participant-id')`, then in one `$transaction`: create `Team` (`captainId: userId`) + create `Participant` (`role: CAPTAIN, isRequired: true, userId`).
  - `rotateInviteCode(teamId, callerId)` — 403 if `callerId !== team.captainId`, generates a new code, updates.
  - `join(idOrCode, dto, userId, photoFile, idFile)` — resolve team via `findFirst({ where: { OR: [{ id: idOrCode }, { inviteCode: dto.inviteCode }] } })` and additionally verify `dto.inviteCode` matches the resolved team's stored code (403 on mismatch) — this covers the real frontend flow (a join link carries only the short code, not the team's UUID) without inventing an undocumented lookup route. **Roster size guard**: inside a `$transaction`, count existing `Participant` rows for the team; if `count >= event.teamSizeMax`, throw `ConflictException` (409, matches `api.md`'s "duplicate/state conflict" convention) before creating the new `Participant` (`role: PLAYER, isRequired: true`). `teamSizeMin` is **not** checked here — that's enforced at Registration submission time (Saad-Manda's module), consistent with `architecture.md` listing "teams, participants" under the Registration module's responsibility.
- **Files:** `apps/api/src/teams/teams.service.ts`
- **Validation:** `npm run test --workspace=api -- teams.service`

### Step 7: Teams controller

- **What:** `POST /teams` (`JwtAuthGuard`, any authenticated role), `POST /teams/:id/invitations` (`JwtAuthGuard`, service enforces captain-only), `POST /teams/:id/join` (`JwtAuthGuard`). Both create/join routes use `FileFieldsInterceptor([{ name: 'photo', maxCount: 1 }, { name: 'idFile', maxCount: 1 }])` with the same 5 MB / jpeg-png-webp validation as `ca.controller.ts`.
- **Files:** `apps/api/src/teams/teams.controller.ts`
- **Validation:** `npm run test --workspace=api -- teams`

### Step 8: Wire modules

- **What:** Add `EventsModule`, `TeamsModule` (importing `UploadsModule`) to `app.module.ts`.
- **Files:** `apps/api/src/app.module.ts`
- **Validation:** `npm run build --workspace=api`

### Step 9: Update reference docs

- **What:** Flesh out `.claude/reference/api.md` §Teams and Registrations to Payments-level detail (request/response shapes, the invite-code-via-`:id`-or-code resolution note, 409 on roster-full, 403 on non-captain invitation rotation). Update `.claude/reference/database.md` §Team table (add `eventId` row) and §5 Required Indexes (add `Team.eventId` index row).
- **Files:** `.claude/reference/api.md`, `.claude/reference/database.md`
- **Validation:** manual read-through; required by CONSTITUTION.md before merge (`.claude/reference/` docs updated in the same PR as any contract/schema change).

## Tests and Validation

```bash
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
```

Targeted specs to add (mirroring `payments.service.spec.ts`):
- `events.service.spec.ts`: capacity guard rejects a lowered `capacity` under existing registrations; accepts otherwise.
- `teams.service.spec.ts`: roster join rejected at `teamSizeMax`; invite-code rotation rejected for non-captain; `createTeam` rejects an unpublished event.

## Acceptance Criteria

- [ ] `POST /events` (admin) creates an event; `GET /events` (public) lists only published ones; `PATCH /events/:id/publish` toggles visibility.
- [ ] Lowering `Event.capacity` below the current non-cancelled registration count is rejected.
- [ ] `POST /teams` creates a team tied to a published event and a `CAPTAIN` `Participant` row with real photo/ID uploads (no stubbed/placeholder data).
- [ ] `POST /teams/:id/invitations` only succeeds for the team's captain and rotates the code.
- [ ] `POST /teams/:id/join` adds a `PLAYER` `Participant`, rejects once `Event.teamSizeMax` is reached (409), and rejects a wrong invite code (403).
- [ ] `.claude/reference/api.md` and `database.md` updated in the same PR.
- [ ] Full validation gate passes.

## Risks and Notes

- **Schema change requires sign-off:** `Team.eventId` (Step 1) isn't in the currently-documented v2.2 schema. Without it, roster-size enforcement against a specific event's `teamSizeMin/Max` is impossible before `Registration` exists (Saad-Manda's module lands Day 2+). This is the one decision in this plan that changes a contract other verticals may read — flagging before `/execute` rather than silently adding it.
- **Participant creation is heavier than the roadmap's one-line bullet suggests:** `Participant.photoUrl`, `idType`, `idNumber`, `idFileUrl` are all `NOT NULL` in the finalized schema (`database.md`). There is no schema-valid way to create a `Team` (which immediately needs a `CAPTAIN` `Participant`) or handle `join` without collecting real photo + ID uploads at that moment — reusing the existing `UploadsService`/`FileInterceptor` pattern, not inventing new infra. Sized into Steps 5–7 rather than stubbed with placeholder data (would violate the "no fake data" spirit and just move the real work later).
- **`teamSizeMin` is not enforced by this plan** — only checked at Registration submission per `architecture.md`'s module boundary (Registration owns "teams, participants, registration status" as one flow). Team creation/join only ever grows the roster; whether it's *big enough* is Saad-Manda's gate.
- **No separate `Invitation` model exists** — `POST /teams/:id/invitations` operates on the single `Team.inviteCode` field (rotate/reissue), not a list of invitations. Matches the locked schema; flagged here since the endpoint name ("invitations", plural) could otherwise read as implying a separate model.
- **API contract change:** additive (new endpoints) + one schema field addition (`Team.eventId`, backward-compatible as long as no `Team` rows exist yet — confirmed zero, since Teams module has never been built).
- **Data migration:** none beyond Step 1's additive column (no existing `Team` rows to backfill).
- **Unknowns:** none blocking — the two ambiguities above (`Team.eventId`, join-by-code-or-id) are resolved with stated rationale rather than left open, since both are prerequisites for the endpoints to function at all, not stylistic choices.
