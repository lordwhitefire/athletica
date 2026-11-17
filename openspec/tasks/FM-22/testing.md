# FM-22 — Testing (reviews via Creators API)

**Task:** FM-22 | **Verify behavior, not UI.**

## What behavior to verify

1. Do reviews show (rating + count + excerpts) when the API is on + returns data?
2. Are they cached in `amazon_product_cache` (≤ 1d TTL)?
3. Does JSON-LD `AggregateOffer` include the rating when present?
4. Is the block **omitted** (not broken, not faked) when the API is off / ineligible / empty?
5. Does a stale cache show last-known + "refreshing"?
6. Does "See all on Amazon" carry the affiliate tag?

## How to verify (behavioral)

- **Reviews on:** with the API enabled + eligible + returning reviews → the product page shows stars + count + 2-3 excerpts + "See all on Amazon."
- **Cache:** after a fetch, the `amazon_product_cache` row has `rating`, `review_count`, `review_samples` populated; `expiration_time` is ≤ 1 day out.
- **JSON-LD:** the `AggregateOffer` includes `ratingValue` + `reviewCount` matching the cached values.
- **Reviews off (API disabled):** with the API off → the reviews block is **absent** from the rendered HTML (no "No reviews," no zero-stars, no empty section).
- **Reviews off (ineligible):** with the API on but ineligible → same: block absent.
- **Reviews off (empty):** with the API on + eligible but the product has no reviews → block absent.
- **Stale cache:** a row past its TTL but with cached values → the page shows the last-known rating + a "refreshing" hint (not a broken/empty state); a background refresh is triggered.
- **See-all link:** the "See all on Amazon" link URL includes `?tag={affiliate_tag}` + goes to the product's reviews page on the right marketplace.

## What "working" means

- Reviews appear when real + cached appropriately.
- The block is honestly absent when there's no data.
- Stale cache degrades gracefully.
- The affiliate tag is preserved on outbound links.

## What to report

- The reviews block content when the API returns data.
- The `amazon_product_cache` row fields + TTL.
- The JSON-LD `AggregateOffer` rating fields.
- Whether the block was absent in each off-state (disabled / ineligible / empty).
- The stale-cache behavior (last-known + refreshing hint).
- The "See all on Amazon" link URL (with tag).
