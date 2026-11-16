# Tester Task: ARCH-REC-005 — Re-Verify the Admin After the Reconciliation

## What to verify

ARCH-005 (admin wired to Supabase) was verified on 2026-08-20 and failed in 3 areas; the owner added requirements. The Builder then did a **reconciliation** (ARCH-REC-005). Your job: verify the reconciliation fixed what it claims, and that it didn't break what already worked. This is a **separate session** — you did not do the building and you have not seen the implementation report before testing.

**Verify the 12 reconciliation items first, in order — any failure blocks the rest:**

| # | Re-test | How |
|---|---|---|
| R1 | `/admin/categories` loads without crashing | Open the page; list, product counts, create/update/delete, and the delete-guard for a category with products must all work from Supabase |
| R2 | Import center shows real numbers | Open import center; totals must match a direct Supabase count (products ~29+, missing ASIN ~28+). No mock constants. Confirming an import must write real rows and report per-row results |
| R3 | Batch upload handles duplicate models | Upload a CSV with 2 rows of the same model → BOTH import (unique slugs); failure rows show the reason, not "Unknown error" |
| R4 | Catalog shows all statuses by default | Unpublish a test product → it appears in the default catalog view without touching filters; customer site still hides it |
| R5 | SKU auto-generated | Quick create without typing SKU → product created with an auto SKU |
| R6 | Quick create has images + model | Quick-created product has an image and a resolved model |
| R7 | Full form edits sizes + ASIN; ASIN survives edits | Edit sizes in the form → stored; ASIN field present; set an ASIN via catalog, then edit the product via the full form → ASIN still in the DB row |
| R8 | Delete confirmations | Product, bulk, brand, category, model deletes all ask for confirmation first (name + count) |
| R9 | Button states | Saves/bulk/deletes show busy, error (visible), and success states |
| R10 | No bulk ASIN | Bulk bar has no ASIN action; ASIN only per product |
| R11 | Catalog reaches the full editor | From `/admin/products`, one click on a product opens `/admin/products/[id]/edit` with images, sizes, description; the pencil quick-edit dialog still works for fast tweaks |
| R12 | Committed | `git log -1` shows the reconciliation commit with a descriptive message |

---

# ROUND 2 VERIFICATION (added 2026-08-21)

Round 1 testing (below) found 4 blockers + 2 UX gaps. The Builder claims a round-2 fix. Verify **these six first** — they are the reason for this round. Evidence = DB rows / HTTP status / row counts, never the UI alone.

| # | Test | How |
|---|---|---|
| T1 | **Import center writes real rows** (round-1 blocker: simulated timer, `batchCreateProducts` never called) | Upload a real CSV (include a duplicate-model pair) → Run Import → Supabase product count increases by EXACTLY the valid rows; result modal shows real created/failed counts with per-row reasons; count before vs after is your proof. A filename containing "fail" must NOT fabricate a failure anymore |
| T2 | **ASIN preserved + status preserved on full-form save** (round-1 blocker: `asin: null` and `status: "published"` hardcoded in `buildProductRow`) | (a) Product with existing ASIN → open full form, change ONLY the price, save → `asin` unchanged in DB. (b) UNPUBLISHED product → full-form edit (e.g. price), save → DB row still `unpublished`; storefront listing does not show it |
| T3 | **Category root-create + dialog rename work** (round-1 blocker: `parentId: ""` → PostgREST invalid uuid) | Create a ROOT category via the dialog → row in Supabase with `parent_id` null. Rename a category you have NOT visited this session via the edit dialog → succeeds, row updated |
| T4 | **Unpublished products 404 at direct URLs** (round-1 blocker: `getProductBySlug` had no status filter) | Unpublish a product → poll its direct storefront URL for 60s+ → must return 404/not-found (not 200 with content); published product URLs unaffected; admin catalog still lists the unpublished product |
| T5 | **Delete-guard prompt accurate** (UX gap: stale 0 count skipped the warning) | Without visiting a category that has products, attempt to delete it → confirmation must warn or block with an ACCURATE product count (not 0); server guard still holds as backstop |
| T6 | **Color trap gone + visible failures** (UX gap: quick-create leaves color "", full-form save failed inline-only) | Quick-create a product leaving color empty → immediately open it in the full form → save SUCCEEDS (or color is pre-filled sensibly — check the implementation report for which approach was chosen and verify it matches). Then force a validation error (e.g. clear name) → a toast/alert appears IN ADDITION to inline text |

### Round-2 regression spot-checks (fast, after T1–T6 pass)

