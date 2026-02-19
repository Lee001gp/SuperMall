# Remediation Plan

## Gap Matrix

| Gap | Files to Change | Acceptance Test |
|---|---|---|
| In-memory runtime source of truth | `server/src/index.js`, new `server/src/db.js`, `server/src/repositories/*`, remove state usage | Restart API and verify records persist through DB reads/writes |
| Mock auth headers in production | `server/src/middleware.js`, new `server/src/services/auth.js` | Requests without auth token to protected routes return 401 |
| Missing auth lifecycle endpoints | `server/src/index.js`, `db/schema.sql` | Register/login/refresh/logout/password-reset endpoints work against DB |
| Incomplete tenant enforcement at query layer | repositories + SQL predicates | Cross-tenant request returns 403 and cannot read foreign tenant data |
| Social/reports/moderation incomplete | `server/src/index.js`, `db/schema.sql`, `docs/API.md` | Report queue create + moderation action persists |
| Parking/routing not DB-backed | `server/src/index.js`, `db/schema.sql` | Save/find car and route endpoints use DB entities |
| Analytics not DB-rolled up | `jobs/src/worker.js`, `server/src/index.js`, `db/schema.sql` | Aggregation job writes idempotent daily KPI rows |
| Docs overstating completion | `docs/FEATURES_MASTER.md`, setup/docs files | Checklist marks NOT DONE where missing |
| Weak integration tests | `tests/*`, `server/src/*.test.js` | Tenant isolation + auth service + aggregation tests pass |
