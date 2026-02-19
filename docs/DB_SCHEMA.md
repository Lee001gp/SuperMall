# DB Schema
Canonical SQL: `db/schema.sql`.

## Core + Access
`tenants`, `users`, `user_tenant_memberships`, `stores`, `store_users`, `refresh_tokens`, `password_reset_tokens`, `audit_logs`

## Store Domain
`categories`, `store_categories`, `store_hours`, `store_contact_links`, `store_gallery`, `store_reviews`, `review_responses`

## Commerce / Events
`promotions`, `promotion_redemptions`, `events`, `event_rsvps`

## Social + Moderation
`posts`, `post_media`, `post_likes`, `post_comments`, `post_shares`, `hashtags`, `post_hashtags`, `mentions`, `conversation_threads`, `messages`, `reports`, `moderation_actions`, `store_verification_requests`

## Mall Infrastructure
`tenant_branding_versions`, `tenant_layout_versions`, `parking_zones`, `parking_occupancy_snapshots`, `car_locations`, `floors`, `pois`, `path_nodes`, `path_edges`, `saved_routes`

## Analytics
`analytics_events`, `analytics_daily_rollups`, `analytics_hourly_rollups`, `analytics_kpis`
