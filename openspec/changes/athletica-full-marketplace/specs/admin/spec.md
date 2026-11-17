# Spec — Admin workspace

**Change:** athletica-full-marketplace | **Phase:** 3 | **Tasks:** FM-10…FM-14
**Sources:** `blueprint/01-build-layers.md` (Functionality), RE-04 (Spree catalog), RE-05 (auth/RLS), RE-07 (UX).

## Intent

The admin workspace is where the owner runs the marketplace: manages products and variants, files them into categories and collections, bulk-updates status, imports catalogs via CSV, manages the media library, and watches a live analytics dashboard. It is secured by the three locks (Phase 1) and every write is role-checked at the server.

## Requirements

**Product CRUD + variants + categories + collections (FM-10):** `/admin/products` (search, status filter, sort, pagination, add/edit modals). `/admin/products/[id]/edit` (variants, images, categories, collections). 5-status state machine (`draft/active/archived` operator-set + `proposed/rejected` review-only, not bulk-assignable). 3-condition publish gate (active + not-deleted + available_on ≤ now). `discontinue()` bypasses validation, sets `discontinue_on`, status=`archived`. Soft-delete via `deleted_at`. Price optional (Amazon policy — never on the public page; admin-only internal field). Tags per-schema.

**Bulk operations (FM-11):** a shared module (not duplicated per entity). Every bulk action guarded by `require_ids!` (validates the `ids` array is present + non-empty — no accidental "destroy everything" by passing empty array). `bulk_status_update` skips `proposed`/`rejected` and counts them in `skipped_in_review_count` so the UI shows "N products skipped." Bulk archive, bulk tag, bulk category/collection assignment.

**Two-phase CSV import (FM-12):** MAPPING phase (parse + validate rows in memory) → PROCESSING phase (persist to DB). Separates "is the data shape right?" from "did the DB writes succeed?" — a 10,000-row file with one bad row reports the bad row at mapping without partial writes. Per-row status. Grouped COUNT for progress ("9,998 completed, 1 failed") in one query. No delete mid-processing. `can_be_deleted?` returns true only for `pending/mapping/completed/failed` — never mid-processing.

**Media library (FM-13):** `/admin/media` — upload (JPEG/PNG/WebP/AVIF, 5MB), browse (grid of assets), asset detail, delete. Service-role upload to Sanity; returns `_id` + `url`. Secured behind admin auth. Sanity write token server-side only. Products reference Sanity URLs (Supabase stores the URL, not the image).

**Live analytics dashboard (FM-14):** `/admin/analytics` — total views, total clicks, CTR, per product, per source (instagram/whatsapp/direct), per affiliate, 7/30/90 days, payout pipeline status. **Live** (SSE or short-polling fallback on flaky connections). Date-range selector. Empty = "No data yet" (no fake zeros). Loading = skeleton. Drop-reason counts visible. Affiliate performance = clicks attributed to tracker. Payout pipeline = payouts grouped by status.

## Behavior boundaries

- Every `/api/admin/*` route checks the admin role server-side (`getClaims()`). No service-role key reaches the browser.
- `/admin/*` returns 404 until the three locks pass (Phase 1).
- Bulk operations never accept an empty `ids` array.
- CSV import never leaves partial writes on a bad row (mapping validates before processing persists).
- The media library never exposes the Sanity write token to the browser.
- The analytics dashboard never shows fake zeros — empty is empty.
- Live updates degrade to polling if SSE drops (Nigerian connectivity context).

## What success looks like (phase gate)

- The owner signs in via the three locks and reaches `/admin/products`.
- The owner creates a product with 3 variants, files it into 2 categories + 1 collection, sets it active, and it appears on the public storefront.
- The owner selects 50 products and bulk-archives them; 3 in `proposed` state are skipped and the response says "3 skipped."
- The owner imports a 500-row CSV; 1 bad row is flagged at the mapping phase; 499 good rows persist; no partial writes.
- The owner uploads an image to the media library and assigns it to a product; the image renders on the public page from the Sanity CDN.
- The owner opens `/admin/analytics` and sees live view/click counts updating; switching the date range updates the charts; an empty period shows "No data yet," not zeros.
