-- =====================================================================
-- FM-02/FM-18/FM-21 integration: RPCs + the dead_link flag.
-- The owner runs this in the Supabase SQL Editor AFTER the FM-02 migration.
-- These are the pieces that can't be pure TypeScript — they need SECURITY DEFINER
-- functions or a transactional RPC.
--
-- Additive + idempotent. Safe to run twice.
-- =====================================================================

-- 0. Schema privileges. REQUIRED for any of this to be reachable from the app.
--
--    The app talks to two custom schemas (rollout, affiliate) via the data API.
--    A custom schema is NOT exposed by default: without USAGE + table grants the
--    API answers "permission denied for schema ..." and every RPC below is
--    uncallable, however correct the GRANT EXECUTE lines are.
--    (Supabase docs: Using Custom Schemas.)
--
--    RLS still does the row filtering — these grants only get you to the table.
--    No ALL ON ROUTINES here: function EXECUTE stays explicit and minimal below.
GRANT USAGE ON SCHEMA rollout TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA rollout TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA rollout
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

GRANT USAGE ON SCHEMA affiliate TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA affiliate TO authenticated, service_role;
-- anon may read active campaigns only (matches the anon_read_campaigns policy)
GRANT USAGE ON SCHEMA affiliate TO anon;
GRANT SELECT ON affiliate.campaigns TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA affiliate
  GRANT ALL ON TABLES TO authenticated, service_role;

-- 1. validate_door_key(token_value) — used by src/middleware.ts (Lock #2).
--    Hashes the cookie value, looks up the row, slides expiry 30d, returns the user_id or NULL.
--
--    Hashing uses PostgreSQL's built-in sha256() on the UTF-8 bytes of the token.
--    That is byte-for-byte identical to the app's
--      createHash('sha256').update(token).digest('hex')
--    and needs no pgcrypto extension (digest() lives outside this function's
--    search_path on Supabase, so it would fail at call time).
CREATE OR REPLACE FUNCTION rollout.validate_door_key(token_value TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = rollout
AS $$
DECLARE
  v_hash TEXT := encode(sha256(convert_to(token_value, 'UTF8')), 'hex');
  v_row  rollout.admin_access_keys%ROWTYPE;
BEGIN
  IF token_value IS NULL OR token_value = '' THEN RETURN NULL; END IF;

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
--
--    Returns JSONB ({ "payout_id": "..." }) so the caller's `data.payout_id` works.
--    A row-returning (RETURNS TABLE) function would come back from supabase-js as an
--    ARRAY and the caller would silently read undefined.
--
--    Who may call it: service_role only. It takes an arbitrary account id and is
--    SECURITY DEFINER, so granting it to `authenticated` would let any logged-in
--    user request a payout for someone else's account. The only caller
--    (src/lib/affiliate/payout-service.ts) uses the service client.
--
--    Drop first: the old signature returned TABLE(payout_id UUID); PostgreSQL
--    cannot change a return type with CREATE OR REPLACE.
DROP FUNCTION IF EXISTS affiliate.request_payout(UUID, NUMERIC, INTEGER);

CREATE OR REPLACE FUNCTION affiliate.request_payout(
  p_account_id UUID,
  p_amount     NUMERIC,
  p_number     INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = affiliate
AS $$
DECLARE
  v_total NUMERIC;
  v_id    UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'request_payout: amount must be positive (got %)', p_amount;
  END IF;

  -- Lock every unreleased balance row for this account. A second concurrent
  -- request blocks here, then finds nothing left to release: no double payout.
  PERFORM 1
    FROM affiliate.balance
   WHERE account_id = p_account_id AND released = FALSE
     FOR UPDATE;

  -- The amount that is actually sitting unreleased in the ledger.
  SELECT COALESCE(SUM(amount), 0)
    INTO v_total
    FROM affiliate.balance
   WHERE account_id = p_account_id AND released = FALSE;

  IF v_total <= 0 THEN
    RAISE EXCEPTION 'request_payout: no unreleased balance for account %', p_account_id;
  END IF;

  -- The caller read the balance before this transaction started. If the ledger
  -- moved in between, refuse rather than pay a number that no longer matches.
  IF ABS(v_total - p_amount) > 0.005 THEN
    RAISE EXCEPTION 'request_payout: balance changed (caller said %, ledger says %)',
      p_amount, v_total;
  END IF;

  UPDATE affiliate.balance
     SET released = TRUE
   WHERE account_id = p_account_id AND released = FALSE;

  -- Insert the ledger total, not the caller's number.
  INSERT INTO affiliate.payouts (account_id, number, amount, currency, status)
       VALUES (p_account_id, p_number, v_total, 'USD', 'requested')
    RETURNING id INTO v_id;

  RETURN jsonb_build_object('payout_id', v_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION affiliate.request_payout(UUID, NUMERIC, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION affiliate.request_payout(UUID, NUMERIC, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION affiliate.request_payout(UUID, NUMERIC, INTEGER) TO service_role;

-- 3. dead_link flag on products (additive) + mark_product_dead / mark_product_alive.
ALTER TABLE rollout.products ADD COLUMN IF NOT EXISTS dead_link BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE rollout.products ADD COLUMN IF NOT EXISTS dead_reason TEXT;

-- service_role only: the caller (src/lib/amazon/dead-link-detector.ts) uses the
-- service client. SECURITY DEFINER bypasses RLS, so granting these to
-- `authenticated` would let any logged-in user — including an affiliate —
-- take a product down.
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
REVOKE EXECUTE ON FUNCTION rollout.mark_product_dead(TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION rollout.mark_product_dead(TEXT, TEXT) TO service_role;

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
REVOKE EXECUTE ON FUNCTION rollout.mark_product_alive(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION rollout.mark_product_alive(TEXT) TO service_role;

-- 4. enforce_payout_terms — marks balance rows eligible after payout_term days.
--    (Simplified; the owner can expand based on the campaign's payout_term.)
--
--    NOTE: this is still a NO-OP stub. It is safe for the cron job to call, but it
--    releases nothing and changes nothing today. The real implementation needs an
--    `eligible_for_payout` column on affiliate.balance and a join
--    balance → campaign_trackers → campaigns.payout_term. Left as a stub on purpose;
--    do not assume payout terms are being enforced.
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
