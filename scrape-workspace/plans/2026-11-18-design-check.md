# Design check — openspec architecture vs the data we need to fetch

Date: 2026-11-18
Source read: `openspec/changes/athletica-architecture/{proposal,design}.md`,
`specs/product-catalog/spec.md`, `specs/product-data-access/spec.md`,
`openspec/tasks/DATA-SEED-01/task.md`.

## What the design mandates (and the fetch must obey)

1. **Supabase is the single source of truth** for products and text content; Sanity holds image
   assets only, referenced by links stored in Supabase. No product copies in JSON/Sanity.
2. **One Product Service** is the only access path; filtering, sorting, search and pagination run
   in the database.
3. **Category-anchored model hierarchy.** Every model chain must be anchored to exactly one
   category. Valid shapes: category → product model; category → brand → product model;
   category → brand → root → submodel → … → product model. Brand is optional, category is not.
4. **Product model invariant.** A terminal node (product model) references exactly one product.
   0 products = branch; 1 = product model; 2+ must restructure into a submodel with one child per
   variant. The write path restructures automatically.
5. **Import parses hierarchy from the source `model` string**, e.g.
   `Predator/League-FT-(FG/MG)` → root Predator → sub League → product model League FT FG/MG.
6. **Navigation is content** pointing at categories/routes — it must not duplicate products.
7. **Data quality** reports missing ASIN, images, category, product model, duplicates, and any node
   with 2+ products.

## Where the live data diverges from the design

| # | Finding | Design impact |
|---|---|---|
| 1 | `categories` has 4 roots (Boots, JERSEYS, MATCH BALLS, Test Football Boots); the menu has 10 roots (adds Multi-Stud Boots, Indoor Shoes, Shin Guards, Socks, Kits, Apparel, Clothing) | The fetch must create the menu's categories first; category-anchored models cannot exist without them. |
| 2 | 127 models, but only 20 have `category_id`; 107 are unanchored | Violates the category-anchored rule today. Every imported chain must be anchored during ingest, and existing chains need backfilling. |
| 3 | Model roots mix product lines with teams/clubs: ARSENAL, CHELSEA, MANCHESTER CITY sit alongside PREDATOR, F50, MERCURIAL | These belong under Jerseys/Kits categories, not Boots. A single global model tree cannot satisfy the doctrine; chains must be anchored per category. |
| 4 | Menu tree duplicates brand/model taxonomy (Boots → Adidas → Predator) that also lives in `models` | Design says navigation points at categories/routes. Need a rule for menu nodes that are brands/models/teams/players/colours: resolve to category, model route, or content, or the two trees drift. |
| 5 | ASIN missing on 30 of 40 products | Affiliate/Amazon link generation is incomplete; the fetch must include ASIN per product. |
| 6 | Product-model invariant holds now: 39 leaf models with exactly 1 product, 0 with 2+; 1 product has null leaf model | Good — the import must preserve this (one product per terminal node, variants as sibling product models). |
| 7 | Frontend `.env.local` keys are legacy and disabled; live store renders no menu and "Unable to load homepage" | Not a design flaw, but it blocks end-to-end verification of any fetched data until new Supabase keys are set. |

## Design gaps / ambiguities to settle before the pull

1. **The category set is not specified in openspec.** The design says categories are owned by the
   product database but never enumerates them. The menu (10 roots, 333 nodes) is the de facto
   target; it should be written into the spec as the category/navigation contract.
2. **Model-string grammar is boot-centric.** `Predator/League-FT-(FG/MG)` works for boots; jerseys,
   kits, balls, socks and apparel need their own grammar (e.g. `LaLiga/Real/Madrid Home`,
   `Nike/Mercurial/Superfly`). The import parser must be per-category.
3. **Non-product menu nodes are unclassified.** Players (CR7, Messi), colours (Black, Yellow),
   "Classic", "Latest Collections" are neither categories nor models. They need a home: category,
   attribute filter, or editorial content.
4. **Image ownership is unresolved operationally.** Design says Sanity links in Supabase, but the
   fetch must either upload assets to Sanity or store existing CDN links. No ingest path is specified.
5. **Navigation vs model duplication.** The menu encodes the same brand/model hierarchy as
   `models`. Either navigation becomes a projection of categories/models (generated), or it stays
   hand-authored content that must be kept in sync. The design leans to content but does not say how
   sync is enforced.

## Verdict

The design is internally coherent and the live schema mostly matches it (products, brands, models,
category_links, RLS, service layer all exist). The product-model 1:1 invariant currently holds.
The blockers are data completeness, not architecture: the category set is too small for the menu,
107 models are unanchored, ASINs are missing, and the frontend cannot reach Supabase with its
current keys. The fetch plan must start by materialising the menu as categories and anchoring every
model chain, then attach products with the full field set.