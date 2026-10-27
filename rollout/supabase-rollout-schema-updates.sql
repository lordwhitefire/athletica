-- Run by owner in Supabase dashboard (SQL editor). Rollout schema.
-- ROLL-06 D3: what's inside the box.
ALTER TABLE rollout.products
  ADD COLUMN IF NOT EXISTS box_contents JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ROLL-07 D6: sizes editor support.
ALTER TABLE rollout.products
  ADD COLUMN IF NOT EXISTS sizes TEXT[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE rollout.products
  ADD COLUMN IF NOT EXISTS sizes_detail TEXT;

-- ROLL-12: source attribution + daily visitor hash.
ALTER TABLE rollout.analytics
  ADD COLUMN IF NOT EXISTS source TEXT
  CHECK (source IN ('instagram', 'whatsapp'));

ALTER TABLE rollout.analytics
  ADD COLUMN IF NOT EXISTS visitor_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_rollout_analytics_source
  ON rollout.analytics(source);

CREATE INDEX IF NOT EXISTS idx_rollout_analytics_visitor
  ON rollout.analytics(visitor_hash);