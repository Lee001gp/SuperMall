# Analytics Engine

## Event Tracking
`trackEvent` records timestamped events into `state.analyticsEvents`.
Tracked types include:
- mall/store views
- store search
- promo redemptions
- route requests
- social posting/likes
- parking saves
- event RSVP

## Aggregations
- `aggregateTenant(tenantId)`: total and by-event counts.
- `aggregateStore(tenantId, storeId)`: funnel metrics (views, promo clicks, redemptions).
- `aggregatePlatform()`: cross-tenant summary.

## Background Snapshots
`jobs/src/worker.js` runs snapshot ticks and stores nightly snapshots in memory using `snapshotNightly`.
