# Features Master Checklist (Truthful)

## Verified Done
- [x] DB-backed API with Postgres default and SQLite fallback mode.
- [x] Auth lifecycle endpoints and tenant resolution/guard middleware.
- [x] Customer app restructured into multi-file app architecture (`api/`, `auth/`, `components/`, `layout/`, `pages/`, `state/`, `styles/`, `utils/`).
- [x] Store/Mall/Platform portals restructured into multi-file app architecture with page modules.
- [x] CRUD endpoint coverage expanded for mall map entities (POIs/nodes/edges read/update/delete support).
- [x] Docker-aware e2e harness that falls back to SQLite when Docker is absent.

## Remaining (not falsely marked done)
- [ ] Deep business-complete UI behavior on every page (many pages currently baseline API-driven and need richer forms/charts).
- [ ] Full deterministic Playwright role-based end-to-end matrix with assertions for all governance workflows.
- [ ] Comprehensive endpoint-level DB integration tests across all modules.
