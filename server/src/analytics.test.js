import test from 'node:test';
import assert from 'node:assert/strict';
import {
  trackEvent,
  aggregateTenant,
  aggregateStore,
  aggregatePlatform,
  snapshotNightly,
  normalizeAnalyticsEvent,
  buildTenantAnalyticsSnapshot
} from './analytics.js';

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

test('normalizeAnalyticsEvent validates allowlist and enriches defaults', () => {
  const event = normalizeAnalyticsEvent({ eventName: 'store_view', properties: { sourceApp: 'portal-store' } });
  assert.equal(event.eventName, 'store_view');
  assert.equal(event.properties.channel, 'unknown');
  assert.equal(event.properties.sourceApp, 'portal-store');

  assert.throws(() => normalizeAnalyticsEvent({ eventName: 'invalid_event' }));
});

test('buildTenantAnalyticsSnapshot computes summary and top events', () => {
  const snapshot = buildTenantAnalyticsSnapshot(
    [
      { metric_name: 'store_view', metric_value: 10, metric_date: '2026-02-20' },
      { metric_name: 'promo_click', metric_value: 4, metric_date: '2026-02-20' },
      { metric_name: 'store_view', metric_value: 5, metric_date: '2026-02-21' }
    ],
    [{ kpi_key: 'total_events', kpi_value: 19, store_id: null }]
  );

  assert.equal(snapshot.summary.totalEvents, 19);
  assert.equal(snapshot.summary.uniqueDays, 2);
  assert.equal(snapshot.topEvents[0].metricName, 'store_view');
  assert.equal(snapshot.kpis[0].key, 'total_events');
});
