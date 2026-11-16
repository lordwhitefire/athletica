# Builder Task: ARCH-04 — Move the Customer Website onto the Product Service

## What we're building

Rewire every **customer-facing** page that reads product data so it reads through the Product Service (`frontend/src/lib/products/product-service.ts` + `types.ts`) built in ARCH-03 — instead of the legacy JSON-file and in-memory filtering paths. The old files stay in the repo (deletion is a later task, ARCH-09); they just stop being the source for page rendering.

## Why it matters

The Product Service is the single data access layer. Right now the customer site still reads `data/products/*.json` and filters entire arrays in memory (homepage carousels, search, category pages, related products). That path:
- is inconsistent with the Supabase-backed catalog (which now has model hierarchy, brands, categories as entities),
- scales badly (fetching everything and filtering in JS),
- can't express model-hierarchy queries (root model, sub-model, color variants) that the service now supports.

After this task, the customer site and the catalog share one source of truth, and the model hierarchy becomes visible to shoppers (model-line related carousels, ancestry breadcrumbs).

## The current data flow (what exists today)

### Legacy read libraries (stay in repo, stop being called by pages)

| File | What it does today |
|---|---|
| `src/lib/getProducts.ts` | Reads all `data/products/*.json`, exports `getAllProducts`, `getProductBySlug`, `getProductsByModelPrefix`, `getProductsByBrand`, `getProductsByTraction`, `getAllBrands`, `getAllCategories` |
| `src/lib/getHomepageJson.ts` | Reads `data/homepage.json`; `getHomepageConfig()` / `getHomepageSections()`; **`getProductsForCarousel(section)`** — derives filters from a section link by string heuristics (`deriveFilterFromLink`), then filters the full product array in memory with `filterProducts()` |
| `src/lib/filterProducts.ts` | Pure in-memory filter/sort over the full product array (`ActiveFilters` shape) |
| `src/lib/generateFilters.ts` | Computes facet options (brands, models, colors, genders, sizes, price range) from an in-memory product array |
| `src/lib/getProductsSanity.ts` | Sanity GROQ product reads (legacy path, not used by these pages) |

### Customer pages that consume product data

| Page | How it reads today |
|---|---|
| `src/app/page.tsx` (homepage) | `getHomepageConfig()` + `getHomepageSections()` from JSON; for each `product_carousel` section calls `getProductsForCarousel(section)` (JSON + in-memory filter) |
| `src/app/[...slug]/page.tsx` (catch-all: product + category pages) | `getAllProducts()` (JSON) + `getNavigation()` (JSON) → `resolveRoute(slug, products, navigation)`. Product: related lists via `getProductsByModelPrefix` / `getProductsByBrand` / `getProductsByTraction`, breadcrumbs via `splitModel(product.model)`, amazon link via `getAmazonLink(product.id)`. Category: passes **all products** to client `CategoryPage` which filters/sorts/paginates **in the browser** |
| `src/app/search/page.tsx` | `getAllProducts()` then in-memory `.filter()` across model/brand/name/category/color/traction |
| `src/components/category/CategoryPage.tsx` (client) | Receives `allProducts: Product[]`; builds `activeFilters` from URL searchParams; `filterProducts(allProducts, activeFilters)` + `generateFilters(...)` in the browser; paginates by slicing |
| `src/components/product/ProductPage.tsx` (client) | Receives product + 3 related arrays + breadcrumbs as props; renders gallery from `main_image`/`image_gallery`, price from `price.current`, sizes from `sizes[]` |

### Legacy `Product` type (`src/types/product.ts`)

Components expect: `id`, `url_slug`, `model`, `brand` (string), `category` (string), `traction`, `name`, `main_image`, `image_gallery`, `thumbnail`, `color`, `color_variants`, `price: { current, original, discount_percent, member_price, currency }`, `sizes: Size[] ({ size, available, stock })`, `description` (rich object).

### Service types (`src/lib/products/types.ts` — from ARCH-03)

`ProductSummary`: `id`, `slug`, `name`, `model`, `brand: {id,slug,name,logo_link}`, `category: {id,slug,name}`, `leaf_model: {id,slug,name,parent}`, `price: number | null`, `color`, `gender`, `image_links: string[] | null`, `status`, `asin`. `ProductWithRelations` adds `description` (jsonb), `attributes`, `sizes: string[]`, `model_ancestry`, `color_variants`.

