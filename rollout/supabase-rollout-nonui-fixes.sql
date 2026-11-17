-- =====================================================================
-- Non-UI fixes migration — dead-link tracking columns.
-- Run AFTER supabase-rollout-fm02-full-marketplace.sql + supabase-rollout-fm02-rpcs.sql.
-- Additive + idempotent.
--
-- Adds the columns the corrected dead-link-detector.ts needs:
--   last_probed_at    — when the HEAD probe last checked this product (fair-batch ordering)
--   redirect_4xx_count — rolling 4xx counter (reactive dead-link signal)
--   last_4xx_at       — when the last 4xx was observed (24h window reset)
-- =====================================================================

ALTER TABLE rollout.products
  ADD COLUMN IF NOT EXISTS last_probed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS redirect_4xx_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_4xx_at TIMESTAMPTZ;

-- Index for the fair-batch HEAD probe (order by last_probed_at NULLS FIRST).
CREATE INDEX IF NOT EXISTS idx_products_last_probed
  ON rollout.products(last_probed_at)
  WHERE deleted_at IS NULL AND status = 'active' AND asin IS NOT NULL;
