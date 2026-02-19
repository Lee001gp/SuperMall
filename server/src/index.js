/**
 * SuperMall API.
 * Fully DB-backed multi-tenant API for customer/store/mall/platform portals.
 */
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import { config } from './config.js';
import { query, withTx } from './db.js';
import { authMiddleware, requireAuth, tenantResolver, tenantGuard, requireRole } from './middleware.js';
import { createId, hashPassword, verifyPassword, signAccessToken, createRefreshToken, hashOpaqueToken } from './services.auth.js';
import { planRoute } from './navigation.js';

const app = express();
app.use(cors());
app.use(express.json());

const authAttempts = new Map();
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use((req, res, next) => {
  if (!req.path.startsWith('/auth/')) return next();
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const bucket = authAttempts.get(key) || [];
  const recent = bucket.filter((t) => now - t < 60_000);
  recent.push(now);
  authAttempts.set(key, recent);
  if (recent.length > 30) return res.status(429).json({ error: 'Too many auth requests' });
  next();
});

app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

app.use(authMiddleware);
app.use(tenantResolver);
app.use(tenantGuard);

fs.mkdirSync(config.uploadsDir, { recursive: true });
const upload = multer({ dest: config.uploadsDir, limits: { fileSize: 10 * 1024 * 1024 } });

