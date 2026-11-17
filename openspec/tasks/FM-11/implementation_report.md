# FM-11 — Implementation + Testing (brief)

**Task:** FM-11 (bulk operations) | **Date:** 2026-11-16

## Built
- `rollout/src/lib/products/bulk-operations.ts` — shared module: `requireIds` guard (throws `EmptyIdsError` on empty array), `bulkStatusUpdate` (skips proposed/rejected + returns `skipped_in_review_count`), `bulkArchive` (only active→archived), `bulkAddToCollection`/`bulkRemoveFromCollection` (upsert/delete on the M2M).

## Benchmarks met
- require_ids! ✓; proposed/rejected skipped + counted ✓; shared module (reusable) ✓; role-checked at route layer ✓.

## Tester verdict
Static. PASS. Recommend ✅.
