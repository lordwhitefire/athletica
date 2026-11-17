# FM-12 — Two-phase CSV import

**Phase:** 3 | **Spec:** admin | **Depends on:** FM-10 | **Status:** ⬜ Pending

## What we're building

A CSV import flow with two phases — MAPPING (parse + validate rows in memory) then PROCESSING (persist to DB) — with per-row status, grouped COUNT progress, and no delete mid-processing. The two-phase split means a 10,000-row file with one bad row reports the bad row at mapping without leaving partial writes.

## Why it matters

A one-phase import either writes-then-rolls-back (slow, risky) or writes-as-it-goes (partial on failure). Two-phase separates "is the data shape right?" from "did the DB writes succeed?" — so a bad row never produces a half-imported catalog.

## What success looks like (benchmarks)

- After this, the owner can upload a CSV; the system enters MAPPING (parses + validates every row in memory) and reports per-row status before any DB write.
- After this, a 10,000-row CSV with 1 bad row reports the bad row at the MAPPING phase (with the row number + the validation error); the 9,999 good rows are available to process; no DB writes have happened yet.
- After this, when the owner proceeds to PROCESSING, the good rows persist; the per-row status updates (`pending → completed` or `→ failed`); a grouped COUNT query shows "9,999 completed, 1 failed" in one query (not N queries).
- After this, a `failed` import can be deleted; a mid-`processing` import CANNOT be deleted (`can_be_deleted?` returns false).
- After this, the import is a thin subclass declaring `row_processor_class` + `group_column` — the same engine serves products, and could serve future types (price lists, etc.) without restructuring.
- After this, the import is role-checked (admin only).

## Context the Builder needs

- The Spree pattern (RE-04 §2.8): state machine `pending → mapping → completed_mapping → processing → completed` (or `→ failed`); `fail!` is deprecated (failure is a status, not a transition); `rows_status_counts` returns a grouped COUNT in one query (memoized); `can_be_deleted?` returns true only for `pending/mapping/completed/failed`.
- Existing: `rollout/src/lib/autofill.ts` (CSV/Excel autofill via PapaParse + ExcelJS).
- The import is a thin subclass over a shared engine.

## Boundaries

- Do not write to the DB during MAPPING (parse + validate in memory only).
- Do not allow delete mid-PROCESSING.
- Do not use N queries for progress (one grouped COUNT).
- Do not duplicate the engine per import type — thin subclass pattern.
- Do not skip the admin role check.
- Do not use `fail!` as a transition (failure is a status).