**The shape mismatch is real and deliberate** — the service returns the canonical catalog shape, components consume the legacy presentation shape. Part of this task is bridging them.

## What to build

Rewire the four customer-facing entry points to the Product Service. Design decisions are yours, but here are the constraints and the shape of the target.

### 1. Product detail (catch-all, `[...slug]/page.tsx`)

- Resolve products via `getProductBySlug(slug)` (service) instead of `getAllProducts()` + find.
- Build breadcrumbs from `getModelAncestry(leafModelId)` (service) instead of `splitModel(product.model)`.
- Related carousels:
  - "More {leaf} Boots" (same model line) → `getColorVariants(leafModelId)` or products by leaf/root model.
  - "More {brand} Products" → `getProducts({ brand: brandSlug })`.
  - "More {traction} Boots" → traction is stored in `attributes` (jsonb) on products; filter via the service (extend the service only if the filter is genuinely missing — see note below).
- Amazon link: keep using `getAmazonLink(product.id)` unchanged (Amazon Affiliate Service is a later task).
- Category resolution still uses `getNavigation()` + `resolveRoute` (navigation moves to Supabase in a later task) — but product lookup uses the service.

### 2. Category pages (catch-all + `CategoryPage.tsx`)

Target: **server-side, database-side filtering**. The URL searchParams (brand, model, traction, color, gender, size, min_price, max_price, sort, page) drive a `getProducts(filters)` call; the page renders the returned page + total. `CategoryPage` stops receiving the full catalog and stops filtering the whole array in the browser.

- Map the legacy `ActiveFilters` URL params to the service `ProductFilters` (slugs/IDs). Note the semantics differ:
  - legacy `model` filter is a display label (e.g. "Predator"); service filters by model IDs — translate via `getRootModels` / `getSubModels` / `getLeafModelsByRoot` name matching, or match by slug.
  - legacy `category`/`brand` are display names; service expects slugs (resolve via a lookup, or extend the service with a slug/name resolver if needed).
  - `traction` and other attributes live in `attributes` jsonb — you may need a small service extension to filter by attribute values (e.g. `traction = FG`). This is acceptable: the service is the data layer; extend it where the storefront genuinely needs a filter it lacks, keeping the same style (database-side, typed, cached).
  - `size`: note the ARCH-10 caveat — stored sizes are mixed format ("42 EU" vs "8"); the filter is exact-match. Keep the existing URL param names; document any mismatch.
- Facets (sidebar): still generated, but **not** from a full catalog array in the browser. Compute them from the database (e.g. distinct values via service/supabase queries, or from a representative result set). Do not fetch the whole table to the client.
- Pagination and counts come from `PaginatedResult` (total, page, pageSize, totalPages) — stop slicing the full array.

### 3. Search (`src/app/search/page.tsx`)

- Use `searchProducts(query, filters?)` from the service.
- Keep the same URL contract (`?q=`).

### 4. Homepage product carousels (`src/app/page.tsx`)

- Keep the homepage section **config** reading from JSON for now (moving config to Supabase `homepage_sections` is a later task, ARCH-06).
- Replace `getProductsForCarousel(section)` (JSON + `deriveFilterFromLink` + in-memory filter) with service calls:
  - Sections whose `link` encodes a category/brand/model path → derive a `ProductFilters` (reuse the intent of `deriveFilterFromLink`, but map to service filter shape) and call `getProducts(filters, { pageSize: limit })`.
  - Sections with no meaningful link/filter → `getFeaturedProducts({ limit })`.
- `getCachedProducts`/cache tags on the service already handle dedupe; let pages use the cached variants.

### Bridging the shape mismatch

You have two legitimate options; pick one and apply it consistently:
1. **Adapter/mapper**: keep the existing components mostly as-is; in the page layer, map service `ProductSummary`/`ProductWithRelations` → the legacy component-facing shape (e.g. `price.current` from numeric price, `sizes` from `string[]` with `available: true`, `main_image` from `image_links[0]`, `url_slug` from `slug`, `brand`/`category` as display strings). Least churn; keeps `types/product.ts` consumers untouched.
2. **Component evolution**: migrate components (ProductInfo, ProductCard, ImageGallery, CategoryPage props) to the service types directly and update `types/product.ts` consumers. Cleaner end-state, larger diff.

