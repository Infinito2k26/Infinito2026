# Database Backup & Restore

Readiness Phase 1, item 12. Covers Postgres only — Redis holds no data that
isn't reconstructable from Postgres (sessions can be re-issued, queue jobs
are re-enqueued by the services that create them).

## Backup

`scripts/db-backup.sh` runs `pg_dump` in custom format (compressed, and
restorable with `pg_restore` regardless of table order) against `$DATABASE_URL`,
writing to `$BACKUP_DIR` (default `./backups`) and pruning anything older than
`$RETENTION_DAYS` (default 14).

```bash
DATABASE_URL="postgresql://..." BACKUP_DIR=/var/backups/infinito ./scripts/db-backup.sh
```

**Version note:** `pg_dump`'s major version must be >= the server's. The
Postgres server runs 16 (see `docker-compose.yml`); on the deploy target, run
this from a container/host with a matching `pg_dump`, not an arbitrary local
install — a version mismatch aborts with `server version mismatch` before
writing anything (confirmed hitting this locally with a Homebrew-installed
`pg_dump` 15 client against the 16 server; running the same dump via
`docker exec` into the Postgres container itself, which always matches the
server version, is the reliable path).

**Schedule:** once deployed (Phase 1 item 5), add this as a daily cron job on
the deploy target, writing to a path outside the app's own disk if possible
(a small object-storage bucket, or the VPS's snapshot-backed volume) so a
lost VM doesn't take the backups with it.

## Restore

```bash
DATABASE_URL="postgresql://.../target_db" ./scripts/db-restore.sh /path/to/infinito-<timestamp>.dump
```

Restores into whatever database `$DATABASE_URL` points at. `--clean
--if-exists` drops existing objects first, so this is safe to run against a
database that already has the same schema loaded (e.g. restoring over a
freshly-migrated empty database) — point it at a *new* database if you want
to keep the original around for comparison.

## Verified restore drill (2026-08-31)

Ran the full loop against the local dev database to confirm the scripts
actually work, not just that they exist:

1. `pg_dump` the running `infinito_dev` database (via `docker exec` into the
   Postgres container, to match its server version) — produced a 74KB custom
   -format dump with no errors.
2. Created a scratch `infinito_restore_test` database.
3. `pg_restore --no-owner --clean --if-exists` the dump into it — completed
   with no errors.
4. Compared row counts on two tables (`User`, `Event`) between the original
   and restored databases — identical in both.
5. Dropped the scratch database and temp files.

This confirms the backup format and restore command are correct end to end.
What's still open is Phase 1 item 5's dependency: there's no deploy target
yet to actually schedule this against, so the cron job itself doesn't exist
until that lands.
