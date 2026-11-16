# ROLL-04: Testing Task — Rollout Amazon Affiliate Service + RLS Policies

This document is for the tester. Run these checks AFTER the implementation task is claimed done. The tester did NOT do the building; verify from scratch. All checks are read-only — nothing here modifies or commits anything.

## Pre-checks

1. Confirm working directory is the repository root: `/home/lordwhitefire/current-project/athletica/athletica`
2. Confirm `rollout/src/lib/affiliate/affiliate-service.ts` exists
3. Confirm `rollout/supabase-rollout-rls-policies.sql` exists

## Checks and expected results

### C1 — Affiliate service exists with required functions
- Run: `cat rollout/src/lib/affiliate/affiliate-service.ts`
- Expected: file exists and exports:
  - `getAffiliateUrl(productId)` — derive URL from product's ASIN
  - `getAffiliateUrlByAsin(asin)` — derive URL directly from ASIN

### C2 — Service uses admin client (service_role)
- Run: `grep -n "createAdminClient\|service_role" rollout/src/lib/affiliate/affiliate-service.ts | head -5`
- Expected: `getAffiliateUrl` calls `createAdminClient()` which uses `SUPABASE_SERVICE_ROLE_KEY`

### C3 — Service handles missing ASIN gracefully
- Run: `grep -n "No ASIN\|asin.*null" rollout/src/lib/affiliate/affiliate-service.ts | head -5`
- Expected: returns error when ASIN is missing

### C4 — Service handles missing product gracefully
- Run: `grep -n "Product not found" rollout/src/lib/affiliate/affiliate-service.ts`
- Expected: returns error when product not found

### C5 — RLS policies file exists
- Run: `cat rollout/supabase-rollout-rls-policies.sql`
- Expected: file exists with 4 policies:
  - `anon_can_read_published_products`
  - `admin_full_access_products`
  - `anon_can_insert_analytics`
  - `admin_can_read_analytics`

### C6 — RLS policies target correct roles
- Run: `grep -n "TO anon\|TO service_role" rollout/supabase-rollout-rls-policies.sql`
- Expected:
  - `anon_can_read_published_products` targets `anon`
  - `admin_full_access_products` targets `service_role`
  - `anon_can_insert_analytics` targets `anon`
  - `admin_can_read_analytics` targets `service_role`

### C7 — RLS policies target correct tables
- Run: `grep -n "ON rollout" rollout/supabase-rollout-rls-policies.sql`
- Expected:
  - 2 policies on `rollout.products`
  - 2 policies on `rollout.analytics`

### C8 — RLS policies have correct operations
- Run: `grep -n "FOR SELECT\|FOR INSERT\|FOR ALL" rollout/supabase-rollout-rls-policies.sql`
- Expected:
  - `anon_can_read_published_products` = `FOR SELECT`
  - `admin_full_access_products` = `FOR ALL`
  - `anon_can_insert_analytics` = `FOR INSERT`
  - `admin_can_read_analytics` = `FOR SELECT`

### C9 — Service uses correct schema (rollout, not public)
- Run: `grep -n "from('products')" rollout/src/lib/affiliate/affiliate-service.ts`
- Expected: queries use `.from('products')` (Supabase routes to the rollout schema)
- **DO NOT** see `.from('public.products')` or `.from('rollout.products')`

### C10 — No Mature schema references
- Run: `grep -E "brands|categories|models|hierarchy|leaf_model" rollout/src/lib/affiliate/affiliate-service.ts || true`
- Expected: NO references to Mature schema/tables

### C11 — TypeScript compiles without errors
- Run: `cd rollout && npx tsc --noEmit`
- Expected: no errors

### C12 — `.env.local` NOT read directly
- Run: `grep -n "\.env\.local" rollout/src/lib/affiliate/affiliate-service.ts || true`
- Expected: NO references to `.env.local` files

### C13 — No push performed
- Run: `git status` (check if local branch is ahead of origin)
- Expected: local branch is ahead by 1 commit (expected); remote unchanged

## Verdict

- **PASS** only if ALL checks C1–C13 produce expected results
- **FAIL** if any check fails, especially:
  - C1: Missing required functions
  - C2: Not using service_role key
  - C5: RLS policies file missing
  - C6: Wrong roles targeted
  - C8: Wrong operations
  - C11: TypeScript errors

## Security Notes

- **Never** read `.env.local` files directly
- **Never** expose API keys or secrets in test output
- Use `process.env` for loading environment variables
- If you need to verify env vars exist, check `.env.example` (committed) not `.env.local` (secret)
- The RLS SQL file is **NOT executed** by the task — owner runs it in the dashboard