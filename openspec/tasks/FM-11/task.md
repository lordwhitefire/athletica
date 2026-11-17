# FM-11 — Bulk operations module

**Phase:** 3 | **Spec:** admin | **Depends on:** FM-10 | **Status:** ⬜ Pending

## What we're building

A shared bulk-operations module (not duplicated per entity) that lets the owner select many products and bulk-update status, bulk-archive, bulk-tag, bulk-add-to-categories, bulk-add-to-collections — every action guarded by `require_ids!` (rejects an empty `ids` array) and reporting skip-counts (`skipped_in_review_count`).

## Why it matters

Without bulk ops, the owner edits products one at a time — unworkable at catalog scale. Without `require_ids!`, an empty selection could "destroy everything." Without skip-counting, the owner can't see why only 47 of 50 products moved.

## What success looks like (benchmarks)

- After this, the owner can select 50 products and bulk-set their status to `archived`; all 50 archive (or fewer, with a skip count).
- After this, when the owner submits a bulk action with an empty `ids` array, the request is rejected (`require_ids!`) — no accidental "destroy everything."
- After this, when the owner bulk-updates status on 50 products that include 3 in `proposed` state, those 3 are skipped and the response says "3 skipped" (the UI surfaces `skipped_in_review_count`).
- After this, bulk operations are a shared module — the same `require_ids!` + skip-counting pattern is used for products, and reusable for any future entity (affiliates, etc.).
- After this, bulk tag/category/collection add/remove work the same way.
- After this, every bulk action is role-checked (admin only).

## Context the Builder needs

- The Spree pattern (RE-04 §2.6–2.7): `require_ids!` guard, `bulk_status_update` skips `proposed`/`rejected`, response includes `skipped_in_review_count`, bulk operations as a shared concern (a Rails concern in Spree — a shared TS module here).
- Existing: `rollout/src/app/admin/products/page.tsx` (the admin list with selection).
- Bulk actions: `bulk_status_update`, `bulk_archive`, `bulk_add_tags`/`bulk_remove_tags`, `bulk_add_to_categories`/`bulk_remove_from_categories`, `bulk_add_to_collections`/`bulk_remove_from_collections`.

## Boundaries

- Do not accept an empty `ids` array (require_ids!).
- Do not bulk-assign `proposed`/`rejected` (review-only statuses).
- Do not duplicate the bulk logic per entity — shared module.
- Do not skip the skip-count in the response.
- Do not skip the admin role check.
