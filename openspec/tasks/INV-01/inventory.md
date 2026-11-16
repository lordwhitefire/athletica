# INV-01 — Rainforest Field Inventory (ASIN `B0FN655XF8`)

## Probe metadata

- ASIN: `B0FN655XF8` (adidas Real Madrid 25/26 Men's Third Jersey)
- Amazon domain: `amazon.com`
- Date: 2026-09-05
- Credits: **1 spent, 99 remaining** (exactly 1 request, `success=true`, HTTP 200)
- Raw response saved to: `inv01-B0FN655XF8.json` (repo root, git-ignored)
- Response shape: `request_info`, `request_parameters`, `request_metadata`, `product`

## Field inventory mapped against the rollout schema

Each rollout schema field → source in the Rainforest response → populated/empty → type/sample.

| Schema field | Rainforest source | Status | Type / sample |
|---|---|---|---|
| `name` | `product.title` | Populated | string — `adidas Real Madrid 25/26 Men's Third Jersey (US, Alpha, Small, Regular, Regular, Blue Bird)` — **polluted with variant tokens** (size/fit/color repeated) |
| `slug` | — | **Missing** | none; must be derived |
| `price` | `product.buybox_winner.price` | Populated | `{ value: 70.2, symbol: "$", currency: "USD", raw: "$70.20" }` — buybox (featured offer) only |
| `asin` | `product.asin` | Populated | string — `B0FN655XF8` |
| `gender` | (implicit) | **Missing** | only `"Department: mens"` buried in `specifications_flat` prose — no clean field |
| `color` | `product.color` | Populated | string — `Blue Bird` |
| `collection` | — | **Missing** | search_alias is just "All Departments" |
| `tagline` | — | **Missing** | |
| `subtitle` | — | **Missing** | |
| `intro` | (prose source) | **Missing** | `product.description` exists — long marketing copy, can feed it but isn't one |
| `key_benefits` | (weak source) | **Missing** | `feature_bullets` = **1 bullet** (`Slim fit Crewneck 100% polyester...`), not structured benefits |
| `technical_details` | `product.specifications` | **Partial** | 26 name/value pairs (dimensions, care, fabric, material, weight, UPC, origin, department) — raw, not styled copy |
| `adjustment` | — | **Missing** | apparel/footwear-specific — Amazon gives none |
| `range` | — | **Missing** | |
| `sole_type` | — | **Missing** | n/a for jerseys; likely none for footwear either |
| `upper_material` | — | **Missing** | `product.material` (`Polyester`) is a proxy, not sized/apparel-specific |
| `traction` | — | **Missing** | |
| `main_image` | `product.main_image.link` | Populated | string URL — `https://m.media-amazon.com/images/I/41CCTWpslmL.jpg` — low-res, one image |
| `images[]` | — | **Missing** | **no gallery at all** — `main_image` is the only image Amazon returned |
| `meta` | — | **Missing** | SEO title/description/keywords must be authored |
| `tags[]` | (weak source) | **Missing** | `categories`/`categories_flat` (`Sports Fan Jerseys`) and `bestsellers_rank` could inform tags, but no explicit tags |
| `box_contents` | — | **Missing** | |
| `sizes` | — | **Missing** | `has_size_guide=true` is just a boolean — **no size data returned** |
| `sizes_detail` | — | **Missing** | |
| `availability` / stock | `product.buybox_winner.availability` | Populated | `{ type: "in_stock", stock_level: 1, raw: "Only 1 left in stock - order soon.", dispatch_days: 1 }` |

**Progress: 8/25 schema fields have a usable source in one Rainforest product response. 17/25 are missing/partial and need the research agent.**

## Also returned by Rainforest (not in the rollout schema — free bonuses)

- `brand` — adidas
- `rating` 5.0, `ratings_total` 6, `rating_breakdown`, **2 `top_reviews`** (body, rating, date, profile, verified)
- `categories` (5-deep) + `categories_flat` = `All Departments > Sports & Outdoors > Fan Shop > Clothing > Jerseys`
- `bestsellers_rank` — #164,380 Sports & Outdoors; #595 Sports Fan Jerseys
- `first_available` — 2025-10-10
- `weight` 6.4 oz, `dimensions` 12.2 x 8.19 x 1.34 in
- `keywords` / `keywords_list` (title tokens)
- `buybox_winner` extras: `new_offers_count: 3`, `shipping: $12.90`, `return_policy` (30-day), `third_party_seller` (Voadera), FBA/fulfillment flags
- `feature_bullets` + `feature_bullets_flat`

## Two-column list — the point of this probe

### Rainforest gives us (can trust & display)
- ASIN, link to product page
- Name/title **but it's dirty** — repeated variant tokens need cleaning before display
- Buybox price + currency ($70.20 USD) and shipping ($12.90)
- Stock / availability ("Only 1 left in stock - order soon", stock_level 1)
- Color (Blue Bird), brand (adidas), material
- One main image (low-res, no gallery)
- Marketing description + 1 feature bullet
- Raw specifications table (26 key/value rows)
- Ratings count + breakdown + a couple of review snippets
- Amazon category path, bestseller ranks, release date
- Fulfillment/seller metadata (3rd-party seller, FBA, return policy)

### The research agent must supply (empty/missing — no usable source)
- slug (derived from a cleaned name)
- clean name (strip the `(US, Alpha, Small, ...)` variant noise)
- gender (mens hidden in spec prose only)
- collection
- tagline, subtitle, intro (structured copy)
- key_benefits (structured, from feature bullets/description)
- technical_details as styled marketing copy (raw specs exist but need rewriting)
- adjustment, range, sole_type, upper_material, traction (fit/property fields — **Amazon returns none**)
- images[] (gallery — Amazon gave only 1 image; needs external sourcing)
- meta (SEO title/description/keywords)
- tags[]
- box_contents
- sizes / sizes_detail (size chart flagged `has_size_guide` but no data)

## Implications for the upcoming architecture (no decisions made yet — findings only)

1. **One Rainforest product call is NOT enough to fill the schema.** 17/25 fields must come from elsewhere — mostly prose/setup work the research agent must write, plus image gallery and size data Amazon doesn't expose.
2. **`availability`/stock data has a shape already** Rainforest offers it (`type`, `raw`, `stock_level`, `dispatch_days`) — worth modeling when ingestion is designed.
3. **`technical_details` is the closest to a freebie** — the 26-row specifications table maps nearly 1:1.
4. **Images are the biggest gap.** After the probe-spend rule (1 request/ASIN), don't expect the product endpoint to return a gallery.