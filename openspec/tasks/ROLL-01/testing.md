# ROLL-01: Testing Task — Rollout schema + types (single project)

This document is for the tester. Run these checks AFTER the implementation task is claimed done. The tester did NOT do the building; verify from scratch. All checks are read-only — nothing here modifies or commits anything.

## Pre-checks

1. Confirm working directory is the repository root: `/home/lordwhitefire/current-project/athletica/athletica`
2. Confirm `rollout/` directory exists

## Checks and expected results

### C1 — `rollout/` is a valid Next.js app
- Run: `cd rollout && cat package.json | grep -E '"next"|"react"|"typescript"'`
- Expected: `package.json` contains `next`, `react`, `typescript` dependencies; `next` version 14+

### C2 — `rollout/` has its own isolated dependencies (not a copy of `frontend/`)
- Run: `diff <(cat ../frontend/package.json | jq -S .dependencies) <(cat package.json | jq -S .dependencies) || true`
- Expected: differences exist — `rollout/` is a fresh app, not a copy

### C3 — Supabase client installed
- Run: `cd rollout && cat package.json | grep '@supabase/supabase-js'`
- Expected: `@supabase/supabase-js` in dependencies

### C4 — No Supabase CLI installed (expected — types are manual)
- Run: `cd rollout && cat package.json | grep '"supabase"'`
- Expected: `supabase` NOT in dependencies (no CLI; types are hand-written)

### C5 — Environment files present (structure only)
- Run: `ls -la rollout/.env.example 2>/dev/null || true`
- Expected: `.env.example` EXISTS
- Run: `cat rollout/.env.example`
- Expected: contains placeholders for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SYSTEM_TYPE=rollout`
- **DO NOT** check `.env.local` content — it contains secrets

### C6 — `rollout` schema exists in the EXISTING project (NOT a second project)
- In the Supabase dashboard for the owner's existing project:
  - A schema named `rollout` exists (NOT a new separate project)
- Table `rollout.products` exists with all columns from design.md
- Table `rollout.analytics` exists with all columns from design.md
- Indexes `idx_rollout_products_status`, `idx_rollout_products_slug`, `idx_rollout_analytics_product`, `idx_rollout_analytics_created` exist
- Foreign key `rollout.analytics.product_id → rollout.products.id` exists with `ON DELETE CASCADE`
- Mature tables remain in `public` (e.g. `public.products` if that's what Mature uses) — untouched

### C7 — TypeScript types file exists and covers both tables under `Database.rollout`
- Run: `cat rollout/src/lib/database.types.ts`
- Expected: File EXISTS and contains:
  - `Database.rollout` (not `Database.public`) as the schema key
  - `products` with `Row`, `Insert`, `Update` types
  - `analytics` with `Row`, `Insert`, `Update` types
  - JSONB sub-types (`ProductBenefit`, `ProductDetail`, or equivalent)
  - Does NOT contain `Database.public` table definitions for Rollout tables

### C8 — Types are manually written (not auto-generated comment)
- Run: `head -5 rollout/src/lib/database.types.ts`
- Expected: a manual note (e.g. "Manually written types for the Rollout schema — no CLI used") or a hand-written structure; NOT a CLI auto-generated header

### C9 — No Mature schema leakage in types
- Run: `grep -E "public\.|models|brands|categories|navigation|settings|media" rollout/src/lib/database.types.ts || true`
- Expected: NO references to Mature schema/tables

### C10 — `.env.local` NOT tracked
- Run: `git ls-files rollout/.env.local`
- Expected: empty output (file not tracked)

### C11 — SQL schema file exists
- Run: `ls rollout/supabase-rollout-schema.sql`
- Expected: file exists
- Run: `head -20 rollout/supabase-rollout-schema.sql`
- Expected: contains `CREATE SCHEMA IF NOT EXISTS rollout` and table definitions

### C12 — `.env.example` should be committed (IMPORTANT: verify this)
- Run: `git ls-files rollout/.env.example`
- Expected: file should be tracked (committed)
- **If not tracked**: This is a bug in `rollout/.gitignore` — the `.env*` pattern is too broad and ignores `.env.example`. To fix, add `!.env.example` after the `.env*` line in `rollout/.gitignore`.

### C13 — No push performed
- Run: `git status` (check if local branch is ahead of origin)
- Expected: local branch is ahead by 1 commit (expected); remote unchanged

## Verdict

- **PASS** only if ALL checks C1–C13 produce expected results
- **FAIL** if any check fails, especially:
  - C2: `rollout/` is a copy of `frontend/` instead of fresh app
  - C4: Supabase CLI was installed (unexpected — types should be manual)
  - C5: `.env.example` missing
  - C6: `rollout` schema missing, tables wrong, OR a second project was used instead of a schema in the existing project
  - C7: Types file missing, uses `Database.public` instead of `Database.rollout`, or incomplete
  - C9: Mature schema types leaked into Rollout types
  - C12: `.env.example` is not committed (bug in .gitignore)

## Security Notes

- **Never** read `.env.local` files directly in test scripts
- **Never** expose actual API keys, tokens, or secrets in test output
- Use dotenv for loading environment variables when testing connectivity
- If you need to verify environment variables exist, check `.env.example` (committed) not `.env.local` (secret)
- The `.env.local` file should only be accessed by the application runtime, not by test scripts

## Known Issue to Fix

The `rollout/.gitignore` has a `.env*` pattern that ignores ALL .env files including `.env.example`. This needs to be fixed by adding `!.env.example` after the `.env*` line. The current `.gitignore` should be:

```gitignore
# env files (can opt-in for committing if needed)
.env*
!.env.example
```

This ensures `.env.local` remains ignored (secrets) while `.env.example` is committed (template).