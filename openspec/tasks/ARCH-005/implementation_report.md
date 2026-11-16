# Implementation Report: ARCH-005 — Wire the Admin Pages to Supabase

## Summary

Rewired the admin data layer from Sanity/JSON/mock sources to Supabase, keeping every admin UI surface (pages and interaction layers) intact. Products catalog, product editor, quick create, bulk ops, batch upload, import center, brands CRUD, categories, models management, suggestions, and the dashboard now read/write Supabase rows through `adminSupabase` (service-role client) and the Product Service. Admin writes invalidate the shared cache tags (`products`, `models`) so storefront reads refresh within TTL. Sanity remains only for image assets (CDN URL conversion helpers) and the ARCH-06 content pages (homepage, navigation, settings, media, amazon-links) which are explicitly out of scope.

## Actions rewired (old → new data source)

| Action / file | Old source | New source |
|---|---|---|
| `products.ts` — catalog read (`getCatalogProducts`, `getCatalogFacets`) | Sanity GROQ + draft-id juggling | Product Service `getProducts`/`getFacets` (Supabase); `CatalogProduct` mapped from `ProductSummary` (brand/category names via relations, `image_links[0]`, `created_at`, `status` column, `asin`) |
| `products.ts` — `createProduct`/`updateProduct` | Sanity createOrReplace/patch | Upsert `products` row: natural id, slug, model, name, `brand_id` (by slug/name), `category_id`, `leaf_model_id` via `resolveModelPath`, numeric `price`, `attributes.price/sizes_detail/traction`, `description` JSON string, `image_links` URLs |
| `products.ts` — `deleteProduct` | Sanity delete | `delete().eq('id')` |
| `products.ts` — quick create + bulk ops (`createCatalogProduct`, `updateCatalogProduct`, `bulkSetProductStatus`, `bulkAssignCategory`, `bulkAssignBrand`, `bulkSetAsin`, `bulkDeleteProducts`, `exportProductMetadata`) | Sanity + amazonLinks doc | `products` rows; ASIN → `products.asin` column (no amazonLinks doc) |
| `batch-upload.ts` — `batchCreateProducts` | Sanity | Insert `products` rows; brand/category resolved (missing brand auto-created, slugified), model via `resolveModelPath`, status from row (default unpublished); `revalidateTag("products", "max")` |
| `batch-upload.ts` — parse route image handling | Sanity asset refs | Kept `adminClient` for image upload (allowed: media assets stay Sanity); converted refs to CDN URLs |
| `brands.ts` — full CRUD + logo map | Sanity + `data/brands.json` | `brands` table (`logo_link`); create slugifies name with unique-slug guard; delete blocked when referenced by products (clear error) |
| `categories.ts` — CRUD | mock/workspace (no server data) | `categories` table: list with parent, create (slugify, `parent_id`), update, delete blocked when products reference it; product counts per category from the service |
| `models.ts` — new management actions | n/a (no page existed) | `models` table: create root/child (level = parent+1, max 2), rename/reparent (recompute level), delete blocked when leaf models are referenced by products; unique `(brand_id, slug)` constraint surfaced as a clean error |
| `get-dashboard-overview.ts`, `get-dashboard-preview.ts`, `get-dashboard-counts.ts`, `getDashboardCounts.ts` | Sanity counts + hardcoded zeros | Supabase counts (products by status, brands, categories, models), quality KPIs from real data (missing asin/image/category), recent products from `created_at`; clicks stay 0 (ARCH-08) |
| `suggestions.ts` | Sanity-derived | Supabase products (missing data, duplicates, invalid price) |

## Models-management placement decision

New `/admin/models` page + `ModelsManagementLayer` interaction layer, following the existing admin patterns (spec sidebar entry with `account_tree` icon, legacy `AdminShell` nav entry added too). The models hierarchy is the catalog's backbone (ARCH-REC-001, ARCH-03), so a dedicated surface was chosen over embedding in the brands page. Hierarchy shown as brand → root → sub → leaf with product counts, slug, and level; create/rename/reparent/delete all implemented against the `models` table.

## Service extensions

None required. `resolveModelPath`, `getProducts` (with search/status/missingData/sort/pagination), `getFacets` already covered every admin read. A `ProductSummary` type import was added to `products.ts` for the catalog mapping.

## Delete-guard behaviors chosen

- **Brand delete**: blocked with `brand_delete_blocked` error when any product references the brand.
- **Category delete**: blocked when any product references the category.
- **Model delete**: blocked when any product references the model (leaf models referenced by products cannot be deleted — reassign products first); surfaced as a clean error.

## Cache + consistency

Every admin write calls `revalidateTag("products", "max")` (and `revalidateTag("models", "max")` where the hierarchy is touched), plus `revalidatePath` for the affected admin route. Note: Next.js 16.1.6 requires the second `"max"` argument to `revalidateTag` (single-arg form is deprecated). Storefront cached reads share these tags, so edits propagate within TTL.

## Schema / migrations

