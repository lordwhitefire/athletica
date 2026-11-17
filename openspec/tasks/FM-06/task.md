# FM-06 — Storefront homepage

**Phase:** 2 | **Spec:** storefront | **Depends on:** FM-03 | **Status:** ⬜ Pending

## What we're building

The `/` homepage — a curated 3-up hero grid of featured products above the fold, a browse carousel below, and a footer. It leads with editorial curation (three picks, not twelve), loads fast on mobile data, and carries Athletica metadata.

## Why it matters

The homepage is the first impression. A visitor who arrives at a 404 root (the old MVP decision) or a generic starter page bounces. A curated 3-up grid communicates taste and points the visitor at the best entry points. The carousel gives a browse path without overwhelming.

## What success looks like (benchmarks)

- After this, when a visitor opens `/`, they see 3 curated products in a hero grid above the fold, a carousel below, and a footer.
- After this, the first screen loads fast on mobile data (LCP target met — the hero images are prioritized).
- After this, the page's metadata is "Athletica" (not "Create Next App"), with a correct OG image.
- After this, the 3 hero products come from a curated source (a `featured` flag or a `collections` row), not a random query.
- After this, the carousel shows a horizontal scroller of product tiles (image + name), swipeable on touch.
- After this, the root `/` no longer returns a 404 (it returns the homepage).

## Context the Builder needs

- The Vercel Commerce pattern (RE-07 §2.1): `<ThreeItemGrid />` + `<Carousel />` + `<Footer />`.
- Existing: `rollout/src/app/page.tsx` (currently the Next.js starter or a 404 per the old MVP decision — replace).
- Existing: `rollout/src/app/layout.tsx` (metadata is "Create Next App" — replace with Athletica).
- Curated picks: a `featured` boolean on products, or a `collections` row (FM-02 modeled collections).
- Gallery/carousel tile pattern from RE-07 §2.1–2.2 (`GridTileImage`).
- Phone-first: the hero grid must stack/scale gracefully on mobile.

## Boundaries

- Do not list every product on the homepage (curated 3, not exhaustive).
- Do not show a price on any tile (Amazon policy).
- Do not leave the root returning a 404.
- Do not block the first screen on slow data (prioritize hero images, skeleton the rest).
- The Creators API is NOT used here (owner-entered data only).
