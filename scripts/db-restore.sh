#!/usr/bin/env bash
# Restores a dump produced by db-backup.sh into $DATABASE_URL.
# The target database must already exist and be otherwise empty.
set -euo pipefail

DATABASE_URL="${DATABASE_URL:?Set DATABASE_URL first}"
dump_file="${1:?Usage: db-restore.sh <path-to-dump-file>}"

pg_restore --dbname="$DATABASE_URL" --no-owner --clean --if-exists "$dump_file"

echo "Restored $dump_file into $DATABASE_URL"