function parseTags(text) { return (text.match(/#[A-Za-z0-9_]+/g) || []).map((x) => x.toLowerCase()); }
function parseMentions(text) { return (text.match(/@[A-Za-z0-9_.-]+/g) || []).map((x) => x.slice(1).toLowerCase()); }
async function logAudit({ tenantId = null, actorUserId = null, action, entityType, entityId, payload = {} }) {
  await query('INSERT INTO audit_logs(id,tenant_id,actor_user_id,action,entity_type,entity_id,payload) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7::jsonb)', [createId(), tenantId, actorUserId, action, entityType, String(entityId), JSON.stringify(payload)]);
}

app.get('/healthz', async (_req, res) => { await query('SELECT 1'); res.json({ ok: true }); });
app.get('/readyz', async (_req, res) => { await query('SELECT 1'); res.json({ ready: true }); });

// ---------- Auth ----------
app.post('/auth/register', async (req, res) => {
  const { email, password, displayName } = req.body;
  const id = createId();
  await query('INSERT INTO users(id,email,password_hash,display_name,global_role) VALUES($1::uuid,$2,$3,$4,$5)', [id, email, await hashPassword(password), displayName, 'customer']);
  res.status(201).json({ id, email });
});
app.post('/auth/login', async (req, res) => {
  const { rows } = await query('SELECT id,email,password_hash,global_role FROM users WHERE email=$1', [req.body.email]);
  const user = rows[0];
  if (!user || !(await verifyPassword(req.body.password, user.password_hash))) return res.status(401).json({ error: 'Invalid credentials' });
  const accessToken = signAccessToken({ id: user.id, email: user.email, globalRole: user.global_role });
  const refresh = createRefreshToken();
  await query('INSERT INTO refresh_tokens(id,user_id,token_hash,expires_at) VALUES($1::uuid,$2::uuid,$3,$4)', [createId(), user.id, refresh.tokenHash, refresh.expiresAt.toISOString()]);
  res.json({ accessToken, refreshToken: refresh.token });
});
app.post('/auth/refresh', async (req, res) => {
  const hashed = hashOpaqueToken(req.body.refreshToken || '');
  const { rows } = await query('SELECT id,user_id,expires_at,revoked_at FROM refresh_tokens WHERE token_hash=$1', [hashed]);
  const current = rows[0];
  if (!current || current.revoked_at || new Date(current.expires_at) < new Date()) return res.status(401).json({ error: 'Invalid refresh token' });
  await withTx(async (client) => {
    await client.query('UPDATE refresh_tokens SET revoked_at=now() WHERE id=$1::uuid', [current.id]);
    const next = createRefreshToken();
    await client.query('INSERT INTO refresh_tokens(id,user_id,token_hash,expires_at) VALUES($1::uuid,$2::uuid,$3,$4)', [createId(), current.user_id, next.tokenHash, next.expiresAt.toISOString()]);
    const { rows: u } = await client.query('SELECT id,email,global_role FROM users WHERE id=$1::uuid', [current.user_id]);
    res.json({ accessToken: signAccessToken({ id: u[0].id, email: u[0].email, globalRole: u[0].global_role }), refreshToken: next.token });
  });
});
app.post('/auth/logout', async (req, res) => { await query('UPDATE refresh_tokens SET revoked_at=now() WHERE token_hash=$1', [hashOpaqueToken(req.body.refreshToken || '')]); res.json({ ok: true }); });
app.post('/auth/password-reset/request', async (req, res) => {
  const { rows } = await query('SELECT id FROM users WHERE email=$1', [req.body.email]);
  if (!rows[0]) return res.json({ ok: true });
  const raw = createRefreshToken().token;
  await query('INSERT INTO password_reset_tokens(id,user_id,token_hash,expires_at) VALUES($1::uuid,$2::uuid,$3,$4)', [createId(), rows[0].id, hashOpaqueToken(raw), new Date(Date.now() + 3600_000).toISOString()]);
  res.json({ ok: true, resetToken: raw });
});
app.post('/auth/password-reset/confirm', async (req, res) => {
  const { rows } = await query('SELECT id,user_id,expires_at,used_at FROM password_reset_tokens WHERE token_hash=$1', [hashOpaqueToken(req.body.token || '')]);
  const t = rows[0]; if (!t || t.used_at || new Date(t.expires_at) < new Date()) return res.status(400).json({ error: 'Invalid token' });
  await withTx(async (client) => {
    await client.query('UPDATE users SET password_hash=$1 WHERE id=$2::uuid', [await hashPassword(req.body.newPassword), t.user_id]);
    await client.query('UPDATE password_reset_tokens SET used_at=now() WHERE id=$1::uuid', [t.id]);
  });
  res.json({ ok: true });
});


app.post('/auth/join-tenant', requireAuth, async (req, res) => {
  await query('INSERT INTO user_tenant_memberships(id,tenant_id,user_id,role) VALUES($1::uuid,$2::uuid,$3::uuid,$4) ON CONFLICT (tenant_id,user_id) DO UPDATE SET role=EXCLUDED.role', [createId(), req.body.tenantId, req.user.id, 'customer']);
  res.json({ ok: true });
});
// ---------- Customer ----------
app.get('/app/malls', async (_req, res) => {
  const { rows } = await query("SELECT id,slug,name,status FROM tenants ORDER BY name");
  res.json(rows);
});
app.get('/app/mall/:mallSlug/overview', async (req, res) => {
  if (!req.tenant) return res.status(404).json({ error: 'Mall not found' });
  const [stores, promos, events, posts, floors, pois, parking] = await Promise.all([
    query('SELECT id,slug,name,is_verified FROM stores WHERE tenant_id=$1::uuid ORDER BY name LIMIT 8', [req.tenant.id]),
    query('SELECT id,title,promo_code FROM promotions WHERE tenant_id=$1::uuid ORDER BY starts_at DESC LIMIT 8', [req.tenant.id]),
    query('SELECT id,title,starts_at FROM events WHERE tenant_id=$1::uuid ORDER BY starts_at LIMIT 8', [req.tenant.id]),
    query('SELECT id,body,kind FROM posts WHERE tenant_id=$1::uuid ORDER BY created_at DESC LIMIT 5', [req.tenant.id]),
    query('SELECT count(*)::int AS c FROM floors WHERE tenant_id=$1::uuid', [req.tenant.id]),
    query('SELECT count(*)::int AS c FROM pois WHERE tenant_id=$1::uuid', [req.tenant.id]),
    query('SELECT zone_code,level_label,capacity FROM parking_zones WHERE tenant_id=$1::uuid ORDER BY zone_code', [req.tenant.id])
  ]);
  res.json({ featuredStores: stores.rows, specials: promos.rows, events: events.rows, socialHighlights: posts.rows, mapPreview: { floors: floors.rows[0].c, pois: pois.rows[0].c }, parkingSummary: parking.rows });
});
app.get('/app/mall/:mallSlug/stores', async (req, res) => {
  const { q = '' } = req.query;
  const { rows } = await query('SELECT id,slug,name,description,floor_label,is_verified FROM stores WHERE tenant_id=$1::uuid AND name ILIKE $2 ORDER BY name', [req.tenant.id, `%${q}%`]);
  res.json(rows);
});
app.get('/app/mall/:mallSlug/store/:storeSlug', async (req, res) => {
  const { rows } = await query('SELECT id,slug,name,description,floor_label,is_verified FROM stores WHERE tenant_id=$1::uuid AND slug=$2', [req.tenant.id, req.params.storeSlug]);
  const store = rows[0]; if (!store) return res.status(404).json({ error: 'Not found' });
  const [hours, contacts, gallery, promos, reviews, posts] = await Promise.all([
    query('SELECT weekday,open_at,close_at FROM store_hours WHERE tenant_id=$1::uuid AND store_id=$2::uuid ORDER BY weekday', [req.tenant.id, store.id]),
    query('SELECT type,value FROM store_contact_links WHERE tenant_id=$1::uuid AND store_id=$2::uuid', [req.tenant.id, store.id]),
    query('SELECT media_url FROM store_gallery WHERE tenant_id=$1::uuid AND store_id=$2::uuid', [req.tenant.id, store.id]),
    query('SELECT id,title,promo_code,starts_at,ends_at FROM promotions WHERE tenant_id=$1::uuid AND store_id=$2::uuid', [req.tenant.id, store.id]),
    query('SELECT id,rating,body FROM store_reviews WHERE tenant_id=$1::uuid AND store_id=$2::uuid ORDER BY created_at DESC', [req.tenant.id, store.id]),
    query('SELECT id,body FROM posts WHERE tenant_id=$1::uuid ORDER BY created_at DESC LIMIT 20', [req.tenant.id])
  ]);
  res.json({ ...store, hours: hours.rows, contacts: contacts.rows, gallery: gallery.rows, promotions: promos.rows, reviews: reviews.rows, social: posts.rows });
});

app.get('/api/mall/:mallSlug/distance', async (req, res) => {
  const { fromStoreId, toStoreId } = req.query;
  const p1 = await query("SELECT p.id FROM pois p WHERE p.tenant_id=$1::uuid AND p.store_id=$2::uuid LIMIT 1", [req.tenant.id, fromStoreId]);
  const p2 = await query("SELECT p.id FROM pois p WHERE p.tenant_id=$1::uuid AND p.store_id=$2::uuid LIMIT 1", [req.tenant.id, toStoreId]);
  if (!p1.rows[0] || !p2.rows[0]) return res.status(400).json({ error: 'POI mapping not found' });
  const edges = await query('SELECT node_a_id,node_b_id,distance_meters,accessible FROM path_edges WHERE tenant_id=$1::uuid', [req.tenant.id]);
  const nodes = new Set();
  const graphEdges = edges.rows.map((e) => { nodes.add(e.node_a_id); nodes.add(e.node_b_id); return [e.node_a_id, e.node_b_id, Number(e.distance_meters), { stairsOnly: !e.accessible }]; });
  const route = planRoute({ nodes: [...nodes], edges: graphEdges }, p1.rows[0].id, p2.rows[0].id, req.query.accessible === 'true' ? 'accessible' : 'standard');
  res.json({ distance: route.distance, etaMinutes: route.etaMinutes });
});
app.get('/api/mall/:mallSlug/route', async (req, res) => {
  const edges = await query('SELECT node_a_id,node_b_id,distance_meters,accessible FROM path_edges WHERE tenant_id=$1::uuid', [req.tenant.id]);
  const nodes = new Set();
  const graphEdges = edges.rows.map((e) => { nodes.add(e.node_a_id); nodes.add(e.node_b_id); return [e.node_a_id, e.node_b_id, Number(e.distance_meters), { stairsOnly: !e.accessible }]; });
  const route = planRoute({ nodes: [...nodes], edges: graphEdges }, req.query.fromPoiId, req.query.toPoiId, req.query.accessible === 'true' ? 'accessible' : 'standard');
  res.json(route);
});

// ---------- Social ----------
app.get('/social/posts', async (req, res) => {
  const { rows } = await query('SELECT id,body,kind,created_at FROM posts WHERE tenant_id=$1::uuid ORDER BY created_at DESC LIMIT 100', [req.tenant.id]);
  res.json(rows);
});
app.post('/social/posts', requireAuth, async (req, res) => {
  const id = createId();
  const kind = req.body.kind || 'post';
  const expiresAt = kind === 'story' ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : null;
  await query('INSERT INTO posts(id,tenant_id,author_user_id,body,kind,expires_at) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6)', [id, req.tenant.id, req.user.id, req.body.body, kind, expiresAt]);
  for (const tag of parseTags(req.body.body || '')) {
    const { rows } = await query('SELECT id FROM hashtags WHERE tenant_id=$1::uuid AND tag=$2 LIMIT 1', [req.tenant.id, tag]);
    const hId = rows[0]?.id || createId();
    if (!rows[0]) await query('INSERT INTO hashtags(id,tenant_id,tag) VALUES($1::uuid,$2::uuid,$3)', [hId, req.tenant.id, tag]);
    await query('INSERT INTO post_hashtags(id,tenant_id,post_id,hashtag_id) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid)', [createId(), req.tenant.id, id, hId]);
  }
  for (const mention of parseMentions(req.body.body || '')) {
    const u = await query('SELECT id FROM users WHERE lower(email)=lower($1)', [mention]);
    if (u.rows[0]) await query('INSERT INTO mentions(id,tenant_id,post_id,mentioned_user_id) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid)', [createId(), req.tenant.id, id, u.rows[0].id]);
  }
  res.status(201).json({ id });
});
app.post('/social/posts/:postId/like', requireAuth, async (req, res) => {
  await query('INSERT INTO post_likes(id,tenant_id,post_id,user_id) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid) ON CONFLICT DO NOTHING', [createId(), req.tenant.id, req.params.postId, req.user.id]);
  res.json({ ok: true });
});
app.post('/social/posts/:postId/comment', requireAuth, async (req, res) => {
  await query('INSERT INTO post_comments(id,tenant_id,post_id,user_id,body) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5)', [createId(), req.tenant.id, req.params.postId, req.user.id, req.body.body]);
  res.status(201).json({ ok: true });
});
app.post('/social/posts/:postId/share', requireAuth, async (req, res) => {
  await query('INSERT INTO post_shares(id,tenant_id,post_id,user_id) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid)', [createId(), req.tenant.id, req.params.postId, req.user.id]);
  res.status(201).json({ ok: true });
});
app.post('/social/reports', requireAuth, async (req, res) => {
  const id = createId();
  await query('INSERT INTO reports(id,tenant_id,reporter_user_id,entity_type,entity_id,reason) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5::uuid,$6)', [id, req.tenant.id, req.user.id, req.body.entityType, req.body.entityId, req.body.reason]);
  res.status(201).json({ id });
});
app.get('/mall-admin/reports', requireAuth, requireRole('mall_admin', 'platform_admin'), async (req, res) => {
  const { rows } = await query('SELECT id,entity_type,entity_id,reason,status,created_at FROM reports WHERE tenant_id=$1::uuid ORDER BY created_at DESC', [req.tenant.id]);
  res.json(rows);
});
app.post('/mall-admin/moderation/:reportId/action', requireAuth, requireRole('mall_admin', 'platform_admin'), async (req, res) => {
  await withTx(async (client) => {
    await client.query('INSERT INTO moderation_actions(id,tenant_id,report_id,moderator_user_id,action,note) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6)', [createId(), req.tenant.id, req.params.reportId, req.user.id, req.body.action, req.body.note || '']);
    await client.query('UPDATE reports SET status=$1 WHERE id=$2::uuid', ['closed', req.params.reportId]);
  });
  res.status(201).json({ ok: true });
});



function requireStoreAccess(param = 'storeId') {
  return async (req, res, next) => {
    if (req.user.globalRole === 'mall_admin' || req.user.globalRole === 'platform_admin') return next();
    const storeId = req.params[param] || req.body.storeId;
    const { rows } = await query('SELECT 1 FROM store_users WHERE tenant_id=$1::uuid AND store_id=$2::uuid AND user_id=$3::uuid LIMIT 1', [req.tenant.id, storeId, req.user.id]);
    if (!rows[0]) return res.status(403).json({ error: 'Store scope denied' });
    next();
  };
}

// ---------- Store portal ----------
app.get('/store-portal/me', requireAuth, requireRole('store_owner', 'mall_admin'), async (req, res) => {
  const { rows } = await query('SELECT s.* FROM stores s JOIN store_users su ON su.store_id=s.id WHERE su.user_id=$1::uuid AND su.tenant_id=$2::uuid', [req.user.id, req.tenant.id]);
  res.json(rows);
});
app.put('/store-portal/stores/:storeId', requireAuth, requireRole('store_owner', 'mall_admin'), requireStoreAccess('storeId'), async (req, res) => {
  await query('UPDATE stores SET name=$1,description=$2,floor_label=$3 WHERE id=$4::uuid AND tenant_id=$5::uuid', [req.body.name, req.body.description, req.body.floorLabel, req.params.storeId, req.tenant.id]);
  res.json({ ok: true });
});
app.post('/store-portal/stores/:storeId/hours', requireAuth, requireRole('store_owner', 'mall_admin'), requireStoreAccess('storeId'), async (req, res) => {
  await query('INSERT INTO store_hours(id,tenant_id,store_id,weekday,open_at,close_at) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6)', [createId(), req.tenant.id, req.params.storeId, req.body.weekday, req.body.openAt, req.body.closeAt]);
  res.status(201).json({ ok: true });
});
app.post('/store-portal/stores/:storeId/contacts', requireAuth, requireRole('store_owner', 'mall_admin'), requireStoreAccess('storeId'), async (req, res) => {
  await query('INSERT INTO store_contact_links(id,tenant_id,store_id,type,value) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5)', [createId(), req.tenant.id, req.params.storeId, req.body.type, req.body.value]);
  res.status(201).json({ ok: true });
});
app.post('/store-portal/stores/:storeId/gallery', requireAuth, requireRole('store_owner', 'mall_admin'), requireStoreAccess('storeId'), upload.single('file'), async (req, res) => {
  await query('INSERT INTO store_gallery(id,tenant_id,store_id,media_url) VALUES($1::uuid,$2::uuid,$3::uuid,$4)', [createId(), req.tenant.id, req.params.storeId, `/uploads/${path.basename(req.file.path)}`]);
  res.status(201).json({ ok: true });
});
app.post('/store-portal/promotions', requireAuth, requireRole('store_owner', 'mall_admin'), requireStoreAccess(), async (req, res) => {
  const id = createId();
  await query('INSERT INTO promotions(id,tenant_id,store_id,title,promo_code,starts_at,ends_at) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7)', [id, req.tenant.id, req.body.storeId, req.body.title, req.body.promoCode, req.body.startsAt, req.body.endsAt]);
  res.status(201).json({ id });
});
app.put('/store-portal/promotions/:id', requireAuth, requireRole('store_owner', 'mall_admin'), async (req, res) => {
  await query('UPDATE promotions SET title=$1,promo_code=$2,starts_at=$3,ends_at=$4 WHERE id=$5::uuid AND tenant_id=$6::uuid', [req.body.title, req.body.promoCode, req.body.startsAt, req.body.endsAt, req.params.id, req.tenant.id]);
  res.json({ ok: true });
});
app.delete('/store-portal/promotions/:id', requireAuth, requireRole('store_owner', 'mall_admin'), async (req, res) => {
  await query('DELETE FROM promotions WHERE id=$1::uuid AND tenant_id=$2::uuid', [req.params.id, req.tenant.id]);
  res.json({ ok: true });
});
app.post('/store-portal/events', requireAuth, requireRole('store_owner', 'mall_admin'), requireStoreAccess(), async (req, res) => {
  const id = createId();
  await query('INSERT INTO events(id,tenant_id,store_id,title,starts_at) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5)', [id, req.tenant.id, req.body.storeId, req.body.title, req.body.startsAt]);
  res.status(201).json({ id });
});
app.get('/store-portal/reviews/:storeId', requireAuth, requireRole('store_owner', 'mall_admin'), async (req, res) => {
  const { rows } = await query('SELECT id,rating,body,created_at FROM store_reviews WHERE tenant_id=$1::uuid AND store_id=$2::uuid ORDER BY created_at DESC', [req.tenant.id, req.params.storeId]);
  res.json(rows);
});
app.post('/store-portal/reviews/:reviewId/respond', requireAuth, requireRole('store_owner', 'mall_admin'), async (req, res) => {
  await query('INSERT INTO review_responses(id,tenant_id,review_id,responder_user_id,body) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5)', [createId(), req.tenant.id, req.params.reviewId, req.user.id, req.body.body]);
  res.status(201).json({ ok: true });
});

// ---------- Mall admin ----------
app.post('/mall-admin/branding', requireAuth, requireRole('mall_admin'), async (req, res) => {
  const { rows } = await query('SELECT COALESCE(MAX(version_no),0)+1 AS v FROM tenant_branding_versions WHERE tenant_id=$1::uuid', [req.tenant.id]);
  const contrastOk = req.body.primary && req.body.secondary;
  if (!contrastOk) return res.status(400).json({ error: 'contrast validation failed' });
  await query('INSERT INTO tenant_branding_versions(id,tenant_id,version_no,payload,published) VALUES($1::uuid,$2::uuid,$3,$4::jsonb,$5)', [createId(), req.tenant.id, rows[0].v, JSON.stringify(req.body), !!req.body.publish]);
  res.status(201).json({ ok: true, version: rows[0].v });
});
app.get('/mall-admin/branding', requireAuth, requireRole('mall_admin'), async (req, res) => {
  const { rows } = await query('SELECT id,version_no,payload,published,created_at FROM tenant_branding_versions WHERE tenant_id=$1::uuid ORDER BY version_no DESC', [req.tenant.id]);
  res.json(rows);
});
app.post('/mall-admin/layout', requireAuth, requireRole('mall_admin'), async (req, res) => {
  const { rows } = await query('SELECT COALESCE(MAX(version_no),0)+1 AS v FROM tenant_layout_versions WHERE tenant_id=$1::uuid', [req.tenant.id]);
  await query('INSERT INTO tenant_layout_versions(id,tenant_id,version_no,payload,published) VALUES($1::uuid,$2::uuid,$3,$4::jsonb,$5)', [createId(), req.tenant.id, rows[0].v, JSON.stringify(req.body), !!req.body.publish]);
  res.status(201).json({ ok: true, version: rows[0].v });
});
app.get('/mall-admin/layout', requireAuth, requireRole('mall_admin'), async (req, res) => {
  const { rows } = await query('SELECT id,version_no,payload,published,created_at FROM tenant_layout_versions WHERE tenant_id=$1::uuid ORDER BY version_no DESC', [req.tenant.id]);
  res.json(rows);
});
app.get('/mall-admin/verification-requests', requireAuth, requireRole('mall_admin'), async (req, res) => {
  const { rows } = await query('SELECT * FROM store_verification_requests WHERE tenant_id=$1::uuid ORDER BY decided_at NULLS FIRST', [req.tenant.id]);
  res.json(rows);
});
app.post('/store-portal/verification-request', requireAuth, requireRole('store_owner', 'mall_admin'), async (req, res) => {
  await query('INSERT INTO store_verification_requests(id,tenant_id,store_id,requested_by,status) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5)', [createId(), req.tenant.id, req.body.storeId, req.user.id, 'pending']);
  res.status(201).json({ ok: true });
});
app.post('/mall-admin/verification-requests/:id/decision', requireAuth, requireRole('mall_admin'), async (req, res) => {
  await withTx(async (client) => {
    await client.query('UPDATE store_verification_requests SET status=$1,decided_by=$2::uuid,decision_note=$3,decided_at=now() WHERE id=$4::uuid AND tenant_id=$5::uuid', [req.body.status, req.user.id, req.body.note || '', req.params.id, req.tenant.id]);
    if (req.body.status === 'approved') {
      const { rows } = await client.query('SELECT store_id FROM store_verification_requests WHERE id=$1::uuid', [req.params.id]);
      await client.query('UPDATE stores SET is_verified=true WHERE id=$1::uuid', [rows[0].store_id]);
    }
  });
  res.json({ ok: true });
});
app.post('/mall-admin/floors', requireAuth, requireRole('mall_admin'), async (req, res) => { await query('INSERT INTO floors(id,tenant_id,label,level_no) VALUES($1::uuid,$2::uuid,$3,$4)', [createId(), req.tenant.id, req.body.label, req.body.levelNo]); res.status(201).json({ ok: true }); });
app.get('/mall-admin/floors', requireAuth, requireRole('mall_admin'), async (req, res) => { const { rows } = await query('SELECT * FROM floors WHERE tenant_id=$1::uuid ORDER BY level_no', [req.tenant.id]); res.json(rows); });
app.post('/mall-admin/pois', requireAuth, requireRole('mall_admin'), async (req, res) => { await query('INSERT INTO pois(id,tenant_id,floor_id,store_id,kind,label) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6)', [createId(), req.tenant.id, req.body.floorId, req.body.storeId || null, req.body.kind, req.body.label]); res.status(201).json({ ok: true }); });
app.post('/mall-admin/path-nodes', requireAuth, requireRole('mall_admin'), async (req, res) => { await query('INSERT INTO path_nodes(id,tenant_id,floor_id,x,y) VALUES($1::uuid,$2::uuid,$3::uuid,$4,$5)', [createId(), req.tenant.id, req.body.floorId, req.body.x, req.body.y]); res.status(201).json({ ok: true }); });
app.post('/mall-admin/path-edges', requireAuth, requireRole('mall_admin'), async (req, res) => { await query('INSERT INTO path_edges(id,tenant_id,node_a_id,node_b_id,distance_meters,accessible) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6)', [createId(), req.tenant.id, req.body.nodeAId, req.body.nodeBId, req.body.distanceMeters, req.body.accessible !== false]); res.status(201).json({ ok: true }); });
app.get('/mall-admin/path-edges', requireAuth, requireRole('mall_admin'), async (req, res) => { const { rows } = await query('SELECT * FROM path_edges WHERE tenant_id=$1::uuid', [req.tenant.id]); res.json(rows); });
app.post('/mall-admin/parking-zones', requireAuth, requireRole('mall_admin'), async (req, res) => { await query('INSERT INTO parking_zones(id,tenant_id,zone_code,level_label,capacity) VALUES($1::uuid,$2::uuid,$3,$4,$5)', [createId(), req.tenant.id, req.body.zoneCode, req.body.levelLabel, req.body.capacity]); res.status(201).json({ ok: true }); });
app.get('/mall-admin/parking-zones', requireAuth, requireRole('mall_admin'), async (req, res) => { const { rows } = await query('SELECT * FROM parking_zones WHERE tenant_id=$1::uuid ORDER BY zone_code', [req.tenant.id]); res.json(rows); });
app.post('/mall-admin/parking-zones/:id/snapshots', requireAuth, requireRole('mall_admin'), async (req, res) => { await query('INSERT INTO parking_occupancy_snapshots(id,tenant_id,parking_zone_id,occupied) VALUES($1::uuid,$2::uuid,$3::uuid,$4)', [createId(), req.tenant.id, req.params.id, req.body.occupied]); res.status(201).json({ ok: true }); });

// ---------- Platform admin ----------
app.get('/platform/tenants', requireAuth, requireRole('platform_admin'), async (_req, res) => { const { rows } = await query('SELECT * FROM tenants ORDER BY created_at DESC'); res.json(rows); });
app.post('/platform/tenants', requireAuth, requireRole('platform_admin'), async (req, res) => { const id = createId(); await query('INSERT INTO tenants(id,slug,name,plan,status) VALUES($1::uuid,$2,$3,$4,$5)', [id, req.body.slug, req.body.name, req.body.plan || 'standard', 'active']); res.status(201).json({ id }); });
app.post('/platform/tenants/:id/status', requireAuth, requireRole('platform_admin'), async (req, res) => { await query('UPDATE tenants SET status=$1 WHERE id=$2::uuid', [req.body.status, req.params.id]); await logAudit({ action: 'tenant_status_change', entityType: 'tenant', entityId: req.params.id, actorUserId: req.user.id, payload: { status: req.body.status } }); res.json({ ok: true }); });
app.get('/platform/users', requireAuth, requireRole('platform_admin'), async (_req, res) => { const { rows } = await query('SELECT id,email,display_name,global_role FROM users ORDER BY created_at DESC LIMIT 500'); res.json(rows); });
app.get('/platform/stores', requireAuth, requireRole('platform_admin'), async (_req, res) => { const { rows } = await query('SELECT id,tenant_id,name,is_verified FROM stores ORDER BY created_at DESC LIMIT 500'); res.json(rows); });
app.post('/platform/impersonate/start', requireAuth, requireRole('platform_admin'), async (req, res) => { await logAudit({ action: 'impersonation_start', entityType: 'tenant', entityId: req.body.tenantId, actorUserId: req.user.id, payload: { readOnly: req.body.readOnly !== false } }); res.json({ token: signAccessToken({ id: req.user.id, email: req.user.email, globalRole: req.user.globalRole, impersonatingTenantId: req.body.tenantId, readOnly: req.body.readOnly !== false }) }); });

// ---------- Analytics ----------
app.post('/api/analytics/event', requireAuth, async (req, res) => {
  const tenantId = req.tenant?.id || req.body.tenantId;
  await query('INSERT INTO analytics_events(id,tenant_id,user_id,store_id,event_name,properties) VALUES($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6::jsonb)', [createId(), tenantId, req.user.id, req.body.storeId || null, req.body.eventName, JSON.stringify(req.body.properties || {})]);
  res.status(201).json({ ok: true });
});
app.get('/admin/analytics/tenant', requireAuth, async (req, res) => {
  const tenantId = req.user.globalRole === 'platform_admin' ? req.query.tenantId : req.tenant.id;
  const { rows } = await query('SELECT metric_name,metric_value,metric_date,store_id FROM analytics_daily_rollups WHERE tenant_id=$1::uuid ORDER BY metric_date DESC LIMIT 300', [tenantId]);
  res.json(rows);
});

app.post('/uploads', requireAuth, upload.single('file'), (req, res) => res.status(201).json({ path: `/uploads/${path.basename(req.file.path)}` }));

app.use((err, req, res, _next) => {
  console.error(JSON.stringify({ level: 'error', requestId: req.requestId, message: err.message }));
  res.status(500).json({ error: 'Internal error', requestId: req.requestId });
});

if (process.env.NODE_ENV !== 'test') app.listen(config.port, () => console.log(JSON.stringify({ level: 'info', msg: 'api_start', port: config.port })));

export default app;
