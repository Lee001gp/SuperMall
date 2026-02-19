# Production Runbook

Production mode is PostgreSQL-backed and Docker-oriented.

> SQLite fallback is for development/testing only and must not be used in production.

## 1. Environment
Set `.env` with:
- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `UPLOADS_DIR`
- `DB_MODE=postgres`

## 2. Deploy
1. `docker compose -f docker/docker-compose.prod.yml up -d postgres`
2. `npm run db:migrate`
3. `npm run db:seed`
4. `docker compose -f docker/docker-compose.prod.yml up -d api jobs nginx`

## 3. Health
- Liveness: `GET /healthz`
- Readiness: `GET /readyz`
- Logs include `X-Request-ID`.

## 4. Backup / Restore
- Backup: `scripts/backup_db.sh ./backups/supermall.sql.gz`
- Restore: `scripts/restore_db.sh ./backups/supermall.sql.gz`

## 5. Zero-downtime-ish migration strategy
1. Apply additive migrations first (`npm run db:migrate`).
2. Roll API containers.
3. Verify `/readyz`.
4. Shift proxy traffic.
