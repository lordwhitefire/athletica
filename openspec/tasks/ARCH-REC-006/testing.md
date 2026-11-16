# Tester Task: ARCH-REC-006 — Verify Reconciliation of ARCH-006 Write Blockers

## What to verify

The Builder has applied fixes for the two write blockers found in ARCH-06 (homepage delete query syntax and lossy navigation saves) and added the missing schema-drift migration file. Your job: verify these specific fixes work and that the content read paths and site settings writes remain healthy.

## How to verify

### 1. Homepage Admin Save Round-Trip
- Open `/admin/homepage/editor`.
- Make a small edit (e.g., change a hero banner subtitle or section title) and click Save.
- **Verify:** Save succeeds (HTTP 200, success toast, no PostgREST 400 error in Network tab).
- **Verify in Supabase:** The corresponding `homepage_sections` row updates with the new text.
- **Verify on Storefront:** The change appears on `/` within cache TTL (~60s).

### 2. Navigation Safe Save
- Check total row count in the `navigation` table in Supabase before testing (expect ~1,293 rows).
- Open `/admin/navigation`, make a minor edit (e.g. rename a label), and click Save.
- **Verify in Supabase:** Row count in `navigation` table remains stable (~1,293 rows) — no unlisted records were purged.
- **Verify on Storefront:** Updated nav label renders correctly within TTL.

### 3. Schema-Drift Migration File Check
- Check `supabase/migrations/` for `20260822000000_homepage_sections_drift_backfill.sql`.
- **Verify:** File exists, contains idempotent statements (`add column if not exists attributes jsonb` and unique constraint check), and was **not** auto-applied.

### 4. Regression & Commit
- Verify site settings save still works (`/admin/site-settings`).
- Verify storefront homepage renders without errors.
- Run `npx tsc --noEmit` in `frontend/` — 0 errors in touched files.
- Verify `git log -1` shows the descriptive ARCH-REC-006 commit message.

## What to report

1. Homepage save result (HTTP status, DB verification, storefront reflection).
2. Navigation save result (pre- and post-save row counts in Supabase).
3. Drift migration file confirmation.
4. Commit hash and tsc status.