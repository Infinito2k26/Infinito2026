# Gate Scan Failure Runbook

Readiness Phase 3, item 1. What to do when `POST /identity/scan` can't be
used at the gate — no offline-first scanner PWA exists (cut from scope), so
this is the manual fallback.

## Volunteer: the scanner has no signal, or the scan fails

1. Ask the participant for their name and event/team, and check them against
   the printed roster / admin registrations list (`/admin/registrations`) if
   you have a phone with signal nearby, or a paper printout as backup.
2. Log the manual entry on paper: name, event, time, gate, your name.
3. Let them through — do not block entry over a connectivity issue.
4. Hand the paper log to the gate lead at the end of your shift for
   reconciliation against `/admin/scans` (flags any names that show as
   never-scanned).

## Volunteer: the scan returns "DUPLICATE" or "INVALID"

- **DUPLICATE**: this credential was already scanned (possibly by another
  gate, or a genuine re-entry attempt). Ask for photo ID matching the
  credential's holder name before allowing re-entry; if it doesn't match,
  escalate to the gate lead — do not let them in on the strength of the QR
  alone.
- **INVALID/EXPIRED**: the credential doesn't validate. Check the
  participant's registration status directly with the gate lead (who has
  admin access) rather than assuming it's a fake — a payment verification
  delay can leave a legitimate registrant without a valid credential yet.

## Admin: manual override check-in

If the scan endpoint itself is unreachable (API down, not just one phone's
signal), an admin can:

1. Confirm the outage isn't limited to one volunteer's device — check
   `GET /health` from a working connection.
2. If the API is actually down, follow the on-call plan
   (`docs/on-call-plan.md`) — this is an incident, not a gate problem.
3. Once the API is back, reconcile every paper log entry taken during the
   outage against `/admin/registrations` manually — there's no bulk-import
   endpoint for paper logs today; this is a manual data-entry pass.

## Who to call if the whole system is down on fest day

See `docs/on-call-plan.md` for the on-call owner and escalation path.
