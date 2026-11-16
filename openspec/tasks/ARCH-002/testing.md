# Tester Task: ARCH-002 — Data Import Verification

## What behavior to verify

The import script ran and populated the Supabase tables with data from the `data/` JSON files. The data must be **complete** (nothing lost), **correct** (mappings work), and **verifiable** (counts match source). We're not testing the script code — we're testing the **resulting data in Supabase**.

## How to verify — using Lighthouse + Chrome

Use Lighthouse at `~/Lighthouse` loaded in Chrome. You'll verify the data through the **Supabase Dashboard** (Table Editor) and **REST API** calls from the browser console.

### Step 1: Row counts match source

In Supabase Dashboard → **Table Editor**, check each table's row count:

| Table | Expected source | How to verify |
|---|---|---|
| `brands` | 4 entries in `data/brands.json` | Count rows = 4 |
| `categories` | Unique product categories + nav top-level | Count rows ≥ unique product categories |
| `products` | Number of files in `data/products/` | Count rows = file count |
| `homepage_sections` | 6 hero banners + cards from `homepage.json` | Count rows = 6 + card count |
| `navigation` | Non-disabled nav items from `navigation.json` | Count rows > 0 |
| `site_settings` | 1 row | Count rows = 1 |
| `editorial_content` | May be 0 (not in source) | Count rows ≥ 0 |

**In Dashboard**: Click each table → bottom shows "X rows". Note any mismatches.

### Step 2: Foreign keys are valid

In Dashboard → **Table Editor** → `products`:
- Filter where `brand_id IS NULL` → should be **0 rows**
- Filter where `category_id IS NULL` → should be **0 rows** (unless a product genuinely has no category)
- Click a few `brand_id` values → should link to real rows in `brands`
- Click a few `category_id` values → should link to real rows in `categories`

### Step 3: Product data integrity

In Dashboard → `products` table, spot-check 3-5 products:

For each product, verify:
- `id` matches the source JSON `id` (e.g., "JI1114")
- `slug` matches `url_slug`
- `name` is populated (falls back to `model` if `name` was null)
- `model` matches source
- `price` = source `price.current` (numeric, e.g., 59.99)
- `gender` = source `gender`
- `color` = source `color`
- `sizes` = text[] of EU sizes (e.g., `{"36 EU","37 1/3 EU",...}`)
- `image_links` = non-empty text[] of Sanity CDN URLs (main_image + image_gallery)
- `attributes` (jsonb) contains: `traction`, `price` (full object), `sizes_detail` (availability/stock), `color_variants` (array of product_ids)
- `asin` = **NULL** (expected — not in source)
- `status` = 'published' (default)
- `description` (jsonb) = full source description object
- `category_id` → valid FK to `categories`
- `brand_id` → valid FK to `brands`

### Step 4: Brand data

In `brands` table:
- 4 rows: adidas, nike, puma, new-balance
- Each has `slug` (e.g., "brand-adidas"), `name`, `logo_link` (Sanity CDN URL)

### Step 5: Categories

In `categories` table:
- At minimum: "Boots" category exists (from product data)
- Slug is lowercase (e.g., "boots")
- May have parent/child from navigation hierarchy

### Step 6: Homepage sections

In `homepage_sections`:
- 6 hero banners (`type='hero'`) with `order` 1-6
- Each has `title`, `copy` (subtitle), `image_links` [banner image], `attributes` with `button_text` and `link`
- Cards from `sections[].cards[]` → `type='card'` or `'carousel'`, with `title`, `copy`, `image_links`, `attributes` with `link`

### Step 6: Navigation

In `navigation`:
- Rows > 0
- Each has `label`, `route` (e.g., "/boots/adidas/predator"), `level` via `parent_id`
- No rows with `disabled: true` from source

### Step 7: Site settings

In `site_settings`:
- 1 row
- `brand_name = 'Athletica'`
- `footer.link_columns` has Store/Account/Support
- `social_links` populated
- `site_logo` = Sanity CDN URL

### Step 8: ASIN status check

In `products` table:
- Filter `asin IS NULL` → count = total products
- This is **expected** — source data has no ASINs
- Document in test report: "ASINs: 0/XX populated (source data has no ASINs)"

### Step 9: Verification report exists

Check that the import script produced a verification report file (JSON or Markdown) with:
- Source vs. target counts for each table
- FK validity results
- ASIN status (all NULL, documented)
- Any data quality issues found

## What to report

Write a plain-language report covering:

1. **Counts** — Did every table's row count match the expected source?
2. **Foreign keys** — Any orphaned products? Any invalid brand_id/category_id?
3. **Product spot-check** — Did the 3-5 products you checked have all fields correctly mapped?
3. **ASINs** — Confirmed all NULL, documented as expected gap
4. **Homepage sections** — Hero banners + cards present and correct?
5. **Navigation** — Menu structure present, no disabled items?
6. **Site settings** — Single row with correct brand info?
7. **Verification report** — Does the script's own report match what you see in Dashboard?
8. **Any surprises** — Duplicate products? Malformed sizes? Missing images? Anything the import script flagged?

**No screenshots. No UI checks.** Just: *Does the data in Supabase match the source JSON, with correct relationships and no loss?*