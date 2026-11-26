# Product extraction spec — exact data to fetch

Date: 2026-11-18
Purpose: the concrete field/category list a pull must return, so the store's
products, filters, navigation and model tree all work.

> **Owner ruling 2026-11-18:** price, sizes, stock and ASIN are left empty for now. The table
> below records the storage shape, not fetch targets for those four fields. Do not fetch them and
> do not fill them from another source.

## 0. Source menu (Futbolmania, 2026-11-18)

The source is the site's own layered menu: **adult + kids, 28 level-1 sections, 901 unique linked
category items**. The earlier 10-section / 333-entry subset is superseded. All access goes through
`@browser-attach` in the real Chrome window — no curl, no headless.

- Menu tree: `structures/futbolmania-menu.json`
- Full crawl (all pages, all product URLs): `structures/futbolmania-full-crawl.json`
- Summary: `structures/futbolmania-full-crawl.csv` / `.md`
- Unique products: `structures/futbolmania-unique-products.json`

The table in section 1 is the app's target category shape, not the source menu. Mapping the 28
source sections onto the app's categories is a separate step.

## 1. Category tree (target)

| Root | Subcategories | Size system |
|---|---|---|
| Boots | FG, AG, SG, MG, TF, IC | EU (36–48), half sizes |
| Apparel | Jerseys, Shorts, Tracksuits, Training tops, Socks | S–XXL (kids: 128–164) |
| Goalkeeper | Gloves, GK jerseys, GK shorts | Gloves 6–11, apparel S–XXL |
| Balls | Match, Training | 3, 4, 5 |
| Accessories | Shin pads, Bags, Water bottles | S/M/L or one-size |

Current repo only has `Boots`. Everything above `Boots` is missing.

## 2. Brands and model families (target)

| Brand | Root models |
|---|---|
| adidas | Predator, F50, Copa |
| Nike | Mercurial, Phantom, Tiempo |
| Puma | Future, King, Ultra |
| New Balance | Tekela, Furon, 442 |

Model hierarchy per root: root → submodel (Elite / Pro / League / Club / Academy) → leaf product model
(e.g. Predator → Elite → Predator Elite FT AG). The leaf is what a product attaches to, and the
model chain must be anchored to the same category as the product (DB trigger enforces this).

## 3. Fields per product (all categories)

| Field | Type / allowed values | Notes |
|---|---|---|
| `id` | text | manufacturer SKU / style code |
| `slug` | text, unique | generated from brand + model + colour |
| `name` | text | full display name |
| `brand` | existing brand | links `brand_id` |
| `category` | existing category | links `category_id` |
| `leaf_model` | existing leaf model | links `leaf_model_id`; category must match |
| `status` | published / unpublished | default published |
| `gender` | Men / Women / Unisex / Kids | |
| `color` | text | primary colourway |
| `color_variants` | list | colour, sibling product id, thumbnail |
| `price.current` | decimal | selling price |
| `price.original` | decimal | pre-discount price |
| `price.discount_percent` | int | derived if absent |
| `price.member_price` | decimal | optional |
| `price.currency` | EUR / GBP / USD | one currency per market |
| `sizes` | list | `{size, available, stock}` |
| `images` | list | main image first, then gallery; owned asset files |
| `description.subtitle` | text | |
| `description.tagline` | text | one-line summary |
| `description.intro` | text | 2–4 paragraphs |
| `description.collection` | text | pack/season name |
| `description.key_benefits` | list of strings | 3–5 bullets |
| `description.technical_details` | object | range, sole_type, upper_material, adjustment |
| `traction` | FG / AG / SG / MG / TF / IC | boots only, null otherwise |
| `asin` | text | Amazon ASIN / affiliate target |

## 4. Category-specific extras

| Category | Extra data |
|---|---|
| Boots | traction, sole_type, upper_material, adjustment (lace/strap), range |
| Jerseys | kit type (home/away/third/GK), fit, sleeve length, season, team/club |
| Shorts | fit, inseam |
| Tracksuits / jackets | garment type, full-zip/half-zip |
| Gloves | cut (flat/roll/fingersave), palm latex, size range, finger protection |
| Balls | size (3/4/5), match vs training, construction |
| Shin pads | size, protection level |
| Bags | type, capacity (litres) |
| Socks | size, crew/knee length |

## 5. Supporting records

- **Brands:** name, slug, logo (owned file).
- **Categories:** name, slug, parent_id.
- **Models:** name, slug, brand_id, parent_id, level, description.
- **Category links:** category_id + entity_type (brand/model/submodel/product_model) + entity_id.
- **Navigation + homepage:** derived from the above; no separate extraction.

## 6. Decisions

- Source: confirmed — Futbolmania (see the fetch plan).
- Store-facing language: English; original Spanish kept in `_source`.
- Scope: the 10 menu sections, full range.
- Images: downloaded and uploaded to Sanity; `image_links` holds the Sanity URLs.
- Price, sizes, stock and ASIN: left empty for now (owner ruling 2026-11-18).

## 7. Acceptance test for the pull

A category page renders from the data; filters return non-empty results for brand, model, traction,
colour and gender; every product resolves a brand, category and leaf model; the only empty fields
are price, sizes, stock and ASIN, by owner ruling.
