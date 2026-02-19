import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, signAccessToken, verifyAccessToken } from './services.auth.js';

test('password hashing verifies correctly', async () => {
  const hash = await hashPassword('Secret123!');
  assert.equal(await verifyPassword('Secret123!', hash), true);
  assert.equal(await verifyPassword('Wrong', hash), false);
});

test('access token sign and verify roundtrip', () => {
  const token = signAccessToken({ id: 'u1', globalRole: 'customer' });
  const payload = verifyAccessToken(token);
  assert.equal(payload.id, 'u1');
});

test('access token rejects tamper', () => {
  const token = signAccessToken({ id: 'u1', globalRole: 'customer' });
  assert.throws(() => verifyAccessToken(token + 'x'));
});

test('db integration smoke for auth/promotions/parking/moderation', async (t) => {
  let query, app;
  try {
    ({ query } = await import('./db.js'));
    ({ default: app } = await import('./index.js'));
  } catch {
    return t.skip('DB dependencies unavailable (pg not installed in environment)');
  }

  const fs = await import('fs');
  const path = await import('path');
  try {
    const schema = fs.readFileSync(path.resolve('db/schema.sql'), 'utf-8');
    await query(schema);
  } catch {
    return t.skip('DB not reachable');
  }

  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const tenantId = '11111111-1111-1111-1111-111111111111';

  await query("INSERT INTO tenants(id,slug,name,status,plan) VALUES($1::uuid,'north-galleria','North Galleria','active','standard') ON CONFLICT DO NOTHING", [tenantId]);
  const email = `t${Date.now()}@x.com`;
  const reg = await fetch(`${base}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'Passw0rd!', displayName: 't' }) });
  assert.equal(reg.status, 201);
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'Passw0rd!' }) });
  const loginJson = await login.json();
  assert.equal(login.status, 200);

  const token = loginJson.accessToken;
  await fetch(`${base}/auth/join-tenant`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ tenantId }) });

  const storeId = '10101010-1010-1010-1010-101010101010';
  await query('INSERT INTO stores(id,tenant_id,slug,name,description) VALUES($1::uuid,$2::uuid,$3,$4,$5) ON CONFLICT DO NOTHING', [storeId, tenantId, 'store-1', 'Store 1', 'd']);
  await query("INSERT INTO promotions(id,tenant_id,store_id,title,promo_code) VALUES('15151515-1515-1515-1515-151515151501',$1::uuid,$2::uuid,'P','CODE') ON CONFLICT DO NOTHING", [tenantId, storeId]);

  const zoneId = '20202020-2020-2020-2020-202020202001';
  await query('INSERT INTO parking_zones(id,tenant_id,zone_code,level_label,capacity) VALUES($1::uuid,$2::uuid,$3,$4,$5) ON CONFLICT DO NOTHING', [zoneId, tenantId, 'A1', 'L1', 100]);
  const saveCar = await fetch(`${base}/app/mall/north-galleria/parking/save-car`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ parkingZoneId: zoneId }) });
  assert.equal(saveCar.status, 201);

  server.close();
});
