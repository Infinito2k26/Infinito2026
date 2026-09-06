# Fix: Unverified-User Login Lockout & Unsafe Delete-on-Re-register

## Context

Today's "email OTP verification" merge (`f0d0964`, PR #79) changed two things in `apps/api/src/auth/auth.service.ts` that are unsafe now that registration is live in production with real user data:

1. **`login()`** (line ~155) now hard-blocks any user whose `isEmailVerified` is `false`, throwing `UnauthorizedException`. Before this commit, `isEmailVerified` existed on the `User` model (since the very first migration) but was **never enforced at login**.
2. **`register()`** (line ~102–121), when someone re-registers with an email that already belongs to an unverified account, now deletes that existing `User` row (and its `EmailVerificationToken`s) before creating a new one — with no check for whether that user owns any real data.

Because `isEmailVerified` was never enforced or consistently set before today, there are almost certainly **real, currently-active users** (people who already have a team, an individual registration, a payment, a CA profile, etc.) sitting in the production database with `isEmailVerified = false`. Today's change has two live consequences for them:

- They can no longer log in at all (silent regression — `login()` now rejects them).
- If anyone re-registers using their email, `register()` tries to delete their account. Every relation from `User` to other tables (`Team.captainId`, `Participant.userId`, `Registration.userId`, `Credential.userId`, `CAProfile.userId`, `CAApplication.userId`, `AuditLog.actorUserId`/`targetUserId`, etc.) has no `onDelete` rule specified in `schema.prisma` — Prisma/Postgres defaults this to `RESTRICT`. Only one relation in the entire schema (`CustomRole`) has an explicit `onDelete: Cascade`. So this delete either crashes with an FK violation (as seen, via `Team_captainId_fkey`) for any account that owns anything, and there's no relation left where it could succeed harmlessly — every other User-referencing FK is equally unprotected, so a "successful" delete isn't actually a safer outcome here, it would just destroy real data instead of crashing.

