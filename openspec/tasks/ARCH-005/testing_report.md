# Tester Report: ARCH-005 — Admin Pages Read/Write Supabase

**Status: NOT APPROVED** — core read/write/Supabase migration verified working, but 3 failures and 1 new bug found.

## Summary

| # | Area | Result |
|---|------|--------|
| 1 | Catalog page | ✅ PASS |
| 2 | Editor CRUD | ✅ PASS (user-verified round trip) |
| 3 | Quick create + bulk ops | ✅ PASS (bulk ASIN op NOT tested — user declined) |
| 4 | Batch upload + import center | ❌ PARTIAL — batch upload writes Supabase but has a slug-collision bug; import center is mock-only |
| 5 | Brands | ✅ PASS (automated, 4/4) |
| 6 | Categories | ❌ FAIL — page crashes on load |
| 7 | Models management | ✅ PASS (automated, 8/8; storefront facet check blocked by pre-existing bug) |
| 8 | Dashboard | ✅ PASS |
| 9 | Cache propagation | ✅ PASS (user-verified) |
| 10 | No Sanity in admin data paths | ✅ PASS |
| 11 | TypeScript | ✅ PASS (0 errors in touched files; 24 remaining, all out of scope) |
| 12 | Schema | ✅ PASS (4 migrations only, none applied by Builder) |

## 1. Catalog page — PASS

- 29 products listed from Supabase; pagination "Showing 1–25 of 29".
- KPIs real: Total 29, Active 29, Unpublished 0, Missing ASIN 28 (96.6%), Missing Images 0, Missing Categories 0.
- Brands/categories facets real (adidas, New Balance, nike, Puma, Test Brand / Boots, Test Football Boots).
- Network: no Sanity API data calls; only CDN `<img>` loads (URLs stored in `image_links`/`logo_link` — expected).
- Search/filter/sort/pagination exercised; `data/brands` / `data/products` grep empty.

## 2. Editor CRUD — PASS (user-verified)

- User edited price of `adidas-predator-elite-ft-ag` (DB row ID1323, price 30.00) → storefront product page showed the new price within TTL. Revert not needed (test row).
- Storefront product `adidas-predator-elite-fg-black` (JI1085) renders €155.99 = DB price. ✅
- Note: admin displays $29.99 for row with price 30.00 (display rounding) — cosmetic only.

## 3. Quick create + bulk ops — PASS

- Quick create `TEST-QA-001` (id `test-qa-001`, slug `test-boot-qa-001`, Test Brand `9e810e95-…`, Boots `6349cb77-…`, price 0.02, published) → row in Supabase, loads on storefront (user-verified).
- Bulk status/category/brand/delete verified by user against selected rows.
- **Not tested:** bulk ASIN (valid 10-char / invalid rejected) — user declined; testing.md §3 requires it. Note: quick-create requires the SKU/Model field manually (not auto-generated).

## 4. Batch upload + import center — ❌ PARTIAL (1 bug)

**Batch upload: writes to Supabase but has a slug-collision bug (new finding):**
- Uploaded ZIP with `products.csv` (2 rows, both model `Predator/Elite-FG`): parse API returned 2 VALID rows; import created row 1 (TEST-BT-01, published, price 149.99) but row 2 failed with generic "Unknown error".
- Root cause: `src/lib/actions/batch-upload.ts:88` sets `slug: slugify(row.model)` with no uniquification, while `products.slug` is `not null unique` (initial schema, migration 20260819000000). Two rows of the same model in one batch → duplicate slug → second insert fails. `createBrand` uses `uniqueSlug()` (brands.ts:26) but batch-create does not.
- Secondary: the failure surfaces as "Unknown error" (row 2) — no per-row reason.

**Import center: FAIL — shows mock data by default, never queries Supabase:**
- `BulkImportInteractionLayer.tsx:229` defaults `source: "mock"` → `MOCK_VALIDATION` shown (`bulk-import.interactions.tsx:309`, 10,245 total / 1,842 issues) — does not match reality (29 products, 28 missing ASIN).
- The layer never calls `batchCreateProducts`; the import flow is simulated (`runImport` fake progress). `source: "real"` exists (`:302`, `:317`, `:361`) but is not default and the real pipeline is not wired to it.
- The validation numbers on the page cannot match a direct Supabase count because they are constants.

## 5. Brands — PASS (Playwright automation, 4/4)

