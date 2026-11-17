# FM-02 — Testing (core data model)

**Task:** FM-02 | **Verify behavior, not UI.**

## What behavior to verify

1. Does every required table exist with the required columns + constraints?
2. Is `marketplaces` seeded with exactly 22 rows, UK→GB?
3. Is `analytics` partitioned by month?
4. Are the UNIQUE constraints real (try inserting a duplicate `trace`, a duplicate `sku`, a duplicate `token_hash`)?
5. Is RLS enabled + FORCED on every table?
6. Does the `(select auth.jwt())` wrapper actually cache (is a query on a large table faster than the unwrapped equivalent)?
7. Is the Amazon URL absent from every table (grep all schemas for a stored URL column)?

## How to verify (behavioral)

- **Schema inspection:** query `information_schema.tables` + `information_schema.columns` for each required table/column. Confirm types (BIGINT for visitor_hash, integer cents for prices, enum for statuses).
- **Seed check:** `SELECT count(*) FROM marketplaces` → 22. `SELECT country_code FROM marketplaces WHERE slug='UK'` → `GB`.
- **Partition check:** confirm `analytics` has a partition strategy (native partitioning or a monthly partition table).
- **UNIQUE enforcement:** attempt to INSERT a balance row with a duplicate `(account_id, trace)` → expect a unique-violation. Same for `product_variants.sku` and `admin_access_keys.token_hash`.
- **RLS + FORCE:** for each table, confirm `rowsecurity = true` and the FORCE flag. As a non-service-role user with no matching policy, attempt SELECT → expect 0 rows (deny by default).
- **Wrapper perf:** run the same RLS-gated query with and without the `(select ...)` wrapper on a table with >1000 rows; the wrapped form should be measurably faster (the unwrapped form calls `auth.jwt()` per row).
- **No stored URL:** `grep -ri "amazon" information_schema.columns` or query for any column named like `url`/`affiliate_url`/`amazon_url` on product/variant tables → expect none.

## What "working" means

- The schema matches the blueprint's D1–D9 answers.
- Money is integer cents everywhere.
- RLS is real (deny by default) and fast (the wrapper caches).
- The affiliate ledger is append-only with idempotency.
- Nothing stores the Amazon URL.

## What to report

- Any missing table, column, constraint, or partition.
- The actual count in `marketplaces` (must be 22) and the UK→GB mapping.
- Whether each UNIQUE constraint rejected the duplicate insert.
- Whether RLS denied the non-matching user.
- The perf delta between wrapped and unwrapped `auth.jwt()`.
- Any table that stores an Amazon URL (there should be none).
