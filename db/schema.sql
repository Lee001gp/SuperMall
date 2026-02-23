-- SuperMall production schema with strict tenant scoping.
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  plan TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  global_role TEXT NOT NULL DEFAULT 'customer',
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_tenant_memberships (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_membership_tenant ON user_tenant_memberships(tenant_id);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  floor_label TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stores_tenant ON stores(tenant_id);

CREATE TABLE IF NOT EXISTS store_users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_users_tenant ON store_users(tenant_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  actor_user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_branding_versions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  version_no INT NOT NULL,
  payload JSONB NOT NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_tenant ON tenant_branding_versions(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_layout_versions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  version_no INT NOT NULL,
  payload JSONB NOT NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_layout_tenant ON tenant_layout_versions(tenant_id);

CREATE TABLE IF NOT EXISTS categories (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS store_categories (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), store_id UUID NOT NULL REFERENCES stores(id), category_id UUID NOT NULL REFERENCES categories(id));
CREATE TABLE IF NOT EXISTS store_hours (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), store_id UUID NOT NULL REFERENCES stores(id), weekday SMALLINT NOT NULL, open_at TEXT NOT NULL, close_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS store_contact_links (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), store_id UUID NOT NULL REFERENCES stores(id), type TEXT NOT NULL, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS store_gallery (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), store_id UUID NOT NULL REFERENCES stores(id), media_url TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS promotions (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), store_id UUID NOT NULL REFERENCES stores(id), title TEXT NOT NULL, promo_code TEXT NOT NULL, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ);
CREATE INDEX IF NOT EXISTS idx_promotions_tenant ON promotions(tenant_id);
CREATE TABLE IF NOT EXISTS promotion_redemptions (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), promotion_id UUID NOT NULL REFERENCES promotions(id), user_id UUID NOT NULL REFERENCES users(id), redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS events (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), store_id UUID REFERENCES stores(id), title TEXT NOT NULL, starts_at TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS event_rsvps (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), event_id UUID NOT NULL REFERENCES events(id), user_id UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS store_reviews (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), store_id UUID NOT NULL REFERENCES stores(id), user_id UUID NOT NULL REFERENCES users(id), rating INT NOT NULL, body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS review_responses (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), review_id UUID NOT NULL REFERENCES store_reviews(id), responder_user_id UUID NOT NULL REFERENCES users(id), body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS conversation_threads (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS messages (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), thread_id UUID NOT NULL REFERENCES conversation_threads(id), sender_user_id UUID NOT NULL REFERENCES users(id), body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS posts (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), author_user_id UUID NOT NULL REFERENCES users(id), body TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'post', expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS post_media (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), post_id UUID NOT NULL REFERENCES posts(id), media_url TEXT NOT NULL, media_type TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS post_likes (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), post_id UUID NOT NULL REFERENCES posts(id), user_id UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS post_comments (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), post_id UUID NOT NULL REFERENCES posts(id), user_id UUID NOT NULL REFERENCES users(id), body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS post_shares (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), post_id UUID NOT NULL REFERENCES posts(id), user_id UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS hashtags (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), tag TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS post_hashtags (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), post_id UUID NOT NULL REFERENCES posts(id), hashtag_id UUID NOT NULL REFERENCES hashtags(id));
CREATE TABLE IF NOT EXISTS mentions (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), post_id UUID NOT NULL REFERENCES posts(id), mentioned_user_id UUID NOT NULL REFERENCES users(id));
CREATE TABLE IF NOT EXISTS reports (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), reporter_user_id UUID NOT NULL REFERENCES users(id), entity_type TEXT NOT NULL, entity_id UUID NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS moderation_actions (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), report_id UUID NOT NULL REFERENCES reports(id), moderator_user_id UUID NOT NULL REFERENCES users(id), action TEXT NOT NULL, note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS store_verification_requests (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), store_id UUID NOT NULL REFERENCES stores(id), requested_by UUID NOT NULL REFERENCES users(id), status TEXT NOT NULL DEFAULT 'pending', decided_by UUID REFERENCES users(id), decision_note TEXT, decided_at TIMESTAMPTZ);

CREATE TABLE IF NOT EXISTS parking_zones (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), zone_code TEXT NOT NULL, level_label TEXT NOT NULL, capacity INT NOT NULL);
CREATE TABLE IF NOT EXISTS parking_occupancy_snapshots (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), parking_zone_id UUID NOT NULL REFERENCES parking_zones(id), occupied INT NOT NULL, captured_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS car_locations (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), user_id UUID NOT NULL REFERENCES users(id), parking_zone_id UUID NOT NULL REFERENCES parking_zones(id), notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS floors (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), label TEXT NOT NULL, level_no INT NOT NULL);
CREATE TABLE IF NOT EXISTS pois (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), floor_id UUID NOT NULL REFERENCES floors(id), store_id UUID REFERENCES stores(id), kind TEXT NOT NULL, label TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS path_nodes (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), floor_id UUID NOT NULL REFERENCES floors(id), x NUMERIC NOT NULL, y NUMERIC NOT NULL);
CREATE TABLE IF NOT EXISTS path_edges (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), node_a_id UUID NOT NULL REFERENCES path_nodes(id), node_b_id UUID NOT NULL REFERENCES path_nodes(id), distance_meters NUMERIC NOT NULL, accessible BOOLEAN NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS saved_routes (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), user_id UUID NOT NULL REFERENCES users(id), from_poi_id UUID NOT NULL REFERENCES pois(id), to_poi_id UUID NOT NULL REFERENCES pois(id), route_json JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS crm_segments (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', rule_json JSONB NOT NULL DEFAULT '{}', created_by UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_crm_segments_tenant ON crm_segments(tenant_id, created_at DESC);
CREATE TABLE IF NOT EXISTS crm_campaigns (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), name TEXT NOT NULL, segment_id UUID REFERENCES crm_segments(id), channel TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', content JSONB NOT NULL DEFAULT '{}', scheduled_at TIMESTAMPTZ, created_by UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_tenant ON crm_campaigns(tenant_id, created_at DESC);
CREATE TABLE IF NOT EXISTS analytics_events (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), user_id UUID REFERENCES users(id), store_id UUID REFERENCES stores(id), event_name TEXT NOT NULL, properties JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant ON analytics_events(tenant_id, created_at);
CREATE TABLE IF NOT EXISTS analytics_daily_rollups (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), store_id UUID REFERENCES stores(id), metric_date DATE NOT NULL, metric_name TEXT NOT NULL, metric_value NUMERIC NOT NULL, UNIQUE(tenant_id, store_id, metric_date, metric_name));
CREATE TABLE IF NOT EXISTS analytics_hourly_rollups (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), store_id UUID REFERENCES stores(id), metric_hour TIMESTAMPTZ NOT NULL, metric_name TEXT NOT NULL, metric_value NUMERIC NOT NULL, UNIQUE(tenant_id, store_id, metric_hour, metric_name));
CREATE TABLE IF NOT EXISTS analytics_kpis (id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), store_id UUID REFERENCES stores(id), kpi_key TEXT NOT NULL, kpi_value NUMERIC NOT NULL, calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(tenant_id, store_id, kpi_key));
