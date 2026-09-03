# Plan: Registration Flow Bug Fixes

Branch: `fix/registration-flow-bugs` (from `develop`)

## 1. Stuck when a team already exists but registration isn't complete

**Root cause:** `teams.service.ts createTeam()` throws `ConflictException` (409) if the user already
captains a team with no completed registration. The web `TeamStep`/`CreateTeamForm` only surfaces this
as a raw error string — no path back to the existing team. There is also currently **no endpoint at all**
to edit a team's details after creation (only `POST /teams`, `POST /teams/:id/invitations` to rotate the
invite code, and `POST /teams/join` exist) or to delete/abandon one.

**Fix (auto-resume + edit, no delete):**
- In `apps/web/app/dashboard/events/[slug]/register/page.tsx`, on load (when `isTeamEvent`), call
  `GET /teams/mine`, filter for a team on this event with `registration == null` where the current user
  is captain.
- If found, skip the "create/join" UI entirely: hydrate `team` state from it and go straight to the
  `details` step, same as if they'd just created it, with an **"Edit team details"** action available.
- **New backend endpoint `PATCH /teams/:id`** (captain-only, 403 otherwise; 409/422 if
  `registration != null` — editing is only allowed pre-registration). Editable fields, all optional in the
  DTO: `name`, `declaredSize`, `collegeName`, `collegeAddress`, `isIITP`, `viceCaptainName`,
  `viceCaptainPhone`, `coachName`, `coachPhone`. Not editable: `eventId` (a team belongs to one event for
  life), `captainId` (no captaincy transfer — out of scope), `inviteCode` (already has its own rotate
  endpoint). `declaredSize` updates are validated against `event.teamSizeMin`/`teamSizeMax` and must be
  `>= current participants.length` (can't shrink below already-joined members).
- Web: reuse the existing `CreateTeamForm` field set as an edit form, pre-filled from the resumed team,
  submitting to `PATCH /teams/:id` instead of `POST /teams`. Surface it both on the register page's
  resumed-team view and from the Teams page (`/dashboard/teams`) card for teams the user captains.
- No delete/abandon action (explicitly out of scope per your answer) — editing covers the "wrong details"
  case.
- Keep the "create" path for users with no existing team on this event.

## 2. Invite link not shown anywhere after the initial creation screen

**Fix — on `apps/web/app/dashboard/teams/page.tsx`:**
- For cards where `team.role === "CAPTAIN"` and `team.participants.length < team.declaredSize`, replace
  the current bare "Invite code" row with the full shareable link (same shape as the register page:
  `${origin}/dashboard/events/${team.event.slug}/register?inviteCode=${team.inviteCode}`) plus a copy
  button.
- Once `participants.length >= declaredSize`, hide the link (roster is full — matches "until all team
  members join").
- No backend change — `GET /teams/mine` already returns `inviteCode` for captains.

## 3. IITP: hide accommodation, and require an explicit final submit (no auto-registration)

**3a. Hide accommodation for IITP:**
- Team events: `team.isIITP` is already known once the team is created/resumed (from the create-team
  checkbox). Thread `isIITP` through `TeamRef` and gate
  `{event.hasAccommodation && !isIITP && <AccommodationSection .../>}` in the `details` step.
- Individual events: fetch the current user via `GET /auth/me` (already used elsewhere, e.g.
  `EmailVerifyBanner`) to read `user.isIITP`, and apply the same gate.

**3b. No silent auto-registration — explicit final submit:**
Today, clicking "Submit Registration" on the `details` step calls `POST /registrations` immediately
(for everyone), then moves to the `payment` step. For IITP that step currently just renders a static
"fee-waived" banner with nothing to click — so the participant is fully registered before ever reaching
a step that reads like a final action.

Change: when `isIITP` is true, clicking "Submit Registration" on the `details` step does **not** call
`POST /registrations`. Instead it moves to the `payment` step (relabelled contextually, e.g. "Review &
Submit") which renders a read-only summary of the entered details and a **"Submit Application"** button.
Only that click calls `POST /registrations`. After it succeeds, show a confirmation state: "Application
submitted — pending verification by organisers" (registration/payment stay in their existing pending
status; admin verification flow is unchanged — this is a UI/sequencing fix only, not a backend workflow
change).

Non-IITP flow is unchanged: `details` submit still creates the registration immediately and moves to the
existing QR/screenshot payment step.

No backend changes required for 3b — purely reordering when the existing `POST /registrations` call
fires and what the payment step renders for the waived case.

## 4. Captain can't remove team members from the Teams page

**New backend endpoint `DELETE /teams/:teamId/participants/:participantId`** (captain-only, 403 for
anyone else including the participant themselves; 400 if `participantId` refers to the `CAPTAIN` role
row — captain cannot remove themselves, no captaincy-transfer/self-removal path).
- Allowed at any time, including after registration is confirmed (per your answer) — no status gate.
- If the participant already has a `Credential` (QR issued post-payment-confirmation), delete/revoke it
  in the same transaction so a removed member's QR no longer scans as valid.
- No `declaredSize` change and no `teamSizeMin` enforcement (per your answer) — removal just deletes the
  `Participant` (+ its `Credential` if any) row. The freed slot shows up naturally via bug #2's fix once
  `participants.length < declaredSize` again, so the invite link reappears on the Teams page for the
  captain to send out and refill it.

**Web — `apps/web/app/dashboard/teams/page.tsx`:**
- For cards where `team.role === "CAPTAIN"`, render a remove (e.g. small "x"/trash icon) control next to
  each non-captain roster entry in `.rosterList`.
- Confirm before removing (native `confirm()` or a small inline confirm state — no destructive action
  without a second step); call the new `DELETE` endpoint, then refetch `/teams/mine` to refresh the card.

## 5. Point of Contact not shown to registrants

- `Event` already has `pointOfContactName` / `pointOfContactPhone` (admin-settable, currently admin-only).
- Add a small "Point of Contact" block to `apps/web/app/dashboard/events/[slug]/page.tsx` (event detail
  page), shown when either field is set — name + `tel:` link for the phone, placed near the
  description/rulebook area.
- Confirm `GET /events/:slug` (public detail endpoint) already returns these two fields for participants;
  add them to the response/DTO if currently stripped for non-admins.

## 6. "View Rulebook" link too small

Not just a font bump — promote it to a full secondary button, matching the visual weight of the
"Register" button:
- In `apps/web/app/dashboard/events/[slug]/page.tsx`, render each rulebook link using the existing
  `Button` component (`variant="secondary"` or `outline`, `size="lg"`, `className={styles.rulebookBtn}`,
  full-width like `registerBtn`) instead of a plain `<a className={styles.rulebookLink}>`, keeping the
  `FileText` icon and `target="_blank"`.
- Position it directly above the `Register` button so the two form a clear stacked CTA pair (rulebook
  first, then register).
- Update `event-detail.module.css`: replace `.rulebookLink`/`.rulebookLinks` with a `.rulebookBtn` rule
  sized/spaced like `.registerBtn` (remove the old micro-text styling).

## 7. Footer contact info

- `apps/web/components/layout/footer.tsx` — replace `CONTACTS` array:
  ```
  { name: "Ankit Rajput", phone: "9508830291" }
  { name: "Ayush", phone: "7979844511" }
  ```
- Drop the `role` line (name + phone only, per your answer); update the render block accordingly (remove
  `footerContactRole` span, keep name + formatted phone).

---

## Order of work
1. Footer contacts (trivial, isolated).
2. Rulebook button promotion (trivial, isolated).
3. POC display on event detail page (small, isolated).
4. Team resume-on-revisit + edit endpoint (#1) + invite link on Teams page (#2) + member removal (#4) —
   all touch the same `/teams/mine` data and Teams page, done together.
5. IITP accommodation gating + explicit submit step (#3) — touches the register page too, done last since
   it's the most involved.

Each will be tested manually via the dev server (team creation/resume/edit, invite flow, member removal,
IITP individual + team registration, POC display, footer) before commit.
