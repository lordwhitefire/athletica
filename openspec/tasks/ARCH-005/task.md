# Builder Task: ARCH-005 — Wire the Admin Pages to Supabase

## What we're building

Rewire the existing admin pages so their data lives in Supabase — replacing the Sanity-backed server actions and seed/mock data. The admin **UI stays as it is** (the 13 pages and their interaction layers); what changes is the data layer beneath them: every server action that currently reads/writes Sanity (or JSON/localStorage/seed) becomes a Supabase operation, and reads go through the Product Service where it already exists.

This is the last big migration step before content (ARCH-06), Amazon (ARCH-07), and analytics (ARCH-08) move over.

## Why it matters

The catalog already lives in Supabase (ARCH-01..04). The admin is the last place where the app still writes to Sanity as if it were the source of truth. If admin keeps writing Sanity, we have two divergent catalogs and the storefront (now on Supabase) will show stale/wrong data after any admin edit. After this task, editing a product in admin updates the exact row the storefront renders.

## The current state (what exists today)

### Admin pages and their data sources

| Page | Current data source | What it does |
|---|---|---|
| `/admin/products` (catalog) | Sanity GROQ via `src/lib/actions/products.ts`: `getCatalogProducts`, `getCatalogFacets` | Lists products (published + drafts from Sanity ids), in-memory filter/sort/search, missing-data flags, ASIN extracted from Sanity `amazonLinks` doc URLs, images resolved from Sanity asset refs |
| `/admin/products/[id]/edit` + `/admin/products/new` | `getProductByIdAdmin`, `createProduct`, `updateProduct`, `deleteProduct` (Sanity createOrReplace/patch/delete, image refs) | Full product form: price object, description object, sizes, image asset refs (main_image/thumbnail/gallery) |
| `/admin/products` quick create + catalog ops | `createCatalogProduct`, `updateCatalogProduct`, `bulkSetProductStatus`, `bulkAssignCategory`, `bulkAssignBrand`, `bulkSetAsin`, `bulkDeleteProducts`, `exportProductMetadata` (Sanity + amazonLinks doc) | Quick add, status toggle (published ↔ drafts.), bulk ops |
| `/admin/products/batch-upload` | `batchCreateProducts` (Sanity) | CSV/spreadsheet batch create |
| `/admin/import-center` | `getImportValidationData` (Sanity-derived) | Missing ASIN/images/categories, invalid price, duplicates report |
| `/admin/brands`, `/admin/brands/new`, `/admin/brands/[id]/edit` | `getAllBrandsAdmin`, `getBrandByIdAdmin`, `createBrand`, `updateBrand`, `deleteBrand` (Sanity); logo map from `data/brands.json` | Brand CRUD |
| `/admin/categories` | `CategoryManagementInteractionLayer` (workspace/localStorage + `MOCK_PRODUCTS_PER_CATEGORY`) | Category management UI — currently **not** backed by any server data |
| `/admin/overview` (dashboard) | `getDashboardOverview` (Sanity counts + hardcoded zero clicks) | KPIs, quality, category distribution, top products, tasks |
| `/admin/import-center` | see above | — |

