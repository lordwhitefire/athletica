# Builder Task: ARCH-REC-005 — Reconciliation: Fix Admin Verification Failures + Owner Requirements

## What we're reconciling

ARCH-005 (wire the 13 admin pages to Supabase) was built and shipped. Verification on 2026-08-20 found **3 failures, 1 new bug, and 2 unverified benchmarks**, and the owner added requirements found while using the admin. This reconciliation fixes the admin **without re-running ARCH-005** — the Supabase wiring itself works; what's left is surgical.

**Verification failures:**
1. **Categories page crashes on load.** `CategoryManagementInteractionLayer.tsx:301` falls back to `workspace["football-boots"]` which no longer exists when the workspace is built from real Supabase data → `TypeError: Cannot read properties of undefined (reading 'subcategories')` at `:960`.
2. **Import center shows mock data by default.** `BulkImportInteractionLayer.tsx:227` defaults `useState(MOCK_VALIDATION)`; the real pipeline is not wired (`runImport` simulated, `source: "real"` exists but unused by default).
3. **Batch upload slug collision.** `batch-upload.ts:88` uses `slug: slugify(row.model)` with no uniquification (contrast `createBrand`'s `uniqueSlug()`); two rows of the same model in one batch → duplicate slug → second insert fails with a generic "Unknown error".
4. **Catalog silently hides unpublished products.** The service (`product-service.ts:80`) defaults to `eq('status','published')` when no status filter is given; the catalog passes none by default.

**Owner requirements (from using the admin):**
5. **SKU not auto-generated** — quick create requires typing SKU manually.
6. **Quick-create surfaces have no image upload and no model field** — products land with `leaf_model_id: null`, no images. (The full form DOES have image upload; the dashboard "Add Product" modal and catalog quick create do not.)
7. **Full product form is missing Sizes and ASIN** — and worse: every full-form save hardcodes `asin: null` (`products.ts:403`), erasing an existing ASIN. The storefront shows sizes; the form cannot edit them.
8. **No confirmation before deletions** — product, bulk, brand, category, model deletes execute on a single click.
9. **Buttons lack state UI** — no consistent busy/error/success states on action buttons.
10. **Bulk bar includes ASIN** — ASIN is product-distinct and must be per-product only.
11. **Catalog cannot reach the full product editor** — the pencil icon opens only the 7-field quick-edit dialog (`ProductEditorSurface`); nothing on the catalog page links to `/admin/products/[id]/edit` (images, sizes, description).

## Why it matters

The storefront already reads Supabase (ARCH-01..04). ARCH-005 made the admin write Supabase too — so an admin edit now changes the exact row the customer site renders. The failures above break that trust: the categories page is unusable, the import center lies with mock numbers, batch import can silently fail half a file, and a full-form save can erase a product's ASIN. These are correctness issues in the last mile of the migration; the owner also wants the admin to behave like a real operating tool (confirmations, button states, reachable editor).

## What we're building (in order)

### 1. Fix the categories crash
`/admin/categories` must render real categories (list, product counts, create/update/delete, delete-guard for categories with products) from Supabase without crashing. Root cause is the legacy workspace fallback key; the page must handle a real-data workspace.

### 2. Wire the import center to real Supabase data
- Validation report computed from the real Supabase catalog (missing ASIN — currently ~28, missing images, missing categories, invalid price ≤ 0, duplicates) — numbers MUST match a direct database count.
- Confirming an import MUST run the real save path (`batchCreateProducts` or the real pipeline) and show a real per-row result report.
- Remove the mock default (`MOCK_VALIDATION` stays only as dead/legacy code, never rendered).

### 3. Fix batch upload slug collisions + per-row errors
- Unique slugs within a batch (dedupe/suffix, reuse the `uniqueSlug()` pattern from `brands.ts`).
- Failure rows report the reason per row (e.g. "duplicate slug: X"), never a generic "Unknown error".

### 4. Catalog defaults to all statuses (admin only)
- No status filter selected → show published AND unpublished. Customer-facing queries keep published-only.
- Implement via an admin read path (e.g. the catalog passes `status: undefined` and the service's admin entry point does NOT default to published — do not change the customer default).

### 5. SKU auto-generated
- Quick create and catalog quick-create generate the SKU when not provided (from name/model, slugified) — never refuse because SKU is missing.

### 6. Quick-create surfaces get images + model
- Dashboard "Add Product" modal and catalog quick create: image upload (consistent with the full form's gallery uploader) and a model field resolved through the hierarchy (sets `leaf_model_id`).
- Quick-create and full form must agree on required fields (currently the modal requires ASIN while the full form can't set it — contradictory; ASIN stays optional in both).

### 7. Full form: Sizes + ASIN + ASIN safety
- Add a **Sizes** editor (sizes + `sizes_detail`) to `ProductForm` — the storefront renders sizes; the form must edit them.
- Add an **ASIN** field to the full form.
- **CRITICAL: never erase an existing ASIN on save** — preserve `products.asin` when the form doesn't provide a value (fix `buildProductRow`'s hardcoded `asin: null`).

### 8. Confirmations before every destructive action
- Product delete, bulk delete, brand delete, category delete, model delete: explicit confirmation dialog naming what will be deleted and how many items. No single-click destruction.

### 9. Button states
- Every action button: idle / busy (disabled + progress) / success / error (visible message, return to idle). Apply to saves, bulk actions, deletes, imports.

### 10. Bulk ASIN removed
- Remove `add-asin` from the bulk bar. ASIN is edited per product only. Bulk covers status, category, brand, delete.

### 11. Catalog links to the full editor
- One click on a product from `/admin/products` reaches `/admin/products/[id]/edit` (product name link or row action). The pencil quick-edit dialog stays for fast tweaks.

### 12. Commit your work
- Commit all changes with a descriptive message (e.g. `fix(admin): ARCH-REC-005 — categories crash, import center real data, batch slugs, ASIN safety, UX confirmations`). The commit is part of the deliverable.

---

# ROUND 2 (added 2026-08-21, after the first verification)

Round 1 was built and tested (commit `4e82001`). Verdict: **NOT APPROVED** — most items verified fixed (crash fix, batch slugs, all-statuses, SKU auto-gen, quick-create images/model, confirmations, button states, bulk ASIN removed, editor links, commit; regression clean), but testing found **4 blockers**, all re-confirmed in the committed code by the Architect, plus 2 UX gaps. Fix exactly these six things — nothing else from round 1's scope needs rework.

> **Before you start:** your round-1 report claimed the import pipeline was real and that ASIN preservation was wired in. The committed code says otherwise — `runImport()` is still the timer simulation and `buildProductRow` still hardcodes `asin: null`. After building, check your working tree/diff and confirm the changes below are actually present **before** writing your report. Report what the code does, not what you intended.

### 13. Import center: make the import real (round-1 blocker)
`runImport()` (`BulkImportInteractionLayer.tsx:435`) animates a progress bar and writes nothing; `batchCreateProducts` is imported (line 21) but never called; `runValidation()` (:399) just re-displays DB-wide stats after 700 ms. Required:
- Confirming an import must POST the uploaded file to `/api/admin/batch-upload/parse` (the same route the batch-upload page uses) and call `batchCreateProducts` with the parsed valid rows.
- The result modal must show the REAL created count and REAL failed rows with reasons — taken from the `BatchUploadCreateResult`, not from validation stats.
- Remove the fake failure injection (the "fail" filename trick at `:440`). Progress animation may stay as chrome while requests are in flight, but completion and numbers must come from the real responses.
- Uploading a file must drive what the validation/mapping steps show for THAT file where the pipeline supports it; at minimum, running an import must visibly change the database.

### 14. `buildProductRow`: use the computed ASIN, preserve status (round-1 blocker)
In `src/lib/actions/products.ts`:
- Line 414 already computes the preserved ASIN (`const asin = … : existing?.asin ?? null`) — line 443 then discards it with `asin: null`. Use the computed value.
- Line 442 hardcodes `status: "published"`. On UPDATE, preserve the row's existing status; default `published` is acceptable only for brand-new products (create path).
- Net behavior: saving a product whose ASIN you didn't touch keeps the ASIN; editing an unpublished product through the full form keeps it unpublished.

### 15. Category `parentId` normalization (round-1 blocker)
Root-category create and dialog rename/update fail with "An unexpected error occurred" because the dialogs send `parentId: ""` (`CategoryManagementInteractionLayer.tsx:2700`, `editorInitial` at `:927`) and the server actions insert/patch it raw (`src/lib/actions/categories.ts:104` insert, `:147` patch) — PostgREST rejects `""` as an invalid uuid. Required:
- Normalize server-side in `createCategory` and `updateCategory`: empty string → `null` before insert/patch (`parentId || null`). This fixes every caller at once (the inline saver already normalizes at `:796`; leave it).
- Result: creating a ROOT category succeeds; renaming/updating ANY category via the dialog succeeds.

### 16. `getProductBySlug`: published-only (round-1 blocker)
`getProductBySlug` (`src/lib/products/product-service.ts:507`) has no status filter, so unpublished products are served with HTTP 200 and full content at their direct storefront URLs. Required:
- Filter to `status = 'published'` so unpublished slugs return null → the page 404s.
- Safety note (verified): the only consumer is the storefront catch-all page (`app/[...slug]/page.tsx` via `getCachedProductBySlug`); the admin editor loads products by id (`getProductByIdAdmin`), so this breaks nothing admin-side.

### 17. Delete-guard prompt must not lie (UX gap)
The pre-delete prompt reads `workspace[id]?.metrics.totalProducts ?? 0` (`CategoryManagementInteractionLayer.tsx:952`) — for a category not yet visited this session it shows 0, skips the "move products first" warning, and enables Delete despite products referencing it. The server guard catches it, so no data loss, but the owner-facing protection doesn't fire. Required: the confirmation for deleting a category with products must always warn or block with an ACCURATE count (fetch the real count when opening the dialog, or always show the confirmation and let the server message carry the true number).

### 18. Color trap + invisible validation failures (UX gap)
Quick-create leaves `color = ""`; the next full-form edit then fails `productFormSchema` ("Color is required.") rendered ONLY as an inline field error — users read it as a broken save button. Required:
- Editing a quick-created product in the full form must succeed without forcing the user to invent a color (pick one: quick-create stores a sensible default, or the schema accepts empty color — your call, document it).
- Form submit failures must ALSO surface as a toast/alert, not only inline field text.

### 19. Commit round 2
- Separate commit with a descriptive message, e.g. `fix(admin): ARCH-REC-005 round 2 — real import pipeline, ASIN/status preservation, category parent normalization, published-only product URLs`.

## Acceptance benchmarks

Round 1 (still must hold):

| # | Benchmark |
|---|---|
| 1 | `/admin/categories` loads without crashing; list, counts, create/update/delete and delete-guards work from Supabase |
| 2 | Import center numbers match a direct Supabase count; confirming an import writes real rows and reports per-row results |
| 3 | Batch upload with two rows of the same model imports both (unique slugs); failures show the reason per row |
| 4 | Admin catalog shows published AND unpublished products by default; customer site still hides unpublished |
| 5 | Quick create works without typing a SKU (auto-generated); created products have images and a resolved model |
| 6 | Full form edits sizes and ASIN; saving a product with an existing ASIN keeps the ASIN (DB row verified) |
| 7 | Every delete action asks for confirmation before executing |
| 8 | Every action button shows busy/error/success states (spot-check catalog, brands, models, import) |
| 9 | Bulk bar has no ASIN action; ASIN editable per product only |
| 10 | From `/admin/products`, one click on a product reaches the full editor page (images, sizes, description); the pencil quick-edit dialog still works for fast tweaks |
| 11 | Changes committed to git with a descriptive message |
| 12 | No NEW tsc errors in files you touched; remaining admin errors reduced (you fix the ones in files you touch) |
| 13 | No admin page/action queries Sanity for products/brands/categories/amazonLinks (grep check) |

Round 2 (new):

| # | Benchmark |
|---|---|
| 14 | Upload a real CSV in the import center → Run Import → product count in Supabase increases by exactly the number of valid rows; result modal shows real created/failed counts with reasons; a duplicate-model pair imports both |
| 15 | Full-form save of a product with an existing ASIN keeps the ASIN (DB row verified); full-form save of an UNPUBLISHED product leaves it `unpublished` in the DB and it does NOT appear on the storefront |
| 16 | Creating a ROOT category via the dialog succeeds; renaming a never-before-visited category via the dialog succeeds (rows verified in Supabase) |
| 17 | Unpublish a product → its direct storefront URL returns 404 / not-found within cache TTL; published product URLs unaffected |
| 18 | Attempting to delete a category with products always warns or blocks, with an accurate product count |
| 19 | Quick-create a product leaving color empty → immediately open it in the full form → save succeeds; forcing a validation error shows a visible toast/alert in addition to inline text |
| 20 | Round 2 committed as its own commit with a descriptive message |

## Context you need

- **Round-1 reports**: `openspec/tasks/ARCH-REC-005/implementation_report.md` (claims — treat items 2 and 7 skeptically, see the note above) and `openspec/tasks/ARCH-REC-005/testing_report.md` (trusted verdict with exact line numbers and dynamic proofs — read it first).
- `products` row shape: id, slug (unique), name, model, description (JSON string), attributes (jsonb: price, sizes_detail, traction), price, gender, color, sizes (text[]), status ('published'/'unpublished'), asin, image_links (text[]), category_id, brand_id, leaf_model_id.
- Product Service (`src/lib/products/product-service.ts`) — admin reads go through it; writes via `adminSupabase` (`src/lib/supabase/admin.ts`, service-role). Every write: `revalidateTag("products", "max")` (+ `"models"` where hierarchy touched), `revalidatePath` for affected routes. Next 16.1.6 requires the two-arg `revalidateTag`.
- Batch-upload pipeline exists and works: `BatchUploadForm.tsx` → POST `/api/admin/batch-upload/parse` → preview → `batchCreateProducts` (verified end-to-end in round-1 testing, R3 PASS). The import center just needs to call it for real.
- Validation schemas in `src/lib/schemas/` — keep using them.
- Pre-existing: ~24 admin tsc errors remain (media-library, homepage-management, system-health, affiliate, root scratch files) — fix the ones in files you touch only.

## Boundaries — what NOT to do

- **Don't redesign the admin UI.** Reuse pages, interaction layers, components.
- **Don't touch homepage/navigation/editorial/settings/media pages** — ARCH-06.
- **Don't build the Amazon Affiliate Service** — ARCH-07. **Don't build analytics/clicks** — ARCH-08.
- **Don't delete legacy code** — ARCH-09. Dead constants/actions stay in the repo.
- **Don't build the product-model hierarchy restructure** — ARCH-11 (design D13).
- **Don't change the Supabase schema** — none of these six fixes needs one. If you truly think one does: migration file + report the SQL; never apply it yourself.
- **Don't touch anything outside these six fixes** — round 1 passed everything else; keep it passing.

## Files you'll likely touch

- `src/components/admin/bulk-import/BulkImportInteractionLayer.tsx` (item 13)
- `src/lib/actions/products.ts` (item 14 — `buildProductRow`)
- `src/lib/actions/categories.ts` + `src/components/admin/category-management/CategoryManagementInteractionLayer.tsx` (items 15, 17)
- `src/lib/products/product-service.ts` (item 16 — `getProductBySlug`)
- quick-create color default OR `src/lib/schemas/product.ts` + `ProductForm.tsx` error surfacing (item 18)

In your implementation report: for each of items 13–18, what you changed and how YOU verified it (DB row checks, HTTP status checks where relevant); the diff/commit hash proving the changes are in the tree; and explicitly confirm which round-1 claims from your previous report were wrong (import pipeline, ASIN preservation) so the record is straight.