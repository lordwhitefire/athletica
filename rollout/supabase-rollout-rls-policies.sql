-- RLS Policies for Rollout schema
-- Run this in the Supabase SQL Editor.
-- Enables Row Level Security and adds policies so only admin accounts can
-- access admin data. The service_role key bypasses RLS and is used only by
-- the owner's issue script.

-- ============================================================
-- 1. Enable RLS on all tables
-- ============================================================

ALTER TABLE rollout.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollout.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollout.admin_access_keys ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Products: anon can read published products
-- ============================================================

DROP POLICY IF EXISTS "anon_can_read_published_products" ON rollout.products;
CREATE POLICY "anon_can_read_published_products"
  ON rollout.products
  FOR SELECT
  TO anon
  USING (status = 'published');

-- ============================================================
-- 3. Products: service_role can do everything
-- ============================================================

DROP POLICY IF EXISTS "admin_full_access_products" ON rollout.products;
CREATE POLICY "admin_full_access_products"
  ON rollout.products
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- 4. Products: authenticated admins can manage products
--    RLS checks app_metadata.role = 'admin' from the user's JWT.
-- ============================================================

DROP POLICY IF EXISTS "admin_can_manage_products" ON rollout.products;
CREATE POLICY "admin_can_manage_products"
  ON rollout.products
  FOR ALL
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================================
-- 5. Analytics: anon can insert view/click events
-- ============================================================

DROP POLICY IF EXISTS "anon_can_insert_analytics" ON rollout.analytics;
CREATE POLICY "anon_can_insert_analytics"
  ON rollout.analytics
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================================
-- 6. Analytics: service_role can read
-- ============================================================

DROP POLICY IF EXISTS "admin_can_read_analytics" ON rollout.analytics;
CREATE POLICY "admin_can_read_analytics"
  ON rollout.analytics
  FOR SELECT
  TO service_role
  USING (true);

-- ============================================================
-- 7. Analytics: authenticated admins can read
-- ============================================================

DROP POLICY IF EXISTS "admin_can_read_analytics_auth" ON rollout.analytics;
CREATE POLICY "admin_can_read_analytics_auth"
  ON rollout.analytics
  FOR SELECT
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================================
-- 8. Admin access keys: service_role only
--    No policy for anon or authenticated — they read nothing.
--    RLS is enabled above, so without a matching policy, access is denied.
-- ============================================================

DROP POLICY IF EXISTS "service_role_full_access_admin_access_keys" ON rollout.admin_access_keys;
CREATE POLICY "service_role_full_access_admin_access_keys"
  ON rollout.admin_access_keys
  FOR ALL
  TO service_role
  USING (true);
