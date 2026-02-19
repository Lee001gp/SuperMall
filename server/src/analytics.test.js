import test from 'node:test';
import assert from 'node:assert/strict';
import { trackEvent, aggregateTenant, aggregateStore, aggregatePlatform, snapshotNightly } from './analytics.js';

test('aggregateTenant counts metrics', () => {
  const s = { analyticsEvents: [], tenants: [{ id: 't1' }], analyticsSnapshots: [] };
  trackEvent(s, { tenantId: 't1', type: 'store_view', storeId: 's1' });
  trackEvent(s, { tenantId: 't1', type: 'store_view', storeId: 's1' });
  trackEvent(s, { tenantId: 't1', type: 'promo_click', storeId: 's1' });
  const result = aggregateTenant(s, 't1');
  assert.equal(result.totalEvents, 3);
  assert.equal(result.metrics.store_view, 2);
});

test('store aggregation and nightly snapshot work', () => {
  const s = { analyticsEvents: [], tenants: [{ id: 't1' }], analyticsSnapshots: [] };
  trackEvent(s, { tenantId: 't1', type: 'store_view', storeId: 's2' });
  trackEvent(s, { tenantId: 't1', type: 'promo_redemption', storeId: 's2' });
  const store = aggregateStore(s, 't1', 's2');
  assert.equal(store.funnel.views, 1);
  assert.equal(store.funnel.redemptions, 1);
  const snap = snapshotNightly(s);
  assert.equal(s.analyticsSnapshots.length, 1);
  assert.equal(snap.platform.totalTenants, 1);
});
