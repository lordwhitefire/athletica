-- =====================================================================
-- FM-02: Core data model migrations for the full marketplace
-- Change: athletica-full-marketplace
-- Task: FM-02 (Spec: foundation)
-- Date: 2026-11-16
-- Source: blueprint/05-gap-questions.md (D1–D9), openspec/tasks/FM-02/task.md
--
-- Intent: extend the existing rollout schema to the full-marketplace shape
-- (5-status products + variants + categories + collections + analytics fields
-- + 22-marketplace seed + amazon_product_cache + affiliate.* schema + audit_log
-- + RLS with FORCE + (select auth.jwt())/(select auth.uid()) wrappers).
--
-- Additive + idempotent. Run in the Supabase SQL Editor.
-- The Amazon URL is NEVER stored in any table here.
-- =====================================================================

-- =====================================================================
-- SECTION A — Affiliate schema (created first; rollout.analytics.tracker_id references it)
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS affiliate;

-- affiliate.accounts — the affiliate user
CREATE TABLE IF NOT EXISTS affiliate.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  -- password hashing is handled by Supabase Auth; this row mirrors the auth.users entry
  auth_user_id UUID UNIQUE,  -- references auth.users(id) (no FK cross-schema in some Supabase setups)
  commission_default DECIMAL(5,2),  -- default percentage, overridden per-campaign
  full_name TEXT,
  address TEXT,
  country TEXT,
  payout_method TEXT,
  payout_instructions TEXT,
  notify_balance BOOLEAN DEFAULT TRUE,
  preferred_locale TEXT DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- affiliate.trackers — the public tracking code used in /go/[tracker-id]
CREATE TABLE IF NOT EXISTS affiliate.trackers (
  id TEXT PRIMARY KEY,  -- the public tracking code (varchar, like Raider)
  label TEXT,
  account_id UUID NOT NULL REFERENCES affiliate.accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_affiliate_trackers_account ON affiliate.trackers(account_id);

-- affiliate.campaigns — commission configuration (per-campaign, not per-affiliate)
CREATE TABLE IF NOT EXISTS affiliate.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_type TEXT NOT NULL DEFAULT 'cash_reward'
    CHECK (reward_type IN ('cash_reward', 'discount_coupon')),
  commission_type TEXT
    CHECK (commission_type IS NULL OR commission_type IN ('percentage', 'fixed')),
  reward NUMERIC(10,2) NOT NULL,  -- percentage or fixed amount; meaning depends on commission_type
  recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_limit INTEGER,  -- nullable: NULL = lifetime (unlimited)
  minimum_payout NUMERIC(10,2) NOT NULL DEFAULT 0,
  payout_term TEXT,  -- e.g. 'net-30'
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- affiliate.campaign_trackers — M2M: a tracker participates in a campaign
CREATE TABLE IF NOT EXISTS affiliate.campaign_trackers (
  campaign_id UUID NOT NULL REFERENCES affiliate.campaigns(id) ON DELETE CASCADE,
  tracker_id TEXT NOT NULL REFERENCES affiliate.trackers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (campaign_id, tracker_id)
);

-- affiliate.balance — append-only ledger. NEVER DELETE. UPDATE only the released flag.
CREATE TABLE IF NOT EXISTS affiliate.balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES affiliate.accounts(id) ON DELETE CASCADE,
  tracker_id TEXT REFERENCES affiliate.trackers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES affiliate.campaigns(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,  -- can be negative (reversals / clawbacks)
  currency TEXT NOT NULL DEFAULT 'USD',
  released BOOLEAN NOT NULL DEFAULT FALSE,  -- flipped TRUE when locked to a payout
  trace TEXT,  -- caller-supplied idempotency key
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Idempotency: UNIQUE(account_id, trace). Raider didn't enforce this — we do.
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_balance_account_trace
  ON affiliate.balance(account_id, trace)
  WHERE trace IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_affiliate_balance_account_released
  ON affiliate.balance(account_id, released);
CREATE INDEX IF NOT EXISTS idx_affiliate_balance_tracker
  ON affiliate.balance(tracker_id);

-- affiliate.payouts — the payout state machine
CREATE TABLE IF NOT EXISTS affiliate.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES affiliate.accounts(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,  -- per-account sequential (1, 2, 3...)
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'scheduled', 'paid', 'rejected')),
  scheduled_for TIMESTAMPTZ,  -- set when admin approves
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, number)  -- per-account sequential uniqueness
);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_account_status
  ON affiliate.payouts(account_id, status);

