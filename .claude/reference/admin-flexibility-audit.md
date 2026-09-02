# Admin Flexibility Audit

What can be changed from the admin portal without a code deploy, versus what
is deliberately code/env-only. Written so the next "can we make X
admin-editable" ask doesn't require re-discovering this from scratch. Last
updated 2026-09-02, alongside the admin power-up plan
(`.claude/plans/local-admin-power-up-email-verification.md`).

## Already admin-editable

Built before this round of work: events (create/edit/publish), team/committee
roster, sponsors, gallery, merch products/orders, CA tasks/applications,
event rulebooks.

## Fixed by this round (Phases 1–3b of the admin power-up plan)

- **Payment QR/VPA/payee name** and **fest dates/countdown/registration-close
  date** — `SiteSettings` singleton, `/admin/settings`. See `SiteSettings` in
  `database.md`.
- **User search/detail/role/ban** — `/admin/users`, with self-protection
  (can't act on your own account, can't demote the last `SUPER_ADMIN`),
  session-revoking, and an `AdminAuditLog` trail. See `AdminAuditLog` in
  `database.md`.
- **Email verification** and **forgot-password OTP** — not admin-editable
  content, but close the "fake email" and reset-link-hijacking gaps flagged
  alongside this audit.

## Deliberately still code/env-only

- `THROTTLE_LIMIT` / `THROTTLE_TTL_MS`, `WEB_ORIGIN`, JWT/QR secrets — these
  are security/ops knobs, not content, and should not become
  admin-UI-editable. Noted explicitly so this isn't mistaken for a gap.
- The landing hero image's baked-in fest title/dates
  (`main-desktop.png`/`main-tablet.png`/`main-mobile.png`) — the artwork has
  no text overlay by design; if the fest date ever actually moves, the art
  needs to be regenerated separately. No `SiteSettings` field can fix pixels.

## Flagged, not built (candidates for a future phase)

- **Site-wide announcement/banner** (e.g. "Gate 3 closed", "Registration
  extended to Oct 5") — no mechanism exists for this today. Exactly the kind
  of thing that gets asked for at 11pm the night before the fest. Not
  requested yet — don't build speculatively.
- **`AdminAuditLog` coverage** currently spans only user role-change and
  ban/unban (Phase 2). Every other admin write (event edits, CA task
  verification, payment approval) still has no "who did this and when"
  record. Extending the same table/pattern to those actions is a natural
  follow-up, out of scope until asked for.
