# FM-22 — Reviews via Creators API

**Phase:** 5 | **Spec:** amazon-integration | **Depends on:** FM-20 | **Status:** ⬜ Pending

## What we're building

The reviews block on the product page: rating (stars) + count + 2-3 review excerpts + "See all on Amazon," fetched via the Creators API's `customerReviews` resource when enabled + eligible, cached in `amazon_product_cache`, referenced in JSON-LD `AggregateOffer`. When the API is off / ineligible / returns nothing, the block is **omitted entirely** (no fake reviews, no broken section).

## Why it matters

Reviews are social proof — they lift conversion. But they're only honest if they're real Amazon reviews, fetched legitimately via the API. Faking them or showing a broken "no reviews" section undermines trust. The omit-when-empty rule keeps the page clean + honest.

## What success looks like (benchmarks)

- After this, with the Creators API enabled + eligible + returning reviews, the product page shows a rating summary (stars + count) + 2-3 excerpts + a "See all on Amazon" link.
- After this, the fetched rating + count + excerpts are cached in `amazon_product_cache` (rating, review_count, review_samples JSONB), TTL ≤ 1 day.
- After this, the JSON-LD `AggregateOffer` includes `ratingValue` + `reviewCount` when reviews exist.
- After this, with the Creators API off / ineligible / returning nothing for a product, the reviews block is **absent from the page** (no "No reviews yet," no zero-stars, no broken section).
- After this, a stale cache (rating present but past TTL) shows the last-known rating + a "refreshing" hint (not a broken state).
- After this, the "See all on Amazon" link goes to the product's Amazon reviews page (with the affiliate tag).

## Context the Builder needs

- The Creators API `customerReviews` resource (RE-08 goark lists it; `resources.go:69-72`; `not proven` to return data — Q3 in the recommendation).
- The `amazon_product_cache` columns (FM-02): `rating`, `review_count`, `review_samples` (JSONB).
- JSON-LD `AggregateOffer` (FM-08/FM-09): `ratingValue`, `reviewCount` when present.
- The omit-when-empty rule: no fake fallback, no zero-stars placeholder.
- Cache TTL ≤ 1 day for non-offers data.

## Boundaries

- Do not fake reviews or show a zero-stars placeholder when there's no data — omit the block.
- Do not make the reviews block a hard dependency (it's omitted gracefully when the API is off).
- Do not cache reviews for > 1 day.
- Do not show a broken section on a stale cache (show last-known + "refreshing").
- Do not strip the affiliate tag from the "See all on Amazon" link.
- If `customerReviews` doesn't return data in practice (Q3), the omit rule stands — the block stays absent. That's acceptable per the recommendation.
