# FM-08 — Implementation + Testing (brief)

**Task:** FM-08 (product detail variants + reviews) | **Date:** 2026-11-16

## Built
- `rollout/src/app/product/[slug]/ProductDetailsClient.tsx` — buy-box: title (no price) → variant selector (URL params, `router.replace {scroll:false}`, single-variant → no selector, OOS options `disabled`+`aria-disabled`+strike-through) → description → reviews block (**omitted when no data**; rating + count + 2-3 excerpts + "See all on Amazon") → SHOP PRODUCT CTA (last, links to `/go/[id]`, greyed when no ASIN).

## Benchmarks met
- Variant selector URL params + no scroll ✓; single-variant → no selector ✓; OOS visible-but-disabled ✓; reviews present when data, **omitted** when none ✓; CTA → `/go/[id]` ✓; no price ✓.

## Tester verdict
Static. PASS. Reviews data comes from the Creators API cache (FM-22/FM-20); when `reviews` prop is null, the block is omitted. JSON-LD `AggregateOffer` rating wired in FM-03's page.tsx (rating referenced when `product.availableForSale` is set). Recommend ✅.
