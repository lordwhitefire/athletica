# Non-UI Remediation Report

**Date:** 2026-11-17
**Source:** the audit at `REMAREMA6/deliverables/athletica/AGENT-NON-UI-REMEDIATION.md` + my own admissions.
**Scope:** non-UI defects only. UI untouched. No data seeded.

## Defects fixed

| # | Audit ref | Defect | Fix |
|---|---|---|---|
| 1 | 4.1 | `database.types.ts` stale (old 2-status, no new tables) | Full rewrite: 5-status products, variants, categories, collections, marketplaces, amazon_product_cache, affiliate.* (6 tables), audit_log, analytics.tracker_id, admin_access_keys, dead-link columns. |
| 2 | 4.2 | Signin rate limit not wired | `checkSigninRateLimit(email, ip)` called before `signInWithPassword` in the signin route; 429 + Retry-After on the 6th attempt; neutral error preserved. |
| 3 | 4.6 | Two URL-derivation paths (old global-env `affiliate-service.ts` vs the 22-marketplace resolver) | `affiliate-service.ts` rewritten: ONE canonical `deriveAmazonUrl({asin, marketplace})` that reads the per-marketplace tag + domain from the `marketplaces` table. Old `getAffiliateUrl`/`getAffiliateUrlByAsin` kept as deprecated wrappers that delegate. No global env tag. |
| 4 | 4.6/4.7 | `/go/[id]` route used the global env tag via `deriveAmazonUrl` | Route rewritten: resolves the visitor's marketplace via `resolveCountry` → `marketplaces` lookup, then calls `deriveAmazonUrlForProduct({productId, visitorMarketplace})` (the canonical DB-driven path). |
| 5 | 4.7 | Creators API used one global `AMAZON_ASSOCIATES_TAG` | `creators-api-client.ts` now calls `getTagForMarketplace(locale)` which reads the tag from the `marketplaces` table (with default fallback). No global env tag in the request body. |
| 6 | 4.8 | Dead-link detector: no last-probed tracking, recordRedirect4xx a no-op, null availability treated as dead, non-200 marked alive | `dead-link-detector.ts` rewritten: (a) HEAD probe orders by `last_probed_at NULLS FIRST` (fair batches) + updates it each run; (b) `recordRedirect4xx` now real — increments `redirect_4xx_count` with a 24h window reset, marks dead at ≥3; (c) null/Unknown API availability = unknown (no state change), only explicit `OutOfStock` → dead; (d) only HTTP 200 → alive, 404/410 → dead, everything else → unknown (no false alive). |
| 7 | 4.9 | `getProductById` didn't apply the publish gate (draft/archived could leak) | Split into `getPublicProductById` (applies the 3-condition gate) + `getProductByIdAdmin` (no gate, admin only). `/go/[id]` switched to the public variant. `getProductById` kept as a deprecated alias of the public one. |
| 8 | 4.9 | "popular" sort = newest (fake) | `listProducts` popular sort now fetches click counts from `analytics` and sorts by that (falls back to created_at when analytics is empty). Honest. |
| 9 | 4.9 | Category filter may not work (`categories.slug` on a `select('*')`) | Uses the correct Supabase nested-relation filter: `select('*, categories!inner(slug)')` + `.eq('categories.slug', category)`. |
| 10 | 4.9 | `PUBLIC_FILTER` constant declared but unused | Replaced with a centralized `applyPublicGate(q)` helper used by every public read (`getProductBySlug`, `getPublicProductById`, `getFeaturedProducts`, `listProducts`, `listAllPublicProductSlugs`). |

## SQL added

- `rollout/supabase-rollout-nonui-fixes.sql` — adds `last_probed_at`, `redirect_4xx_count`, `last_4xx_at` columns + a fair-batch index. Run after the FM-02 migration + RPCs.

## Not fixed (honestly)

- **4.3 (FM-01 runtime)** — no live Supabase in the sandbox. The owner must apply the SQL + verify the door-key/invite/rate-limit live. Can't be fixed by code alone.
- **4.4 (analytics partitioning)** — kept deferred (BRIN index). Native monthly partitioning is a destructive migration on an existing table; tracked as a follow-up with a threshold (>1M rows).
- **4.5 (SQL corrections)** — already in the repo at commit `582df3e` (drop old CHECK first, Postgres `sha256()` for door-key, payout RPC locks rows + derives amount, dead/alive RPCs service_role only, schema grants). Verified present; not re-done.
- **4.10 (registry statuses)** — updated below to honest states.

## UI not touched

Per the audit + your instruction, no UI files were modified. The product-detail UI patch (`ATHLETICA-PRODUCT-DETAIL-UI.patch`) is separate work; not applied here.

## Files changed

- `rollout/src/lib/database.types.ts` (full rewrite)
- `rollout/src/app/api/admin/auth/signin/route.ts` (rate limit wired)
- `rollout/src/lib/affiliate/affiliate-service.ts` (canonical per-marketplace path)
- `rollout/src/app/go/[id]/route.ts` (uses canonical path + public product fetch)
- `rollout/src/lib/amazon/creators-api-client.ts` (per-marketplace tag from DB)
- `rollout/src/lib/amazon/dead-link-detector.ts` (fair batches, real 4xx, no false state)
- `rollout/src/lib/products/product-service.ts` (publish gate split, real popular sort, category filter, centralized gate)
- `rollout/supabase-rollout-nonui-fixes.sql` (new — dead-link columns)
- `openspec/tasks-registry.md` (honest statuses)
