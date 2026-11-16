# ROLL-02: Testing Task — Rollout Product Service

This document is for the tester. Run these checks AFTER the implementation task is claimed done. The tester did NOT do the building; verify from scratch. All checks are read-only — nothing here modifies or commits anything.

## Pre-checks

1. Confirm working directory is the repository root: `/home/lordwhitefire/current-project/athletica/athletica`
2. Confirm `rollout/src/lib/supabase/server.ts` exists
3. Confirm `rollout/src/lib/products/product-service.ts` exists

## Checks and expected results

### C1 — Supabase server client exists
- Run: `cat rollout/src/lib/supabase/server.ts`
- Expected: file exists and exports:
  - `createAdminClient()` — uses `SUPABASE_SERVICE_ROLE_KEY`
  - `createPublicClient()` — uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Both use the `Database` type from `@/lib/database.types`

### C2 — Product service exists with all required functions
- Run: `cat rollout/src/lib/products/product-service.ts`
- Expected: file exists and exports:
  - `getProductsAdmin(options?)` — list products with status, search, sort, pagination
  - `getProductByIdAdmin(id)` — get single product by ID
  - `createProductAdmin(product)` — create new product
  - `updateProductAdmin(id, updates)` — update product
  - `deleteProductAdmin(id)` — delete product
  - `publishProductAdmin(id)` — set status to published
  - `unpublishProductAdmin(id)` — set status to unpublished
  - `getProductBySlug(slug)` — public: get published product by slug
  - `getPublishedProducts(options?)` — public: list published products

### C3 — Admin operations use service_role key
- Run: `grep -n "createAdminClient\|service_role" rollout/src/lib/products/product-service.ts | head -5`
- Expected: admin functions call `createAdminClient()` which uses `SUPABASE_SERVICE_ROLE_KEY`

### C4 — Public operations use anon key
- Run: `grep -n "createPublicClient\|anon" rollout/src/lib/products/product-service.ts | head -5`
- Expected: public functions call `createPublicClient()` which uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### C5 — Service uses correct schema (rollout, not public)
- Run: `grep -n "from('products')" rollout/src/lib/products/product-service.ts`
- Expected: queries use `.from('products')` (Supabase routes to the rollout schema via the client config)
- **DO NOT** see `.from('public.products')` or `.from('rollout.products')`

### C6 — Types are imported correctly
- Run: `grep -n "import.*Database" rollout/src/lib/products/product-service.ts`
- Expected: imports `Database` from `@/lib/database.types`

### C7 — No Mature schema references
- Run: `grep -E "brands|categories|models|hierarchy|leaf_model" rollout/src/lib/products/product-service.ts || true`
- Expected: NO references to Mature schema/tables

### C8 — TypeScript compiles without errors
- Run: `cd rollout && npx tsc --noEmit`
- Expected: no errors

### C9 — `.env.local` NOT read directly
- Run: `grep -n "\.env\.local" rollout/src/lib/supabase/server.ts rollout/src/lib/products/product-service.ts || true`
- Expected: NO references to `.env.local` files (env vars loaded via `process.env`)

### C10 — No push performed
- Run: `git status` (check if local branch is ahead of origin)
- Expected: local branch is ahead by 1 commit (expected); remote unchanged

## Verdict

- **PASS** only if ALL checks C1–C10 produce expected results
- **FAIL** if any check fails, especially:
  - C2: Missing required functions
  - C3: Admin operations not using service_role
  - C5: Wrong schema references
  - C7: Mature schema leakage
  - C8: TypeScript errors

## Security Notes

- **Never** read `.env.local` files directly
- **Never** expose API keys or secrets in test output
- Use `process.env` for loading environment variables
- If you need to verify env vars exist, check `.env.example` (committed) not `.env.local` (secret)