This plan fixes both the login lockout and the unsafe delete, and grandfathers in pre-existing real users — matching what you confirmed:
- **Check production first** for how many users currently have `isEmailVerified = false` (see §1 — I can't run this myself, no `gcloud`/SSH access from this machine).
- **Grandfather pre-existing active accounts** — anyone created before the OTP feature shipped who already has real activity gets `isEmailVerified` backfilled to `true` in one migration, rather than being forced to re-verify.
- **Restrict `register()`'s delete-and-recreate path** to accounts with zero related rows — anything else gets a clean `ConflictException` instead of an attempted delete.

---

## 1. Check production impact (you run this, I can't reach the VM)

I have no `gcloud` CLI and no SSH access configured on this machine, so I cannot query the production database myself. Per `docs/deployment.md`, the production Postgres runs as the `postgres` service in `docker-compose.prod.yml` on the GCP VM (`infinito-api`, `asia-south1-a`). Whoever has `gcloud` authenticated for this project can run:

```bash
gcloud compute ssh infinito-api --zone=asia-south1-a
# --- on the VM, from the directory holding docker-compose.prod.yml and .env.prod ---
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres \
  psql -U postgres -d infinito_prod -c "
    SELECT
      count(*) FILTER (WHERE u.\"isEmailVerified\" = false) AS total_unverified,
      count(*) FILTER (WHERE u.\"isEmailVerified\" = false AND EXISTS (
        SELECT 1 FROM \"Team\" t WHERE t.\"captainId\" = u.id
      )) AS unverified_team_captains,
      count(*) FILTER (WHERE u.\"isEmailVerified\" = false AND EXISTS (
        SELECT 1 FROM \"Registration\" r WHERE r.\"userId\" = u.id
      )) AS unverified_with_registration,
      count(*) FILTER (WHERE u.\"isEmailVerified\" = false AND EXISTS (
        SELECT 1 FROM \"Payment\" p JOIN \"Registration\" r ON r.id = p.\"registrationId\"
        WHERE r.\"userId\" = u.id OR r.\"teamId\" IN (SELECT id FROM \"Team\" WHERE \"captainId\" = u.id)
      )) AS unverified_with_payment,
      count(*) FILTER (WHERE u.\"isEmailVerified\" = false AND NOT EXISTS (
        SELECT 1 FROM \"Team\" t WHERE t.\"captainId\" = u.id
        UNION ALL SELECT 1 FROM \"Registration\" r WHERE r.\"userId\" = u.id
        UNION ALL SELECT 1 FROM \"Participant\" p WHERE p.\"userId\" = u.id
        UNION ALL SELECT 1 FROM \"CAProfile\" c WHERE c.\"userId\" = u.id
      )) AS unverified_with_no_activity_at_all
    FROM \"User\" u;
  "
```

This is read-only (`SELECT` only) and safe to run against production. Paste me the output and I'll fold the real numbers into the backfill in §2 (in particular, sanity-check that `unverified_with_no_activity_at_all` roughly matches accounts genuinely mid-signup, not real users).

---

## 2. Grandfather pre-existing active accounts (migration)

Add a new Prisma migration (data-only, no schema change) that backfills `isEmailVerified = true` for any `User` created **before** the OTP feature's deploy timestamp who has real activity, so the login-gate regression doesn't lock out people who were already legitimately using the site:

```sql
-- apps/api/prisma/migrations/<timestamp>_grandfather_preexisting_verified_users/migration.sql
UPDATE "User" u
SET "isEmailVerified" = true
WHERE u."isEmailVerified" = false
  AND u."createdAt" < '<OTP_FEATURE_DEPLOY_TIMESTAMP>'::timestamptz
  AND (
    EXISTS (SELECT 1 FROM "Team" t WHERE t."captainId" = u.id)
    OR EXISTS (SELECT 1 FROM "Registration" r WHERE r."userId" = u.id)
    OR EXISTS (SELECT 1 FROM "Participant" p WHERE p."userId" = u.id)
    OR EXISTS (SELECT 1 FROM "CAProfile" c WHERE c."userId" = u.id)
    OR EXISTS (SELECT 1 FROM "CAApplication" a WHERE a."userId" = u.id)
  );
```

`<OTP_FEATURE_DEPLOY_TIMESTAMP>` should be the actual production deploy time of PR #79 (confirm from your deploy history / GHCR image push time), not the commit's authored-at time, so we don't accidentally grandfather someone who signed up in the gap between commit and deploy. Accounts created before that cutoff with **no** real activity are left as-is — they're genuinely abandoned mid-signups and remain subject to the existing cleanup job / re-registration flow.

## 3. Restrict `register()`'s delete-and-recreate path to empty accounts

In `apps/api/src/auth/auth.service.ts`, before deleting an existing unverified user, check whether it owns any related row. If it does, reject the re-registration attempt cleanly instead of attempting (and possibly crashing on, or silently destroying data via) a delete.

`User`'s full set of back-relations (`schema.prisma:217-234`) is: `captainedTeams`, `caProfile`, `registrations`, `credentials`, `scansDone`, `rulebooksUploaded`, `taskVerifications`, `participants`, `caApplications`, `caApplicationsReviewed`, `merchOrders`, `auditLogsAsActor`, `auditLogsAsTarget`, `siteSettingsUpdates`. A handful of these can't realistically be non-empty for an unverified account (e.g. `auditLogsAsActor`/`siteSettingsUpdates` imply admin actions, `scansDone` implies a volunteer role) but checking all of them is cheap and future-proof — no need to special-case which ones are "plausible":

```ts
if (existing) {
  if (existing.isEmailVerified) {
    throw new ConflictException('Email is already registered');
  }

  const hasActivity = await this.prisma.user.findFirst({
    where: {
      id: existing.id,
      OR: [
        { captainedTeams: { some: {} } },
        { caProfile: { isNot: null } },
        { registrations: { some: {} } },
        { credentials: { some: {} } },
        { scansDone: { some: {} } },
        { rulebooksUploaded: { some: {} } },
        { taskVerifications: { some: {} } },
        { participants: { some: {} } },
        { caApplications: { some: {} } },
        { caApplicationsReviewed: { some: {} } },
        { merchOrders: { some: {} } },
        { auditLogsAsActor: { some: {} } },
        { auditLogsAsTarget: { some: {} } },
        { siteSettingsUpdates: { some: {} } },
      ],
    },
  });

  if (hasActivity) {
    throw new ConflictException('Email is already registered');
  }

  await this.prisma.emailVerificationToken.deleteMany({ where: { userId: existing.id } });
  await this.prisma.user.delete({ where: { id: existing.id } });
}
```

Add a unit test in `apps/api/src/auth/auth.service.spec.ts` covering: (a) re-registering against a genuinely empty unverified account still works (deletes and recreates), (b) re-registering against an unverified-but-active account (has a team/registration/etc.) throws `ConflictException` instead of attempting the delete.

## 4. Verification

- `npm run test --workspace=api -- auth.service` — new and existing auth tests pass.
- `npm run build --workspace=api` and `npm run check-types --workspace=api`.
- Locally: recreate the crash scenario (unverified user with a team) against the dev DB, confirm `register()` now returns a clean 409 instead of a 500.
- Confirm a pre-OTP-feature seeded/test user with `isEmailVerified = false` and real activity can log in after the backfill migration runs.
- Before deploying to production: run the migration's `UPDATE` as a dry-run `SELECT` first (swap the `UPDATE ... SET` for a `SELECT u.id, u.email` with the same `WHERE`) against production, review the affected rows, then run the real migration via `prisma migrate deploy` per `docs/deployment.md` step 5/8.

## Open items for you

- Run the §1 query against production and share the counts so the backfill's activity checks can be sanity-checked against real numbers.
- Confirm the exact deploy timestamp for PR #79 to use as the grandfathering cutoff.
- Decide whether this needs to go out as an urgent hotfix branch off `develop`→`main` ahead of other in-flight work, given registration is currently live and real users may already be locked out.
