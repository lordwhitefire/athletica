-- Run by owner in Supabase dashboard (SQL editor). Rollout schema.
-- ROLL-06 D3: what's inside the box.
ALTER TABLE rollout.products
  ADD COLUMN IF NOT EXISTS box_contents JSONB NOT NULL DEFAULT '[]'::jsonb;