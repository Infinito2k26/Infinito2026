# Role Management (Custom Roles + Per-Service Permissions)

## Goal

Allow a `SUPER_ADMIN` to create, update, and delete custom roles, each granting
read/write/delete access to a chosen subset of admin services (e.g. a
"Registration Team" role with read+write on `events` only). This coexists with
the existing fixed `UserRole` enum — `SUPER_ADMIN` and `ADMIN` keep unrestricted
access exactly as today. A custom role is an additional, narrower grant that can
be layered on any user (including a `PARTICIPANT`) to give them scoped access to
the admin panel without promoting them to `ADMIN`.

## Current State (baseline)

- `UserRole` is a fixed Prisma enum: `SUPER_ADMIN`, `ADMIN`, `MODERATOR`,
  `VOLUNTEER`, `CAMPUS_AMBASSADOR`, `BRAND`, `PARTICIPANT`.
- `RolesGuard` (`apps/api/src/common/guards/roles.guard.ts`) +
  `@Roles(...)` decorator (`apps/api/src/common/decorators/roles.decorator.ts`)
  gate access by checking `user.role` against a static list, applied mostly at
  controller level (e.g. `@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)` on the
  whole `AdminEventsController`).
- 13 controllers currently use `@Roles(...)`: `admin-users`, `admin` (brands/CA
  tasks/leads/leaderboard), `ca`, `admin-content`, `admin-events`,
  `admin-rulebooks`, `admin-scans`, `identity`, `admin-merch`,
  `admin-payments`, `admin-registrations`, `admin-settings`, `admin-teams`.
- No concept of dynamic roles or per-service granularity exists today.

## Decisions (confirmed with user)

1. **Coexist**, don't replace: `SUPER_ADMIN`/`ADMIN` remain full-access; custom
   roles are an additive, scoped grant.
2. **Services map 1:1 to existing API modules**: `events`, `registrations`,
   `payments`, `merch`, `teams`, `content`, `identity`, `settings`, `ca`,
   `leads`, `leaderboard`, `uploads`, `admin-users`.
3. **Granularity**: separate `canRead` / `canWrite` / `canDelete` flags per
   service (not just read/write).
4. **Assignment**: one custom role per user (nullable FK, not a join table).
   Only `SUPER_ADMIN` can create/update/delete roles and assign/unassign them.

## Implementation Steps

### 1. Schema (`apps/api/prisma/schema.prisma`)

- Add `enum AdminService { EVENTS REGISTRATIONS PAYMENTS MERCH TEAMS CONTENT IDENTITY SETTINGS CA LEADS LEADERBOARD UPLOADS ADMIN_USERS }`.
- Add `model CustomRole`:
  - `id String @id @default(uuid()) @db.Uuid`
  - `name String @unique`
  - `description String?`
  - `createdAt`, `updatedAt`, `deletedAt DateTime?` (soft delete, consistent
    with `User.deletedAt` convention already in the schema)
  - `permissions RolePermission[]`
  - `users User[]`
- Add `model RolePermission`:
  - `id String @id @default(uuid()) @db.Uuid`
  - `roleId String @db.Uuid`, `role CustomRole @relation(fields: [roleId], references: [id])`
  - `service AdminService`
  - `canRead Boolean @default(false)`
  - `canWrite Boolean @default(false)`
  - `canDelete Boolean @default(false)`
  - `@@unique([roleId, service])`
- `User`: add `customRoleId String? @db.Uuid` and
  `customRole CustomRole? @relation(fields: [customRoleId], references: [id])`.
- Run `prisma migrate dev` for a new migration; regenerate the Prisma client.

### 2. Roles module (`apps/api/src/roles/`)

- `roles.module.ts`, `roles.controller.ts`, `roles.service.ts`.
- Controller mounted at `admin/roles`, guarded
  `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.SUPER_ADMIN)`
  (role management itself is not delegable — stays a hard `@Roles` check, not
  a permission check).
  - `GET /admin/roles` — list roles with their permissions.
  - `POST /admin/roles` — create role + permissions in one call.
  - `GET /admin/roles/:id` — role detail.
  - `PATCH /admin/roles/:id` — update name/description/permissions.
  - `DELETE /admin/roles/:id` — soft delete; reject (409) if users are still
    assigned unless a `reassignTo` / force-unassign flag is passed — decide
    exact behavior during implementation, default to blocking deletion while
    users are attached.
- DTOs (`apps/api/src/roles/dto/`):
  - `RolePermissionDto { service: AdminService; canRead: boolean; canWrite: boolean; canDelete: boolean }`
  - `CreateRoleDto { name: string; description?: string; permissions: RolePermissionDto[] }`
  - `UpdateRoleDto` — same shape, all optional except validated permissions
    array when present.
- `roles.service.ts`: enforce unique name, upsert permissions per service
  (one row per `(roleId, service)`), wrap create/update permission writes in
  `prisma.$transaction`.

### 3. Assignment endpoint (extend `admin-users`)

- `apps/api/src/admin/dto/update-user-custom-role.dto.ts`:
  `UpdateUserCustomRoleDto { customRoleId: string | null }` (`null` unassigns).
- `AdminUsersController`: `PATCH /admin/users/:id/custom-role`, delegates to
  `AdminUsersService.updateCustomRole(actorId, userId, customRoleId)`.
