# Fetch plan — fill the menu with new products

Date: 2026-11-18
Scope: Futbolmania's own full menu — adult + kids, every linked category, every page. Existing DB
rows are void; this is a fresh pull. Volatile data (price, sizes, stock) is NOT fetched.

## The plan in one line

For every branch in the menu, open the matching Futbolmania category page in the real Chrome
window, read the products, open each product page, and save the stable product data as
import-ready files.

## Source (confirmed)

Futbolmania — `https://www.futbolmania.com/` (owner's choice). The site's own layered menu is the
target taxonomy: **adult + kids, 28 level-1 sections, 901 unique linked category items**. The
earlier 10-section / 333-entry subset is superseded. Futbolmania's category pages and product
pages are the source. Existing DB rows are void.

No brand sites are used. All Futbolmania access goes through `@browser-attach` in the real Chrome
window; no curl, no headless. If a page blocks, the owner clears the challenge.

## Steps

1. **Map the menu to Futbolmania category URLs.** Each menu branch gets the matching Futbolmania
   category page (e.g. Boots → `/es/botas-de-futbol`, Jerseys → the jersey category). Follow the
   menu tree, not the current DB categories.
2. **Open the page in the real Chrome window** (CDP :9222, never headless). Wait for real content;
   the owner clicks any challenge.
3. **Read the product grid:** product name, colour, image, product URL. Follow pagination.
4. **Open each product page** and extract:
   - name, brand, category, model path (root → submodel → product model)
   - colour + colour variants (sibling product names/links)
   - gender
   - description: tagline, intro, collection, key benefits, technical details
   - images: main + gallery (download the files)
   - ASIN — leave empty; Futbolmania does not provide it
5. **Save the raw capture** per branch under `captures/<menu-branch>/`.
6. **Normalise** into `structures/`: categories.json (menu tree), models.json (brand → root →
   submodel → product model), products/<slug>.json.
7. **Package** import-ready files in `deliverables/import/` plus `images/`.
8. **Validate:** pick one product, change its name in the import file, confirm the page still
   renders and the rest of the data holds. Record the result in `validations/`.

## What is NOT fetched

- Price, original price, discount, member price
- Sizes, stock, availability

## Order of work

No subset — follow the site's own menu. Start with the biggest sections (adult Boots alone is
**1,281 products across 22 pages**), then kids, then the rest. The full menu crawl is running
through the real Chrome ref tab and writes results after every batch.

## Rules while fetching

- All Futbolmania access through `@browser-attach` in the real Chrome window (CDP :9222, never
  headless). No curl. The owner watches and clicks challenges.
- No writes to Supabase during the pull. Import happens only after the owner approves the files.

## Fields left empty (owner ruling)

Price, sizes, stock and ASIN are left empty for now. They are not fetched, they do not block the
pull, and they do not block the import. They are recorded in the test-product section below.

---

## Test product — fixed template (2026-11-18)

Test: **Nike Mercurial Zoom Superfly 11 Elite AG-PRO** (SKU IM2513-102), source
`https://www.futbolmania.com/es/im2513-102`.
Deliverable: `scrape-workspace/deliverables/test-product-im2513-102.json`.

### Filled

- id / SKU, slug, name, model, brand (Nike), category (Boots), gender (Unisex), colour (White)
- description: subtitle, tagline, intro, collection, 4 key benefits, technical details
  (range, sole type, upper material, adjustment)
- traction (AG), status (published)
- images: **10 in Sanity** — 1 main + 9 gallery, plus `image_links` (10)
- colour variants: same model and sole only, deduped by colour, SKU uppercase, English colours,
  thumbnail in Sanity

### Left empty for now (owner ruling 2026-11-18)

- **Price** — empty; the product file carries the zeroed price object the app renders when no
  price is set. Not fetched.
- **Sizes** — empty (`[]`). Not fetched.
- **Stock / availability** — empty. Not fetched.
- **ASIN** — empty (`null`). Futbolmania does not provide it; no Amazon matching for now.

### Fixes applied to the test product

1. Collection parsed from `Colección: ...`.
2. Colour variants filtered to the exact same model/sole; current product and duplicate colours
   removed; colours translated; SKUs uppercased.
3. Variant thumbnail downloaded and uploaded to Sanity.
4. All store-facing text translated to English; original Spanish kept in `_source`.
5. App-shaped image fields at top level (`main_image`, `thumbnail`, `image_gallery`, `image_links`).

### Ruling (2026-11-18)

Price, sizes, stock and ASIN stay empty for now. Do not fetch them, do not block the pull on
them, and do not fill them from another source. They are owner-entered later if needed.

### Rules for the full pull

- Store-facing data in English only; `_source` keeps the original Spanish for traceability.
- Variants: same model and sole, deduped by colour, no current product, uppercase SKU, English colour.
  `product_id` on a variant is the storefront slug the app links to; the source SKU stays in `sku`.
- Images: all images per product uploaded to Sanity; `image_links` = main + gallery.
- Leave price, sizes, stock and ASIN empty in every product file. Do not fetch them.
- Futbolmania has no ASINs; the field stays null. No Amazon matching for now.