- List shows brands from `brands` table (Test Brand, New Balance, …) with Sanity CDN logo URLs (expected — stored in `logo_link`).
- Create "TestBrandQA" → row in Supabase, slug auto-generated (`testbrandqa`). Toast "Brand added successfully."
- Edit/rename → "TestBrandQA-Edited" → row updated. Toast "Brand updated successfully."
- Delete adidas (27 products + models) → blocked: "Cannot delete brand: 27 product(s) still reference it…" — brand intact.
- Delete empty brand → works ("TestBrandQA-Edited deleted."), row gone.
- Note: dialog has Tagline/Website/Description/Status fields but `createBrand`/`updateBrand` (brands.ts:116-175) persist only name/slug/logo_link — legacy UI fields silently dropped (minor, UI/data mismatch).

## 6. Categories — ❌ FAIL (page crashes)

- `/admin/categories` crashes on load: `TypeError: Cannot read properties of undefined (reading 'subcategories')` at `CategoryManagementInteractionLayer.tsx:960`.
- Root cause: `selectedData = workspace["football-boots"]` fallback (`:301`) is `undefined` — the workspace is now built from real Supabase data and the mock fallback no longer exists, so the legacy hardcoded key crashes.
- No list, counts, create/edit/delete or guards can be exercised.

## 7. Models management — PASS (Playwright automation, 8/8)

- Page + sidebar nav exist (`AdminShell.tsx:12`); 21 models rendered with hierarchy (Predator root + 14 children, X root + child, Mercurial Vapour 17 root=leaf) and product counts.
- Automated (Playwright, DB-verified after every step):
  - Create root under adidas → row in Supabase (level 0). ✅
  - Create child → level 1, `parent_id` = root id. ✅
  - Delete root with children → blocked: "Cannot delete model: 1 submodel depend on it…" ✅
  - Delete leaf with products (Elite-FG, 1 product) → blocked: "Cannot delete model: 1 product(s) reference it…" ✅
  - Rename root → row updated. ✅
  - Reparent child under X → `parent_id` = X root id (verified in DB). ✅
  - Delete empty leaf / empty root → works ("Model deleted", rows gone). ✅
- Note: the create-root brand select only lists brands that already have models (adidas, nike) — Test Brand cannot host a root model until it has one (limitation, not a failure).
- **Storefront link (testing.md §7 last bullet): NOT VERIFIABLE** — see Surprises.

## 8. Dashboard — PASS

- KPIs real (29 / 28 missing ASIN / 0 clicks); category distribution Boots 28 + Test Football Boots 1 matches Supabase; no Sanity calls.

## 9. Cache propagation — PASS (user-verified)

- Price edit appeared on storefront within TTL; quick-created product also appeared. `revalidateTag("products", "max")` / `revalidatePath` present in all write actions.

## 10. No Sanity in admin data paths — PASS

- `adminClient|sanity` in admin code = image-URL helpers only: `products.ts:62` (`sanityImageUrl`), `brands.ts:21`, `batch-upload.ts:14`, `DashboardPreviewHub.tsx:43`, `urlFor` in ProductForm/ImageSelector — plus ARCH-06/07 content pages (homepage, navigation, site-settings, media) by design.
- `data/brands|data/products` grep: empty. ✅

## 11. TypeScript — PASS

- `npx tsc --noEmit`: 0 errors in Builder-touched files; 24 remaining, all out of scope (media-library 15, homepage-management 3, system-health 1, affiliate 1, test-debug.ts 2, import-data-to-supabase.ts 2). Down from 53.

## 12. Schema — PASS

- `supabase/migrations/`: 4 files (initial schema + 3), none applied by Builder; no un-migrated schema changes found.

## 13. Surprises / blockers

1. **Storefront model + brand facets empty (pre-existing, blocks §7 storefront check):** `getFacets` (`src/lib/products/product-service.ts:394`) passes the raw category label `"Boots"` to `getCategoryIdBySlug` (expects slug `"boots"`), so FilterSidebar renders only Price. A newly created model therefore cannot be verified in the customer-side filter. Out of ARCH-005 scope but blocks benchmark 10.
2. **Batch upload slug collision** (see §4) — recommend `uniqueSlug()` in `batchCreateProducts`.
3. **Import center mock default** (see §4) — a "REAL FAIL" against testing.md §4.
4. **Categories crash** (see §6) — a "REAL FAIL".
5. **Bulk ASIN** untested by choice (user declined).

## Test environment notes

- Automation: Python Playwright 1.61.0 (system Chrome, headless) from `/home/lordwhitefire/playwright`; Supabase row verification via REST with anon/service-role keys.
- Login flakiness: dev-mode compile causes login to take up to ~10s; scripts retry. Several earlier Puppeteer runs tripped the Upstash login rate limiter — mitigated by waiting.
- All test data cleaned up after runs (models, brands, products via service-role DELETE).
- Test scripts: `/home/lordwhitefire/playwright/{models-full,brands-test,batch-test}.py`.