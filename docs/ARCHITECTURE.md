# Architecture
- Multi-tenant key is `tenant_id` across all tenant-scoped entities.
- API layer (`/server`) applies auth mock, tenant resolver, tenant guard, then RBAC guards per endpoint.
- Frontends (`/apps/*`) are separated by persona and consume REST endpoints.
- Worker (`/jobs`) performs recurring analytics snapshots and parking simulation.
- Database (`/db`) contains SQL schema and deterministic seed.

## Tenant Resolution Order
1. Mall slug from URL path (`/app/mall/:mallSlug/...`) maps to tenant.
2. Fallback to `X-Tenant-ID` header (for admin portals).
3. Platform admin bypasses tenant guard for cross-tenant analytics.
