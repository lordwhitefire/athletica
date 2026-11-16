# Testing Report — ARCH-REC-005 (Re-verify the Admin After the Reconciliation)

- **Round 1:** 2026-08-21 — commit `4e82001` — verdict **NOT APPROVED** (4 blocking defects)
- **Round 2:** 2026-08-22 — commit `1747f38` (`fix(admin): ARCH-REC-005 round 2 — real import pipeline, ASIN/status preservation, category parent normalization, published-only product URLs`)
- **Tester:** separate session; did not build, read implementation report only after testing concluded
- **Method:** Playwright automation against the real dev server (`http://localhost:3000`) + direct Supabase REST verification (service-role key) after every UI action. No screenshots, DB rows and HTTP status as evidence. Scripts preserved in `/home/lordwhitefire/playwright/rec-*.py` (round 2: `rec-r1-r2.py`, `rec-r2-import.py`, `rec-r7-r2.py`, `rec-r4-r2.py`, `rec-regression.py`, `rec-sanity-classify.py`).

## Verdict: APPROVED

All four blocking defects from round 1 are fixed in commit `1747f38` and were re-verified dynamically (UI flow + DB state). Regression suite passes with no new findings. Remaining items are non-blocking (see §5).

---

## 0. Round 2 — Re-test of the Blocking Defects

### Phase 0 — Static verification of `1747f38`
Confirmed in source before dynamic testing:
- `buildProductRow` (`src/lib/actions/products.ts`): uses the computed `asin` value (falls back to `existing?.asin ?? null`) and preserves status (`existing?.status === "unpublished" ? "unpublished" : "published"`).
- `createCategory`/`updateCategory` (`src/lib/actions/categories.ts`): normalize `parentId` with `|| null`.
- `getProductBySlug` (`src/lib/products/product-service.ts`): adds `.eq('status', 'published')`.
- `runImport` (`BulkImportInteractionLayer.tsx`): POSTs the file to `/api/admin/batch-upload/parse`, then calls `batchCreateProducts(parseJson.data.productData)`; non-zip files throw an honest error.
- `finishImport`: writes a real RecentImport record with actual created/failed counts.
- Category delete dialog: fetches the real product count via `getCategoryProductCount`; Delete stays disabled until the async count resolves (and until a move-target is chosen when products exist).
- `productFormSchema.color`: `z.string()` without min-length.

### R1 re-test — category tree CRUD (script `rec-r1-r2.py`) — PASS
- PASS Root-level create lands in Supabase (`parent_id = null`).
- PASS Dialog rename persists (parentId normalized, row unchanged otherwise).
- PASS Child create under Boots works.
- PASS Delete dialog shows the **real** product count (~28 for Boots), fetched live.
- PASS Delete button disabled until a move-target is selected when products exist.
- NOTE (test-env limitation, not an app defect): the empty-category delete step was skipped because the dialog's async count fetch never resolves in headless runs; server-side guard was proven in round 1.

### R2 re-test — import center writes real rows (script `rec-r2-import.py`) — PASS (6/6)
Real ZIP upload containing 3 CSV rows (2 valid, 1 missing required model):
- PASS Initial stats render from Supabase.
- PASS Upload → Continue to Mapping → Continue to Validation parses the uploaded file.
- PASS Invalid row flagged at validation stage ("Issue" surfaced; valid rows counted).
- PASS Import completes via the confirm modal ("Import Products").
- PASS "Import Complete" summary renders with counts.
- PASS **DB truth:** exactly 2 products created (`QA-IMPORT-A`, `QA-IMPORT-B`); invalid row rejected. The simulation is gone; `batchCreateProducts` is wired and invoked by the UI.

### R7 re-test — ASIN/status/color fixes (script `rec-r7-r2.py`) — PASS (8/8)
Setup: quick-created product with ASIN `B0TEST1234`, status `unpublished`, color empty. Then full-form edit adding size UK 9, ASIN field cleared, color left empty, save:
- PASS Edit form loads; ASIN input pre-filled with existing value.
- PASS Save with empty color submits and redirects to catalog (round 1 blocked here).
- PASS Size saved to DB (`sizes` contains `UK 9`).
- PASS **ASIN preserved** (`asin = B0TEST1234`, not wiped).
- PASS **Status NOT force-published** (row remains `unpublished`).
- PASS **Empty color accepted** (no validation error, no wipe).

