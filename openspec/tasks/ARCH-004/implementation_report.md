# Implementation Report: ARCH-004 — Move the Customer Website onto the Product Service

## Summary

Rewired all four customer-facing entry points (homepage, product detail, category pages, search) to read exclusively through the Product Service built in ARCH-003. Used the **adapter/bridging option (option 1)**: service types stay canonical, a single centralized mapping layer (`src/lib/products/product-adapter.ts`) converts `ProductSummary`/`ProductWithRelations` → the legacy component-facing `Product` shape, so existing components (ProductInfo, ProductCard, ImageGallery) were left untouched. Category pages now do **server-side, database-side filtering** with pagination from `PaginatedResult`; the client `CategoryPage` is display-only. All 41 integration checks pass; the 28 ARCH-003 checks still pass; TypeScript compiles for all touched files.

## Bridging choice: adapter (option 1)

- Components consume the legacy shape (`price.current`, `sizes: Size[]`, `main_image`, `url_slug`, `brand`/`category` strings). ~10 components consume these fields.
- The canonical catalog shape is the long-term source of truth (model hierarchy, brand/category entities). Migrating every component now would double the diff and churn props through product cards, gallery, info sections.
- Mapping lives in **one place** (`src/lib/products/product-adapter.ts`) — pages never map inline:
  - `toPageProduct(p: ProductWithRelations): Product` — full detail mapping incl. `description` (parsed from the `description` TEXT column that stores a JSON string matching the legacy `Description` shape), `color_variants` (from service `color_variants`, `product_id` = slug — fixes the legacy broken `/{product_id}` variant links), price from `attributes.price` with numeric `price` column fallback, sizes from `attributes.sizes_detail` (fallback: `sizes: string[]` all-available).
  - `toPageProductSummary(p: ProductSummary): Product` — card-level mapping (no description/color_variants).
  - `toFilterOptions(facets)` — DB facets → component `FilterOptions`.
  - `activeFiltersToProductFilters(active: ActiveFilters): ProductFilters` — the URL→service contract (see below).

## ActiveFilters → ProductFilters mapping

| Legacy URL param | Service filter | Notes |
|---|---|---|
| `brand` (display name) | `brand` slug | resolved via `resolveBrandFilter` (slug-or-name lookup, slugify fallback) — case-insensitive |
| `category` (display name) | `category` slug | via `resolveCategoryFilter` — case-insensitive |
| `model` (display path, e.g. `Predator` or `Predator/Elite-FG`) | `model` (same display path) | service resolves through the model hierarchy: root/child name matching per segment; products matched via leaf-model IDs (RPC), not string prefixes |
| `traction` | `traction` (jsonb `attributes->>traction`) | service extension, see below |
| `color` / `gender` | `color` / `gender` | exact case-insensitive (`ilike`) |
| `size` (exact match) | `sizes` | jsonb containment: `attributes` ⊇ `{ sizes_detail: [{ size, available: true }] }` — available-only, like legacy |
| `min_price` / `max_price` | `priceMin` / `priceMax` | on the numeric `price` column |
| `sort` | `sort` | `biggest_discount` → `newest` (no discount column to order by; documented) |
| `page` | `page` | pagination now server-side |

Documented limitations (multi-value URL params): brand, model, color, gender, traction, size take **first value only** (legacy URL contract was effectively single-value too, but arrays were tolerated).

## Service extensions (genuinely needed, kept to the service's existing conventions)