Either is acceptable; the benchmarks below are about behavior, not which option. If you choose option 1, put the mapping in one place (`src/lib/products/product-adapter.ts` or similar) — not scattered across pages.

## Boundaries — what NOT to do

- **Don't delete** the legacy libs (`getProducts.ts`, `getProductsSanity.ts`, `filterProducts.ts`, `getHomepageJson.ts`, `generateFilters.ts`, `types/product.ts`). They stay for now; ARCH-09 removes them.
- **Don't touch navigation** — `getNavigation()` stays JSON-based until ARCH-06.
- **Don't touch admin** — admin pages are ARCH-05.
- **Don't build the Amazon Affiliate Service** — ARCH-07.
- **Don't move homepage/navigation/editorial/settings content to Supabase** — ARCH-06.
- **Don't rewrite the Product Service's architecture** — extend it only where a genuine storefront filter is missing (attribute/traction filters, facet queries), following its existing conventions.
- **Don't do client-side catalog filtering** — the whole point is database-side.

## Acceptance benchmarks

| # | Benchmark |
|---|---|
| 1 | Product page `/adidas-predator-elite-fg-black` (or any real slug) renders from Supabase via the service — brand, category, leaf model, ancestry breadcrumb, images from `image_links`, price from DB. Related carousels populated from service calls, not JSON. |
| 2 | Category page (e.g. `/boots`, `/boots/adidas/predator`, a nav-resolved URL) shows correct product counts, pagination, sorting, and filters — all applied database-side (verify via Network tab: single Supabase request per logical query, no full-table client fetch). |
| 3 | Category page URL params (`?brand=adidas&color=Black&sort=price_asc&page=2`) produce DB-filtered results matching the old in-memory filter for the same inputs (spot-check at least 3 URLs). |
| 4 | Search `?q=predator` returns matches via `searchProducts` from the service. |
| 5 | Homepage product carousels render products from the service; sections with links filter by the section's intended category/brand/model; sections without links use featured. |
| 6 | Model-line related products on the product page use the model hierarchy (leaf model / root model / color variants), not `splitModel` string heuristics. |
| 7 | No customer page imports the legacy read functions for product data anymore (grep check: `getAllProducts`, `getProductsByModelPrefix`, `getProductsForCarousel`, `filterProducts` are no longer imported by app/components — they may remain in the repo, unused by the customer site). |
| 8 | TypeScript compiles; no `any` in new code; mapping layer is centralized if option 1 chosen. |
| 9 | Performance: cached page render < 100ms for service queries; uncached product page < 500ms; category/search pages respect pagination (no unbounded queries). |
| 10 | All pre-existing customer-site pages still render (homepage, product, category, search, cart, checkout, account, legal) — no regressions introduced by the rewiring. |

## Files you'll likely create/modify

- `src/app/page.tsx` — homepage carousel payload via service
- `src/app/[...slug]/page.tsx` — product/category data via service
- `src/app/search/page.tsx` — search via service
- `src/components/category/CategoryPage.tsx` — stop full-catalog filtering; render DB results (may split into server wrapper + client display)
- `src/components/product/ProductPage.tsx` + related subcomponents — as needed for the bridging option chosen
- `src/lib/products/product-service.ts` / `types.ts` — only if a genuine storefront filter is missing (attribute/traction, facet queries, slug/name resolver)
- `src/lib/products/product-adapter.ts` — only if option 1 (mapping layer)
- `src/lib/model.ts` usage — replace `splitModel`/`joinModel` usages on the product page with service hierarchy data where applicable

## Files you'll use (read-only reference)

- `src/lib/products/product-service.ts`, `src/lib/products/types.ts` — the service (ARCH-03)
- `src/lib/getProducts.ts`, `src/lib/getHomepageJson.ts`, `src/lib/filterProducts.ts`, `src/lib/resolveRoute.ts` — legacy behavior reference (for equivalence spot-checks)
- `src/types/product.ts` — legacy component-facing shape
- `src/lib/supabase/types.ts` — generated DB types

In your implementation report: explain the bridging choice (adapter vs component evolution) and why, how you mapped `ActiveFilters` → `ProductFilters`, any service extensions you made (and why they were genuinely needed), and how facets are computed now. If the mixed-format sizes (ARCH-10) block a size filter, say so explicitly with evidence.