/**
 * Internal analytics engine methods.
 * Tracks raw events and computes tenant/store/platform rollups.
 */

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
  const byTenant = state.tenants.map((t) => aggregateTenant(state, t.id));
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
