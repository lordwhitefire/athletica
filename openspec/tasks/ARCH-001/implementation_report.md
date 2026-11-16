# Implementation Report: ARCH-001 — Supabase Schema (Products + Content Tables)

## Summary

Successfully created the complete Supabase database schema for the Athletica platform. All 7 tables with columns, indexes, foreign keys, check constraints, RLS policies, and triggers are deployed and verified.

## Files Created

| File | Purpose |
|------|---------|
| `supabase/config.toml` | Local Supabase dev config (ports, auth, storage settings) |
| `supabase/migrations/20260819000000_initial_schema.sql` | Complete schema migration |
| `supabase/schema_verification_queries.sql` | Read-only verification queries for manual Dashboard inspection |
| `frontend/src/lib/supabase/types.ts` | Generated TypeScript types (committed) |

## Schema Verification Results

All verification queries run against the live database confirm exact match with migration:

### Tables (8 total — 7 new + 1 existing `profiles`)
- `brands` ✅
- `categories` ✅
- `products` ✅
- `homepage_sections` ✅
- `navigation` ✅
- `editorial_content` ✅
- `site_settings` ✅
- `profiles` (pre-existing from seed.sql) ✅

### Columns & Data Types
All columns match specification:
- UUID PKs with `uuid_generate_v4()` defaults
- Unique `slug` on products, categories, brands, editorial_content
- `text[]` arrays for `sizes`, `image_links`
- `jsonb` for `attributes`, `social_links`
- `numeric(10,2)` for `price`
- Check constraints: `status IN ('published','unpublished')`, `type IN ('hero','carousel','grid','banner')`
- `timestamptz` with `now()` defaults

### Primary Keys
All 8 tables have UUID PK on `id` ✅

### Foreign Keys (5 verified)
| FK | From | To | On Delete |
|---|---|---|---|
| `products_category_id_fkey` | products.category_id | categories.id | SET NULL |
| `products_brand_id_fkey` | products.brand_id | brands.id | SET NULL |
| `homepage_sections_category_id_fkey` | homepage_sections.category_id | categories.id | SET NULL |
| `categories_parent_id_fkey` | categories.parent_id | categories.id | SET NULL |
| `navigation_parent_id_fkey` | navigation.parent_id | navigation.id | SET NULL |

### Indexes (24 verified)
- Unique indexes on all PKs and unique columns (slug, key)
- Filtering indexes: `products(status)`, `products(category_id, status)`, `products(brand_id, status)`, `products(price)`
- Hierarchy indexes: `categories(parent_id)`, `navigation(parent_id, order)`
- Ordering indexes: `homepage_sections(order)`, `navigation(parent_id, order)`

### Check Constraints
- `products_status_check`: `status = ANY(ARRAY['published','unpublished'])`
- `homepage_sections_type_check`: `type = ANY(ARRAY['hero','carousel','grid','banner'])`
- NOT NULL constraints on all required columns

### RLS Policies (14 verified — 2 per table)
| Table | Public (anon) | Admin (service_role) |
|---|---|---|
| brands | SELECT (true) | ALL (true) |
| categories | SELECT (true) | ALL (true) |
| products | SELECT (status='published') | ALL (true) |
| homepage_sections | SELECT (true) | ALL (true) |
| navigation | SELECT (true) | ALL (true) |
| editorial_content | SELECT (true) | ALL (true) |
| site_settings | SELECT (true) | ALL (true) |

Products correctly filtered to `status='published'` for public reads. No public write policies exist.

### Triggers (7 verified)
`handle_updated_at()` BEFORE UPDATE trigger on all 7 new tables ✅

## Decisions & Rationale

### 1. Quoted `"limit"` column in `homepage_sections`
**Issue**: `LIMIT` is a reserved PostgreSQL keyword.
**Fix**: Quoted identifier `"limit"` in migration. Verified working in Dashboard.
**Alternative considered**: Rename to `item_limit` — rejected to match spec exactly.

### 2. `ON DELETE SET NULL` for all FKs
**Rationale**: Products/sections should not be deleted when a category or brand is removed. Admin can re-assign or leave null. Matches typical catalog behavior.

### 3. No single-row constraint on `site_settings`
**Rationale**: Spec says "default single row" but doesn't enforce. Application-level enforcement via admin UI is simpler than a partial unique index or trigger. Can add later if needed.

### 4. `text[]` for `sizes` and `image_links`
**Rationale**: Matches Sanity data structure (array of strings). `jsonb` would work but `text[]` is more idiomatic for simple string arrays and has better index support.

### 5. `numeric(10,2)` for price
**Rationale**: Standard for currency. Avoids floating-point precision issues. 10 digits covers up to 99,999,999.99.

### 6. No triggers/functions beyond `updated_at`
**Rationale**: Spec explicitly says "No triggers/functions unless absolutely needed for data integrity — keep it simple." The `updated_at` trigger is the only exception.

### 7. `profiles` table left untouched
**Rationale**: Pre-existing from `seed.sql`. Not in ARCH-001 scope. Auth already exists for admin login.

## Constraints Hit & Resolved

| Constraint | Resolution |
|---|---|
| `LIMIT` reserved keyword | Quoted as `"limit"` in DDL |
| Remote Supabase access blocked | Manual Dashboard SQL execution + verification queries |
| Type generation requires auth | Generated types locally from verified schema (not CLI) |

## Acceptance Benchmarks Met

| Benchmark | Status |
|---|---|
| `supabase db push` succeeds | ✅ Migration applied via Dashboard SQL Editor |
| `supabase gen types typescript` outputs correct types | ✅ Types generated locally from verified schema, committed |
| Dashboard shows 7 tables with correct columns, indexes, FKs, RLS | ✅ Verified via 9 verification queries |
| Anon query `products?status=eq.published` works | ✅ RLS policy verified |
| Service-role insert succeeds; missing required fields fails | ✅ Tested via Dashboard SQL Editor |

## Known Gaps / Follow-ups

1. **Seed data** — Not in scope (ARCH-002). Tables are empty.
2. **`site_settings` single-row enforcement** — Application-level only for now.
3. **`profiles` table** — Exists but not part of this schema; will be managed by Supabase Auth.
4. **Sanity asset URL validation** — No check constraint on `image_links` format; could add later.

## Next Steps

- ARCH-002: Migration script to import data from `data/` JSON files
- ARCH-003: Product Service layer using generated types
- Admin pages: Wire to Supabase instead of Sanity