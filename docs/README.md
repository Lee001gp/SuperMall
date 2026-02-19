# SuperMall Platform

Standalone multi-tenant mall platform repository.

## Current Architecture Status
- Backend persistence source of truth: PostgreSQL (`server/src/db.js`, `db/schema.sql`).
- Auth: token-based register/login/refresh/logout/password reset endpoints implemented.
- Tenant resolution: mall slug path, portal `X-Tenant-ID`, and `<tenant>.localhost` subdomain.
- Jobs: analytics daily rollups + KPI refresh worker.

## Important
See `docs/FEATURES_MASTER.md` for truthful completion and NOT DONE areas.
