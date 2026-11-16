# DATA-SEED-01: Ingest ~5 products into rollout.products via Rainforest API

## What and why

The `rollout.products` table is empty (verified: 0 rows). ROLL-13's product page and ROLL-14's `/go/[id]` redirect cannot be tested end-to-end without real products. This task pulls ~5 products from the Rainforest API using the existing `RAIN_FOREST_API_KEY`, maps them to `rollout.products` columns, inserts them as published products with ASINs, and verifies they exist in the database.

This is data seeding, not feature work. No pages, no API routes, no UI changes.

## What exists

- `rollout/.env.local` has `RAIN_FOREST_API_KEY=F6953ABC819D46829F5ACE70ACADED3F` (already verified working)
- `rollout/src/lib/supabase/server.ts` — `createAdminClient()` and `createPublicClient()` both select `rollout` schema (ROLL-12 done)
- `rollout/src/lib/products/product-service.ts` — `createProductAdmin(product)` exists for inserting products
- `rollout/supabase-rollout-schema.sql` — `rollout.products` table structure with columns: id, slug, name, status, gender, color, asin, sku, collection, tagline, subtitle, intro, key_benefits, technical_details, adjustment, range, sole_type, upper_material, traction, price, main_image, images, meta, tags, box_contents, sizes, sizes_detail, created_at, updated_at
- Rainforest API: `https://api.rainforestapi.com/request` with parameters `api_key`, `type=product`, `asin=<ASIN>` or `search=<query>`

## Decisions

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Source | Rainforest API product endpoint using `api_key` from env |
| 2 | Count | ~5 products (not more, not less — enough to test happy paths) |
| 3 | Status | All inserted as `published` |
| 4 | ASIN required | Only products with a non-null ASIN are inserted (needed for ROLL-14 affiliate URLs) |
| 5 | Insert method | Use `createProductAdmin(product)` from `product-service.ts` (service_role, bypasses RLS) |
| 6 | Script location | One-off script under `developer-workspace/DATA-SEED-01/seed.ts` — not committed to the app |
| 7 | Slug generation | `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')` |
| 8 | Price | Use Rainforest `price.value` if present, else null |
| 9 | Main image | Use Rainforest `image` or `main_image` if present |
| 10 | No hardcoding | Do not hardcode product data — all values come from Rainforest API responses |

## Steps

Run from the repository root: `/home/lordwhitefire/current-project/athletica/athletica`.

### 1. Create the seed script

Create `developer-workspace/DATA-SEED-01/seed.ts` (outside the repo's tracked app directories):

```ts
import { createProductAdmin } from '@/lib/products/product-service';
```

The script should:

- Read `RAIN_FOREST_API_KEY` from `process.env`
- Call Rainforest API for ~5 products (search queries like "running shoes", "football boots", "trainers", "cleats", "sports shoes" — or any 5 real products)
- For each product with a non-null ASIN:
  - Generate slug from name
  - Map fields: name, slug, status='published', asin, brand→collection or meta, price, image→main_image, etc.
  - Call `createProductAdmin(product)`
- Log which products were inserted (product name + ASIN, not secrets)
- Handle errors gracefully (one failure doesn't stop the others)

### 2. Run the seed script

With owner approval:

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsx developer-workspace/DATA-SEED-01/seed.ts
```

Or if tsx is not available, compile and run with `tsc` + `node`.

Do not hardcode the API key in the script — read it from `process.env.RAIN_FOREST_API_KEY`.

### 3. Verify products exist

With owner approval, query the database:

```bash
npx supabase db query --db-url "$SUPABASE_DB_URL" "SELECT id, slug, name, status, asin FROM rollout.products;"
```

Confirm ~5 rows with `status = 'published'` and non-null `asin`.

### 4. Stop

Do not commit the seed script to the app (it's a one-off data script under `developer-workspace/`). Do not commit/push anything. The products live in the database only.

## Benchmarks (what must be true after this change)

- `rollout.products` has ~5 rows
- All rows have `status = 'published'`
- All rows have non-null `asin`
- All rows have unique `slug`
- All rows have non-null `name`
- The seed script reads `RAIN_FOREST_API_KEY` from env, not hardcoded
- `npx tsc --noEmit` passes (if the script is type-checked)
- No app code was changed (no pages, no API routes, no components)

## What is explicitly NOT done in this task

- No page or route changes
- No ROLL-14 work (affiliate redirect, CTA wiring)
- No admin auth (ROLL-15)
- No price changes (ROLL-16)
- No Sentry (ROLL-17)
- No Vitest suite (ROLL-18)
- No commits or pushes
