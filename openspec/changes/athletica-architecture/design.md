## Context

The project currently reads products from Sanity documents and from local JSON snapshots in `data/` (`products/*.json`, `brands.json`, `navigation.json`, `homepage.json`, `site-settings.json`, `amazon-links.json`), with admin product actions living in the Sanity Studio (`studio-athletica/`). The customer site (`frontend/`, Next.js 16) already depends on `@supabase/supabase-js` + `@supabase/ssr` (installed but not used for products) and `@sanity/client`.

**The admin already exists as 13 pages** (`/admin/overview`, `/admin/products`, `/admin/import-center`, `/admin/categories`, `/admin/brands`, `/admin/homepage`, `/admin/media`, `/admin/analytics` + overview/products/traffic, `/admin/affiliate-settings`, `/admin/settings`, `/admin/system-health`) with full UI and interactions. Their data is a mix: Products and Import Center call Sanity-backed server actions (`src/lib/actions/*`); the overview reads Sanity counts with hardcoded zero clicks; analytics, brands, media, homepage, affiliate settings, settings, and system health use seed/mock data or localStorage. The work is wiring these pages to real data, not building new screens.

There is no Supabase schema yet. See proposal.md — Why for the motivation; the behavior contract is in the specs.

## Goals / Non-Goals

**Goals:**
- A single data model in Supabase that answers every product question (lookup, filter, category, brand, **model hierarchy**, search, related, featured) AND stores all website text content (homepage sections, banners, marketing copy, editorial, navigation, settings).
- One product data layer (Product Service) that all pages and the admin use; filtering/sorting/pagination executed by the database.
- Sanity reduced to image asset storage only; every image is referenced by a link stored in Supabase.
- An isolated Amazon Affiliate Service so no other code builds Amazon URLs.
- An admin (existing 13 pages) wired to real data, operating the catalog without Sanity Studio, with explicit import results and clickable data quality problems.
- A migration path where each step is verifiable before the old path is removed.

**Non-Goals:**
- No payment/checkout system — purchase happens on Amazon.
- No speculative analytics beyond the business path (views → Amazon clicks).
- No full rewrite of the customer site's presentation layer in this change.
- No building of new admin screens — the 13 pages are reused as-is.
- No final multi-product Amazon cart format decision — that is verified during implementation (see Open Questions).

## Decisions

### D1: Supabase as the database for products AND text content
All product data (products, categories, brands, **model hierarchy**, attributes, ASINs, status, slugs, relationships, image links) AND all website text content (homepage sections, banners, marketing/editorial text, navigation, site settings) live in Supabase tables with migrations as the only schema-change mechanism (per AGENTS.md), and generated TypeScript types kept in sync (`supabase gen types typescript`).
**Alternatives considered:** keeping Sanity for content (rejected: the owner decided all text lives in Supabase — one database, one answer), a separate Postgres instance (rejected: Supabase is already in the stack and provides auth/RLS for the admin).

