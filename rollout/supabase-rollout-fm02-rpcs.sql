-- =====================================================================
-- FM-02/FM-18/FM-21 integration: RPCs + the dead_link flag.
-- The owner runs this in the Supabase SQL Editor AFTER the FM-02 migration.
-- These are the pieces that can't be pure TypeScript — they need SECURITY DEFINER
-- functions or a transactional RPC.
-- =====================================================================

-- 1. validate_door_key(token_value) — used by src/middleware.ts (Lock #2).
--    Hashes the cookie value, looks up the row, slides expiry 30d, returns the user_id or NULL.
CREATE OR REPLACE FUNCTION rollout.validate_door_key(token_value TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = rollout
AS $$
DECLARE
  v_hash TEXT := encode(digest(token_value, 'sha256'), 'hex');
  v_row  rollout.admin_access_keys%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM rollout.admin_access_keys
    WHERE token_hash = v_hash AND kind = 'door'
      AND revoked_at IS NULL AND expires_at > NOW();
  IF NOT FOUND THEN RETURN NULL; END IF;
  -- Slide renewal: 30 days from now on each valid check.
  UPDATE rollout.admin_access_keys SET expires_at = NOW() + INTERVAL '30 days'
    WHERE id = v_row.id;
  RETURN v_row.user_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION rollout.validate_door_key(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rollout.validate_door_key(TEXT) TO anon, authenticated;

-- 2. request_payout(account_id, amount, number) — ONE transaction.
--    Releases the balance rows + inserts the payout atomically. Used by payout-service.ts.
CREATE OR REPLACE FUNCTION affiliate.request_payout(p_account_id UUID, p_amount NUMERIC, p_number INTEGER)
RETURNS TABLE(payout_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = affiliate
AS $$
DECLARE v_id UUID;
BEGIN
  -- Single transaction: release + insert.
  UPDATE affiliate.balance SET released = TRUE
    WHERE account_id = p_account_id AND released = FALSE;
  INSERT INTO affiliate.payouts (account_id, number, amount, currency, status)
    VALUES (p_account_id, p_number, p_amount, 'USD', 'requested')
    RETURNING id INTO v_id;
  RETURN QUERY SELECT v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION affiliate.request_payout(UUID, NUMERIC, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION affiliate.request_payout(UUID, NUMERIC, INTEGER) TO authenticated, service_role;

-- 3. dead_link flag on products (additive) + mark_product_dead / mark_product_alive.
ALTER TABLE rollout.products ADD COLUMN IF NOT EXISTS dead_link BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE rollout.products ADD COLUMN IF NOT EXISTS dead_reason TEXT;

CREATE OR REPLACE FUNCTION rollout.mark_product_dead(p_product_id TEXT, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = rollout
AS $$
BEGIN
  UPDATE rollout.products SET dead_link = TRUE, dead_reason = p_reason, updated_at = NOW()
    WHERE id = p_product_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION rollout.mark_product_dead(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rollout.mark_product_dead(TEXT, TEXT) TO service_role, authenticated;

CREATE OR REPLACE FUNCTION rollout.mark_product_alive(p_product_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = rollout
AS $$
BEGIN
  UPDATE rollout.products SET dead_link = FALSE, dead_reason = NULL, updated_at = NOW()
    WHERE id = p_product_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION rollout.mark_product_alive(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rollout.mark_product_alive(TEXT) TO service_role, authenticated;

-- 4. enforce_payout_terms — marks balance rows eligible after payout_term days.
--    (Simplified; the owner can expand based on the campaign's payout_term.)
CREATE OR REPLACE FUNCTION affiliate.enforce_payout_terms()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = affiliate
AS $$
BEGIN
  -- Placeholder: a real impl joins balance → campaign_trackers → campaigns.payout_term
  -- and flips an `eligible_for_payout` flag when the term has elapsed.
  -- For now this is a no-op stub the cron job calls safely.
END;
$$;
REVOKE EXECUTE ON FUNCTION affiliate.enforce_payout_terms() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION affiliate.enforce_payout_terms() TO service_role;

-- 5. The `dead_link` flag is now part of the products table.
--    RLS: the existing anon_read_published_products policy already gates on status='active'
--    AND deleted_at IS NULL AND available_on <= now. The dead_link flag doesn't change
--    visibility — a dead product is still visible; its CTA greys out (the storefront reads
--    product.dead_link). No policy change needed.
