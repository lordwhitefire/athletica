-- ROLL-15 T3: admin access keys — one-time invite codes and door-key links
-- Run this in Supabase → SQL Editor.
-- Creates rollout.admin_access_keys and its RLS policies.
-- Only service_role may touch this table: no anon, no authenticated policy.

CREATE TABLE IF NOT EXISTS rollout.admin_access_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          TEXT NOT NULL CHECK (kind IN ('invite', 'door')),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  browser_label TEXT,
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  used_at       TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ
);

-- Look up a door key by its admin user.
CREATE INDEX IF NOT EXISTS idx_admin_access_keys_user_id
  ON rollout.admin_access_keys (user_id);

-- Look up an invite/door key by its hash (token lookup on every request).
CREATE INDEX IF NOT EXISTS idx_admin_access_keys_token_hash
  ON rollout.admin_access_keys (token_hash);

-- RLS: service_role may do everything (owner's issue script only).
-- No policy for anon: strangers read nothing.
-- No policy for authenticated: even logged-in non-admins read nothing.
-- If RLS is not already enabled on this table, the policies below have no effect;
-- enable it in Supabase → Database → Tables → admin_access_keys → RLS.
CREATE POLICY "service_role_full_access_admin_access_keys"
  ON rollout.admin_access_keys
  FOR ALL
  TO service_role
  USING (true);