1. **`traction` filter** — `eq('attributes->>traction', value)` (jsonb attribute; not filterable before).
2. **`sizes` filter** — `contains('attributes', { sizes_detail: [{ size, available: true }] })` (jsonb containment, exact size match, availability-aware — matches legacy `filterProducts` semantics).
3. **`model` path filter** — `resolveModelPath(displayPath)` walks root/children by name, then either `.in('leaf_model_id', RPC leaf ids)` (branch) or `.eq('leaf_model_id')` (leaf). Replaces legacy string-prefix matching with the authoritative hierarchy.
4. **Slug/name resolvers** — `resolveBrandFilter`, `resolveCategoryFilter` (brands/categories entities; slug or display name accepted, slugify fallback; unknown → `null` → empty result, matching ARCH-003's unknown-slug behavior).
5. **`getFacets` / `getCachedFacets`** — distinct values computed from a representative DB result set scoped by the **base (nav) filters only** (brands, models, tractions, colors, genders, sizes, price range). No full-table client fetch.
6. **`biggest_discount` sort → `newest`** — no DB column for discount percentage; documented as a known deviation from legacy sort semantics.

### Bugs found & fixed during verification (important)

1. **PostgREST builder is a thenable — `await`ing an async helper auto-resolves the query.** `buildFilteredQuery` was `async` and returned the raw builder; `await buildFilteredQuery(...)` in the caller caused the async wrapper to await the thenable builder, yielding the fetched `{data, error}` object — `query.order is not a function`. Fixed by returning `{ query } | null` (plain object, never a thenable).
2. **Double `.select()` drops the exact count.** `buildFilteredQuery` called `.select('*')` first, then `applyPagination` called `.select('*', { count: 'exact' })` again — count came back `null` (items present, `total=0`). Fixed: the initial select carries `{ count: 'exact' }`; pagination only applies `.range()`. (`searchProducts` got the same count on its own select.)
3. **`resolveModelPath` returned the parent's `hasChildren`** for multi-segment paths (loop left `hasChildren` set from the last parent's children count) — `Predator/Elite-FG` was wrongly reported as a branch. Fixed: final node's children are re-checked after the loop.
4. **`activeFiltersToProductFilters` silently dropped `model`** — the category-page model URL param would have been ignored (unfiltered results). Caught by the benchmark-3 spot-checks (db=29 unfiltered vs legacy=24). Fixed; `model` now maps.
5. **Test-harness-only**: `getAllProducts()` (react `cache`) returned an empty result when the Next service module (which pulls in `next/cache`/`react`) was loaded in the same tsx process. The equivalence reference in the test now reads the JSON files directly (same logic as `getProducts.ts`), and — more importantly — equivalence is asserted against the **DB's own clean dataset** mapped through the adapter, not the dirty JSON content (see Data Quality).

## Category pages — server-side filtering

- `[...slug]/page.tsx` category branch: `resolveRoute(slug, [], navigation)` for routing; URL params via `mergeBaseAndUrlFilters` (base filters from the nav path: category/brand/model); `activeFiltersToProductFilters` → `getCachedProducts(filters, { pageSize: 24 })` + `getCachedFacets(baseFilters)`; brand hero logo from facets; page/subtitle/breadcrumbs built server-side; `CategoryPage` receives only the rendered page (`products`, `filterOptions`, `totalProducts`, `currentPage`, `totalPages`, titles, breadcrumbs) and is now a display-only client component — no catalog, no in-browser filtering, no slicing.
- Product branch: `getCachedProductBySlug`, related carousels from `getProducts` (root-model / brand / traction filters), `modelLineName` from the leaf parent, breadcrumbs from `getModelAncestry`.
- Verified via benchmark 7: no customer page imports legacy readers.

## Facets

`getFacets` computes distinct brand/model/traction/color/gender/size + price range from a DB result set scoped by base filters (a few columns, not full rows, single PostgREST call). `toFilterOptions` maps to the sidebar shape. Legacy `generateFilters` no longer runs in the browser.

## Sizes (ARCH-10 caveat)

Stored sizes are mixed format (`"42 EU"` vs `"8"`); the filter is exact-match via jsonb containment and **requires `available: true`** (matches legacy). A filter for `"42"` finds nothing; `"42 EU"` works (verified: 6 products). Recommendation from ARCH-003 (normalize sizes) remains open as a cleanup task.

## Acceptance benchmarks

