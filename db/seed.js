/** Seed script for deterministic users and tenant data across postgres/sqlite. */
import { query } from '../server/src/db.js';

const HASH = 'fixedsalt:0aadd769e015d23536b1db31a7eeafaa2b3d30b2898e98164a4fce565157be1cc8dd689257a4cbdfa0e5de12d46f119425f79b3c88d0f2d4aed2261e02fbdb60';
const tenants = [
  { id: '11111111-1111-1111-1111-111111111111', slug: 'north-galleria', name: 'North Galleria' },
  { id: '22222222-2222-2222-2222-222222222222', slug: 'city-central', name: 'City Central' },
  { id: '33333333-3333-3333-3333-333333333333', slug: 'harbor-plaza', name: 'Harbor Plaza' }
];

for (const t of tenants) {
  await query('INSERT INTO tenants(id,slug,name,status,plan) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,name=excluded.name', [t.id, t.slug, t.name, 'active', 'standard']);
}

await query(`INSERT INTO users(id,email,password_hash,display_name,global_role,is_email_verified)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','platform@supermall.local',$1,'Platform Admin','platform_admin',1)
ON CONFLICT(id) DO UPDATE SET password_hash=excluded.password_hash`, [HASH]);

for (let i = 0; i < tenants.length; i++) {
  const t = tenants[i];
  const mallAdminId = `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb0${i + 1}`;
  const storeOwnerId = `eeeeeeee-eeee-eeee-eeee-eeeeeeeeee0${i + 1}`;
  const customerId = `ffffffff-ffff-ffff-ffff-ffffffffff0${i + 1}`;

  await query('INSERT INTO users(id,email,password_hash,display_name,global_role,is_email_verified) VALUES($1,$2,$3,$4,$5,1) ON CONFLICT(id) DO UPDATE SET password_hash=excluded.password_hash', [mallAdminId, `mall${i + 1}@supermall.local`, HASH, `Mall Admin ${i + 1}`, 'mall_admin']);
  await query('INSERT INTO users(id,email,password_hash,display_name,global_role,is_email_verified) VALUES($1,$2,$3,$4,$5,1) ON CONFLICT(id) DO UPDATE SET password_hash=excluded.password_hash', [storeOwnerId, `store${i + 1}@supermall.local`, HASH, `Store Owner ${i + 1}`, 'store_owner']);
  await query('INSERT INTO users(id,email,password_hash,display_name,global_role,is_email_verified) VALUES($1,$2,$3,$4,$5,1) ON CONFLICT(id) DO UPDATE SET password_hash=excluded.password_hash', [customerId, `customer${i + 1}@supermall.local`, HASH, `Customer ${i + 1}`, 'customer']);

  await query('INSERT INTO user_tenant_memberships(id,tenant_id,user_id,role) VALUES($1,$2,$3,$4) ON CONFLICT(tenant_id,user_id) DO UPDATE SET role=excluded.role', [`cccccccc-cccc-cccc-cccc-cccccccccc0${i + 1}`, t.id, mallAdminId, 'mall_admin']);
  await query('INSERT INTO user_tenant_memberships(id,tenant_id,user_id,role) VALUES($1,$2,$3,$4) ON CONFLICT(tenant_id,user_id) DO UPDATE SET role=excluded.role', [`dddddddd-dddd-dddd-dddd-dddddddddd0${i + 1}`, t.id, storeOwnerId, 'store_owner']);
  await query('INSERT INTO user_tenant_memberships(id,tenant_id,user_id,role) VALUES($1,$2,$3,$4) ON CONFLICT(tenant_id,user_id) DO UPDATE SET role=excluded.role', [`99999999-9999-9999-9999-99999999990${i + 1}`, t.id, customerId, 'customer']);

  const floorId = `12121212-1212-1212-1212-12121212120${i + 1}`;
  const entrancePoi = `13131313-1313-1313-1313-13131313130${i + 1}`;
  await query('INSERT INTO floors(id,tenant_id,label,level_no) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING', [floorId, t.id, 'Ground', 1]);
  await query('INSERT INTO pois(id,tenant_id,floor_id,kind,label) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING', [entrancePoi, t.id, floorId, 'entrance', 'Main Entrance']);

  for (let s = 1; s <= 10; s++) {
    const sid = `${i + 1}${s}`.repeat(18).slice(0, 32);
    const storeId = `${sid.slice(0, 8)}-${sid.slice(8, 12)}-${sid.slice(12, 16)}-${sid.slice(16, 20)}-${sid.slice(20, 32)}`;
    await query('INSERT INTO stores(id,tenant_id,slug,name,description,floor_label) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING', [storeId, t.id, `store-${i * 10 + s}`, `Store ${i * 10 + s}`, 'Seed store', `L${(s % 3) + 1}`]);
    if (s === 1) {
      await query('INSERT INTO store_users(id,tenant_id,store_id,user_id) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING', [`14141414-1414-1414-1414-14141414140${i + 1}`, t.id, storeId, storeOwnerId]);
      await query('INSERT INTO promotions(id,tenant_id,store_id,title,promo_code,starts_at,ends_at) VALUES($1,$2,$3,$4,$5,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(id) DO NOTHING', [`15151515-1515-1515-1515-15151515150${i + 1}`, t.id, storeId, 'Seed Promotion', `PROMO${i + 1}`]);
      await query('INSERT INTO events(id,tenant_id,store_id,title,starts_at) VALUES($1,$2,$3,$4,CURRENT_TIMESTAMP) ON CONFLICT(id) DO NOTHING', [`16161616-1616-1616-1616-16161616160${i + 1}`, t.id, storeId, 'Seed Event']);
      await query('INSERT INTO store_reviews(id,tenant_id,store_id,user_id,rating,body) VALUES($1,$2,$3,$4,5,$5) ON CONFLICT(id) DO NOTHING', [`17171717-1717-1717-1717-17171717170${i + 1}`, t.id, storeId, customerId, 'Great store']);
      const storePoi = `18181818-1818-1818-1818-18181818180${i + 1}`;
      await query('INSERT INTO pois(id,tenant_id,floor_id,store_id,kind,label) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING', [storePoi, t.id, floorId, storeId, 'store_door', 'Store Door']);
      await query('INSERT INTO path_nodes(id,tenant_id,floor_id,x,y) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING', [entrancePoi, t.id, floorId, 0, 0]);
      await query('INSERT INTO path_nodes(id,tenant_id,floor_id,x,y) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING', [storePoi, t.id, floorId, 10, 20]);
      await query('INSERT INTO path_edges(id,tenant_id,node_a_id,node_b_id,distance_meters,accessible) VALUES($1,$2,$3,$4,$5,1) ON CONFLICT(id) DO NOTHING', [`19191919-1919-1919-1919-19191919190${i + 1}`, t.id, entrancePoi, storePoi, 120]);
      await query('INSERT INTO parking_zones(id,tenant_id,zone_code,level_label,capacity) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING', [`20202020-2020-2020-2020-20202020200${i + 1}`, t.id, 'A1', 'L1', 100]);
    }
  }
}

console.log('Seed complete');
