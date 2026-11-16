# ROLL-02 — Task Completion Report

## Status
✅ **DONE** — Rollout product service added and committed (not pushed).

## What was done

1. **Created `rollout/src/lib/supabase/server.ts`** — the Supabase server client:
   - `createAdminClient()` — uses the **service_role** key (bypasses RLS), for admin operations.
   - `createPublicClient()` — uses the **anon** key (respects RLS), for customer reads.
   - Reads its config from the existing env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
2. **Created `rollout/src/lib/products/product-service.ts`** — the product service with all required functions:
   - Admin (service_role): `getProductsAdmin` (filter/search/sort/paginate), `getProductByIdAdmin`, `createProductAdmin`, `updateProductAdmin`, `deleteProductAdmin`, `publishProductAdmin`, `unpublishProductAdmin`.
   - Public (anon): `getProductBySlug` (published only), `getPublishedProducts` (published, newest first, paginated).
   - Imports types from `@/lib/database.types` (`Database.rollout`).
   - No hierarchy (self-contained `rollout.products` only), no caching (deferred).
3. **Fixed `rollout/src/lib/database.types.ts`** (from ROLL-01) — see note below.
4. **Typechecked** — `npx tsc --noEmit` passes with no errors.
5. **Committed** as `feat(rollout): add product service with admin and public clients` (`7672aac`). **Not pushed.**

## ⚠️ Deviation found and fixed — `Relationships` missing from types
The ROLL-01 `database.types.ts` compiled in isolation but **failed once used by the product service**:
- supabase-js v2's `GenericTable` type requires a `Relationships` array on each table.
- Without it, `.insert()` and `.update()` were typed as `never[]` / `never`, so `npx tsc --noEmit` failed (TS2345 on `createProductAdmin` and `updateProductAdmin`).
- Fix: added `Relationships: []` to `products` (no FKs) and `Relationships: [{ foreignKeyName: 'rollout_analytics_product_id_fkey', columns: ['product_id'], isOneToOne: false, referencedRelation: 'products', referencedColumns: ['id'] }]` to `analytics`.
- **Architecture note:** any future tables added to the `rollout` schema must include a `Relationships` entry, or the service layer won't typecheck. This mirrors what `supabase gen types` would emit for the `Relationships` block.

## ⚠️ Architecture note — RLS dependency for public reads
The public service functions (`getProductBySlug`, `getPublishedProducts`) use the **anon key** and are therefore **subject to RLS**. These tables still have RLS enabled with **no policies yet**, so:
- These functions currently return **zero rows** until matching RLS policies are defined (e.g. `SELECT` for `anon` on `rollout.products`, restricted to `status = 'published'`).
- This is planned work (RLS note from ROLL-01 report). It should be tracked as part of the security/RLS backlog rather than a code bug — the service code is correct; the data-layer policies are what's missing.
- Admin functions are unaffected (service_role bypasses RLS).

## Not done (per task scope)
- No UI pages (ROLL-05, ROLL-06, ROLL-07).
- No analytics service (ROLL-03).
- No Amazon affiliate service (ROLL-04).
- No caching (deferred).
- No validation schemas (ROLL-07, with the editor).
- No tests (deferred with the UI).
