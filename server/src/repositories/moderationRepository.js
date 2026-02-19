/** Moderation repository for reports and actions. */
import { query } from '../db.js';

export async function createReport({ id, tenantId, reporterUserId, entityType, entityId, reason }) {
  await query(
    'INSERT INTO reports(id,tenant_id,reporter_user_id,entity_type,entity_id,reason) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5::uuid,$6)',
    [id, tenantId, reporterUserId, entityType, entityId, reason]
  );
}

export async function listReports(tenantId) {
  const { rows } = await query(
    'SELECT id,entity_type,entity_id,reason,status,created_at FROM reports WHERE tenant_id=$1::uuid ORDER BY created_at DESC',
    [tenantId]
  );
  return rows;
}
