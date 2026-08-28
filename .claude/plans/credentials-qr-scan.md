# Plan: QR/Credential + Scan (Launch Sprint Vertical)

## Issue

- Tracker: pending — `gh` CLI is unavailable in the dev environment this plan was written in, so no issue number exists yet. Create the GitHub issue from this doc's title/scope, then replace this line and rename the file to `<issue>-credentials-qr-scan.md` per repo convention (plan docs are the authoritative spec, not the issue body).
- Parent context: `.claude/plans/master-roadmap-sept30-launch.md` — 3-day compressed launch plan (Aug 28–30, 2026). This doc is that plan's "QR/Credential + Scan" vertical, promoted to its own execution doc, same pattern as `issue-18-auth-minimal-phase-a.md`.
- Track: Frontend + Backend, single-owner vertical (this sprint's verticals are split by feature, not by layer — see master roadmap)
- Priority: P0 for launch — closes the loop `register → pay → QR issued → scan`, the sprint's stated acceptance bar
- Owner: Anjney-Lawaniya
- Branch: `feature/credentials`

## Scope

**In:** HMAC token design for `Credential.tokenHash`, QR payload shape, `GET /identity/mine`, `GET /identity/validate/:token`, `POST /identity/scan`, a BullMQ worker that generates the credential + QR image on payment confirmation, the credential display/download page on the frontend, duplicate-scan detection, a bare admin scan-log viewer if Day 3 has slack.

**Out (this vertical, this sprint):** Razorpay/gateway payments (cut from the whole sprint), email delivery of the QR (Notifications module doesn't exist), the volunteer scanner PWA's camera/offline UX (only the bare `POST /identity/scan` API + minimal viewer are attempted), true client-side offline HMAC verification (see Risks).

## Ground Truth (verified this session, 2026-08-28)

1. **Schema already exists, zero code does.** `Credential` and `ScanLog` models are fully defined in `apps/api/prisma/schema.prisma` (lines 578–611) exactly as documented in `.claude/reference/database.md` §4. No `apps/api/src/identity/` module exists yet.
2. **`QR_SIGNING_SECRET` is already reserved.** `apps/api/src/config/env.schema.ts` requires it (`z.string().min(32)`), added ahead of need during the Auth phase (`issue-18-auth-minimal-phase-a.md`). No env work needed to start.
3. **Hard upstream dependency: Payments.** Credential issuance is triggered by a registration reaching `CONFIRMED` (via Shikhar's manual-UPI verification flow), which does not land until Day 2 of the master roadmap. `POST /identity/scan` and the full identity module cannot be meaningfully built or tested end-to-end until that lands. This is why Day 1 for this vertical is scoped to design + isolated, dependency-free code only — see Implementation Steps.
4. **Required critical tests (from `.claude/reference/testing.md` §3) that this vertical owns:** #7 "Confirmed registration creates exactly one QR credential", #8 "Valid QR scan records a scan log", #9 "Tampered QR token is rejected".
5. **Established module conventions**, confirmed by reading `apps/api/src/ca/*` (closest existing analog):
   - `module.ts` / `controller.ts` / `service.ts` / `dto/*.ts` layout.
   - `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.X)` from `common/guards` and `common/decorators` (shared, not module-private).
   - `AuthenticatedRequest` (`common/interfaces/authenticated-request.interface.ts`) for `req.user.id` / `req.user.role`.
   - Async work (QR generation) goes through a `BullMQ` `Processor extends WorkerHost`, registered in `queue/queue.module.ts`, following `ReferralFlushProcessor`'s pattern.
   - File storage reuses `UploadsService` (`apps/api/src/uploads/uploads.service.ts`) — currently hardcodes the `ca-proof/` key prefix; Shikhar's Day 1 task generalizes it to accept a `folder` param for his own payment-screenshot work, which this vertical will also depend on for `qr-codes/` — do not duplicate that generalization here, just consume it once it lands.
6. **Frontend conventions**, confirmed by reading `apps/web/lib/api.ts` and `apps/web/components/auth/AuthGuard.tsx`: a thin `fetch` wrapper (`api.get/post/patch/delete`) reading a bearer token from `localStorage.infinito_token`, and a client-side `<AuthGuard allowedRoles={...}>` wrapper that calls `GET /auth/me` on mount. These get reused as-is for the credential display page; any fixes needed to them are tracked separately (see `feature/credentials` shared-convention pass, not part of this doc's scope).

## Token & QR Design

### Why not a plain random opaque token

`.claude/reference/database.md` originally described `tokenHash` as "SHA-256 of a secure random token" — sufficient for a pure online, DB-round-trip validation. But `.claude/reference/architecture.md`'s QR Check-In sequence explicitly calls for `Scanner->>Scanner: Verify signature offline when possible`, and `GET /identity/validate/:token` is documented in `api.md` as "Offline-safe credential validation". A pure random token carries no verifiable structure — there is nothing to check without a DB hit. A **signed** token is required to make that offline/structural check possible at all. That's what `QR_SIGNING_SECRET` was reserved for.

### Token format

```
rawToken = "<credentialId>.<sig>"
sig       = base64url( HMAC-SHA256( credentialId, QR_SIGNING_SECRET ) )
```

- `credentialId` is the `Credential.id` UUID — already 122 bits of server-generated randomness, so no extra nonce is needed for unguessability.
- `sig` is base64url (not hex) to keep the encoded QR payload shorter — QR density directly affects how reliably cheap phone cameras scan it at a busy gate, so byte count matters here more than it would in an API token.
- `Credential.tokenHash` (existing schema field, `String @unique`) stores `SHA-256(rawToken)` hex-encoded. The DB never stores the raw token or the secret — only its hash, consistent with `tokenHash` already being documented as a hash, not the token itself.
- The QR image encodes `rawToken` directly (not a URL). This is an internal volunteer-scanning flow through a dedicated interface, not a public phone-camera deep link, so there's no reason to wrap it in a URL.

### Verification algorithm (`verifyToken(rawToken)`)

1. Split `rawToken` on the last `.` into `credentialId` and `sig`.
2. Recompute `expectedSig = base64url(HMAC-SHA256(credentialId, QR_SIGNING_SECRET))`.
3. Compare `sig` to `expectedSig` with `crypto.timingSafeEqual` (never `===`, to avoid a timing side-channel on a security-relevant comparison).
4. Mismatch (including malformed input, e.g. no `.`, wrong length) → structurally `INVALID`. This is the check that satisfies critical test #9 ("tampered QR token is rejected") without needing a DB hit.
5. Match → structurally valid. Caller then hashes `rawToken` and looks up `Credential.tokenHash` to fetch the row and proceed with scan-count/duplicate logic (that lookup is what makes revocation possible — a structurally valid but deleted/superseded credential still fails at this step).

### Where this lands in code (Day 1 vs. later)

Day 1 ships only `apps/api/src/identity/token.service.ts` — an injectable `TokenService` (`signToken(credentialId)` / `verifyToken(rawToken)`, DI'd `ConfigService<Env, true>` for `QR_SIGNING_SECRET`, matching the `*.service.ts` naming convention used by `auth.service.ts`/`uploads.service.ts`/`ca.service.ts`), plus unit tests covering: valid round-trip, tampered signature, tampered credentialId, malformed input (no `.`, empty string). This has no dependency on `Credential` rows existing, so it doesn't block on Registration/Payments and can't be broken by their Day 1/2 changes.

The full `identity` module (controller, service, BullMQ processor, DTOs, wiring into `app.module.ts`) is Day 2 work, once Shikhar's payment-confirmed transition exists to trigger off of, and once `UploadsService`'s `folder` param generalization has landed for QR PNG storage.

## Files to Read First (Day 2, before resuming)

- This doc, in full.
- `apps/api/src/ca/*` — module/controller/service/DTO pattern to mirror.
- `apps/api/src/queue/queue.module.ts`, `apps/api/src/queue/jobs/referral-flush.processor.ts` — BullMQ processor pattern for the payment-confirmed → generate-QR worker.
- `apps/api/src/uploads/uploads.service.ts` — confirm the `folder` param Shikhar adds; use `qr-codes/` as this vertical's prefix.
- Shikhar's Payments module — the exact shape/event of a `Registration` reaching `CONFIRMED`, since that's this module's trigger.
- `.claude/reference/api.md` §3 Identity table — endpoint contract to match exactly.

## Files to Change / Create

```
Day 1 (this session):
apps/api/src/identity/token.service.ts               new — TokenService: signToken / verifyToken
apps/api/src/identity/token.service.spec.ts          new — unit tests

Day 2:
apps/api/src/identity/identity.module.ts             new
apps/api/src/identity/identity.controller.ts         new
apps/api/src/identity/identity.service.ts             new
apps/api/src/identity/dto/scan.dto.ts                 new
apps/api/src/identity/jobs/credential-issue.processor.ts   new — BullMQ worker, fires on payment confirmed
apps/api/src/app.module.ts                            wire IdentityModule
apps/api/src/queue/queue.module.ts                    register 'credential-issue' queue
apps/web/app/dashboard/credential/page.tsx            new — QR display/download page
apps/web/app/dashboard/credential/page.module.css      new

Day 3:
apps/api/src/identity/identity.controller.ts          add POST /identity/scan
apps/web/app/admin/scans/page.tsx                      new (only if time allows) — bare scan-log viewer
```

## Implementation Steps

**Step 1 — Token utility (Day 1, today)**
- What: `signToken(credentialId: string): string` and `verifyToken(rawToken: string): { valid: boolean; credentialId?: string }` per the design above, using Node's built-in `crypto` (`createHmac`, `timingSafeEqual`) and `Buffer`'s native `base64url` encoding — no new dependency needed.
- Files: `apps/api/src/identity/token.service.ts`, `apps/api/src/identity/token.service.spec.ts`
- Validation: `npm run test --workspace=api -- token.service` — covers valid round-trip, tampered signature, tampered credentialId, malformed input.

**Step 2 — Identity module (Day 2)**
- What: `GET /identity/mine` (authenticated, returns the caller's own credential + QR image URL via `UploadsService.getSignedGetUrl`), `GET /identity/validate/:token` (public, runs `verifyToken` + DB lookup, no scan-log write), BullMQ processor listening for payment-confirmed to create the `Credential` row (`signToken` + `SHA-256` hash + QR PNG render + upload).
- Files: see table above.
- Validation: critical test #7 (confirmed registration → exactly one credential), manual curl against a payment confirmed by Shikhar's flow.

**Step 3 — Scan endpoint + duplicate detection (Day 3)**
- What: `POST /identity/scan` (Volunteer/Admin only) — `verifyToken`, DB lookup by `tokenHash`, write `ScanLog` with gate/direction, set `result` to `VALID`/`DUPLICATE`/`INVALID`/`EXPIRED`, increment `Credential.scanCount`.
- Files: `identity.controller.ts`, `identity.service.ts`.
- Validation: critical tests #8 and #9.

## Tests and Validation (gate)

```
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
```

Day 2+ additionally: `npm run test:e2e --workspace=api` once the controller exists.

## Acceptance Criteria

- [ ] `signToken`/`verifyToken` round-trip correctly; tampering with either the `credentialId` or `sig` segment is detected without a DB call.
- [ ] `GET /identity/mine`, `GET /identity/validate/:token`, `POST /identity/scan` match `.claude/reference/api.md` exactly (path, method, envelope).
- [ ] A confirmed registration produces exactly one `Credential` row (critical test #7).
- [ ] A valid scan writes exactly one `ScanLog` row and increments `scanCount` (critical test #8).
- [ ] A tampered token is rejected before any DB write (critical test #9).

## Risks and Notes

- **Symmetric HMAC means "offline" verification isn't truly client-side yet.** `QR_SIGNING_SECRET` is a single symmetric secret; shipping it to volunteer scanner devices for real offline verification would mean distributing a server secret onto handheld devices at a physical venue — not acceptable for this launch. Phase 1 (this sprint) keeps `verifyToken` server-side only, called via `GET /identity/validate/:token` / `POST /identity/scan`. True offline scanning would need asymmetric signing (e.g. Ed25519) issued as a later hardening pass — flagging now so it isn't assumed to already work per the architecture doc's aspirational sequence diagram.
- **Hard dependency on Payments (Day 2) and `UploadsService` generalization (Shikhar, Day 1).** Both are outside this vertical's control; Day 1 scope was deliberately kept to code with zero coupling to either so nothing here blocks or gets blocked by their slippage.
- **Volunteer scanner PWA is explicitly cut** per the master roadmap — Day 3 delivers the bare API + maybe a minimal viewer, not a scanning UI.
- **No schema changes.** `Credential`/`ScanLog` are already fully modeled; this vertical only writes service/controller code against them.
