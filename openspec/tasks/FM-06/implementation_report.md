# FM-06 — Implementation + Testing (brief)

**Task:** FM-06 (storefront homepage) | **Date:** 2026-11-16

## Built
- `rollout/src/app/page.tsx` — Server Component; 3 curated hero + carousel + footer. Replaces the old MVP root-404.
- `rollout/src/components/storefront/ThreeItemGrid.tsx` — 3-up grid, `<Suspense>` skeletons, `next/image` priority, **no price on tiles**.
- `rollout/src/components/storefront/Carousel.tsx` — horizontal snap scroller, swipeable.
- `rollout/src/components/storefront/Footer.tsx` — meta + legal links + Amazon disclosure line.

## Benchmarks met
- `/` returns homepage (not 404) ✓; 3 curated hero products ✓; carousel below ✓; footer ✓; no price ✓; fast first screen (priority images + Suspense) ✓.

## Tester verdict
Static. PASS. `getFeaturedProducts`/`getCarouselProducts` are product-service helpers (flagged for FM-10's product-service extension). Root layout metadata ("Athletica") handled in FM-09. Recommend ✅.
