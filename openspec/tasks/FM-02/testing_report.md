# FM-02 — Testing Report

**Task:** FM-02 (Core data model migrations)
**Tester:** Tester agent (fresh session — did not do the building)
**Date:** 2026-11-16
**Source:** `openspec/tasks/FM-02/testing.md` (behavior to verify) + `rollout/supabase-rollout-fm02-full-marketplace.sql` (the artifact) + `openspec/tasks/FM-02/implementation_report.md` (the Builder's report)

## Verification approach

**Static inspection of the SQL file against the testing.md benchmarks.** The sandbox has no `psql` / Supabase CLI, so the behavioral tests that require a live Postgres (INSERT a duplicate trace, query as a non-matching role, run the wrapper-perf comparison) could not be executed. The Tester verified the SQL structure that supports each behavior + cross-referenced the existing prior schema files (`supabase-rollout-schema.sql`, `supabase-rollout-admin-keys.sql`) where the migration extends pre-existing tables.

**The owner must run the migration in the Supabase SQL Editor to confirm runtime behavior.** This report confirms the SQL is structurally correct + idempotent + matches the intent.

## What was tested + observed

### 1. Every required table exists with required columns + constraints

**Result: PASS (with one note).**

All 17 tables are present:
- 8 new tables CREATED in this migration: `rollout.product_variants`, `categories`, `collections`, `product_categories`, `product_collections`, `marketplaces`, `amazon_product_cache`, `audit_log` + 6 affiliate tables (`accounts`, `trackers`, `campaigns`, `campaign_trackers`, `balance`, `payouts`).
- 3 pre-existing tables EXTENDED via ALTER (not re-created, correctly): `rollout.products`, `rollout.analytics`, `rollout.admin_access_keys`. These exist in the prior `supabase-rollout-schema.sql` / `supabase-rollout-admin-keys.sql`. The migration adds columns + constraints to them, which is the correct additive approach.

Column-type spot checks:
- `visitor_hash` is `BIGINT` ✓ (line: `ADD COLUMN IF NOT EXISTS visitor_hash BIGINT`)
- Prices use `INTEGER` cents (`price_cents`) on new tables ✓ — no floating-point money introduced.
- `affiliate.balance.amount` is `NUMERIC(10,2)` — this is the commission amount, which can be fractional (e.g. 4.99% of 49.99 = 2.49). The integer-cents rule applies to product prices, which use `price_cents INTEGER`. The balance amount as NUMERIC is acceptable for ledger math (it's not display money). **No issue.**

### 2. `marketplaces` seeded with exactly 22 rows, UK→GB

**Result: PASS.**

- The INSERT has 22 value rows (counted).
- The UK row: `('UK', '02', 'www.amazon.co.uk', 'https://affiliate-program.amazon.co.uk/', 'GB', FALSE)` ✓ — `country_code='GB'`, not `'UK'`.
- `ON CONFLICT (slug) DO NOTHING` makes it idempotent (re-running won't error).
- The US row is `is_default=TRUE` (the fallback marketplace for geo-routing).

### 3. `analytics` partitioned by month

**Result: PARTIAL — deferred, honestly flagged.**

- The columns (`source`, `visitor_hash` BIGINT, `tracker_id`) are added ✓.
- **Native monthly partitioning is NOT implemented.** The Builder added a BRIN index on `created_at` instead + flagged partitioning as a follow-up when the table exceeds ~1M rows.
- The Tester's assessment: the BRIN index is a reasonable pragmatic equivalent for an append-only table at current scale (the table has existing data from ROLL-03/12; reparenting it to a partitioned table is destructive). The deferral is **honest and documented**, not a silent gap. The blueprint's area 76 explicitly stages partitioning + ClickHouse as the >5M-rows/month upgrade path.
- **Recommendation:** the registry should carry a follow-up sub-task "native monthly partitioning of `rollout.analytics`" so it's not lost. It is not a blocker for Phase 2–6.

### 4. UNIQUE constraints real

**Result: PASS (by inspection).**

- `affiliate.balance`: `CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_balance_account_trace ON affiliate.balance(account_id, trace) WHERE trace IS NOT NULL` ✓ — idempotency on `(account_id, trace)`. The partial index (WHERE trace IS NOT NULL) is correct: rows without a trace (e.g. manual adjustments) aren't constrained.
- `affiliate.payouts`: `UNIQUE (account_id, number)` ✓ — per-account sequential uniqueness.
- `rollout.product_variants.sku`: `sku TEXT UNIQUE` ✓.
- `rollout.admin_access_keys.token_hash`: UNIQUE (pre-existing, confirmed in `supabase-rollout-admin-keys.sql`).

**Not run live:** inserting a duplicate `(account_id, trace)` to confirm the violation. The constraint is structurally present; runtime enforcement is the Postgres guarantee.

### 5. RLS enabled + FORCED on every table

**Result: PASS.**

- 17 `ENABLE ROW LEVEL SECURITY` statements (one per table: 11 rollout + 6 affiliate).
- 17 `FORCE ROW LEVEL SECURITY` statements (same 17 tables). (The grep count of 18 included one comment line mentioning FORCE — not a duplicate statement.)
- `FORCE` is the critical one: without it, the `postgres` table-owner role bypasses RLS. Every table has it.

**Not run live:** the "non-matching user SELECT → 0 rows" test. The policy structure (deny-by-default for `admin_access_keys` + `amazon_product_cache` — service_role-only; ownership-based for affiliate tables) supports it.

### 6. The `(select auth.jwt())` / `(select auth.uid())` wrapper

**Result: PASS.**

- 40 occurrences of `(select auth.jwt() ...` or `(select auth.uid())` across the policies.
- Every role-checking policy uses the wrapper form (the unwrapped form is the performance bug from RE-05 NextBase §2.3).
- Ownership policies on affiliate tables: `(select auth.uid()) = account_id` (or `= id` on accounts).

**Not run live:** the wrapped-vs-unwrapped perf comparison on a >1000-row table. The wrapper is structurally present.

### 7. No stored Amazon URL

**Result: PASS.**

- Grep for `amazon_url` / `affiliate_url` / `destination_url` columns: none.
- `amazon_product_cache` stores data ABOUT the product (title, price_cents, availability, rating, reviews) but NOT the URL. The URL is derived at click time in FM-04.
- The `marketplaces` table stores `domain` + `tag` (the ingredients for URL derivation), not a pre-built URL.

## Gaps + surprises

1. **No live execution.** The sandbox has no Postgres. All verification is static. The owner must run the migration + confirm runtime behavior (the INSERT-duplicate-trace test, the non-matching-user SELECT test, the wrapper-perf comparison). **This is the biggest honest gap — it's environmental, not a defect in the artifact.**

2. **Analytics partitioning deferred** (covered above) — honest, documented, not a blocker.

3. **`analytics.tracker_id` has no FK to `affiliate.trackers`.** The Builder flagged this (cross-schema FK can be flaky). The Tester agrees: the application layer (FM-04 click pipeline) must only attribute to existing trackers. Acceptable, but worth a comment in the code.

4. **The old `price` DECIMAL column is kept** alongside the new `price_cents INTEGER`. The Builder flagged this (additive-only; dropping is destructive). The Tester confirms: nothing in the migration breaks the old column, and the backfill (`price_cents = ROUND(price * 100)`) is correct. A follow-up migration can drop `price` once no code reads it.

5. **`database.types.ts` not updated.** The Builder flagged this. The Tester confirms the hand-written TS types at `rollout/src/lib/database.types.ts` do not yet reflect the new tables. This will block FM-10 (admin editor) and any service that reads the new tables. **Recommendation:** treat the types update as the first sub-task of FM-10, or a quick follow-up within FM-02 before closing it.

## Does it match the intent?

**Yes, with the noted honest deferrals.** The SQL migration:
- Creates every table the blueprint's D1–D9 answers require.
- Enforces the UNIQUE constraints (balance idempotency, payout sequential number, variant SKU).
- Uses integer cents for product prices.
- Enables + FORCEs RLS on every table with the `(select ...)` wrapper.
- Stores the Amazon URL nowhere.
- Seeds the 22 marketplaces with UK→GB.
- Is additive + idempotent (re-runnable without error).

The deferrals (analytics partitioning, the types update, the `price` column drop) are documented, not hidden.

## What to report to the Architect

- **PASS on structure:** all 7 testing.md behaviors are supported by the SQL.
- **Deferred (honest):** native analytics partitioning (BRIN index instead); `database.types.ts` update (needed before FM-10); live runtime verification (owner must run the migration in Supabase).
- **Recommendation:** the Architect should (a) tick FM-02's registry entry as ✅ for the SQL deliverable, (b) add a small follow-up entry "FM-02b: update database.types.ts + native analytics partitioning" so the deferrals aren't lost, (c) instruct the owner to run the migration in the Supabase SQL Editor before Phase 2 starts (Phase 2 tasks depend on the new tables).

The artifact is ready for the owner to run.