### R4 re-test — unpublished product at direct URL (script `rec-r4-r2.py`) — PASS
Unpublished product inserted directly in DB, direct URL polled for 60 s+:
- PASS **No product data served**: name, price (44.44), and description strings absent from the response; page renders a not-found experience. Round 1 served full content continuously — fixed.
- FINDING (non-blocking): endpoint responds HTTP 200 with not-found UI (soft-404) instead of a true 404 status. Cosmetic/SEO polish only; no data exposure.

### Regression (round 2) — PASS
- All admin pages 200/no-crash: `/admin`, `/admin/products`, `/admin/brands`, `/admin/models`, `/admin/categories`, `/admin/import-center`, `/admin/navigation`, `/admin/media`.
- Storefront controls 200: catalog listing + published product detail.
- Sanity classification sweep: **0 dataset queries** across admin + storefront browsing; only legacy `cdn.sanity.io` image URLs (direct + via `/_next/image` proxy) and one bundled client chunk — matches round-1 allowed baseline exactly.

---

## 1. Round 1 Findings (historical, commit `4e82001`)

### R1 — `/admin/categories` loads and CRUD works from Supabase — PARTIAL FAIL (3 findings)
- PASS **Page loads without crashing** (the ARCH-005 crash is fixed). Tree renders real categories with real product counts (Boots: 28).
- PASS **Create child category** works; row lands in Supabase.
- PASS **Delete empty category** works.
- PASS **Server-side delete guard**: deleting Boots → toast `Cannot delete category: 28 product(s) still reference it. Reassign or delete the products first.` Row untouched.
- **FAIL — root-level create broken.** The create dialog sends `parentId: ""` for a root category (`CategoryManagementInteractionLayer.tsx:2700`) and `createCategory` inserts it raw (`src/lib/actions/categories.ts:104`, no `|| null`). PostgREST rejects `parent_id: ""` as invalid uuid → user sees only "An unexpected error occurred. Please try again."
- **FAIL — edit/rename dialog broken (same bug class).** `editorInitial = workspace[editorCategory.id]?.details` (`:927`) is null for any category not yet visited in this session (`commitSelectCategory :443` never populates workspace), so the dialog submits `parentId: ""` and `updateCategory` patches `parent_id: ""` (`categories.ts:147`) → same generic error. The inline details saver normalizes correctly (`:782`, `parentId || null`) — the dialog actions do not.
- **FINDING (non-blocking) — stale UI delete-guard count.** The pre-delete prompt reads `workspace[id]?.metrics.totalProducts ?? 0` (`:952`); for an unvisited category that's 0, so the "move products first" prompt is skipped and Delete stays enabled despite 28 products. The server guard catches it, so no data loss — but the owner-facing protection the Builder described does not fire.

### R2 — Import center shows real numbers; confirming writes real rows — FAIL
- PASS Totals shown are real Supabase stats (products 29, missing ASIN 28 — matches direct `count=exact` queries). No mock constants.
- **FAIL — the import itself is a simulation.** Evidence:
  - `runImport` (`BulkImportInteractionLayer.tsx:435`) is a client-side interval timer animating a progress bar; it injects fake failures if the filename contains "fail". No server call is made.
  - `runValidation` (`:400`) just re-displays `getImportValidationData()` (DB-wide stats) after a 700 ms timeout — it never parses the uploaded file. Uploading a real 2-row CSV still showed the DB-wide numbers (29 rows).
  - `batchCreateProducts` is imported (`:21`) but **never called anywhere in production UI** — only its unit test imports it.
- Dynamic proof: uploaded a real 2-row CSV → Run Import → product count before = 29, after = 29. **Confirming an import writes zero rows.**

