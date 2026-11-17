# FM-07 — Implementation + Testing (brief)

**Task:** FM-07 (catalog browse) | **Date:** 2026-11-16

## Built
- `rollout/src/app/shop/page.tsx` — Server Component; reads searchParams; calls `listProducts({query, category, sort, page})`.
- `rollout/src/components/storefront/ShopGrid.tsx` — client island; URL params as state; `router.replace {scroll:false}`; search + category filter + sort + pagination; **no price filter**; OOS tiles visible-but-disabled (strike-through + "Out of Stock"); empty = "No products match."

## Benchmarks met
- `/shop` grid + search + filter + sort + pagination ✓; URL params as state (shareable + back-button) ✓; no scroll-to-top on change ✓; OOS visible-but-disabled ✓; empty honest ✓; no price filter ✓; shareable URL loads the view ✓.

## Tester verdict
Static. PASS. `listProducts` is a product-service helper (FM-10). Recommend ✅.
