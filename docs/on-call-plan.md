# On-Call & Incident Plan

Readiness Phase 3, item 2. **Names below are placeholders — the team needs
to actually assign these**, per CLAUDE.md's roster. Everything else
(rollback steps, holding message) is ready to use as written.

## On-call owners

| Window | Owner | Backup |
|---|---|---|
| Registration window (open through close) | _TBD — assign_ | _TBD_ |
| Fest day | _TBD — assign_ | _TBD_ |

Whoever is on-call needs: SSH/console access to the deploy target, the
Sentry project (once `SENTRY_DSN` is configured — see Phase 1 item 9), and
admin credentials on the live site.

## If the API goes down

1. Check `GET /health` — it reports DB and Redis status separately, so you
   know immediately whether it's the app, Postgres, or Redis.
2. Check the deploy target's own process status (systemd/pm2/docker, per
   however Phase 1 item 5's deploy is actually set up) and recent logs for
   a crash loop vs. a hung process.
3. If it's a bad deploy: roll back to the previous known-good image/commit
   (the exact command depends on the CD setup landed in Phase 1 item 5 —
   record it here once that exists).
4. If it's a database issue: check `docker compose ps` / the managed
   Postgres console for connection limits or disk space before assuming
   data loss. See `docs/backup-restore.md` if an actual restore is needed.
5. Post the holding message (below) to the public site/socials if the
   outage will visibly affect users for more than a few minutes.

## Holding message (draft — post as-is or adapt)

> Infinito's registration/check-in system is temporarily down while we fix
> an issue. Your registration and payment data are safe — nothing is lost.
> We'll post here the moment it's back up. Thanks for your patience!

## After the incident

- Note what happened and the fix in a short postmortem — doesn't need to be
  formal, just enough that the next on-call person isn't starting cold.
- If it was a code bug, file a GitHub issue for the actual fix before
  closing out the incident.
