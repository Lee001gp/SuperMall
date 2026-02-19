import crypto from 'crypto';
/**
 * Security middleware: auth token parsing, tenant resolution, RBAC, and tenant isolation.
 */
import { query } from './db.js';
import { verifyAccessToken } from './services.auth.js';

export async function authMiddleware(req, _res, next) {
  try {
    // Test-only backdoor for unit tests; never used in non-test runtime.
    if (process.env.NODE_ENV === 'test' && req.header('X-Role')) {
      req.user = { id: req.header('X-User-ID') || 'test-user', globalRole: req.header('X-Role'), tenantId: req.header('X-Tenant-ID') || null };
      return next();
    }
    const header = req.header('Authorization');
    if (!header?.startsWith('Bearer ')) return next();
    const payload = verifyAccessToken(header.slice(7));
    req.user = payload;
    next();
  } catch {
    next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

export async function tenantResolver(req, _res, next) {
  const mallSlug = req.params.mallSlug;
  const headerTenant = req.header('X-Tenant-ID');
  const host = req.hostname;

  if (mallSlug) {
    const { rows } = await query('SELECT id, slug FROM tenants WHERE slug = $1', [mallSlug]);
    if (rows[0]) req.tenant = rows[0];
  }

  if (!req.tenant && headerTenant) {
    const { rows } = await query('SELECT id, slug FROM tenants WHERE id = $1::uuid', [headerTenant]);
    if (rows[0]) req.tenant = rows[0];
  }

  if (!req.tenant && host?.includes('.localhost')) {
    const sub = host.split('.')[0];
    const { rows } = await query('SELECT id, slug FROM tenants WHERE slug = $1', [sub]);
    if (rows[0]) req.tenant = rows[0];
  }

  next();
}

export async function tenantGuard(req, res, next) {
  if (!req.tenant || !req.user) return next();
  if (req.user.globalRole === 'platform_admin') {
    try {
      await query('INSERT INTO audit_logs(id,tenant_id,actor_user_id,action,entity_type,entity_id,payload) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7::jsonb)', [crypto.randomUUID(), req.tenant.id, req.user.id, 'tenant_bypass', 'tenant', req.tenant.id, JSON.stringify({ path: req.path })]);
    } catch {}
    return next();
  }
  const { rows } = await query('SELECT 1 FROM user_tenant_memberships WHERE user_id = $1::uuid AND tenant_id = $2::uuid LIMIT 1', [req.user.id, req.tenant.id]);
  if (!rows[0]) return res.status(403).json({ error: 'Cross-tenant access denied' });
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.globalRole)) return res.status(403).json({ error: 'Forbidden by role' });
    next();
  };
}