- Batch upload page still works end-to-end (R3 flow) — the import center now shares its pipeline.
- One full editor CRUD round trip (edit price → DB → storefront within TTL).
- Brands delete-guard + models delete-guard still block with clear errors.
- No new tsc errors in Builder-touched files (`npx tsc --noEmit` in `frontend/`; baseline 24 pre-existing admin errors).
- Commit exists: round 2 should be its own descriptive commit (`git log -2`).

### Honesty check on the implementation report

Round 1's report claimed fixes that were not in the code. For round 2: after testing, skim the implementation report and flag ANY claim contradicted by your observations. The verdict must state whether the report matches reality this time.

## What to report

1. T1–T6 results, each pass/fail with hard evidence (row counts, DB rows, HTTP status codes).
2. Regression spot-check results.
3. Whether the round-2 commit exists and is descriptive.
4. Report-vs-reality check (see above).
5. Surprises: anything else broken or behaving differently from the benchmarks.

**No screenshots. No UI matching.** Just: *Are the four blockers really dead, do the two UX gaps behave, and did nothing regress?*

---

## ROUND 1 REFERENCE (original verification brief — kept as the regression baseline)

### Then re-verify the ARCH-005 core (regression)

### 1. Products catalog (`/admin/products`)
- Lists products from Supabase (expect ~29 rows); **Network tab**: no `cdn.sanity.io`/Sanity API calls (Supabase/PostgREST only — CDN `<img>` loads from `image_links` are fine).
- Filters/sort/search/facets/KPIs work: search "predator", brand adidas, status published/unpublished, missing data, pagination.

### 2. Product editor — full CRUD round trip
Pick a real product (e.g. `adidas-predator-elite-fg-black`):
1. **Edit** price → save → verify in Supabase (row changed) → verify on the storefront product page within cache TTL (< ~60s) → revert.
2. **Create** via the full form (unique name) → row in Supabase with slug, brand_id, category_id, leaf_model_id, image_links populated (URLs not refs) → appears in admin catalog + storefront search.
3. **Delete** the created product → row gone; storefront URL 404s; no orphan references.

### 3. Quick create + bulk ops
- Quick create (name/category/brand, no SKU) → product appears with auto SKU and chosen status.
- Bulk ops (set status, assign category, assign brand, delete) → verify in Supabase each op touched exactly the selected rows.

### 4. Brands
- List from `brands` table with logos from `logo_link`.
- Create → row with slugified name. Edit → row updated. Delete a brand with products → blocked with clear error. Delete empty brand → works (or matches the Builder's documented choice — check the implementation report).

### 5. Categories (after R1)
- Real categories with real product counts; create/update/delete work; delete a category with products → blocked.

### 6. Models management
- Hierarchy displayed (21 models: adidas Predator root + children, X root; Nike Mercurial Vapour 17 root=leaf) with product counts.
- Create root/child (levels 0/1), reparent, rename; delete a leaf with products → blocked; delete empty model → works.
- **Storefront link**: newly created root model appears in the customer site's model filters within cache TTL (note: a pre-existing `getFacets` category-label-vs-slug bug may block this — report it if so, it is tracked separately).

### 7. Dashboard (`/admin/overview`)
- Real KPIs (total ~29, missing ASIN ~28, etc.), recent products from `created_at`, category distribution matching Supabase, clicks 0, no Sanity calls.

### 8. Cache propagation
- Admin write (price change) → storefront shows it within TTL. Same for a model change.

### 9. No Sanity in admin data paths
```bash
rg -l "adminClient|sanity" frontend/src/lib/actions frontend/src/app/admin frontend/src/components/admin | sort
```
Allowed: image-utility files + ARCH-06 content pages (homepage, navigation, site-settings, media). **Forbidden**: products, brands, categories, import-center, batch-upload, overview actions.
```bash
rg -l "data/brands|data/products" frontend/src/lib/actions frontend/src/app/admin frontend/src/components/admin
```
Expected: empty.

### 10. TypeScript
```bash
npx tsc --noEmit
```
in `frontend/`. Report: errors in Builder-touched files (should be 0) + remaining admin error count (was 24 after ARCH-005; should be ≤ that).

### 11. Schema
Migration file exists in `supabase/migrations/` if the Builder claims one, **not applied by them** (user applies it). Schema changed without a migration file = failure.

## What to report

1. R1–R12 results, each pass/fail with evidence (DB rows, Network tab, screenshots not needed).
2. Regression results per area (catalog, editor CRUD, quick create + bulk, brands, categories, models, dashboard, cache, no-Sanity grep, tsc, schema).
3. The commit hash from `git log -1`.
4. Surprises: anything behaving differently from the benchmarks, any action still hitting Sanity, any UI breakage, any storefront inconsistency.

**No screenshots. No UI matching.** Just: *Did the reconciliation fix the failures, did the owner requirements land, and did nothing regress?*