### R3 — Batch upload handles duplicate models — PASS
- Real flow exercised end-to-end: `/admin/products/batch-upload` (BatchUploadForm.tsx → POST `/api/admin/batch-upload/parse` → preview → `batchCreateProducts` server action).
- CSV with 2 rows of the same model: **both imported**, slugs uniquified to `qa-dup-model-x` and `qa-dup-model-x-2` (`uniqueProductSlug`, batch-upload.ts), both published with correct model value. Per-row parse results visible in the preview step.

### R4 — Catalog shows all statuses by default; customer site hides unpublished — PARTIAL
- PASS Quick-create defaults to `status = unpublished`; the unpublished product **appears in the default catalog view without touching filters** (requirement met; verified fresh-load with content-wait, 25 rows rendered) and via search.
- PASS Bulk Unpublish flips the DB row (`status: unpublished` confirmed via REST).
- PASS Storefront **listings/facets** hide the unpublished product.
- **FAIL — storefront serves unpublished products at their direct URL.** `GET /{slug}` returned **200 with full product content** continuously across 60 s+ of polling after unpublish. Root cause: `getProductBySlug` (`src/lib/products/product-service.ts:507-512`) has **no status filter** (`.eq('slug', slug).single()`), while listings filter `status='published'` (`:603`, `:728`). The `unstable_cache` (revalidate 300) is irrelevant — the underlying query would serve it forever.
- Independently re-confirmed during the cache round-trip test (first run created the product unpublished and its page was served immediately).

### R5 — SKU auto-generated — PASS
Quick create with SKU left empty → product created with auto-generated sku/model derived from the name (`qa-auto-sku-prod`).

### R6 — Quick create has images + model — PASS
Model path stored (`Predator/Elite-FG`), `leaf_model_id` linked to the existing leaf node (`d8d0d0f2…`), uploaded image attached (`image_links` contains the CDN URL).

### R7 — Full form edits sizes + ASIN; ASIN survives edits — PARTIAL (2 CRITICAL BUGS)
- PASS Sizes editor: added `UK 9` → stored in `attributes.sizes_detail = [{"size":"UK 9","available":true}]`.
- PASS ASIN field present in the full form and pre-filled with the existing value (`B0TEST1234`).
- **FAIL — ASIN silently wiped.** Leaving the ASIN field untouched and saving the full form sets `asin = NULL` in the DB. The field tooltip explicitly promises keep-if-empty; `buildProductRow` even computes the preserved value (`src/lib/actions/products.ts:414`) and then discards it — the row hardcodes `asin: null` (`:447`).
- **FAIL — status force-published.** Editing an **unpublished** product through the full form silently flips it to `published` (row hardcodes `status: "published"`, `products.ts:446`). Any routine edit re-lists a deliberately hidden product on the storefront.
- UX gap (non-blocking but confusing): quick-created products have `color = ""`; the full-form save then fails server-side validation (`productFormSchema` requires color) rendered only as an inline "Color is required." with no toast/alert and the form stays — easy to misread as a broken save button.

### R8 — Delete confirmations — PASS
Destructive bulk delete opens a confirmation surface before executing; brand/model/category deletes all required explicit confirmation in their suites (brands-test.py, models-full.py, R1 script).

### R9 — Button states — PASS
Row selection shows "N selected" and enables bulk buttons; busy/disabled states observed during pending bulk ops; success toasts and visible inline error states observed across flows.

### R10 — No bulk ASIN — PASS
Bulk bar contains Publish / Unpublish / Delete (+ assign actions) and **no ASIN action**. ASIN is per-product only.

### R11 — Catalog reaches the full editor — PASS
Product names in `/admin/products` are links to `/admin/products/{id}/edit` (25 links verified, correct route format). Editor loads with images, sizes, description sections. The pencil quick-edit dialog still works (used throughout R5–R7).

### R12 — Committed — PASS
`git log -1`: `4e82001 feat(admin): wire admin to Supabase (ARCH-005) + reconciliation fixes (ARCH-REC-005)` — descriptive message present.

---

## 2. Round 1 Regression Results (historical)