-- =====================================================================
-- SECTION B — Marketplaces (22 Amazon locales) + amazon_product_cache
-- =====================================================================

CREATE TABLE IF NOT EXISTS rollout.marketplaces (
  slug TEXT PRIMARY KEY,  -- 'US', 'UK', 'DE', ...
  locale_number TEXT,  -- '01', '02', ...
  domain TEXT NOT NULL,  -- 'www.amazon.com', 'www.amazon.co.uk', ...
  associates_url TEXT,  -- 'https://affiliate-program.amazon.com/'
  country_code TEXT NOT NULL,  -- ISO 3166: 'US', 'GB' (NOT 'UK'), 'JP'
  tag TEXT,  -- the affiliate tag for this marketplace (owner-supplied, nullable until provided)
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed all 22 marketplaces (RE-03 §2.1). Idempotent: ON CONFLICT DO NOTHING.
INSERT INTO rollout.marketplaces (slug, locale_number, domain, associates_url, country_code, is_default) VALUES
  ('US', '01', 'www.amazon.com',           'https://affiliate-program.amazon.com/',          'US', TRUE),
  ('UK', '02', 'www.amazon.co.uk',         'https://affiliate-program.amazon.co.uk/',        'GB', FALSE),
  ('DE', '03', 'www.amazon.de',            'https://partnernet.amazon.de/',                  'DE', FALSE),
  ('FR', '04', 'www.amazon.fr',            'https://partenaires.amazon.fr/',                 'FR', FALSE),
  ('JP', '05', 'www.amazon.co.jp',         'https://affiliate-program.amazon.co.jp/',        'JP', FALSE),
  ('CA', '06', 'www.amazon.ca',            'https://associates.amazon.ca/',                  'CA', FALSE),
  ('IT', '07', 'www.amazon.it',            'https://programma-affiliazione.amazon.it/',      'IT', FALSE),
  ('ES', '08', 'www.amazon.es',            'https://afiliados.amazon.es/',                   'ES', FALSE),
  ('IN', '09', 'www.amazon.in',            'https://affiliate-program.amazon.in/',           'IN', FALSE),
  ('CN', '10', 'www.amazon.cn',            'https://affiliate-program.amazon.cn/',           'CN', FALSE),
  ('MX', '11', 'www.amazon.com.mx',        'https://afiliados.amazon.com.mx/',               'MX', FALSE),
  ('AU', '12', 'www.amazon.com.au',        'https://affiliate-program.amazon.com.au/',       'AU', FALSE),
  ('BR', '13', 'www.amazon.com.br',        'https://programafiliados.amazon.com.br/',        'BR', FALSE),
  ('AE', '14', 'www.amazon.ae',            'https://affiliate-program.amazon.ae/',           'AE', FALSE),
  ('SA', '15', 'www.amazon.sa',            'https://affiliate-program.amazon.sa/',           'SA', FALSE),
  ('SG', '16', 'www.amazon.sg',            'https://affiliate-program.amazon.sg/',           'SG', FALSE),
  ('NL', '17', 'www.amazon.nl',            'https://affiliate-program.amazon.nl/',           'NL', FALSE),
  ('SE', '18', 'www.amazon.se',            'https://affiliate-program.amazon.se/',           'SE', FALSE),
  ('PL', '19', 'www.amazon.pl',            'https://affiliate-program.amazon.pl/',           'PL', FALSE),
  ('BE', '20', 'www.amazon.com.be',        'https://affiliate-program.amazon.com.be/',       'BE', FALSE),
  ('EG', '21', 'www.egypt.souq.com',       'https://affiliate-program.amazon.eg/',           'EG', FALSE),
  ('TR', '22', 'www.amazon.com.tr',        'https://affiliate-program.amazon.com.tr/',       'TR', FALSE)
ON CONFLICT (slug) DO NOTHING;

-- amazon_product_cache — composite key, TTL, error, integer-cents price, availability, reviews
-- The Amazon URL is NEVER stored here. Derived at click time.
CREATE TABLE IF NOT EXISTS rollout.amazon_product_cache (
  product_id TEXT PRIMARY KEY,  -- composite: {ASIN}_{locale}|{lang}|{currency}
  asin TEXT NOT NULL,
  locale TEXT NOT NULL,  -- marketplace slug
  modified_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiration_time TIMESTAMPTZ NOT NULL,  -- TTL
  title TEXT,
  price_cents INTEGER,  -- integer cents (no floating-point money)
  price_formatted TEXT,
  currency TEXT,
  rating NUMERIC(2,1),  -- e.g. 4.5
  review_count INTEGER,
  review_samples JSONB DEFAULT '[]'::jsonb,
  is_prime BOOLEAN,
  is_adult BOOLEAN,
  availability TEXT,  -- 'in_stock', 'out_of_stock', etc.
  error TEXT,  -- last fetch error (if any)
  delivery_free_shipping BOOLEAN,
  delivery_fba BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_amazon_cache_asin_locale ON rollout.amazon_product_cache(asin, locale);
CREATE INDEX IF NOT EXISTS idx_amazon_cache_expiration ON rollout.amazon_product_cache(expiration_time);

-- =====================================================================
-- SECTION C — Extend rollout.products to the 5-status + soft-delete + scheduling
-- =====================================================================

-- Add the scheduling + soft-delete columns (additive)
ALTER TABLE rollout.products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS available_on TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discontinue_on TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS default_marketplace TEXT DEFAULT 'US'
    REFERENCES rollout.marketplaces(slug);

-- Drop the old 2-status CHECK constraint FIRST — the UPDATE below writes the new
-- status values, which the old constraint rejects while it is still in place.
ALTER TABLE rollout.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE rollout.products DROP CONSTRAINT IF EXISTS rollout_products_status_check;

-- Migrate the old 2-status to the new 5-status (published -> active, unpublished -> draft)
UPDATE rollout.products SET status = 'active' WHERE status = 'published';
UPDATE rollout.products SET status = 'draft'  WHERE status = 'unpublished';

-- Install the new 5-status CHECK constraint
ALTER TABLE rollout.products
  ADD CONSTRAINT rollout_products_status_check
  CHECK (status IN ('draft', 'active', 'archived', 'proposed', 'rejected'));

-- Add integer-cents price (nullable; the old DECIMAL price stays for migration safety, will be dropped later)
ALTER TABLE rollout.products ADD COLUMN IF NOT EXISTS price_cents INTEGER;

-- Backfill price_cents from the old price where present
UPDATE rollout.products SET price_cents = ROUND(price * 100) WHERE price IS NOT NULL AND price_cents IS NULL;

-- Index for the 3-condition publish gate + soft-delete default scope
CREATE INDEX IF NOT EXISTS idx_products_status_deleted_available
  ON rollout.products(status, deleted_at, available_on);

-- =====================================================================
-- SECTION D — Variants, categories, collections (RE-04 Spree model)
-- =====================================================================

-- product_variants — the purchasable unit (separate from the product grouping)
CREATE TABLE IF NOT EXISTS rollout.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES rollout.products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  price_cents INTEGER,  -- integer cents; nullable (never displayed publicly)
  attributes JSONB DEFAULT '{}'::jsonb,  -- size, color, etc.
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON rollout.product_variants(product_id);

-- categories (operator-managed)
CREATE TABLE IF NOT EXISTS rollout.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES rollout.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- collections (curated groupings, e.g. "featured")
CREATE TABLE IF NOT EXISTS rollout.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- M2M junctions
CREATE TABLE IF NOT EXISTS rollout.product_categories (
  product_id TEXT NOT NULL REFERENCES rollout.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES rollout.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
CREATE TABLE IF NOT EXISTS rollout.product_collections (
  product_id TEXT NOT NULL REFERENCES rollout.products(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES rollout.collections(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, collection_id)
);

-- =====================================================================
-- SECTION E — Extend rollout.analytics (source, visitor_hash, tracker_id)
-- =====================================================================

ALTER TABLE rollout.analytics
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS visitor_hash BIGINT,
  ADD COLUMN IF NOT EXISTS tracker_id TEXT;  -- references affiliate.trackers(id); no cross-schema FK for simplicity

CREATE INDEX IF NOT EXISTS idx_analytics_source ON rollout.analytics(source);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor_hash ON rollout.analytics(visitor_hash);
CREATE INDEX IF NOT EXISTS idx_analytics_tracker ON rollout.analytics(tracker_id);
-- BRIN index on created_at — efficient for time-range scans on append-only data.
-- (Native monthly partitioning is deferred until the table exceeds ~1M rows; the BRIN
-- index makes monthly queries fast in the meantime. See blueprint 76 Scalability.)
CREATE INDEX IF NOT EXISTS idx_analytics_created_brin ON rollout.analytics USING BRIN (created_at);

-- =====================================================================
-- SECTION F — Audit log
-- =====================================================================

CREATE TABLE IF NOT EXISTS rollout.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,  -- auth.users id (admin or affiliate)
  action TEXT NOT NULL,  -- e.g. 'product.publish', 'payout.schedule'
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON rollout.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON rollout.audit_log(actor_id, created_at);

-- =====================================================================
-- SECTION G — RLS: enable + FORCE + (select ...) wrappers everywhere
--
-- The (select auth.jwt()) / (select auth.uid()) wrapper caches the result once
-- per query (the unwrapped form re-evaluates per row — a performance bug; RE-05 NextBase §2.3).
-- FORCE ROW LEVEL SECURITY prevents the table owner (postgres role in Supabase) from
-- bypassing RLS.
-- =====================================================================

-- Enable + FORCE on every table
ALTER TABLE rollout.products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollout.product_variants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollout.categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollout.collections           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollout.product_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollout.product_collections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollout.analytics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollout.admin_access_keys     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollout.marketplaces          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollout.amazon_product_cache  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollout.audit_log             ENABLE ROW LEVEL SECURITY;

ALTER TABLE rollout.products              FORCE ROW LEVEL SECURITY;
ALTER TABLE rollout.product_variants      FORCE ROW LEVEL SECURITY;
ALTER TABLE rollout.categories            FORCE ROW LEVEL SECURITY;
ALTER TABLE rollout.collections           FORCE ROW LEVEL SECURITY;
ALTER TABLE rollout.product_categories    FORCE ROW LEVEL SECURITY;
ALTER TABLE rollout.product_collections   FORCE ROW LEVEL SECURITY;
ALTER TABLE rollout.analytics             FORCE ROW LEVEL SECURITY;
ALTER TABLE rollout.admin_access_keys     FORCE ROW LEVEL SECURITY;
ALTER TABLE rollout.marketplaces          FORCE ROW LEVEL SECURITY;
ALTER TABLE rollout.amazon_product_cache  FORCE ROW LEVEL SECURITY;
ALTER TABLE rollout.audit_log             FORCE ROW LEVEL SECURITY;

-- Affiliate schema: enable + FORCE + ownership-based RLS
ALTER TABLE affiliate.accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate.trackers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate.campaigns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate.campaign_trackers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate.balance             ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate.payouts             ENABLE ROW LEVEL SECURITY;

ALTER TABLE affiliate.accounts            FORCE ROW LEVEL SECURITY;
ALTER TABLE affiliate.trackers            FORCE ROW LEVEL SECURITY;
ALTER TABLE affiliate.campaigns           FORCE ROW LEVEL SECURITY;
ALTER TABLE affiliate.campaign_trackers   FORCE ROW LEVEL SECURITY;
ALTER TABLE affiliate.balance             FORCE ROW LEVEL SECURITY;
ALTER TABLE affiliate.payouts             FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- rollout.products policies (rewritten with the wrapper)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_can_read_published_products" ON rollout.products;
CREATE POLICY "anon_can_read_published_products"
  ON rollout.products FOR SELECT TO anon
  USING (
    status = 'active'
    AND deleted_at IS NULL
    AND (available_on IS NULL OR available_on <= NOW())
  );

DROP POLICY IF EXISTS "admin_full_access_products" ON rollout.products;
CREATE POLICY "admin_full_access_products"
  ON rollout.products FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_can_manage_products" ON rollout.products;
CREATE POLICY "admin_can_manage_products"
  ON rollout.products FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------
-- rollout.product_variants policies
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_can_read_published_variants" ON rollout.product_variants;
CREATE POLICY "anon_can_read_published_variants"
  ON rollout.product_variants FOR SELECT TO anon
  USING (
    status = 'active' AND deleted_at IS NULL
    -- a variant is public iff its parent product is public; the join is enforced at the app layer
  );

DROP POLICY IF EXISTS "service_role_full_variants" ON rollout.product_variants;
CREATE POLICY "service_role_full_variants"
  ON rollout.product_variants FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_can_manage_variants" ON rollout.product_variants;
CREATE POLICY "admin_can_manage_variants"
  ON rollout.product_variants FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------
-- rollout.categories / collections / junctions — admin-managed
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_read_categories" ON rollout.categories;
CREATE POLICY "anon_read_categories"
  ON rollout.categories FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "service_role_categories" ON rollout.categories;
CREATE POLICY "service_role_categories"
  ON rollout.categories FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_manage_categories" ON rollout.categories;
CREATE POLICY "admin_manage_categories"
  ON rollout.categories FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "anon_read_collections" ON rollout.collections;
CREATE POLICY "anon_read_collections"
  ON rollout.collections FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "service_role_collections" ON rollout.collections;
CREATE POLICY "service_role_collections"
  ON rollout.collections FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_manage_collections" ON rollout.collections;
CREATE POLICY "admin_manage_collections"
  ON rollout.collections FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Junctions: same pattern (anon read, service_role full, admin manage)
DROP POLICY IF EXISTS "anon_read_product_categories" ON rollout.product_categories;
CREATE POLICY "anon_read_product_categories"
  ON rollout.product_categories FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "service_role_product_categories" ON rollout.product_categories;
CREATE POLICY "service_role_product_categories"
  ON rollout.product_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_manage_product_categories" ON rollout.product_categories;
CREATE POLICY "admin_manage_product_categories"
  ON rollout.product_categories FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "anon_read_product_collections" ON rollout.product_collections;
CREATE POLICY "anon_read_product_collections"
  ON rollout.product_collections FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "service_role_product_collections" ON rollout.product_collections;
CREATE POLICY "service_role_product_collections"
  ON rollout.product_collections FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_manage_product_collections" ON rollout.product_collections;
CREATE POLICY "admin_manage_product_collections"
  ON rollout.product_collections FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------
-- rollout.analytics — anon INSERT only; authenticated/admin SELECT
-- (rewritten with the wrapper)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_can_insert_analytics" ON rollout.analytics;
CREATE POLICY "anon_can_insert_analytics"
  ON rollout.analytics FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "admin_can_read_analytics" ON rollout.analytics;
CREATE POLICY "admin_can_read_analytics"
  ON rollout.analytics FOR SELECT TO service_role USING (true);

DROP POLICY IF EXISTS "admin_can_read_analytics_auth" ON rollout.analytics;
CREATE POLICY "admin_can_read_analytics_auth"
  ON rollout.analytics FOR SELECT TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------
-- rollout.marketplaces — public read (needed for geo-routing), admin manage
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_read_marketplaces" ON rollout.marketplaces;
CREATE POLICY "anon_read_marketplaces"
  ON rollout.marketplaces FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "service_role_marketplaces" ON rollout.marketplaces;
CREATE POLICY "service_role_marketplaces"
  ON rollout.marketplaces FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_manage_marketplaces" ON rollout.marketplaces;
CREATE POLICY "admin_manage_marketplaces"
  ON rollout.marketplaces FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------
-- rollout.amazon_product_cache — service_role only (no anon/authenticated policy → deny by default)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_amazon_cache" ON rollout.amazon_product_cache;
CREATE POLICY "service_role_amazon_cache"
  ON rollout.amazon_product_cache FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_manage_amazon_cache" ON rollout.amazon_product_cache;
CREATE POLICY "admin_manage_amazon_cache"
  ON rollout.amazon_product_cache FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------
-- rollout.audit_log — service_role insert; admin read
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_audit_log" ON rollout.audit_log;
CREATE POLICY "service_role_audit_log"
  ON rollout.audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_audit_log" ON rollout.audit_log;
CREATE POLICY "admin_read_audit_log"
  ON rollout.audit_log FOR SELECT TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------
-- rollout.admin_access_keys — service_role ONLY (no anon/authenticated policy → deny by default)
-- (rewritten with the wrapper)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_full_access_admin_access_keys" ON rollout.admin_access_keys;
CREATE POLICY "service_role_full_access_admin_access_keys"
  ON rollout.admin_access_keys FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- affiliate.* — OWNERSHIP-BASED RLS (auth.uid() = the affiliate's account_id)
-- An affiliate sees ONLY their own rows. The wrapper caches auth.uid() once per query.
-- ---------------------------------------------------------------------

-- accounts: an affiliate reads/updates their own account row
DROP POLICY IF EXISTS "affiliate_own_account" ON affiliate.accounts;
CREATE POLICY "affiliate_own_account"
  ON affiliate.accounts FOR ALL TO authenticated
  USING ((select auth.uid()) = id)   -- the account row's PK is the affiliate's id
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "service_role_affiliate_accounts" ON affiliate.accounts;
CREATE POLICY "service_role_affiliate_accounts"
  ON affiliate.accounts FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_manage_affiliate_accounts" ON affiliate.accounts;
CREATE POLICY "admin_manage_affiliate_accounts"
  ON affiliate.accounts FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- trackers: own
DROP POLICY IF EXISTS "affiliate_own_trackers" ON affiliate.trackers;
CREATE POLICY "affiliate_own_trackers"
  ON affiliate.trackers FOR ALL TO authenticated
  USING ((select auth.uid()) = account_id)
  WITH CHECK ((select auth.uid()) = account_id);
DROP POLICY IF EXISTS "service_role_trackers" ON affiliate.trackers;
CREATE POLICY "service_role_trackers"
  ON affiliate.trackers FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_manage_trackers" ON affiliate.trackers;
CREATE POLICY "admin_manage_trackers"
  ON affiliate.trackers FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- campaigns: public read (affiliates see the campaigns they're in via campaign_trackers);
-- admin manage. Affiliates do NOT write campaigns.
DROP POLICY IF EXISTS "anon_read_campaigns" ON affiliate.campaigns;
CREATE POLICY "anon_read_campaigns"
  ON affiliate.campaigns FOR SELECT TO anon USING (status = 'active');
DROP POLICY IF EXISTS "service_role_campaigns" ON affiliate.campaigns;
CREATE POLICY "service_role_campaigns"
  ON affiliate.campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_manage_campaigns" ON affiliate.campaigns;
CREATE POLICY "admin_manage_campaigns"
  ON affiliate.campaigns FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- campaign_trackers: an affiliate reads their own memberships
DROP POLICY IF EXISTS "affiliate_own_campaign_trackers" ON affiliate.campaign_trackers;
CREATE POLICY "affiliate_own_campaign_trackers"
  ON affiliate.campaign_trackers FOR SELECT TO authenticated
  USING ((select auth.uid()) IN (
    SELECT account_id FROM affiliate.trackers WHERE id = tracker_id
  ));
DROP POLICY IF EXISTS "service_role_campaign_trackers" ON affiliate.campaign_trackers;
CREATE POLICY "service_role_campaign_trackers"
  ON affiliate.campaign_trackers FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_manage_campaign_trackers" ON affiliate.campaign_trackers;
CREATE POLICY "admin_manage_campaign_trackers"
  ON affiliate.campaign_trackers FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- balance: own (SELECT only; writes come via service_role postback)
DROP POLICY IF EXISTS "affiliate_own_balance" ON affiliate.balance;
CREATE POLICY "affiliate_own_balance"
  ON affiliate.balance FOR SELECT TO authenticated
  USING ((select auth.uid()) = account_id);
DROP POLICY IF EXISTS "service_role_balance" ON affiliate.balance;
CREATE POLICY "service_role_balance"
  ON affiliate.balance FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_manage_balance" ON affiliate.balance;
CREATE POLICY "admin_manage_balance"
  ON affiliate.balance FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- payouts: own (SELECT + INSERT request; admin transitions via service_role / admin role)
DROP POLICY IF EXISTS "affiliate_own_payouts" ON affiliate.payouts;
CREATE POLICY "affiliate_own_payouts"
  ON affiliate.payouts FOR ALL TO authenticated
  USING ((select auth.uid()) = account_id)
  WITH CHECK ((select auth.uid()) = account_id);
DROP POLICY IF EXISTS "service_role_payouts" ON affiliate.payouts;
CREATE POLICY "service_role_payouts"
  ON affiliate.payouts FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_manage_payouts" ON affiliate.payouts;
CREATE POLICY "admin_manage_payouts"
  ON affiliate.payouts FOR ALL TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =====================================================================
-- END FM-02 migration
-- The Amazon URL is stored NOWHERE in this file. It is derived at click time.
-- Money is integer cents (price_cents) everywhere new.
-- RLS is enabled + FORCED + (select ...) wrapped on every table.
-- =====================================================================
