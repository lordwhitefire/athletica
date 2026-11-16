# Builder Task: ARCH-REC-006 — Reconciliation: Fix ARCH-06 Write Blockers & Add Drift Migration

## What we're reconciling

ARCH-06 successfully moved content reads (homepage, navigation, site settings) and site settings writes to Supabase, but testing revealed **two critical write blockers** and one missing artifact:
1. **Homepage admin save fails (HTTP 400):** `src/lib/actions/homepage.ts:632` attempts to delete removed sections using `.delete().neq("id", "")`, which PostgREST rejects as invalid UUID syntax (`?id=neq.`).
2. **Navigation save is lossy:** `src/lib/actions/navigation.ts` loads navigation unpaginated and deletes any DB record not explicitly present in the submitted payload, purging ~228 unlisted records.
3. **Drift migration file missing:** The schema-drift migration for `homepage_sections.attributes jsonb` and the unique index `(type, order, title)` was never committed to `supabase/migrations/`.

This reconciliation fixes these two write blockers and adds the missing drift migration file without altering the working read paths or site settings writes.

## What we're building

### 1. Fix Homepage Delete Query (`homepage.ts`)
Instead of `.delete().neq("id", "")`, delete removed sections properly:
- Collect all section IDs currently kept in the save payload (`survivingIds`).
- If `survivingIds.length > 0`, delete rows whose `id` is NOT in `survivingIds`: `.delete().not("id", "in", `(${survivingIds.join(",")})`)`. If no sections survive, delete all rows: `.delete()`.
- Verify that saving `/admin/homepage/editor` now returns 200 and updates Supabase.

### 2. Fix Navigation Save (`navigation.ts`)
Prevent the navigation save from wiping unlisted records:
- Instead of wiping the table and reinserting, use an UPSERT strategy for items submitted in the payload.
- If items were deleted in the UI, delete ONLY those specific IDs received as deletions or compute the diff against submitted IDs using explicit `.in("id", deletedIds)` rather than a wholesale truncate-and-reinsert of unpaginated records.
- Ensure all 1,293+ navigation items remain intact after a save (verify via Supabase count).

### 3. Add Schema-Drift Migration File
Create `supabase/migrations/20260822000000_homepage_sections_drift_backfill.sql`:
- Idempotent SQL:
  ```sql
  -- Add attributes jsonb column if missing
  alter table homepage_sections add column if not exists attributes jsonb;

  -- Add unique constraint on (type, order, title) if missing (wrapped in DO block or conditional check)
  do $$
  begin
      if not exists (
          select 1 from pg_constraint where conname = 'homepage_sections_type_order_title_key'
      ) then
          alter table homepage_sections add constraint homepage_sections_type_order_title_key unique (type, "order", title);
      end if;
  end $$;
  ```
- **Do not apply it** — commit the file; report the SQL and command for the user.

### 4. Commit your work
- Commit with a descriptive message, e.g. `fix(content): ARCH-REC-006 — fix homepage delete syntax, safe navigation upsert, schema drift migration`.

## Acceptance benchmarks

| # | Benchmark |
|---|---|
| 1 | Saving changes in `/admin/homepage/editor` succeeds (HTTP 200, no PostgREST 400 error) and updates Supabase rows |
| 2 | Saving navigation in `/admin/navigation` preserves unlisted records (Supabase row count remains stable at ~1,293 rows) |
| 3 | Schema-drift migration file exists in `supabase/migrations/`, is idempotent, and matches live DB structure |
| 4 | All ARCH-06 read paths, site settings writes, media page, and product regressions continue to pass |
| 5 | Changes committed to git with a descriptive message |

## Boundaries
- Do not touch read paths, site settings writes, or media management (they already passed testing).
- Do not apply the migration file yourself.
- No new TypeScript errors in files you touch.