Key facts:
- `products` in Supabase has: `id` (text, natural keys like `JI1114`), `slug`, `name`, `model` (text), `description` (text column storing a JSON string in the legacy `Description` shape — see ARCH-004's adapter), `attributes` (jsonb — includes `price`, `sizes_detail`, `traction` per ARCH-004), `price` (numeric), `gender`, `color`, `sizes` (text[]), `status` ('published'/'unpublished'), `asin` (text, all NULL today), `image_links` (text[] — Sanity CDN URLs, imported), `category_id`, `brand_id`, `leaf_model_id`.
- `brands`: `id`, `slug`, `name`, `logo_link`. `categories`: `id`, `slug`, `name`, `parent_id`. `models`: `id`, `slug`, `name`, `brand_id`, `parent_id`, `level` (0=root, 1, 2), unique `(brand_id, slug)`.
- The Product Service (`src/lib/products/product-service.ts`) already has `getProducts(filters)` with `missingData` filter, `getFacets`, `resolveBrandFilter`/`resolveCategoryFilter`, model hierarchy queries. Admin reads should use it.
- Service caches use `unstable_cache` with tags `products` and `models` (60s/300s/600s TTL). Admin writes must invalidate these tags (`revalidateTag('products')` / `revalidateTag('models')`) plus `revalidatePath` for the affected routes.
- Validation schemas live in `src/lib/schemas/` (productFormSchema, brandFormSchema, batch-upload) — keep using them.
- `src/lib/supabase/admin.ts` exposes `adminSupabase` (service-role client, used by the Product Service) — use the same client for admin writes.
- Pre-existing: ~53 tsc errors in `src/components/admin/*` (media-library, category-management, homepage-management, system-health, affiliate, brands). You will be touching several of those files; fix the errors in files you touch.

## What to build

### 1. Products catalog (`/admin/products`) — read via the Product Service

Rewrite `getCatalogProducts` / `getCatalogFacets` (in `src/lib/actions/products.ts` or a new Supabase-backed module) so they:
- Read products via the Product Service (`getProducts({ search, category, brand, status, missingData, sort, page, pageSize })` — extend the service with a `search` filter if missing; note the service already supports most of these).
- Map to the existing `CatalogProduct` shape (name, sku=model, brand, category, price, status, asin, imageUrl from `image_links[0]`, clicks=0, addedAt from `created_at`, missingData).
- Facets/KPIs from `getFacets` + real counts (total/active/unpublished/missingAsin/missingImages/missingCategories/createdThisMonth from `created_at`).
- No Sanity queries. No draft-id juggling — `status` column is the single source of truth.

### 2. Product editor + quick create + bulk ops — write to Supabase

Rewrite the write actions so they:
- `createProduct` / `updateProduct`: upsert the `products` row (natural id, slug, model, name, brand_id via slug/name resolution, category_id, leaf_model_id via model-path resolution — reuse ARCH-004's `resolveModelPath`-style logic from the service), `price` numeric, `attributes.price`/`attributes.sizes_detail`/`attributes.traction`, `description` as the JSON string, `image_links` from the form's image URLs (the form currently submits Sanity asset ids — keep the interaction layer contract: accept whatever the form sends and store URL strings in `image_links`; if the form sends asset refs, resolve them to CDN URLs like ARCH-004's adapter does, or update the form to send URLs).
- `deleteProduct`: delete the row.
- `createCatalogProduct` / `updateCatalogProduct` / `bulkSetProductStatus` / `bulkAssignCategory` / `bulkAssignBrand` / `bulkSetAsin` / `bulkDeleteProducts` / `exportProductMetadata`: operate on `products` rows (asin → `products.asin`; no more amazonLinks doc).
- Always: `revalidateTag('products')`, `revalidateTag('models')` where hierarchy is touched, `revalidatePath('/admin/products')`.

### 3. Batch upload + import center — Supabase

- `batchCreateProducts`: insert rows into `products` (resolve brand/category/leaf model; slugify; status from row or default unpublished).
- `getImportValidationData`: compute the same issue report from the Supabase catalog (missing asin/image/category, invalid price ≤ 0, duplicates by name/sku).

### 4. Brands CRUD — Supabase

- Rewrite brand actions against the `brands` table: list (with logo_link), get by id, create (slugify name, unique slug), update, delete. `getBrandLogoMap` from the brands table instead of `data/brands.json`.
- Guard: deleting a brand that has products/models — decide and implement a safe behavior (block with a clear error is fine; document it).

### 5. Categories — real Supabase data

- The categories page currently has no server data. Back it with the `categories` table: list (with parent), create (slugify, parent_id), update, delete (block if products reference it), and display real product counts per category (from the service). Keep the existing UI shell (interaction layer) — replace its mock/workspace data with the server-backed actions.

### 6. Models management — new capability, same UI patterns

There is no models page among the 13 today; the model hierarchy is the catalog's backbone (ARCH-REC-001, ARCH-03). Build a management surface following the existing admin patterns (a `/admin/models` page + interaction layer, or a well-defined section inside the brands page — your call, keep it consistent with the existing design system):
- List models with hierarchy (brand → root → sub → leaf), product counts per leaf, slug, level.
- Create root model; create child model under a parent (level = parent.level + 1, max 2).
- Rename/reparent (updates `parent_id`, recompute `level`).
- Delete a model: only when no products reference it (leaf models referenced by products cannot be deleted — block with a clear message; reassign products first).
- Slug unique per brand (`(brand_id, slug)` constraint — surface constraint errors nicely).

### 7. Dashboard (`/admin/overview`) — real Supabase counts

- `getDashboardOverview`: counts from Supabase (products by status, brands, categories, models), quality KPIs from real data (missing asin/images/category), recent products from `created_at`, category distribution from real counts. Clicks remain 0 (ARCH-08). Keep the response shape (`DashboardOverview`) so the UI doesn't change.

### 8. Cache + consistency rules (all of the above)

- Every write invalidates: `revalidateTag('products')`, `revalidateTag('models')` (when models touched), `revalidatePath` for the page(s) affected, and the storefront's cached reads (same tags — that's the point: admin edits propagate to the customer site within cache TTL).
- No page or action may query Sanity for products/brands/categories/amazonLinks anymore. (Sanity stays for image assets only — but admin already stores CDN URLs in Supabase, so admin reads need no Sanity at all after this task.)

## Boundaries — what NOT to do

- **Don't redesign the admin UI.** Reuse the existing pages, interaction layers, and components. Change the data layer; adjust components only where the data contract demands it (e.g. image URL fields).
- **Don't touch homepage/navigation/editorial/settings/media pages** — those are ARCH-06 (Sanity-backed content stays as-is for now).
- **Don't build the Amazon Affiliate Service** — ARCH-07. ASIN editing continues to work via the `asin` column; validation of Amazon URLs stays out of scope.
- **Don't build analytics/clicks** — ARCH-08. Keep `clicks: 0`.
- **Don't delete legacy code** — ARCH-09. Old Sanity actions may become dead but stay in the repo (unless you are replacing them in place, in which case replacing the implementation is fine).
- **Don't change the Supabase schema** unless strictly necessary (a new `models` management feature needs no schema change; if you truly need a column, put it in a migration file and say so in the report).
- **Don't run migrations yourself** — output the SQL and report it; the user applies it (project rule: all schema changes go through migration files, user runs them).

## Acceptance benchmarks

| # | Benchmark |
|---|---|
| 1 | `/admin/products` lists the 28 Supabase products with real brand/category/price/status/asin; filters, search, sort, pagination, facets and KPIs all work from Supabase; no Sanity network calls on the page (verify in Network tab). |
| 2 | Edit a product in `/admin/products/[id]/edit`, save → the change appears in Supabase AND on the storefront product page within cache TTL; image URLs come from `image_links`. |
| 3 | Create a product (full form + quick create) → row exists in Supabase with slug, brand_id, category_id, leaf_model_id resolved; it shows in admin catalog and storefront search. |
| 4 | Delete a product → row gone from Supabase; no orphan references; storefront page 404s. |
| 5 | Bulk ops (set status, assign category, assign brand, set ASIN, delete) update the correct rows; `bulkSetAsin` writes `products.asin`; invalid ASIN rejected (10 chars). |
| 6 | Batch upload creates products in Supabase with resolved brand/category/leaf model; validation report shows accurate totals. |
| 7 | Import center report is computed from Supabase (missing asin — currently all 28, missing images, missing categories, invalid price, duplicates). |
| 8 | Brands CRUD works against `brands` table; logo shows from `logo_link`; deleting a brand with products is blocked with a clear error. |
| 9 | Categories page shows real categories (Boots etc.) with real product counts; create/update/delete works; deleting a category with products is blocked. |
| 10 | Models management: create root/child models, reparent, rename; delete blocked when products reference the leaf; hierarchy reflects on storefront (new models appear in brand/model filters via the service). |
| 11 | Dashboard shows real counts/quality from Supabase (products 29 incl. test product, brands, missing ASIN 28 or 29, etc.); response shape unchanged. |
| 12 | After any write, the storefront reflects the change within cache TTL (tags invalidated); no stale data beyond TTL. |
| 13 | No admin page/action queries Sanity for products/brands/categories/amazonLinks anymore (grep check). |
| 14 | tsc: no NEW errors in files you touched; the 53 pre-existing admin errors are reduced (you fix the ones in files you touch). |
| 15 | Schema unchanged (or only via a documented migration file). |

## Files you'll likely touch

- `src/lib/actions/products.ts`, `src/lib/actions/brands.ts`, `src/lib/actions/batch-upload.ts`, `src/lib/actions/get-dashboard-overview.ts` (+ `get-dashboard-counts.ts`), `src/lib/getDashboardCounts.ts`, `src/lib/actions/suggestions.ts` (if it reads Sanity for product suggestions)
- `src/lib/products/product-service.ts` / `types.ts` — only if a genuine admin read is missing (e.g. `search` filter, counts by category)
- New: `src/lib/actions/models.ts` (or similar) + `/admin/models/page.tsx` + interaction layer (if you choose a new page)
- Admin interaction layers under `src/components/admin/*` as the data contract requires
- `src/app/admin/*/page.tsx` — only where wiring changes

In your implementation report: list every action you rewired (old → new data source), the models-management placement decision, any service extensions, the delete-guard behaviors you chose, and any schema/migration needs (with the exact SQL, unapplied).