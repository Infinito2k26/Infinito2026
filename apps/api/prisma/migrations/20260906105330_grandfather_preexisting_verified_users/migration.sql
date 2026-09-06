-- Login enforcement of isEmailVerified (PR #79) has not been deployed to
-- production yet as of this migration. Running this as part of the same
-- deploy backfills isEmailVerified for every pre-existing account that
-- already has real activity, so the new login gate doesn't lock them out
-- retroactively. Accounts with no activity are left untouched -- they're
-- abandoned mid-signups, not real users.
UPDATE "User" u
SET "isEmailVerified" = true
WHERE u."isEmailVerified" = false
  AND (
    EXISTS (SELECT 1 FROM "Team" t WHERE t."captainId" = u.id)
    OR EXISTS (SELECT 1 FROM "Registration" r WHERE r."userId" = u.id)
    OR EXISTS (SELECT 1 FROM "Participant" p WHERE p."userId" = u.id)
    OR EXISTS (SELECT 1 FROM "CAProfile" c WHERE c."userId" = u.id)
    OR EXISTS (SELECT 1 FROM "CAApplication" a WHERE a."userId" = u.id)
  );
