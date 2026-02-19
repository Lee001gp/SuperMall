# Enterprise Audit Report

This audit validates current repository behavior against required enterprise checklist.

## 1) Multi-tenant isolation — **PASS (with noted gaps)**
- Evidence: `tenantResolver` and `tenantGuard` enforce tenant mapping and membership checks, with platform admin bypass logging. (`server/src/middleware.js`)
- Evidence: tenant-scoped SQL predicates across customer/store/mall queries. (`server/src/index.js`)
- Gap: some platform-wide read endpoints are intentionally cross-tenant by role.

## 2) Auth & session security — **PASS (baseline)**
- Evidence: register/login/refresh/logout/reset endpoints implemented. (`server/src/index.js`)
- Evidence: password hashing/signature verification in `services.auth`. (`server/src/services.auth.js`)
- Evidence: auth rate limiting added for `/auth/*` routes. (`server/src/index.js`)

## 3) RBAC correctness — **PARTIAL**
- Evidence: `requireRole` present and route-level guards in API. (`server/src/middleware.js`, `server/src/index.js`)
- Fix applied: store-scope guard middleware to restrict store-owner writes to assigned stores. (`server/src/index.js`)
- Remaining: broader test coverage needed for every guarded route.

## 4) DB integrity — **PASS (dev/prod dual mode)**
- Evidence: Postgres schema + SQLite fallback schema + migration mode switch. (`db/schema.sql`, `db/schema.sqlite.sql`, `db/migrate.js`)
- Evidence: deterministic seed across modes. (`db/seed.js`)
- Evidence: backup/restore scripts present. (`scripts/backup_db.sh`, `scripts/restore_db.sh`)

## 5) Internal analytics engine — **PASS (baseline)**
- Evidence: event ingestion endpoint + rollup worker writing daily/kpi outputs. (`server/src/index.js`, `jobs/src/worker.js`)

## 6) Social + moderation + verification — **PASS (baseline workflows)**
- Evidence: post/like/comment/share/report APIs and moderation actions. (`server/src/index.js`)
- Evidence: verification request + decision path and store badge updates. (`server/src/index.js`)

## 7) Indoor routing + walking distance — **PASS (baseline)**
- Evidence: route and distance endpoints and Dijkstra planning utility. (`server/src/index.js`, `server/src/navigation.js`)

## 8) Parking + car locator — **PASS (baseline)**
- Evidence: parking zone admin + occupancy snapshots + save/find car endpoints. (`server/src/index.js`)

## 9) Web apps API-driven — **PASS (baseline)**
- Evidence: customer/store/mall/platform apps call API and perform CRUD actions. (`apps/*/src/main.jsx`)

## 10) Tests + E2E — **PARTIAL**
- Evidence: `npm run test` passes in this environment.
- Evidence: `npm run test:e2e` no longer fails solely due to missing Docker; SQLite fallback path works.
- Remaining: full browser end-to-end assertions require full runtime dependencies in environment.

## 11) Production readiness — **PASS (baseline)**
- Evidence: `/healthz`, `/readyz`, request IDs, production compose/nginx, backup docs/scripts. (`server/src/index.js`, `docker/*`, `scripts/*`, docs)

## 12) Documentation accuracy — **PASS (truthful)**
- Updated setup docs for Postgres production default + SQLite dev/e2e fallback and current verification status. (`docs/SETUP_LOCAL.md`, `docs/SETUP_PRODUCTION.md`, `docs/FEATURES_MASTER.md`)
