# Plan: Issue #2 Database Baseline - Prisma Schema Porting and Seeding

## Issue

- GitHub: https://github.com/Infinito2k26/Infinito2026/issues/2
- Owner: `ansariowais669-hub`
- Track: Backend / Database
- Priority: P0
- Branch: `feature/database-baseline`
- Target: `develop`

## Outcome

The API workspace has Prisma installed, a PostgreSQL datasource configured, an initial Infinito domain schema committed, Prisma Client generation working from the monorepo, and a deterministic seed script for local development.

## Current Context

- Local infrastructure exists in `docker-compose.yml` with PostgreSQL on `localhost:5432`.
- `apps/api` is a minimal NestJS app with no Prisma dependency yet.
- `reference/database.md` defines the MVP entity model and required constraints.
- Issue body references Section 6 of the architecture roadmap, but the repo-local source of truth should now be `reference/database.md`.

## Scope

In scope:

- Add Prisma to `apps/api`.
- Create `apps/api/prisma/schema.prisma`.
- Configure PostgreSQL datasource through `DATABASE_URL`.
- Implement MVP enums and models from `reference/database.md`.
- Add seed script with realistic local data.
- Add package scripts for generate, migrate, and seed.
- Document local database commands in API README or root docs if needed.

Out of scope:

- NestJS `PrismaModule` wiring. That is lead-owned core scaffolding.
- Auth service implementation.
- Registration/payment business logic.
- Production deployment migrations.

## Files to Read First

- `reference/database.md`
- `reference/architecture.md`
- `docker-compose.yml`
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `package.json`

## Files to Change

- `apps/api/package.json`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.ts`
- `.env.example` if missing or incomplete
- `apps/api/README.md` if command documentation is needed
- `package-lock.json`

## Implementation Steps

1. Install Prisma dependencies in the API workspace:
   ```bash
   npm install @prisma/client --workspace=api
   npm install prisma --workspace=api --save-dev
   ```

2. Add package scripts in `apps/api/package.json`:
   ```json
   {
     "prisma:generate": "prisma generate",
     "prisma:migrate": "prisma migrate dev",
     "prisma:studio": "prisma studio",
     "db:seed": "prisma db seed"
   }
   ```

3. Add Prisma seed config to `apps/api/package.json`:
   ```json
   {
     "prisma": {
       "seed": "ts-node prisma/seed.ts"
     }
   }
   ```

4. Create `apps/api/prisma/schema.prisma`.

5. Implement initial enums:
   - `UserRole`
   - `EventCategory`
   - `TeamMemberRole`
   - `RegistrationStatus`
   - `PaymentStatus`
   - `ScanResult`

6. Implement MVP models:
   - `User`
   - `Event`
   - `Team`
   - `TeamMember`
   - `Registration`
   - `Payment`
   - `Credential`
   - `ScanLog`

7. Add constraints and indexes from `reference/database.md`.

8. Create a seed script that inserts:
   - one super admin
   - one event manager
   - two participant users
   - two events
   - one team
   - one pending registration

9. Run local database:
   ```bash
   docker compose up -d
   ```

10. Generate client and run first migration:
    ```bash
    npm run prisma:generate --workspace=api
    npm run prisma:migrate --workspace=api -- --name init
    npm run db:seed --workspace=api
    ```

## Acceptance Criteria

- [ ] Prisma installed in `apps/api`.
- [ ] `schema.prisma` exists with datasource, generator, enums, and MVP models.
- [ ] Prisma Client generation succeeds.
- [ ] Initial migration succeeds against local PostgreSQL.
- [ ] Seed script runs successfully and is deterministic.
- [ ] Unique constraints prevent duplicate team/event and user/event registrations.
- [ ] `npm run build --workspace=api` passes.
- [ ] `npm run test --workspace=api` passes.

## Review Notes for Lead

Check especially:

- Whether nullable `teamId` and `userId` uniqueness is modeled correctly for PostgreSQL.
- Whether enum names match shared `packages/types/src/auth.ts` where relevant.
- Whether seed credentials are documented but not production-like secrets.

