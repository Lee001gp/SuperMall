#!/usr/bin/env bash
set -euo pipefail

if command -v docker >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
  echo "Docker available -> Postgres smoke mode"
  export DB_MODE=postgres
  docker compose -f docker/docker-compose.yml up -d postgres
else
  echo "Docker unavailable -> SQLite fallback smoke mode"
  export DB_MODE=sqlite
  export SQLITE_PATH=data/test.sqlite
fi

npm run db:migrate
npm run db:seed
PORT=4300 npm run dev -w server >/tmp/supermall-smoke.log 2>&1 &
PID=$!
trap 'kill $PID >/dev/null 2>&1 || true' EXIT

node scripts/wait_for_http.js http://localhost:4300/healthz 60000
node scripts/wait_for_http.js http://localhost:4300/readyz 60000

echo "Smoke OK: http://localhost:4300/healthz and /readyz"
