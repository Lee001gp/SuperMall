#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL required}"
IN=${1:?usage: restore_db.sh <backup.sql.gz>}
gunzip -c "$IN" | psql "$DATABASE_URL"
echo "restore complete"
