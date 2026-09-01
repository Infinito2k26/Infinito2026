#!/usr/bin/env bash
# Dumps the Postgres database at $DATABASE_URL to a timestamped, compressed
# custom-format file in $BACKUP_DIR (default ./backups). Safe to run from cron.
set -euo pipefail

DATABASE_URL="${DATABASE_URL:?Set DATABASE_URL first}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

timestamp=$(date -u +%Y%m%dT%H%M%SZ)
out_file="$BACKUP_DIR/infinito-$timestamp.dump"

pg_dump --dbname="$DATABASE_URL" --format=custom --compress=9 --file="$out_file"

echo "Backup written to $out_file"

# Prune backups older than RETENTION_DAYS.
find "$BACKUP_DIR" -name 'infinito-*.dump' -mtime "+$RETENTION_DAYS" -delete
