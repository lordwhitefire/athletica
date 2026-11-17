# FM-06 — Testing (storefront homepage)

**Task:** FM-06 | **Verify behavior, not UI.**

## What behavior to verify

1. Does `/` return a homepage (200) with 3 curated hero products + a carousel + footer?
2. Is the first screen fast on mobile (LCP target)?
3. Is the metadata "Athletica" with a correct OG image?
4. Do the hero products come from a curated source?
5. Is the carousel swipeable on touch?

## How to verify (behavioral)

- **Homepage renders:** open `/` → 200; the hero grid shows exactly 3 product tiles; the carousel shows a horizontal scroller; the footer is present.
- **Mobile LCP:** run Lighthouse on a phone/emulated mobile → LCP meets the target; hero images are prioritized (not lazy-loaded above the fold).
- **Metadata:** inspect `<head>` → title contains "Athletica" (not "Create Next App"); OG image present with w/h/alt.
- **Curation source:** inspect the data query behind the hero grid → it selects from a `featured` flag or a `collections` row (not `ORDER BY random()` or `LIMIT 3` on all products).
- **Carousel:** on touch, swipe the carousel → it scrolls horizontally; each tile shows an image + name; tapping a tile navigates to `/product/[slug]`.
- **No price:** scrape the homepage HTML → no price/currency strings.

## What "working" means

- The homepage is a real curated storefront, not a starter or a 404.
- It's fast on mobile.
- The metadata is correct.
- The carousel works on touch.

## What to report

- The HTTP status for `/` (200, not 404).
- The Lighthouse LCP on mobile.
- The hero product count (3) + their source (featured/collection).
- The metadata values.
- Whether the carousel swipes + navigates.
- Any price string found (there should be none).