**No schema changes** — the `products`, `brands`, `categories`, `models` tables (with `image_links`, `asin`, `brand_id`, `category_id`, `leaf_model_id`, `parent_id`, `level`, unique `(brand_id, slug)`) already existed from ARCH-01..04. No migration file produced.

## Data decisions documented

- Batch import auto-creates missing brands (slugified name, `logo_link: null`); missing category → `category_id: null` (no auto-create — categories are curated).
- Brands `status`/`tagline`/`website`/`description` are **not persisted** (UI-only fields on the existing form; no columns exist) — documented limitation.
- Amazon links count = products with non-null `asin` (no more `amazonLinks` Sanity doc).
- `getAllBrandsAdmin` keeps the Sanity-compatible shape `{ _id, name, slug, logo: { asset: { _ref } } }` because `ProductForm`/`BrandForm` rely on it.
- `getModelNavTreeAction` verified safe: `getModelNavTree` reads local `data/navigation.json` (storefront nav source), not Sanity.

## TypeScript

All ARCH-005 errors fixed. Also fixed several union-narrowing/pre-existing tsc errors in touched files: `ModelsManagementLayer` modal narrowing, `CategoryManagementInteractionLayer` (menuData init, `deleteNavNode` rename, subcategory/nav-editor closure narrowing, action-menu target capture), `category-management.interactions.tsx` recursive `insertInto` null-invoke, `BrandManagementInteractionLayer` dialog narrowing, missing `ProductSummary` import, and the deprecated `revalidateTag` calls.

**Remaining pre-existing tsc errors (NOT in ARCH-005 scope, untouched files)**: `import-data-to-supabase.ts` (untracked scratch file), `test-debug.ts` (untracked scratch), `affiliate/AffiliateInteractionLayer.tsx`, `homepage-management/use-homepage-management.ts`, `media-library/*`, `system-health/SystemHealthPresentation.tsx`. These belong to ARCH-06/07 scope and were left as-is per the task boundary ("fix errors in files you touch").

## Tests

- `src/lib/actions/__tests__/batch-upload.test.ts` — rewritten to mock `@/lib/supabase/admin` (chainable query mock with `__captureInsert`) + `@/lib/products/product-service`; **7/7 pass**.
- `src/lib/actions/products.integration.test.ts` — rewritten to mock `@/lib/supabase/admin` (configurable `__setProductsError`/`__setDeleteError`) + product-service + `@/lib/validate` (synchronous mock — the real `validateOrFail` is sync and `createProduct` doesn't `await` it); **10/10 pass**.
- `admin-auth.integration.test.ts` + `schemas/__tests__/batch-upload.test.ts` — verified unchanged and still valid; **18/18 pass**.

## Grep verification (benchmark 13)

- `rg -l "adminClient|sanity" src/lib/actions src/app/admin src/components/admin` — only allowed files remain: `products.ts`/`brands.ts`/`batch-upload.ts` (CDN URL conversion helpers only), `siteSettings.ts`/`homepage.ts`/`navigation.ts`/`media.ts`/`amazon-links.ts` (ARCH-06/07 content pages, out of scope), plus component-level `urlFor`/`sanityCdnUrl` image utilities and the ARCH-06 homepage editor forms.
- `rg -l "data/brands|data/products"` in the same dirs — **empty** (no JSON file reads left).

## Surprises / deviations

- Next 16 deprecated single-arg `revalidateTag`; all calls updated to two-arg form.
- The `insertInto` recursive helper in `category-management.interactions.tsx` needed a non-null-asserted closure to satisfy the recursive call narrowing.
- Test debugging revealed `createProduct` reads `validateOrFail` synchronously — the test mock must be synchronous (an `async` mock silently bypassed validation in tests).

## Benchmarks status

| # | Benchmark | Status |
|---|---|---|
| 1 | Products catalog lists Supabase products with real data, filters/search/sort/facets/KPIs | Implemented (service reads); browser verification pending |
| 2 | Edit product → change appears in Supabase + storefront within TTL | Implemented (upsert + tag invalidation); E2E pending |
| 3 | Create product → row with resolved brand/category/leaf model | Implemented |
| 4 | Delete product → row gone, storefront 404s | Implemented |
| 5 | Bulk ops update correct rows, ASIN written, invalid rejected | Implemented (schema validation) |
| 6 | Batch upload creates products with resolved refs + accurate report | Implemented + tested |
| 7 | Import center computed from Supabase | Implemented |
| 8 | Brands CRUD vs `brands` table; delete blocked when referenced | Implemented |
| 9 | Categories page real data + counts; delete blocked when referenced | Implemented |
| 10 | Models management full CRUD + hierarchy; delete blocked on leaf refs | Implemented (new page) |
| 11 | Dashboard real counts from Supabase, shape unchanged | Implemented |
| 12 | Storefront reflects writes within TTL | Implemented via tags |
| 13 | No admin Sanity queries for products/brands/categories/amazonLinks | Verified via grep |
| 14 | tsc: no new errors in touched files | Verified (remaining errors are out-of-scope pre-existing) |
| 15 | Schema unchanged | No migration produced |