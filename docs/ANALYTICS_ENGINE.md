# Analytics Engine

## Event Tracking
`POST /api/analytics/event` writes validated, tenant-scoped analytics events into `analytics_events`.

### Canonical event types
- mall_view
- store_view
- store_search
- promo_click
- promo_redemption
- route_request
- social_post / social_like
- parking_save
- event_rsvp
- message_reply

Payloads are normalized with default attribution properties (`channel`, `sourceApp`) and rejected if event names are unsupported.

## Rollups and KPIs
`jobs/src/worker.js` computes idempotent rollups from `analytics_events`:
- daily rollups in `analytics_daily_rollups`
- KPI snapshots in `analytics_kpis`

`ON CONFLICT ... DO UPDATE` guarantees re-running the worker does not double-count values.

## Tenant dashboard shape
`GET /admin/analytics/tenant?days=30` now returns dashboard-ready data:
- `summary`: total events, active days, average/day
- `series`: filtered day-by-day metric rows
- `topEvents`: ranked metric totals
- `kpis`: latest KPI rows

## CRM bridge
CRM endpoints consume analytics signals to enrich contacts (`/crm/contacts`) and to define reusable segments (`/crm/segments`).
