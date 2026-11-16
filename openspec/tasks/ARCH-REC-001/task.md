# Builder Task: ARCH-REC-001 — Reconciliation: Add Model Hierarchy to Schema & Re-Run Import

## What we're reconciling

The architecture was updated after ARCH-001 and ARCH-002 completed to add **model hierarchy** as a first-class catalog entity. The original work did not account for this:

**What's missing:**
1. **`models` table** does not exist in Supabase — the schema from ARCH-001 only created products, categories, brands, and content tables
2. **Import didn't parse model hierarchy** — products were inserted with a flat `model` string (e.g., "Predator/League-FT-(FG/MG)") instead of being linked to leaf models in a model hierarchy
3. **Products have no `leaf_model_id`** — the `products` table has a `model` text column but no `leaf_model_id` FK to a `models` table
4. **No `models` table exists** — no root models, sub-models, or leaf models exist in Supabase

## Why it matters

Until this is fixed:
- The Product Service (ARCH-003) cannot implement model hierarchy queries (no `models` table to query)
- Category/listing pages cannot filter by root model or sub-model
- Product detail pages cannot show model ancestry breadcrumbs
- Color variants cannot be found (they're products sharing the same leaf model)
- The admin cannot manage model hierarchy

## What we're building

### Part 1: Add `models` table to Supabase schema
Create the `models` table with self-referential hierarchy:
- `id` (uuid, pk), `slug` (unique per brand), `name`, `brand_id` (FK → brands), `parent_id` (self-ref FK, nullable for root models), `level` (int: 0=root, 1=sub-model, 2=sub-sub-model), `description`, timestamps
- Unique constraint on `(brand_id, slug)`
- Self-referential FK: `parent_id → models.id` with `ON DELETE SET NULL`
- Index on `brand_id`, `parent_id`, `level`

### Part 2: Add `leaf_model_id` to `products` table
- Add `leaf_model_id` column (uuid, FK → models.id, nullable for now)
- Index on `leaf_model_id`
- Keep existing `model` text column for backward compatibility during transition

### Part 3: Parse model hierarchy from source data and upsert models
Parse the source `model` field from each product JSON:
- Example: `"Predator/League-FT-(FG/MG)"` → split by `/`
- Level 0 (root): "Predator" → brand: adidas
- Level 1 (sub): "League" → parent: Predator
- Level 2 (leaf): "League-FT-(FG/MG)" → parent: League

Upsert models in order (roots first, then subs, then leafs):
- For each unique model path, create/get the model record
- Track the leaf model ID for each product

### Part 3b: Link products to leaf models
- For each product, after upserting its model path, set `products.leaf_model_id` to the leaf model's ID
- Keep the original `model` text column for now (can be dropped later)

### Part 4: Verify model hierarchy integrity
- Every product has a `leaf_model_id` pointing to a model with `level=2` (leaf)
- No orphaned models (models with no products and no children — or flag them for review)
- Model hierarchy depth is 0-3 (root → sub → sub-sub)
- Each model's `brand_id` matches its products' brand
- Color variants: products sharing the same `leaf_model_id` should have different `color` values

## Context you need

### Source data format (from `data/products/*.json`)
Each product has a `model` field like:
- `"Predator/League-FT-(FG/MG)"` → 3 levels
- `"Mercurial/Superfly"` → 2 levels (root + leaf)
- `"X/Crazyfast"` → 2 levels
- `"Phantom/GX"` → 2 levels
- `"Tiempo/Legend"` → 2 levels
- `"Future/Ultimate"` → 2 levels
- `"Ultra/Ultimate"` → 2 levels
- `"Copa/Pure"` → 2 levels
- `"442"` → 1 level (root only, also leaf)
- `"King"` → 1 level (root only, also leaf)
- `"Mundial/Team"` → 2 levels

Parsing logic: split by `/`, last segment = leaf, first = root, middle (if any) = sub-model.

### Existing Supabase state
- `products` table: 29 rows (28 source + 1 test), has `model` text column, no `leaf_model_id`
- `brands` table: 5 rows (4 real + 1 test)
- `categories` table: 2 rows (boots + test)
- `models` table: **does not exist**
- Generated types in `frontend/src/lib/supabase/types.ts` need regeneration

## Boundaries — what NOT to do

- **Don't drop the `model` text column yet** — keep for transition; can be removed in a later cleanup task
- **Don't modify the import script for other entities** — brands, categories, homepage, navigation, site_settings are fine
- **Don't build the Product Service** — that's ARCH-003
- **Don't touch admin pages** — that's ARCH-005

## Acceptance benchmarks

- **Benchmark 1**: `models` table exists with correct columns, indexes, FKs, RLS
- **Benchmark 2**: `products` table has `leaf_model_id` column with FK to `models.id`
- **Benchmark 3**: All 28 source products have a non-NULL `leaf_model_id` pointing to a model with `level=2` (or level=0/1 if the model has no children)
- **Benchmark 4**: Model hierarchy depth is correct (0=root, 1=sub, 2=sub-sub/leaf)
- **Benchmark 5**: Color variants work — products with same `leaf_model_id` have different `color` values
- **Benchmark 6**: Root model queries work — e.g., "Predator" root has children "League", "Elite", "Accuracy", etc.
- **Benchmark 7**: Regenerated TypeScript types include `models` table and `products.leaf_model_id`
- **Benchmark 8**: RLS on `models` — public read for all, admin write via service role

## Files you'll likely create/modify

- `supabase/migrations/YYYYMMDDHHMMSS_add_models_table.sql` — create `models` table + add `leaf_model_id` to products
- `scripts/upsert-model-hierarchy.ts` — parse source data, upsert models, link products
- `scripts/verify-model-hierarchy.ts` — verification queries
- Regenerate `frontend/src/lib/supabase/types.ts`

**Reminder**: In your implementation report, explain your parsing logic for the model strings, how you handled edge cases (1-level models like "442", 2-level like "Mercurial/Superfly"), and any data quality issues you found (e.g., inconsistent naming).

---

**Note**: This reconciliation replaces the need to re-run ARCH-002 entirely — it surgically adds the missing model hierarchy on top of the existing data. Once done, ARCH-002 can be considered fully complete.