### D2: Schema shape
- `products` — id, slug (unique), name, description, price, gender, color, sizes, attributes (JSONB for flexible filtering), status, asin, category_id, brand_id, **product model reference** (column `leaf_model_id`; see D13 — a product model SHALL reference exactly one product), image links (Sanity asset URLs/refs), timestamps.
- `categories` — id, slug, name, parent (support hierarchy), timestamps.
- `brands` — id, slug, name, logo link (Sanity asset URL/ref), timestamps.
- **`models`** — id, slug (unique), name, brand_id (FK), parent_id (self-ref FK, nullable for root models), level (int: 0=root, 1=sub-model, 2=sub-sub-model), description, timestamps. Self-referential FK `parent_id → models.id` with recursive CTE for hierarchy queries. Unique constraint on `(brand_id, slug)`.
- Content tables — `homepage_sections` (type, order, title, copy, category reference, limit, image links), `navigation` (menu structure pointing at categories/routes), `editorial_content` (banners, marketing text), `site_settings` — all text in Supabase, images referenced by Sanity links.
- Relationship queries for related products (same category, same brand, same root model, same sub-model, same product model, shared attributes) — computed at query time via model hierarchy (recursive CTE on `models.parent_id`) rather than stored as denormalized links.
**Alternatives considered:** storing model as flat string on products (rejected: loses hierarchy, can't filter by root/sub-model), storing related products explicitly (rejected: derived queries via model hierarchy are simpler and always current).

### D3: Product Service as the only access path
A single module (e.g., `frontend/src/lib/products/` or equivalent) exposes `getProduct(id)`, `getProductBySlug(slug)`, `getProducts(filters)`, `getProductsByCategory(category)`, `getProductsByBrand(brand)`, `getProductsByProductModel(model_id)`, `getProductsByRootModel(root_model_id)`, `getProductModelsByRoot(root_model_id)`, `getSubModels(parent_model_id)`, `getModelAncestry(product_model_id)`, `getColorVariants(product_model_id)`, `getRelatedProducts(product)`, `searchProducts(query)`, `getFeaturedProducts()` and the admin equivalents. Pages and admin screens never construct Supabase queries themselves. Caching and optimization live here. (Function names MAY keep their current `LeafModel` spelling internally; the behavior and the terminology in specs/UI use product models.)
**Alternatives considered:** querying Supabase directly from each page (rejected: scattering filtering/sorting/caching across pages is exactly the current problem).

### D4: Database-side filtering
All filtering/sorting/pagination executes in Supabase queries (PostgREST), never by loading the catalog into the browser. Model hierarchy filtering uses recursive CTE on `models.parent_id`.
**Alternatives considered:** client-side filtering (rejected: catalog is large and the architecture doc forbids it).

### D5: Image assets stay in Sanity; links live in Supabase
Sanity stores the image files only. Product records, brand records, homepage sections, and editorial content store the links (Sanity asset URLs/refs) needed to display those images. No text or product data is duplicated into Sanity.
**Alternatives considered:** migrating images out of Sanity (rejected: Sanity already serves them; unnecessary churn), keeping content in Sanity alongside images (rejected: owner decision — all text in Supabase).

### D6: Homepage and navigation as Supabase content referencing products
Homepage sections (Supabase) declare queries (e.g., category + limit, root model + limit) or explicit product references (IDs only). Navigation (Supabase content) points at Supabase categories. The frontend resolves sections/navigation through the Product Service. No product copies anywhere.
**Alternatives considered:** keeping the current JSON homepage/navigation snapshots (rejected: they are a second source of truth), keeping homepage in Sanity (rejected: all text lives in Supabase).

### D7: Cart stores IDs + quantities
Cart state stores product IDs and quantities (zustand is already a dependency for client state). When displayed, the app fetches current product info through the Product Service.
**Alternatives considered:** cart holding full product snapshots (rejected: stale data and duplicated product objects).

### D8: Amazon Affiliate Service owns all Amazon URL logic
One module builds product links and cart links from ASINs + affiliate configuration, and validates Amazon data. Nothing else constructs Amazon URLs. The multi-product Amazon cart format is isolated here so only this module needs updating when the format is confirmed (see Open Questions).
**Alternatives considered:** inline link building in pages (rejected: scattered URL rules are a maintenance hazard).

### D9: Admin = reuse the 13 existing pages, replace their data sources
The admin UI already exists (dashboard, catalog, import center, categories, brands, **models**, homepage, media, analytics, affiliate settings, settings, system health). The work is wiring each page's interaction layer/server action to the correct source: catalog, import, categories, brands, models, homepage text, navigation → Supabase through the Product Service; media uploads → Sanity with links stored in Supabase; analytics → real event data. Sanity Studio remains available for image upload only; it is not required for product or content operations.
**Alternatives considered:** rebuilding the admin in Sanity Studio (rejected: the owner must not need to understand Sanity/technical tooling), rebuilding the admin screens from scratch (rejected: they already exist and match the spec).

### D10: Bulk import keeps the proven workflow, changes the sink
The existing upload → preview → validation → confirm flow is preserved; the final save target changes from Sanity to Supabase. Import reports created/updated/duplicates/missing-field/failed rows explicitly. **Import must parse model hierarchy from source `model` field (e.g., "Predator/League-FT-(FG/MG)" → root: Predator, sub: League, sub-sub: League FT FG/MG) and upsert the model hierarchy before upserting products.** Imported products land on **product models** (see D13): if a resolved node already has a product, the node becomes a submodel and each variant gets its own product model.
**Alternatives considered:** rebuilding the import UX from scratch (rejected: the workflow already exists and works).

### D11: Analytics events at the business boundaries
Record product views and Amazon clicks (and search activity where available) as events; derive CTR, top products/brands/categories from them. Keep the model minimal until the owner needs more.
**Alternatives considered:** a full product-analytics platform (rejected: against the spec's "no speculative analytics" requirement).

### D12: Migration in verifiable steps
Follow the migration steps below: schema → data import → data layer → website → admin wiring → content move → affiliate service → data quality/analytics. Each step keeps the old path working until the new one is checked against it (parallel run for reads; data import verified by counts/IDs/fields before switchover).
**Alternatives considered:** big-bang rewrite (rejected by the architecture document itself).

### D13: Product model — the terminal node, one product per node (owner decision 2026-08-20)
The model tree's terminal nodes are **product models**: a model node that references exactly one product. Node type is **derived from what is attached**, not stored:
- **0 products directly attached** → branch node (root model or submodel); may have children.
- **Exactly 1 product directly attached** → **product model**; terminal, no children.
- **2+ products directly attached** → invalid state. The node becomes a **submodel**, and every variant product gets its own **product model** child under it (named after the node + the product's variant, e.g. "Predator Elite FG" with two colors becomes submodel "Predator Elite FG" with product models "Predator Elite FG Black" and "Predator Elite FG White").

The restructure happens automatically on every write that would attach a second product to a node (product create, update, import, variant add): the existing product(s) move to their own product-model children, the node stays a branch, and the new product gets its own product model. Existing data is migrated once (the current 21-model tree with shared leaf models is split into per-product product models). `products.leaf_model_id` keeps its column name (implementation detail); 1:1 is enforced by app logic plus an optional partial unique index via migration (user applies migrations). The "leaf model" term is replaced by "product model" in specs, UI, and admin (the models page shows brand → root model → submodel → product model with product counts).
**Alternatives considered:** keeping shared leaf models with color variants hanging off one node (rejected by owner: two products under one node means two distinct product models; the tree must always decompose to one product per terminal node), storing node type as a column (rejected: type is fully derived from product counts and would drift).

## Risks / Trade-offs

- **Supabase schema grows (products + content + models)** → migrations + generated types keep the schema authoritative; content tables stay schema-light and are edited through the admin, not ad-hoc.
- **Data import correctness** → Step 2 verifies count, IDs, categories, brands, ASINs, images, required fields, **model hierarchy linkage** before the website switches; the old JSON/Sanity reads remain available during verification.
- **Amazon multi-product cart format may not support arbitrary product sets** → the format is verified during implementation; the Affiliate Service isolates the risk so fallback (per-product links) can be implemented in one place.
- **Attribute flexibility via JSONB can drift into inconsistency** → validation at the Product Service/import layer enforces known attribute keys; Data Quality surfaces anomalies.
- **Wiring 13 existing pages risks touching working UI** → each page is wired independently (interaction layer + its server action), verified against the old data source before the next; UI components stay untouched where possible.
- **Mock/seed data in analytics and system health could be mistaken for real** → wiring replaces seed data with real queries; the pages stay visible during migration so the difference is obvious.
- **RLS misconfiguration could expose unpublished products** → customer-facing queries exclude unpublished status at the service layer and RLS enforces read policy.
- **Model hierarchy parsing from flat source** → source `model` field is a string like "Predator/League-FT-(FG/MG)"; parsing must be robust to variations. Import script parses once; admin UI manages hierarchy going forward.
- **Auto-restructure on variant writes (D13)** → the write path must never silently orphan products; the restructure moves existing products to new product-model children in the same transaction and reports what it did (Data Quality surfaces any node with 2+ direct products as an anomaly until the rule is enforced).

## Migration Plan

1. Create the Supabase schema (**products, categories, brands, models**, content tables — migrations only; regenerate TS types).
2. Import existing product data (JSON snapshots and/or Sanity export) into Supabase; **parse model hierarchy from source `model` field; upsert model hierarchy; link products to product models (terminal nodes, one product per node)**; verify counts, IDs, categories, brands, model hierarchy linkage, ASINs, images, required fields against the old system.
3. Build the Product Service on Supabase.
4. Move the website (search, category pages, product pages, homepage product sections, related products, filtering) onto the Product Service.
5. Wire admin product operations (product list, editor, bulk import, categories, brands, **models**, dashboard) to Supabase.
6. Move all text content (homepage sections, navigation, editorial text, settings) from Sanity/JSON to Supabase; reduce Sanity to image assets only, with image links stored in Supabase.
7. Build the Amazon Affiliate Service and route cart/checkout links through it; wire the affiliate settings page.
8. Wire Data Quality and analytics to real data — only after the core catalog is reliable.
9. **Product-model hierarchy (D13)** — migrate the existing tree so every terminal node holds exactly one product; update service/UI terminology (leaf → product model); enforce the 1:1 + auto-restructure rule on every write path (product create/update/import/variant).

Rollback: because steps keep the old path in place until verified, each step can be reverted by switching reads back to the previous source.

## Open Questions

- **Amazon multi-product cart URL/request format** — must be verified against current Amazon affiliate capabilities during implementation (per cart spec). The design keeps this isolated in the Amazon Affiliate Service so the decision can land later without changing specs or tasks.
- **Analytics storage** — whether events live in Supabase tables or a lightweight analytics store is an implementation choice within the analytics spec's behavior.
- **Model hierarchy parsing edge cases** — source `model` strings vary (e.g., "Predator/League-FT-(FG/MG)", "Mercurial/Superfly", "X/Crazyfast"); import script must handle 2-4 level hierarchies. Admin UI will manage going forward.
- **Product model naming for split variants** — when a node with 2+ products restructures, product models are named after the node + variant (e.g., "Predator Elite FG Black"); exact formatting for multi-attribute variants (color vs traction) is settled during implementation of the restructure task.