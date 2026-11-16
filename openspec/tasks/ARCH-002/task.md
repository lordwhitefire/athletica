# Builder Task: ARCH-002 — One-Time Product Data Import into Supabase

## What we're building

A one-time import script that reads the existing data from `data/` (JSON snapshots synced from Sanity) and upserts everything into the Supabase schema created in ARCH-001. This is the bridge from the old multi-source world (Sanity + JSON) to the new single-source-of-truth (Supabase).

## Why it matters

This is the **data migration** step. Until this runs and verifies, the Product Service (ARCH-003) has nothing to query, the admin has no real data, and the website can't switch over. The import must be lossless — every product, brand, category, homepage section, and navigation item must land in Supabase with fidelity.

## What success looks like

After this, the Supabase tables are populated with real data that matches the JSON source:
- All ~20 products inserted with correct brand/category links, prices, sizes, descriptions, image links
- 4 brands inserted with logo links
- Category hierarchy built from product categories + navigation structure
- Homepage sections (hero banners + cards) inserted in order
- Navigation simplified and inserted as menu structure
- Site settings inserted
- **Verification report** proves counts match, IDs map, no data lost

## Context you need

### Source files (read-only)
```
data/
├── products/
│   ├── adidas-predator-league-ft-fg-mg-white.json
│   ├── adidas-predator-league-ft-fg-mg-red.json
│   ├── ... (~20 total product files)
├── brands.json
├── navigation.json
├── homepage.json
├── site-settings.json
├── amazon-links.json (empty)
└── build-metadata.json
```

### Target tables (from ARCH-001)
- `brands` (id, slug, name, logo_link)
- `categories` (id, slug, name, parent_id)
- `products` (id, slug, name, model, description, price, gender, color, sizes, attributes, status, asin, category_id, brand_id, image_links)
- `homepage_sections` (id, type, "order", title, copy, category_id, limit, image_links)
- `navigation` (id, parent_id, label, route, order)
- `editorial_content` (id, key, title, body, image_links)
- `site_settings` (id, site_name, tagline, contact_email, social_links)

### Data format details (critical for mapping)

**Product JSON structure:**
```json
{
  "id": "JI1114",
  "brand": { "_id": "brand-adidas", "name": "adidas", "logo": "https://cdn.sanity.io/..." },
  "category": "Boots",
  "color": "White",
  "color_variants": [{ "color": "Black", "product_id": "JI1110" }, ...],
  "description": {
    "collection": "Road to Glory",
    "intro": "...",
    "key_benefits": [...],
    "subtitle": "...",
    "tagline": "...",
    "technical_details": { "adjustment": "...", "range": "...", "sole_type": "...", "upper_material": "..." }
  },
  "gender": "Unisex",
  "model": "Predator/League-FT-(FG/MG)",
  "name": null,
  "price": { "currency": "€", "current": 59.99, "discount_percent": 40, "member_price": 93.99, "original": 100 },
  "sizes": [{ "size": "36 EU", "available": false, "stock": 0 }, ...],
  "image_gallery": ["https://cdn.sanity.io/...", ...],
  "main_image": "https://cdn.sanity.io/...",
  "traction": "FG/MG",
  "url_slug": "adidas-predator-league-ft-fg-mg-white",
  "thumbnail": null
}
```

**Key mappings:**
| Source | → Target |
|---|---|
| `brand._id` + `brand.name` + `brand.logo` | → `brands` table (slug from `_id`, logo_link from logo) |
| `category` string ("Boots") | → `categories` table (slug from lowercase, name from string); build hierarchy from navigation later |
| `id` (e.g., "JI1114") | → `products.id` (text, not UUID — keep original ID as natural key) |
| `url_slug` | → `products.slug` |
| `name` (often null) | → fallback to `model` or `id` |
| `model` | → `products.model` |
| `description` (full object) | → `products.description` (jsonb) |
| `price.current` | → `products.price` (numeric) |
| `price` (full object) | → `products.attributes.price` (jsonb) |
| `gender` | → `products.gender` |
| `color` | → `products.color` |
| `sizes[].size` | → `products.sizes` (text[] of "36 EU", "37 1/3 EU", ...) |
| `sizes[].available` + `stock` | → `products.attributes.sizes_detail` (jsonb) |
| `image_gallery` + `main_image` | → `products.image_links` (text[] of Sanity CDN URLs) |
| `traction` | → `products.attributes.traction` |
| `color_variants[].product_id` | → related product links (store in `attributes.color_variants`) |
| **ASIN** | → **missing entirely** → `products.asin` = NULL initially |

