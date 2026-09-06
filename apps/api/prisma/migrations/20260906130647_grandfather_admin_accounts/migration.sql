-- The 2026-09-06 grandfathering migration only checked participant-style
-- activity (teams, registrations, etc.), so it missed staff accounts that
-- have none of that -- specifically the two admin accounts bootstrapped
-- manually before OTP verification existed, which locked them out of
-- login the moment enforcement went live. Every current admin-creation
-- path (seed.ts, admin-users.service.ts) already sets isEmailVerified
-- true, so this only needs to cover pre-existing rows, not future ones.
UPDATE "User"
SET "isEmailVerified" = true
WHERE role IN ('ADMIN', 'SUPER_ADMIN')
  AND "isEmailVerified" = false;
