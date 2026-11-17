# FM-11 — Testing (bulk operations)

**Task:** FM-11 | **Verify behavior, not UI.**

## What behavior to verify

1. Does a bulk action on 50 products move them all (or report skips)?
2. Does an empty `ids` array get rejected?
3. Are `proposed`/`rejected` skipped + counted in `skipped_in_review_count`?
4. Is the bulk module shared (not duplicated per entity)?
5. Is every bulk action role-checked?

## How to verify (behavioral)

- **Bulk archive:** select 50 `active` products, bulk-archive → all 50 become `archived`.
- **Empty ids:** submit a bulk action with `ids: []` → the request is rejected with an error (no products touched).
- **Skip count:** select 50 products (47 `active` + 3 `proposed`), bulk-set to `archived` → 47 archive; the response carries `skipped_in_review_count: 3`; the UI shows "3 skipped."
- **Shared module:** inspect the code → the `require_ids!` + skip-counting logic is in one shared module used by all bulk endpoints (not copy-pasted per route).
- **Role check:** with no admin session, POST to a bulk endpoint → 404.

## What "working" means

- Bulk ops work at scale safely.
- Empty selections can't destroy data.
- Review-only statuses are protected.
- The logic is shared, not duplicated.

## What to report

- The count of products moved in the bulk archive.
- The response for the empty-`ids` submission (must be a rejection).
- The `skipped_in_review_count` value + the UI surfacing it.
- Whether the bulk module is shared (file structure).
- The HTTP status for an unauthenticated bulk POST.
