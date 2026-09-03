-- Create the dedicated Rollout schema (separate from Mature's public schema)
CREATE SCHEMA IF NOT EXISTS rollout;

-- Self-contained product table (no foreign keys to hierarchy)
CREATE TABLE rollout.products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'unpublished' CHECK (status IN ('published', 'unpublished')),

  -- Identity
  gender TEXT,
  color TEXT,
  asin TEXT,
  sku TEXT,

  -- Description
  collection TEXT,
  tagline TEXT,
  subtitle TEXT,
  intro TEXT,
  key_benefits JSONB DEFAULT '[]'::jsonb,
  technical_details JSONB DEFAULT '[]'::jsonb,

  -- Attributes
  adjustment TEXT,
  range TEXT,
  sole_type TEXT,
  upper_material TEXT,
  traction TEXT,
  price DECIMAL(10,2),

  -- Images
  main_image TEXT,
  images TEXT[] DEFAULT '{}',

  -- SEO
  meta JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple analytics (no complex attribution)
CREATE TABLE rollout.analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES rollout.products(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rollout_products_status ON rollout.products(status);
CREATE INDEX idx_rollout_products_slug ON rollout.products(slug);
CREATE INDEX idx_rollout_analytics_product ON rollout.analytics(product_id);
CREATE INDEX idx_rollout_analytics_created ON rollout.analytics(created_at);
