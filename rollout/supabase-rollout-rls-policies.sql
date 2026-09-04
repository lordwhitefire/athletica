-- RLS Policies for Rollout schema
-- Run this in the Supabase SQL Editor

-- 1. Products: anon can read published products
CREATE POLICY "anon_can_read_published_products"
  ON rollout.products
  FOR SELECT
  TO anon
  USING (status = 'published');

-- 2. Products: service_role can do everything
CREATE POLICY "admin_full_access_products"
  ON rollout.products
  FOR ALL
  TO service_role
  USING (true);

-- 3. Analytics: anon can insert view/click events
CREATE POLICY "anon_can_insert_analytics"
  ON rollout.analytics
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 4. Analytics: service_role can read analytics
CREATE POLICY "admin_can_read_analytics"
  ON rollout.analytics
  FOR SELECT
  TO service_role
  USING (true);