- Keep this endpoint under the controller's existing
  `@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)`? No — assigning scoped power
  is itself sensitive, so restrict this specific handler to
  `@Roles(UserRole.SUPER_ADMIN)` via a method-level override.

### 4. Permission guard + decorator

- `apps/api/src/common/decorators/require-permission.decorator.ts`:
  `RequirePermission(service: AdminService, action: 'read' | 'write' | 'delete')`
  → `SetMetadata`.
- `apps/api/src/common/guards/permissions.guard.ts`:
  - Reads required `(service, action)` via `Reflector`; if none set, allow
    (mirrors `RolesGuard`'s no-metadata passthrough).
  - If `user.role` is `SUPER_ADMIN` or `ADMIN`, allow immediately (unchanged
    behavior for existing admins).
  - Otherwise, look up the user's `customRole.permissions` entry for
    `service`; if missing or the relevant `can*` flag is false, throw
    `ForbiddenException`.
  - Fetch the user's custom role + permissions fresh from the DB per request
    (not cached on the JWT) so a role edit/revoke takes effect immediately
    without requiring re-login.
- Register `PermissionsGuard` alongside `JwtAuthGuard` where used; it can run
  after `RolesGuard` or replace it per-endpoint (see step 5).

### 5. Migrate existing controllers to per-endpoint permission checks

For each of the 13 controllers listed in "Current State", replace the
controller-level `@Roles(ADMIN, SUPER_ADMIN)` with `@UseGuards(JwtAuthGuard, PermissionsGuard)`
and add a per-handler `@RequirePermission(<service>, <action>)`, mapping HTTP
verb to action:
- `GET` → `read`
- `POST` / `PATCH` / `PUT` → `write`
- `DELETE` → `delete`

Service key per controller:
| Controller | Service |
|---|---|
| `admin-events.controller.ts` | `EVENTS` |
| `admin-rulebooks.controller.ts` | `EVENTS` |
| `admin-registrations.controller.ts` | `REGISTRATIONS` |
| `admin-payments.controller.ts` | `PAYMENTS` |
| `admin-merch.controller.ts` | `MERCH` |
| `admin-teams.controller.ts` | `TEAMS` |
| `admin-content.controller.ts` | `CONTENT` |
| `admin-scans.controller.ts` / `identity.controller.ts` | `IDENTITY` |
| `admin-settings.controller.ts` | `SETTINGS` |
| `ca.controller.ts` | `CA` |
| `admin.controller.ts` (brands/CA tasks) | split per handler: brands → keep `ADMIN_USERS`-adjacent judgment call at implementation time — likely a new `LEADS`/`CA` split; confirm exact mapping while touching the file |
| `admin-users.controller.ts` | `ADMIN_USERS` (role/custom-role assignment stays `@Roles(SUPER_ADMIN)`, not permission-gated) |

`identity.controller.ts`'s existing `@Roles(VOLUNTEER, ADMIN, SUPER_ADMIN)`
scan endpoint is a special case (non-admin role granted access) — leave
`VOLUNTEER` as an explicit `@Roles` bypass alongside the new permission check,
or fold `VOLUNTEER` into a role assignable via custom roles; decide during
implementation based on how scanning is actually used.

### 6. Shared types (`packages/types/src/`)

- Add `AdminService` enum (mirrors Prisma) and `CustomRole`,
  `RolePermission` interfaces to a new `packages/types/src/roles.ts`,
  exported from the package index, so `apps/web` and `apps/api` share one
  definition.

### 7. Web dashboard (`apps/web`)

- New admin page for role management: list roles, create/edit a role via a
  permission matrix (services × read/write/delete checkboxes), delete a role.
- Extend the existing admin user list/detail view with a "Custom Role"
  assign/unassign control (dropdown of existing roles + "None").
- Follow existing light-theme UI conventions already used elsewhere in
  `apps/web`.

### 8. Docs

- Update `.claude/reference/api.md`: add `admin/roles` endpoint table and the
  `PATCH /admin/users/:id/custom-role` endpoint, with envelope examples.
- Update `.claude/reference/database.md`: document `CustomRole`,
  `RolePermission`, `AdminService`, and the new `User.customRoleId` field.

### 9. Tests

- `apps/api/src/roles/roles.service.spec.ts` — unit tests for create/update/
  delete, unique-name enforcement, blocked deletion while assigned.
- `apps/api/src/common/guards/permissions.guard.spec.ts` — unit tests: allow
  for SUPER_ADMIN/ADMIN regardless of custom role; allow/deny for a
  PARTICIPANT with/without the right permission; no-metadata passthrough.
- `apps/api/test/roles.e2e-spec.ts` — e2e: SUPER_ADMIN creates a role scoped
  to `EVENTS` read+write, assigns it to a PARTICIPANT, verifies that user can
  hit `GET`/`POST` on events admin endpoints but gets 403 on
  registrations/payments endpoints and on `DELETE` events; verify role
  deletion/unassignment revokes access on the next request.

## Open Items to Resolve During Implementation

- Exact service mapping for `admin.controller.ts`'s mixed brand/CA-task/lead
  handlers (may need a `BRANDS` or `LEADS` service split rather than reusing
  one key for all of them).
- Whether `VOLUNTEER`'s scan access becomes a custom-role-managed permission
  or stays a hardcoded `@Roles` exception.
- Exact behavior for deleting a `CustomRole` that still has users assigned
  (block vs. cascade-unassign vs. require explicit `reassignTo`).
