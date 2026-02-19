# RBAC Matrix
- `customer`: register/login, browse malls/stores, social actions, parking save/find, analytics event emit.
- `store_owner`: customer abilities + store profile editing, promotions/events CRUD, review responses, verification request submit.
- `mall_admin`: tenant branding/layout publish, moderation actions, verification decisions, floors/POIs/path/parking management.
- `platform_admin`: tenant governance, global user/store views, impersonation audit mode, cross-tenant analytics.

## Tenant Isolation
- `tenantResolver` maps tenant from mall slug, `X-Tenant-ID` (portal), or subdomain.
- `tenantGuard` checks membership except for platform admin.
- Platform impersonation emits audit logs; UI displays audit-mode banner.