| # | Benchmark | Status |
|---|-----------|--------|
| 1 | Product page renders from Supabase via service (brand/category/leaf/ancestry/images/price) | ✅ (adapter checks + 41/41 integration) |
| 2 | Category page server-side filtering with counts/pagination, no full-table client fetch | ✅ (CategoryPage display-only; grep-verified) |
| 3 | 3+ URL spot-checks DB-filtered ≡ legacy semantics (on clean data) | ✅ 6 spot-checks pass; see quirks below |
| 4 | Search via `searchProducts` | ✅ (matches reference model/name search) |
| 5 | Homepage carousels from service; linked sections filter; unlinked → featured | ✅ |
| 6 | Related products via model hierarchy (root/leaf/color variants), not `splitModel` | ✅ |
| 7 | No customer page imports legacy readers | ✅ (grep: only new `getProductsForCarouselSection` match) |
| 8 | TypeScript compiles; mapping centralized | ✅ |
| 9 | Pagination respected; no unbounded queries | ✅ (`pageSize` capped at 100; pages use 24) |
| 10 | No regressions to other pages | ✅ (only customer pages touched; admin untouched) |

## Data quality findings (new in this task)

1. **Legacy JSON content is inconsistent with its filenames** (the source the old site rendered): e.g. `adidas-predator-elite-ft-fg-black.json` contains `brand: PUMA`, `category: "Jerseys "`, `model: "Manchester/City Jersey"`, `traction: null` — while its slug/URL says adidas Predator Elite FG. ~10 files are affected. The DB (imported/normalized in ARCH-001/002) carries the correct attribution (brand adidas, model Predator, category Boots, traction FG). Consequence: the old in-memory filter produced *wrong* results for brand/model/category/traction (e.g. brand=adidas → 17 instead of 27). The new site returns the **correct** sets; benchmark-3 equivalence is therefore asserted against the legacy filter *semantics* applied to the DB's clean dataset. Documented here for ARCH-09 (legacy removal).
2. **`id1323`** has model string `(Predator/Elite-AG)` (leading paren) but its leaf model sits under the Predator root — the DB hierarchy is authoritative, so it appears in model=Predator (25) while string-prefix matching would miss it (24). Expected, one-product difference.
3. **`test-product-1`** (DB-seeded test artifact) has a `price` column (129.99) but no `attributes.price`; adapter falls back to the column. Its model is "Test Model" with `leaf_model_id = null`, so it never matches hierarchy filters.
4. **Mixed-format sizes** (ARCH-10): unchanged; exact-match filter documented above.
5. **`biggest_discount` sort** maps to `newest` — no discount column exists to order by.

## Tests

- `frontend/test-arch004.ts` — 41 checks: resolvers, traction/size/color/gender filters, 6 benchmark-3 equivalence spot-checks vs legacy semantics on clean data, facets vs reference set, search vs reference, adapter mappings (summary + full detail incl. description parsing and color variants), `toFilterOptions`. **41/41 pass.**
- `frontend/test-product-service.ts` (ARCH-003) — still **28/28** after service changes.
- `npx tsc --noEmit` — clean for all touched files. Remaining errors are pre-existing: `frontend/import-data-to-supabase.ts` (leftover duplicate, recommend deletion) and `src/components/admin/*` (ARCH-05 scope).

## Files created/modified

| File | Change |
|------|--------|
| `src/lib/products/product-adapter.ts` | **New** — centralized service→legacy mapping |
| `src/lib/products/homepage-sections.ts` | **New** — `deriveProductFiltersFromLink` (ports `deriveFilterFromLink` intent to service filters), `getProductsForCarouselSection` (linked sections filter; unlinked → featured) |
| `src/lib/products/product-service.ts` | Extended: traction/sizes/model filters, `resolveBrandFilter`/`resolveCategoryFilter`/`resolveModelPath`, `getFacets`/`getCachedFacets`, count/pagination fixes |
| `src/app/page.tsx` | Carousels via service |
| `src/app/[...slug]/page.tsx` | Product + category branches rewritten on the service |
| `src/app/search/page.tsx` | `searchProducts` |
| `src/components/category/CategoryPage.tsx` | Display-only; props from server |
| `src/components/product/ProductPage.tsx` | `modelLineName` prop; `splitModel` removed |
| `test-arch004.ts` | Integration verification (41 checks) |

## Next steps

- ARCH-005 (admin on the service), ARCH-006 (homepage/navigation config to Supabase), ARCH-09 (delete legacy libs).
- Cleanup recommendations: delete `frontend/import-data-to-supabase.ts` leftover; normalize sizes format; fix the dirty legacy JSON content (or rely on ARCH-09 deletion since the DB is authoritative).