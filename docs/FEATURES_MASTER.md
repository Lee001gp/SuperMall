# Features Master Checklist (Truthful)

## Done (DB + API + UI + tests)
- [x] Single-command local dev orchestrator (`npm run dev`) with Docker-aware fallback.
- [x] Customer app API wiring for auth, mall discovery, store detail, parking save/find, social interactions, walking distance query.
- [x] Store portal API wiring for profile updates, promotions CRUD, events create, review responses, analytics cards.
- [x] Mall admin API wiring for branding/layout version actions, moderation queue actions, verification decisions, floors/path/parking management.
- [x] Platform admin API wiring for tenant governance and impersonation audit mode.
- [x] Production hardening assets: health/readiness, request IDs, backup/restore scripts, prod compose and nginx sample.
- [x] E2E harness supports Docker Postgres mode and Docker-less SQLite fallback mode.

## Remaining
- [ ] Full deterministic Playwright assertions for all deep multi-role business flows.
- [ ] Full DB integration coverage for every endpoint (expanded smoke coverage exists in `server/src/api.test.js`).
- [ ] Advanced observability stack (metrics exporter, centralized logging backend, alerts).
