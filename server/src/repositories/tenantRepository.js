/** Tenant repository for mall discovery and status management. */
import { query } from '../db.js';

export async function listTenants() {
  const { rows } = await query('SELECT id,slug,name,status,plan FROM tenants ORDER BY name');
  return rows;
}

export async function getTenantBySlug(slug) {
  const { rows } = await query('SELECT id,slug,name,status,plan FROM tenants WHERE slug=$1', [slug]);
  return rows[0] || null;
}

export async function updateTenantStatus(id, status) {
  await query('UPDATE tenants SET status=$1 WHERE id=$2::uuid', [status, id]);
}
