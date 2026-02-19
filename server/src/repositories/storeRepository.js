/** Store repository for tenant-scoped catalog and profile reads. */
import { query } from '../db.js';

export async function listStoresByTenant(tenantId, search = '') {
  const { rows } = await query(
    'SELECT id,slug,name,description,floor_label,is_verified FROM stores WHERE tenant_id=$1::uuid AND name ILIKE $2 ORDER BY name',
    [tenantId, `%${search}%`]
  );
  return rows;
}

export async function getStoreBySlug(tenantId, storeSlug) {
  const { rows } = await query(
    'SELECT id,slug,name,description,floor_label,is_verified FROM stores WHERE tenant_id=$1::uuid AND slug=$2',
    [tenantId, storeSlug]
  );
  return rows[0] || null;
}
