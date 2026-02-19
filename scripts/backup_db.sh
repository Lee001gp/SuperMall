#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL required}"
STAMP=$(date +%Y%m%d_%H%M%S)
OUT=${1:-backup_$STAMP.sql.gz}
pg_dump "$DATABASE_URL" | gzip > "$OUT"
echo "backup written to $OUT"
