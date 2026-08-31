# Readiness Phase 3 — Event-Day Operations

**Status:** Active — not started, no code involved. **Written:** 2026-08-31.
**Supersedes:** section 3 of `production-readiness-audit.md` — that file is kept for history but this is now the standalone source.

## What this phase is

Process and planning work, not code. A fest is a live, in-person event with a hard deadline and no do-over — these gaps block "production" in the sense that matters (the event running smoothly) just as much as a missing endpoint would, but none of them require an engineer to fix. This category was entirely absent from every prior planning document, which focused on code.

---

## 1. No runbook for scan failures at the gate

`POST /identity/scan` exists and duplicate-scan detection is built, but the roadmap explicitly cut the offline-first, camera-UX volunteer scanner PWA. Nobody has written down what a volunteer does when their phone has no signal at the venue, or how an admin performs a manual override check-in when the scan endpoint is unreachable. This is a same-day-of-event failure mode, not a hypothetical.

**Action:** write a one-page runbook — what a volunteer does on scan failure (manual ID check + paper log?), how an admin performs an override check-in against `admin-scans`, and who they call if the whole system is down.

## 2. No on-call or incident plan

If the API goes down during a registration deadline or fest-day check-in, there's no documented who-gets-paged, no rollback procedure, no holding message for users.

**Action:** name an on-call owner for the registration window and for fest day itself; write down the rollback steps (tied to Phase 1's deployment target once it exists); draft a one-line holding message for the public site/socials in case of an outage.

## 3. The issue tracker isn't tracking any of this

`gh issue list` currently shows exactly 2 open issues: #24 (already shipped, tracked for closing in Phase 1 item 14) and #6 (a stale sprint-kickoff/onboarding doc issue from June). None of Phase 1 or Phase 2's items have a tracked issue — none of this work is currently assigned to anyone or visible on the project board the team otherwise uses.

**Action:** file a GitHub issue per Phase 1/2/3 item (or per tier) before work starts on it.

## 4. Domain is still undecided

`deployment-requirements.md` frames institute-subdomain (`infinito.iitp.ac.in`) vs. a purchased `.in` domain as an open choice. This isn't just a hosting detail — it blocks finalizing CORS origins, Cloudflare setup, and (once Phase 1 item 8's email gap is addressed) sender-domain verification (SPF/DKIM), all of which need a settled domain first.

**Action:** decide institute subdomain vs. purchased domain; this is a coordination/approval task, not an engineering one — get it moving early since it gates Phase 1 item 5 (deployment target).

## 5. Load testing has never been attempted

Cut explicitly in every prior planning document. Given the budget doc's own estimate (50–100 peak concurrent users), likely fine to keep deferred — but it should get one real smoke run at realistic concurrency once Phase 1's rate-limiting fix (item 2) lands, since the default throttler limits were chosen, not measured.

**Action:** one scripted load-test run (e.g. `k6` or `autocannon` against a staging deploy) at ~100 concurrent users hitting registration/payment endpoints, after Phase 1 items 1–3 ship.

---

## Suggested order of work

1. Item 4 (domain decision) first — it's a coordination task with no dependencies, and it gates Phase 1's deployment work. Get it into someone's queue immediately.
2. Item 3 (issue tracking) costs an hour and should happen before, not after, Phase 1/2 work starts — file the issues as you pick up each phase's items.
3. Items 1 and 2 (runbook, on-call plan) are a single working session each — schedule them well before the event, not the week of.
4. Item 5 (load test) waits on Phase 1 items 1–3 (rate limiting) landing first.
