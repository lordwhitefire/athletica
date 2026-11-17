# FM-12 — Testing (two-phase CSV import)

**Task:** FM-12 | **Verify behavior, not UI.**

## What behavior to verify

1. Does MAPPING parse + validate without writing to the DB?
2. Does a bad row surface at MAPPING (with row number + error) before any write?
3. Does PROCESSING persist only the good rows + update per-row status?
4. Is progress a grouped COUNT in one query (not N)?
5. Can a `failed`/`completed` import be deleted but NOT a mid-`processing` one?
6. Is the import role-checked?

## How to verify (behavioral)

- **MAPPING no-write:** upload a 100-row CSV; during MAPPING, query the product table → no new rows yet.
- **Bad row surfaced:** upload a 100-row CSV with row 47 missing a required field → the mapping result flags row 47 with the error; rows 1–46 + 48–100 are valid.
- **PROCESSING:** proceed to PROCESSING → the 99 good rows persist; per-row status updates to `completed`; row 47 stays `failed` (or is excluded).
- **Grouped COUNT:** query the import's progress → one grouped query returns `{completed: 99, failed: 1, pending: 0}` (not 100 separate row queries).
- **Delete guard:** attempt to delete an import in `processing` → rejected. Attempt on `failed` or `completed` → succeeds.
- **Role check:** with no admin session, POST to the import endpoint → 404.

## What "working" means

- Bad rows never produce partial writes.
- Progress is observable + cheap.
- Mid-processing deletes are blocked.
- The engine is reusable.

## What to report

- Whether DB rows appeared during MAPPING (there should be none).
- The bad-row report (row number + error).
- The final per-row counts (completed vs failed).
- Whether progress was one grouped query.
- The delete-guard behavior for each state.
- The HTTP status for an unauthenticated import POST.
