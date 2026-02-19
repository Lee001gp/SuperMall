/**
 * Aggregation worker.
 * Computes idempotent daily rollups and KPI snapshots from analytics_events.
 */
import { query } from '../../server/src/db.js';
import { createId } from '../../server/src/services.auth.js';

async function rollupDaily() {
  const sql = `
    WITH base AS (
      SELECT tenant_id, store_id, date(created_at) AS metric_date, event_name, count(*)::numeric AS metric_value
      FROM analytics_events
      GROUP BY tenant_id, store_id, date(created_at), event_name
    )
    SELECT tenant_id, store_id, metric_date, event_name AS metric_name, metric_value
    FROM base
  `;
  const { rows } = await query(sql);
  for (const row of rows) {
    await query(
      `INSERT INTO analytics_daily_rollups(id,tenant_id,store_id,metric_date,metric_name,metric_value)
       VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6)
       ON CONFLICT (tenant_id, store_id, metric_date, metric_name)
       DO UPDATE SET metric_value = EXCLUDED.metric_value`,
      [createId(), row.tenant_id, row.store_id, row.metric_date, row.metric_name, row.metric_value]
    );
  }
}

async function refreshKpis() {
  const { rows } = await query(`SELECT tenant_id, store_id, sum(metric_value)::numeric AS total FROM analytics_daily_rollups GROUP BY tenant_id, store_id`);
  for (const row of rows) {
    await query(
      `INSERT INTO analytics_kpis(id,tenant_id,store_id,kpi_key,kpi_value)
       VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5)
       ON CONFLICT (tenant_id, store_id, kpi_key)
       DO UPDATE SET kpi_value=EXCLUDED.kpi_value, calculated_at=now()`,
      [createId(), row.tenant_id, row.store_id, 'total_events', row.total]
    );
  }
}

setInterval(async () => {
  try {
    await rollupDaily();
    await refreshKpis();
    console.log('[jobs] rollups refreshed', new Date().toISOString());
  } catch (error) {
    console.error('[jobs] rollup error', error.message);
  }
}, 60000);
