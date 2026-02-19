# Local Setup

## Mode A — Full production-like (Postgres + Docker)
1. `cp .env.example .env`
2. `npm install`
3. Ensure Docker is running.
4. `npm run dev`

## Mode B — Standalone fallback (SQLite, no Docker)
1. `cp .env.example .env`
2. `npm install`
3. `DB_MODE=sqlite SQLITE_PATH=data/dev.sqlite npm run dev`

The dev orchestrator auto-detects Docker and will switch to SQLite fallback if Docker is unavailable.

## Ports
- API: `4000`
- Customer: `5173`
- Store portal: `5174`
- Mall portal: `5175`
- Platform admin: `5176`

## Database lifecycle
- Migrate: `npm run db:migrate`
- Seed: `npm run db:seed`

## Tests
- Unit/integration: `npm run test`
- E2E (Docker-aware, SQLite fallback): `npm run test:e2e`
- Smoke: `npm run smoke`
