# FM-08 — Product detail with variants + reviews

**Phase:** 2 | **Spec:** storefront | **Depends on:** FM-03, FM-20 | **Status:** ⬜ Pending

## What we're building

The product detail page extended to its full form: a variant selector (URL params as state), a reviews summary (rating + count + excerpts, fetched via the Creators API when enabled, omitted when not), and JSON-LD `AggregateOffer` referencing the rating when present.

## Why it matters

Variants are the difference between a single-product page and a real catalog product (one shoe, multiple sizes/colors). Reviews are social proof. The variant selector in URL params means a visitor can share a specific size+color link. The reviews-when-available rule keeps the page honest: never fake reviews, never show a broken section when the API is off.

## What success looks like (benchmarks)

- After this, when a product has multiple variants, the buy-box shows a variant selector (size/color), and selecting one updates the URL (`?size=M&color=blue`) without scrolling.
- After this, when a product is single-variant, no variant selector renders (returns null — no empty UI).
- After this, when a variant is out of stock, its option is visible-but-disabled (strike-through + "Out of Stock" title + `aria-disabled`).
- After this, when the Creators API is enabled + eligible + returns reviews, the product page shows a rating summary (stars + count) + 2-3 review excerpts + "See all on Amazon."
- After this, when the Creators API is off / ineligible / returns nothing, the reviews block is **omitted entirely** (no broken section, no fake reviews, no zero-stars placeholder).
- After this, the JSON-LD `AggregateOffer` includes the rating + review count when reviews exist; when they don't, the `AggregateOffer` still emits with `availability` only.
- After this, changing a variant via URL param does not reload the page or scroll.

## Context the Builder needs

- FM-03 built the base product page. This task extends it with the variant selector + reviews block.
- The Vercel Commerce variant-selector pattern (RE-07 §2.4): URL search params, precomputed `combinations` map, `router.replace {scroll:false}`, `aria-disabled` + strike-through for OOS, returns `null` for single-variant.
- The Creators API (FM-20) is the reviews source (`customerReviews` resource). Cache in `amazon_product_cache` (rating, review_count, review_samples JSONB).
- JSON-LD `AggregateOffer`: `lowPrice`, `highPrice`, `priceCurrency`, `availability` (InStock/OutOfStock), `ratingValue`, `reviewCount` (when present).
- The reviews block hides when there's no data — no fake fallback.

## Boundaries

- Do not fake reviews or show a zero-stars placeholder when there's no data — omit the section.
- Do not use React state for variant selection (URL params).
- Do not hide out-of-stock variants (visible-but-disabled).
- Do not reload or scroll on variant change.
- Do not make the Creators API a hard dependency — the page must render fully without it.
- Do not show a price (still Amazon policy).
