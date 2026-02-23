/**
 * Internal analytics helpers.
 * Includes lightweight event normalization and deterministic in-memory aggregations for unit tests.
 */

const EVENT_ALLOWLIST = new Set([
  'mall_view',
  'store_view',
  'store_search',
  'promo_click',
  'promo_redemption',
  'route_request',
  'social_post',
  'social_like',
  'parking_save',
  'event_rsvp',
  'message_reply'
]);

export function normalizeAnalyticsEvent(raw = {}) {
  const eventName = String(raw.eventName || '').trim();
  if (!EVENT_ALLOWLIST.has(eventName)) {
    const error = new Error(`Unsupported analytics event: ${eventName || 'empty'}`);
    error.statusCode = 400;
    throw error;
  }

  const properties = raw.properties && typeof raw.properties === 'object' ? raw.properties : {};
  const channel = String(properties.channel || 'unknown').slice(0, 64);

  return {
    eventName,
    storeId: raw.storeId || null,
    properties: {
      ...properties,
      channel,
      sourceApp: String(properties.sourceApp || 'web').slice(0, 32)
    }
  };
}

export function trackEvent(state, event) {
  const enriched = { id: `evt-${state.analyticsEvents.length + 1}`, at: new Date().toISOString(), ...event };
  state.analyticsEvents.push(enriched);
  return enriched;
}

export function aggregateTenant(state, tenantId) {
  const events = state.analyticsEvents.filter((e) => e.tenantId === tenantId);
  const metrics = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});
  return { tenantId, totalEvents: events.length, metrics };
}

export function aggregateStore(state, tenantId, storeId) {
  const events = state.analyticsEvents.filter((e) => e.tenantId === tenantId && e.storeId === storeId);
  const funnel = {
    views: events.filter((e) => e.type === 'store_view').length,
    promoClicks: events.filter((e) => e.type === 'promo_click').length,
    redemptions: events.filter((e) => e.type === 'promo_redemption').length
  };
  return { tenantId, storeId, funnel };
}

export function aggregatePlatform(state) {
  const byTenant = state.tenants.map((tenant) => aggregateTenant(state, tenant.id));
  return {
    totalTenants: state.tenants.length,
    totalEvents: state.analyticsEvents.length,
    tenants: byTenant
  };
}

export function snapshotNightly(state) {
  const snapshot = {
    at: new Date().toISOString(),
    platform: aggregatePlatform(state)
  };
  state.analyticsSnapshots.push(snapshot);
  return snapshot;
}

export function buildTenantAnalyticsSnapshot(rows = [], kpiRows = []) {
  const sorted = [...rows].sort((a, b) => String(a.metric_date).localeCompare(String(b.metric_date)));
  const totalEvents = sorted.reduce((sum, row) => sum + Number(row.metric_value || 0), 0);
  const uniqueDays = new Set(sorted.map((row) => String(row.metric_date))).size;
  const topEventsMap = new Map();
  for (const row of sorted) {
    const prev = topEventsMap.get(row.metric_name) || 0;
    topEventsMap.set(row.metric_name, prev + Number(row.metric_value || 0));
  }

  return {
    summary: {
      totalEvents,
      uniqueDays,
      avgPerDay: uniqueDays ? Number((totalEvents / uniqueDays).toFixed(2)) : 0
    },
    series: sorted,
    topEvents: [...topEventsMap.entries()]
      .map(([metricName, total]) => ({ metricName, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8),
    kpis: kpiRows.map((kpi) => ({ key: kpi.kpi_key, value: Number(kpi.kpi_value || 0), storeId: kpi.store_id || null }))
  };
}
