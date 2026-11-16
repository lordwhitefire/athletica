# Tester Task: ARCH-005 — Verify the Admin Pages Read/Write Supabase

## What behavior to verify

The 13 admin pages must now be backed by Supabase: products catalog, product editor, quick create, bulk ops, batch upload, import center, brands, categories, **models management**, and the dashboard. No admin page or action may query Sanity (or JSON/localStorage/seed) for products, brands, categories, or amazon links anymore. Writes must propagate to the storefront within cache TTL.

## Setup

- Dev server running (or built app), Chrome with Lighthouse (`~/Lighthouse`).
- You need an admin login (the existing admin auth flow — login as admin).
- Supabase access to spot-check rows (SQL editor or a read tool) — verify a few writes directly in the DB.

## How to verify

### 1. Products catalog (`/admin/products`)

- Page lists the products (expect 29 rows: 28 source + 1 test product, unless the Builder cleaned it).
- **Network tab:** filter to Fetch/XHR. Any request to `cdn.sanity.io` or Sanity API = **failure**. Requests should go to Supabase (PostgREST) only.
- Try each filter/sort/search: search "predator", filter by brand adidas, status published/unpublished, missing data (ASIN — expect all/nearly all products flagged, since ASINs are NULL), pagination.
- Facets/KPIs render with real numbers (total, active, unpublished, missing ASIN/images/categories, created this month).

### 2. Product editor — full CRUD round trip

Pick a real product (e.g. `adidas-predator-elite-fg-black`):

1. **Edit**: change the price (or color), save.
2. **Verify in Supabase**: the `products` row changed (price column / attributes).
3. **Verify on the storefront**: open the product page — the new price shows (within cache TTL — the write must invalidate `products` tags; if it takes up to 60s that's the TTL, if it never updates that's a failure).
4. Revert the change.

**Create**: use the full product form with a unique name/sku. Then:
- Row exists in Supabase with: slug, brand_id (correct brand), category_id, leaf_model_id (resolved from the model string if provided), image_links populated (URLs, not refs).
- Product appears in admin catalog and in storefront search.

**Delete**: delete the created product → row gone; storefront URL for it 404s; no orphan references.

### 3. Quick create + bulk ops

- Quick create a product (name/category/brand) → appears in catalog with status as chosen.
- Bulk ops (select multiple rows): set status published/unpublished, assign category, assign brand, set ASIN (valid 10-char → row's `asin` column updated; invalid → rejected with error), delete (rows gone).
- **Verify in Supabase** that each bulk op touched exactly the selected rows.

### 4. Batch upload + import center

- Batch upload a small CSV (2–3 rows) → products created in Supabase with resolved brand/category/leaf model.
- Import center: report renders from Supabase data (missing ASIN count matches reality — expect 28+; missing images; invalid price; duplicates). The numbers must match a direct Supabase count.

### 5. Brands

- List shows brands from the `brands` table (4 imported + test brand) with logos from `logo_link`.
- Create a brand → row in Supabase with slugified name.
- Edit name/logo → row updated.
- Delete a brand **with products** → blocked with a clear error, brand still exists.
- Delete a brand with no products → works (or is blocked per the Builder's documented choice — check the implementation report for what they decided; verify it matches).

### 6. Categories

- List shows real categories with real product counts.
- Create a category → row in Supabase (slugified, parent_id if hierarchical).
- Edit → updated.
- Delete a category with products → blocked; empty category → deleted.

### 7. Models management (new surface)

- The page/section exists and follows the admin design (sidebar nav includes it).
- Shows the 21 models: adidas (Predator root with its leaves, X root), Nike (Mercurial Vapour 17 as root=leaf); product counts per leaf.
- Create a root model under a brand → row in Supabase (level 0, unique (brand_id, slug)).
- Create a child under it → level 1, parent_id set.
- Reparent/rename → hierarchy updates.
- Delete a leaf model that has products → **blocked** with a clear message.
- Delete a model with no products → works.
- **Storefront link**: a newly created root model appears in the brand's model filters on the customer site (via the service) within cache TTL.

### 8. Dashboard (`/admin/overview`)

- KPIs: Total Products (29), Active/Unpublished (per status column), Missing ASIN (matches Supabase count), Missing Images, Missing Categories — all real numbers, not hardcoded.
- Top products / recent products from `created_at`.
- Category distribution matches Supabase counts.
- Clicks remain 0 (expected until ARCH-08).
- **Network tab:** no Sanity calls.

### 9. Cache invalidation (storefront propagation)

Pick a product, change its price in admin, then immediately (within seconds) load the storefront product page:
- If the change appears quickly (< ~60s): tags invalidated correctly. ✅
- If it never appears: failure.
- Same for a model change (create a child model → appears in storefront model filter after invalidation).

### 10. No Sanity in admin data paths

```bash
rg -l "adminClient|sanity" frontend/src/lib/actions frontend/src/app/admin frontend/src/components/admin | sort
```

Allowed remaining: image-utility files, ARCH-06 content pages (homepage, navigation, site-settings, media — they still use Sanity by design). **Forbidden**: products, brands, categories, import-center, batch-upload, overview actions.

Also confirm no admin action reads `data/brands.json` or `data/products`:

```bash
rg -l "data/brands|data/products" frontend/src/lib/actions frontend/src/app/admin frontend/src/components/admin
```

Expected: empty.

### 11. TypeScript

```bash
npx tsc --noEmit
```

in `frontend/`. Report: errors in files the Builder touched (should be 0), and the count of remaining admin errors (should be lower than the previous 53; the Builder fixes the ones in touched files).

### 12. Schema

If the Builder claims a schema/migration is needed: the migration file exists in `supabase/migrations/` **but has not been applied by them** (user applies it). Verify the report matches reality; if the schema was changed without a migration file, that's a failure.

## What to report

1. **Catalog page** — lists Supabase products; all filters/sort/search/facets/KPIs work; no Sanity calls (Network tab evidence).
2. **Editor CRUD** — edit/create/delete verified end-to-end (admin → Supabase row → storefront); leaf_model_id and image_links correct.
3. **Quick create + bulk ops** — each op verified against Supabase rows; invalid ASIN rejected.
4. **Batch upload + import center** — rows created; validation numbers match Supabase counts.
5. **Brands** — CRUD works; delete guards behave as documented.
6. **Categories** — real data; counts correct; delete guards work.
7. **Models management** — hierarchy display, create/reparent/rename/delete-guards all work; storefront sees new models after cache invalidation.
8. **Dashboard** — real counts; no hardcoded values; no Sanity calls.
9. **Cache propagation** — admin write → storefront update within TTL.
10. **grep results** — no Sanity in admin data paths (list allowed exceptions), no data/ JSON reads.
11. **tsc** — new errors 0 in touched files; remaining admin error count.
12. **Schema** — migration file if any; nothing applied without a migration.
13. **Surprises** — anything that behaves differently from the benchmarks, any action that still hits Sanity, any UI breakage, any storefront inconsistency.

**No screenshots. No UI matching.** Just: *Do the admin pages read and write Supabase, do the writes reach the storefront, and is Sanity out of the admin data path?*