**Brand JSON:** simple array under keys "0", "1", "2", "3" with `_id`, `name`, `logo`

**Navigation JSON:** complex hierarchy (levels 1-4). For our simplified `navigation` table:
- Only keep items that represent actual routes (have `href`)
- Map `label` → `navigation.label`
- `href` → `navigation.route` (strip leading `/en/adultos/` if present, or keep full)
- `level` → hierarchy via `parent_id`
- `order` → from array position
- Skip `disabled: true` items
- `bottomLinks`, `customLinks`, `sizeLinks` → these are utility links, not main nav — store separately or skip for now

**Homepage JSON:**
- `hero_carousel.banners[]` → `homepage_sections` with `type='hero'`, `order` from array, `title`, `copy` (subtitle), `image_links` [image], `button_text` + `link` in `attributes`
- `sections[].cards[]` → `homepage_sections` with `type='card'`/`carousel`, `order`, `title`, `copy` (subtitle), `image_links` [image], `link` in `attributes`

**Site Settings JSON:** → `site_settings` single row (footer link columns, social_links, brand_name, brand_description, copyright, site_logo)

### Verification requirements
The script must output a verification report comparing source vs. target:
| Check | Method |
|---|---|
| Product count | JSON files count = `products` rows |
| Brand count | brands.json entries = `brands` rows |
| Category count | unique product categories + nav categories = `categories` rows |
| Product-brand links | every product has valid `brand_id` FK |
| Product-category links | every product has valid `category_id` FK |
| Image links | every product has `image_links` array (non-empty) |
| ASIN status | count of NULL ASINs reported |
| Homepage sections | banners + cards count = `homepage_sections` rows |
| Navigation items | count of non-disabled nav items = `navigation` rows |
| Site settings | single row exists with expected fields |

## Boundaries — what NOT to do

- **Don't invent ASINs** — leave `asin` NULL; flag missing ASINs in verification report
- **Don't guess category hierarchy** — build flat categories from product `category` field first; navigation hierarchy is separate
- **Don't modify source JSON** — read-only
- **Don't create the Product Service** — that's ARCH-003
- **Don't wire admin pages** — that's ARCH-005
- **Idempotency** — script should be safely re-runnable (upsert on natural keys: `products.id`, `brands.slug`, `categories.slug`, etc.)

## Acceptance benchmarks

- **Benchmark 1**: Script runs to completion with zero errors
- **Benchmark 2**: Verification report shows all counts match (source JSON = Supabase rows)
- **Benchmark 3**: All foreign keys valid (no orphaned products)
- **Benchmark 4**: Every product has non-empty `image_links` array
- **Benchmark 5**: ASIN column is NULL for all products (expected — documented in report)
- **Benchmark 6**: Homepage sections count = hero banners (6) + cards (from sections)
- **Benchmark 7**: Navigation rows > 0, all have valid `route` and `label`
- **Benchmark 8**: Site settings row exists with `brand_name = 'Athletica'`

## Files you'll likely create

- `scripts/import-data-to-supabase.ts` (or `.js`) — the import script
- `scripts/import-verification-report.json` (or `.md`) — the verification output
- Uses `@supabase/supabase-js` with service role key

**Reminder**: In your implementation report, explain your mapping decisions (e.g., why you chose text[] for sizes, how you handled missing ASINs, how you built category hierarchy). If you hit data quality issues (duplicates, malformed data), document them and how you resolved them.

---

**Note on ASINs**: The user confirmed ASINs don't exist in the source data. This is a known gap — the import will populate everything else, and ASINs will be added later via the admin (ARCH-005/007) or a separate enrichment step. The verification report must explicitly call out "ASINs: 0/XX populated (expected — not in source)."