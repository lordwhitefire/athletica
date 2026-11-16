# Tester Task: ARCH-004 — Verify the Customer Website Reads Through the Product Service

## What behavior to verify

The customer-facing pages (homepage product carousels, product detail, category pages, search) must now get their product data from the Product Service (`src/lib/products/product-service.ts`) backed by Supabase — not from `data/products/*.json` with in-memory filtering. The catalog and the storefront share one source of truth, and model-hierarchy data (ancestry, leaf/root models, color variants) is used where the old code used string heuristics.

The old JSON read libraries may still exist in the repo, but **no customer page may import them for product data anymore**.

## Setup

1. Start the frontend dev server (or the built app) and open Chrome.
2. Have Lighthouse (`~/Lighthouse`) ready.
3. You will verify **behavior** via: rendered pages in Chrome, the Network tab (which requests go where, how many), and a code-level grep. No screenshots, no pixel comparisons.

## How to verify

### 1. Product detail page — service-backed, model hierarchy used

Open a real product URL, e.g. `http://localhost:3000/adidas-predator-elite-fg-black` (use an actual slug from the DB if different; you can get slugs from the admin products list or a service call).

**Check:**
- Page renders the product: name, brand, category, price, color, images, description, sizes.
- Breadcrumb shows the model ancestry (e.g. Home > Boots > Adidas > Predator > Elite FG) — from `getModelAncestry`, not from splitting the raw model string.
- Related carousels render:
  - "More {leaf} Boots" (same model line) — products sharing the leaf/root model (color variants).
  - "More {brand} Products".
  - "More {traction} Boots" (if traction exists for this product).
- Network tab: the page's data comes from Supabase (PostgREST/RPC requests), **not** from a `data/products/*.json` fetch. Spot-check the request payloads: product lookup by slug, ancestry RPC, related-products queries.
- The rendered content is equivalent to (or richer than) what the old JSON path produced for the same slug.

### 2. Category pages — database-side filtering, no full-catalog client fetch

Open a category URL, e.g. `http://localhost:3000/boots` (or a nav-resolved category like `http://localhost:3000/boots/adidas/predator`).

**Check:**
- Correct product count and grid render.
- **Network tab:** the page fetches from Supabase with filters in the request (`.eq`, `.in`, `.range`, RPC for root-model) — NOT a request that pulls the whole product table to the browser, and NOT a JSON fetch.
- **Facets/sidebar** render brand/model/color/gender/size/price options without downloading the full catalog to the client.
- Pagination controls reflect `total`/`totalPages` from the service.

**Filter spot-checks (at least 3 URLs):** apply URL params and confirm results match the legacy in-memory filter for the same inputs. Use the old behavior as reference (`filterProducts` semantics): e.g.

| URL | Expected |
|---|---|
| `/boots?brand=adidas&sort=price_asc` | Adidas boots sorted by price ascending; count matches old filter |
| `/boots?color=Black&page=2` | Black boots, page 2, correct total |
| `/boots/adidas/predator?brand=adidas` | Products under the Predator line (root/leaf model filter), still brand-consistent |
| `/boots?min_price=50&max_price=100` | Products in price range |
| `/boots?size=42%20EU` (or whatever format is in the DB) | Products with that size — note the ARCH-10 mixed-format caveat: if the stored format is `"42 EU"`, filtering by `"42"` will return nothing; that is a **known data issue, not a regression** — but report it clearly |

If any of these produce obviously wrong results (wrong brand showing, wrong sort, count wildly off), that is a failure — report it.

### 3. Search — service-backed

Open `http://localhost:3000/search?q=predator`.

**Check:**
- Results come from Supabase (Network tab: search query request).
- Returns products matching name/model/brand/color (same fields the old in-memory search covered).
- Empty query → empty results (no crash).

### 4. Homepage — carousels from the service, config unchanged

Open `http://localhost:3000/`.

**Check:**
- Hero carousel renders (config still from JSON — fine).
- Each product carousel section renders products.
- Network tab: carousel product payloads come from Supabase via the service (cached variants OK), **not** from `data/products/*.json`.
- Sections with links filter by the intended category/brand/model; sections without links use featured products. Spot-check one linked carousel's contents against the section's link semantics (e.g. a carousel linking to `/boots/adidas/predator` should show Predator-line boots).

### 5. No legacy imports on the customer site

Run from the repo root:

```bash
rg -l "getAllProducts|getProductsByModelPrefix|getProductsForCarousel|filterProducts|getProductsSanity|getAllProductsSanity" frontend/src/app frontend/src/components
```

**Expected:** no output (empty). If any customer page/component still imports these, that's a failure — list the offenders.

Also check that nothing in `app` or customer components fetches product data directly from `data/`:

```bash
rg -l "data/products|data/homepage.json" frontend/src/app frontend/src/components
```

The homepage config read of `data/homepage.json` in `src/lib/getHomepageJson.ts` is allowed to remain (ARCH-06 moves it), but **no product payload** should come from `data/products`.

### 6. No regressions on other customer pages

Spot-check that these still render without errors (they may not use the service, but must not break from the rewiring):
- `/cart`, `/checkout`, `/account`, `/orders`, `/returns`, `/terms`, `/privacy-policy`, `/cookies`, `/login`, `/register`.

### 7. TypeScript compiles

```bash
npx tsc --noEmit
```

in `frontend/`. Any NEW type errors from this task are failures; pre-existing errors outside the touched files should be listed separately (do not count them as failures if they were already there — but note them).

### 8. Performance spot-check

In the Network tab / console timing:

| Query | Target |
|---|---|
| Product page load (cached) | < 100ms for the service queries |
| Product page uncached | < 500ms |
| Category page (cached) | < 150ms for service queries |
| Search | < 300ms |

Note: Next.js caches (revalidate 60s) apply — repeat calls should be fast.

## What to report

Write a plain-language report covering:

1. **Product page** — renders from Supabase via service; ancestry breadcrumbs; related carousels correct (model line uses hierarchy, not string heuristics); images from `image_links`; no JSON fetch in Network tab.
2. **Category pages** — DB-side filtering confirmed (Network tab); facets without full-catalog download; pagination/count correct; the URL spot-checks all matched the legacy filter behavior (list each URL + result). Any mismatch = failure.
3. **Search** — service-backed, same coverage as before.
4. **Homepage** — carousel payloads from service; linked sections filter correctly; config still JSON (expected).
5. **Legacy imports** — the two `rg` checks: report the output. Empty = pass; non-empty = fail with offenders.
6. **Regressions** — the legal/account/cart/checkout pages render.
7. **TypeScript** — `tsc --noEmit` result; new errors vs pre-existing.
8. **Performance** — timings vs targets.
9. **Surprises** — size-format caveat (ARCH-10) if it affected a spot-check; any service extensions the Builder made and whether they behave; anything that looks wrong or fragile.

**No screenshots. No UI matching.** Just: *Do the pages render the right data, from Supabase through the service, with filters applied in the database, without legacy imports, without regressions, fast enough?*