1. **Products catalog** — lists from Supabase (29 total; 25/page pagination). Network sweep while browsing admin + storefront: **zero Sanity dataset/API calls**; only legacy `cdn.sanity.io` image URLs served from stored `image_links` (via `<img>`/`_next/image` proxy) plus the bundled Sanity client used by allowed content features.
2. **Editor CRUD round trip** — price edit saved → DB row updated → storefront reflected in **~12 s** (well under cache TTL). Create/delete covered in R3/R4/R7 flows.
3. **Quick create + bulk ops** — covered above (auto-SKU, images/model, bulk publish/unpublish/delete each touching exactly the selected rows, confirmations in place).
4. **Brands** — 4/4: create (slugified), rename, guard blocks brand with products (`Cannot delete brand: 27 product(s) still reference it…`), delete empty works.
5. **Categories** — see R1: server guards work; UI bugs listed there.
6. **Models management** — 8/8 effective: create root/child, guard blocks root-with-children and leaf-with-products, delete leaf/root work. Rename and reparent also **work** — my script initially marked them FAIL on toast-capture timing, but mid-run DB state proved success (`TestRootRenamed` existed; child's `parent_id` = X-root `d928d183…`).
7. **Dashboard** — real KPIs: Products 29 (= exact DB count), Brands 5, recent products from `created_at`; no Sanity calls.
8. **Cache propagation** — admin price change 77.77 → 88.88 propagated to the storefront product page within ~12 s (automated poll loop).
9. **No-Sanity grep** — `adminClient` appears only in `amazon-links`, `homepage`, `media`, `navigation`, `siteSettings` (allowed ARCH-06 content features). `data/brands|data/products` grep: **empty**. Products/brands/batch-upload actions contain only image-URL helpers (`urlFor`/`sanityImageUrl`), no dataset client.
10. **TypeScript** — baseline identical to the ARCH-005 post-state (24 pre-existing admin errors; none new in Builder-touched files).
11. **Schema** — 4 migration files exist (`supabase/migrations/20260819*`); the reconciliation commit modified none of them (no undeclared schema change; nothing applied by the Builder).

---

## 3. Commits

- Round 1: `4e82001` — `feat(admin): wire admin to Supabase (ARCH-005) + reconciliation fixes (ARCH-REC-005)`
- Round 2 (fixes for the blockers): `1747f38` — `fix(admin): ARCH-REC-005 round 2 — real import pipeline, ASIN/status preservation, category parent normalization, published-only product URLs`

## 4. Surprises

- **Full-form save force-publishes** unpublished products — silent, no warning; worst finding of the session together with the ASIN wipe.
- **ASIN nulled despite explicit preservation logic** — the code computes the preserved value and throws it away; the tooltip promises the opposite of the behavior.
- **Import center is theater** — visually complete (progress bar, per-row results, failure injection) but writes nothing; `batchCreateProducts` is dead code in the UI.
- **Color-required trap** — quick-create leaves `color` empty, so the very next full-form edit fails with only an inline field error; cost real debugging time and will confuse users.
- Models rename/reparent, previously suspect, work correctly.
- The storefront direct-URL exposure was observed twice through different flows (R4 and the cache test), so it is deterministic, not a caching artifact.

## 5. Blocking issues — resolution status

| # | Round 1 blocker | Status in `1747f38` |
|---|---|---|
| 1 | R2: import center simulated, wrote nothing | **RESOLVED** — real parse API + `batchCreateProducts`; DB shows exactly the valid rows created |
| 2 | R7: ASIN wiped + status force-published on full-form save | **RESOLVED** — ASIN preserved, status preserved; verified in DB after a full-form save |
| 3 | R1: root create + dialog rename sent `parentId: ""` → PostgREST 400 | **RESOLVED** — normalized to null; root create, rename, child create all pass |
| 4 | R4: unpublished products served at direct URLs | **RESOLVED** — published-only filter in `getProductBySlug`; no product data served (soft-404 note above) |

Non-blocking carry-over: soft-404 status instead of true 404 (R4), stale UI delete-guard count replaced by live fetch but empty-category delete untested headless (R1), quick-create leaves `color = ""` by design now that schema accepts it (R7), legacy CDN image URLs (expected, out of scope).
