# Data inventory — what the Athletica software needs

Date: 2026-11-18
Asked: "find out what we need"
Status: investigation only — no scraping, no writes to the app or database.

## What the software reads (from code)

### Store app (`frontend/`) — Supabase tables

| Table | Columns the app actually uses |
|---|---|
| `products` | `id` (text PK), `slug`, `name`, `model`, `description` (JSON string: subtitle, tagline, intro, collection, key_benefits[], technical_details{range, sole_type, upper_material, adjustment}), `price` (numeric), `attributes` (jsonb: traction, price{current,original,discount_percent,member_price,currency}, sizes_detail[{size,available,stock}]), `gender`, `color`, `sizes` (text[]), `status` (published/unpublished), `asin`, `category_id`, `brand_id`, `leaf_model_id`, `image_links` (text[]) |
| `brands` | `slug`, `name`, `logo_link` |
| `categories` | `slug`, `name`, `parent_id` (tree) |
| `models` | `slug`, `name`, `brand_id`, `parent_id`, `level` 0–2, `description` |
| `category_links` | `category_id`, `entity_type` (brand/model/submodel/product_model), `entity_id` |
| `homepage_sections` | hero carousel + section configs (`attributes` jsonb) |
| `navigation` | `label`, `route`, `parent_id`, `order` |
| `editorial_content` | keyed page copy |
| `site_settings` | site name, tagline, contact email, social links |

Orders, customers, carts, affiliate accounts are runtime data — created by use, not seeded by scraping.

### Rollout app (`rollout/`) — separate schema

`rollout.products`, `product_variants`, `product_categories`, `product_collections`, `categories`,
`collections`, `marketplaces`, `amazon_product_cache`, `analytics`, `audit_log`, plus `affiliate.*`
(accounts, campaigns, trackers, payouts, balance).

## What already exists locally

- `data/products/` — 28 product JSONs: all "Boots"; 27 adidas, 1 nike; 19 unisex / 9 men.
  Contains brand, category, color, color_variants, description, gender, id, image_gallery,
  main_image, model, name, price, sizes, thumbnail, traction, url_slug.
  Gaps: 2 products have no sizes; `key_benefits` is empty everywhere.
- `frontend/data/products/` — 31 product JSONs (newer copy).
- `data/brands.json` — 4 brands (adidas, nike, Puma, New Balance) with Sanity logo URLs.
- `data/homepage.json` — 1 hero carousel + 28 homepage sections.
- `data/navigation.json`, `data/site-settings.json`.
- `data/amazon-links.json` — empty.

## Live Supabase (read 2026-11-18, project mtudltsfcxvjjhmaztrp)

| Table | Rows |
|---|---|
| products | 40 (39 published, 1 unpublished) |
| brands | 5 (adidas, Nike, Puma, New Balance, Test Brand) |
| categories | 4, all roots: Boots, JERSEYS, MATCH BALLS, Test Football Boots |
| models | 127 (levels 0–3: 20/79/22/6) |
| category_links | 0 |
| homepage_sections | 21 |
| navigation | 333 |
| editorial_content | 0 |
| site_settings | 1 |

Products: 30 Boots, 5 Test Football Boots, 2 Jerseys, 1 Match Balls, 2 uncategorised.
Gaps: ASIN missing on 30/40, sizes missing on 9, leaf_model_id missing on 1.
Read succeeded with the rollout app's new-format key; the frontend `.env.local` keys are legacy
and disabled (`UNAUTHORIZED_DISABLED_LEGACY_KEY`), which explains the live homepage failure.

## What is missing / blocking

1. **Catalogue breadth.** Only boots, only 2 brands. No clothing, balls, goalkeeper gloves,
   shin pads, bags; no Puma / New Balance products at all.
2. **Taxonomy.** No `models` rows shipped in the local data (model hierarchy is only a string on
   each product), no `category_links`, no category tree beyond "Boots".
3. **Images.** Images point at Sanity CDN, not owned assets; no local media library.
4. **Live database unreachable with repo credentials.** Supabase REST returns
   `UNAUTHORIZED_DISABLED_LEGACY_KEY` (legacy JWT keys disabled); `psql` password fails;
   management token returns "Invalid access token". Live storefront currently renders
   "Unable to load homepage. Please try again later." Cause cannot be confirmed until valid
   credentials exist (could be keys, empty tables, or both).
5. **Rollout catalogue.** `rollout.products` status/ownership unknown for the same reason.

## Data set needed to make the software complete

1. Products for each brand and category the store sells — name, model, colourway, gender,
   description, price, sizes + stock, images, ASIN/affiliate link, category, brand, model.
2. Brand list with logos.
3. Category tree + category/model links that drive navigation and filters.
4. Model hierarchy per brand (root → submodel → product model).
5. Editorial: homepage sections, navigation, site settings.
6. Media: product images and brand logos, stored as owned assets.

## Open questions for the owner

- Which source(s) should the data come from? (brand sites, retailer, existing Sanity, supplier feed)
- Which categories beyond boots?
- How many products, and which markets/currencies?
- Output: SQL seed for Supabase, JSON fixtures, or both?
