# ROLL-03: Testing Task — Rollout Analytics Service

This document is for the tester. Run these checks AFTER the implementation task is claimed done. The tester did NOT do the building; verify from scratch. All checks are read-only — nothing here modifies or commits anything.

## Pre-checks

1. Confirm working directory is the repository root: `/home/lordwhitefire/current-project/athletica/athletica`
2. Confirm `rollout/src/lib/analytics/analytics-service.ts` exists

## Checks and expected results

### C1 — Analytics service exists with all required functions
- Run: `cat rollout/src/lib/analytics/analytics-service.ts`
- Expected: file exists and exports:
  - `recordView(productId)` — public: record a view event
  - `recordClick(productId)` — public: record a click event
  - `getKPIs(range)` — admin: get total views, clicks, CTR
  - `getTopProducts(range, limit)` — admin: get per-product metrics
  - `getChartData(range)` — admin: get daily chart data

### C2 — Public operations use anon key
- Run: `grep -n "createPublicClient\|anon" rollout/src/lib/analytics/analytics-service.ts | head -5`
- Expected: `recordView` and `recordClick` call `createPublicClient()` which uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### C3 — Admin operations use service_role key
- Run: `grep -n "createAdminClient\|service_role" rollout/src/lib/analytics/analytics-service.ts | head -5`
- Expected: `getKPIs`, `getTopProducts`, `getChartData` call `createAdminClient()` which uses `SUPABASE_SERVICE_ROLE_KEY`

### C4 — Service uses correct schema (rollout, not public)
- Run: `grep -n "from('analytics')" rollout/src/lib/analytics/analytics-service.ts`
- Expected: queries use `.from('analytics')` (Supabase routes to the rollout schema)
- **DO NOT** see `.from('public.analytics')` or `.from('rollout.analytics')`

### C5 — Types are imported correctly
- Run: `grep -n "import.*Database" rollout/src/lib/analytics/analytics-service.ts`
- Expected: imports `Database` from `@/lib/database.types`

### C6 — No Mature schema references
- Run: `grep -E "brands|categories|models|hierarchy|leaf_model" rollout/src/lib/analytics/analytics-service.ts || true`
- Expected: NO references to Mature schema/tables

### C7 — Date range support exists
- Run: `grep -n "DateRange\|7d\|30d\|90d" rollout/src/lib/analytics/analytics-service.ts`
- Expected: `DateRange` type with `'7d' | '30d' | '90d'` options

### C8 — KPIs include views, clicks, and CTR
- Run: `grep -n "totalViews\|totalClicks\|ctr" rollout/src/lib/analytics/analytics-service.ts | head -10`
- Expected: `AnalyticsKPIs` interface with `totalViews`, `totalClicks`, `ctr`

### C9 — Top products include per-product metrics
- Run: `grep -n "product_id\|product_name\|views\|clicks\|ctr" rollout/src/lib/analytics/analytics-service.ts | head -10`
- Expected: `ProductMetric` interface with `product_id`, `product_name`, `views`, `clicks`, `ctr`

### C10 — Chart data includes daily aggregation
- Run: `grep -n "ChartDataPoint\|date\|views\|clicks" rollout/src/lib/analytics/analytics-service.ts | head -10`
- Expected: `ChartDataPoint` interface with `date`, `views`, `clicks`, `ctr`

### C11 — TypeScript compiles without errors
- Run: `cd rollout && npx tsc --noEmit`
- Expected: no errors

### C12 — `.env.local` NOT read directly
- Run: `grep -n "\.env\.local" rollout/src/lib/analytics/analytics-service.ts || true`
- Expected: NO references to `.env.local` files

### C13 — No push performed
- Run: `git status` (check if local branch is ahead of origin)
- Expected: local branch is ahead by 1 commit (expected); remote unchanged

## Verdict

- **PASS** only if ALL checks C1–C13 produce expected results
- **FAIL** if any check fails, especially:
  - C1: Missing required functions
  - C2: Public operations not using anon key
  - C3: Admin operations not using service_role
  - C4: Wrong schema references
  - C6: Mature schema leakage
  - C11: TypeScript errors

## Security Notes

- **Never** read `.env.local` files directly
- **Never** expose API keys or secrets in test output
- Use `process.env` for loading environment variables
- If you need to verify env vars exist, check `.env.example` (committed) not `.env.local` (secret)