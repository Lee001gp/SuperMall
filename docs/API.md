# API

## Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/password-reset/request`
- `POST /auth/password-reset/confirm`
- `POST /auth/join-tenant`

## Health / Observability
- `GET /healthz`
- `GET /readyz`

## Customer
- `GET /app/malls`
- `GET /app/mall/:mallSlug/overview`
- `GET /app/mall/:mallSlug/stores?q=`
- `GET /app/mall/:mallSlug/store/:storeSlug`
- `GET /api/mall/:mallSlug/distance?fromStoreId=&toStoreId=&accessible=`
- `GET /api/mall/:mallSlug/route?fromPoiId=&toPoiId=&accessible=`
- `POST /app/mall/:mallSlug/parking/save-car`
- `GET /app/mall/:mallSlug/parking/find-car`

## Social
- `GET /social/posts`
- `POST /social/posts`
- `POST /social/posts/:postId/like`
- `POST /social/posts/:postId/comment`
- `POST /social/posts/:postId/share`
- `POST /social/reports`

## Store Portal
- `GET /store-portal/me`
- `PUT /store-portal/stores/:storeId`
- `POST /store-portal/stores/:storeId/hours`
- `POST /store-portal/stores/:storeId/contacts`
- `POST /store-portal/stores/:storeId/gallery`
- `POST /store-portal/promotions`
- `PUT /store-portal/promotions/:id`
- `DELETE /store-portal/promotions/:id`
- `POST /store-portal/events`
- `GET /store-portal/reviews/:storeId`
- `POST /store-portal/reviews/:reviewId/respond`
- `POST /store-portal/verification-request`

## Mall Admin
- `GET/POST /mall-admin/branding`
- `GET/POST /mall-admin/layout`
- `GET /mall-admin/reports`
- `POST /mall-admin/moderation/:reportId/action`
- `GET /mall-admin/verification-requests`
- `POST /mall-admin/verification-requests/:id/decision`
- `GET/POST /mall-admin/floors`
- `POST /mall-admin/pois`
- `POST /mall-admin/path-nodes`
- `GET/POST /mall-admin/path-edges`
- `GET/POST /mall-admin/parking-zones`
- `POST /mall-admin/parking-zones/:id/snapshots`

## Platform Admin
- `GET/POST /platform/tenants`
- `POST /platform/tenants/:id/status`
- `GET /platform/users`
- `GET /platform/stores`
- `POST /platform/impersonate/start`

## Analytics
- `POST /api/analytics/event`
- `GET /admin/analytics/tenant`
