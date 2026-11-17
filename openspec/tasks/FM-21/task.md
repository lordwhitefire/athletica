# FM-21 — Dead-link detection

**Phase:** 5 | **Spec:** amazon-integration | **Depends on:** FM-20 | **Status:** ⬜ Pending

## What we're building

A dead-link detection subsystem with three signals: (1) a scheduled HEAD probe of `/dp/{ASIN}` (daily, batched + throttled) that marks products dead on 404/410; (2) a redirect-time 4xx signal (high 4xx rate from outbound Amazon clicks → dead-link signal, reactive); (3) Creators API availability (`Offers.Listings.Availability.Type === "OutOfStock"` or empty offers → soft-dead) — **only when the API is enabled**. A dead product → CTA greyed + "Out of stock" or "Link coming soon" + no click recorded.

## Why it matters

Affiliate products go out of stock or get delisted. Sending a visitor to a 404 on Amazon kills trust + wastes the click. Dead-link detection keeps the shop honest: a dead product greys out, and the visitor is never sent to a dead Amazon page. Two of the three signals run without the Creators API — so detection works even when the owner isn't eligible.

## What success looks like (benchmarks)

- After this, a scheduled job (daily, batched + throttled) HEAD-probes `/dp/{ASIN}` for products; a 404 or 410 marks the product dead in `amazon_product_cache` (`error` set, or a dead flag).
- After this, a dead product's storefront CTA renders greyed + "Out of stock" or "Link coming soon" + no click is recorded if tapped.
- After this, a high 4xx rate from outbound Amazon clicks on a product raises a dead-link signal (reactive) — the product is flagged for review.
- After this, when the Creators API is enabled + eligible, `Offers.Listings.Availability.Type === "OutOfStock"` or empty offers marks the product soft-dead.
- After this, when the Creators API is disabled/ineligible, dead-link detection still runs (HEAD probe + 4xx signal).
- After this, the HEAD probe is batched + throttled (respects Amazon's rate limits; does not get blocked).
- After this, a product that comes back in stock (HEAD probe returns 200, or API availability flips back) is un-marked dead (the CTA re-activates).

## Context the Builder needs

- RE-03 §2.7 (Amazon Auto Links has no dead-link detector — we add all three signals).
- The `amazon_product_cache` table (FM-02): `expiration_time`, `error`, `availability`.
- The Creators API (FM-20) for the availability signal (when enabled).
- Vercel cron for the scheduled HEAD probe (daily).
- The HEAD probe must be batched + throttled (Amazon rate-limits aggressive probes).

## Boundaries

- Do not make dead-link detection depend on the Creators API (HEAD probe + 4xx run without it).
- Do not flood Amazon with HEAD probes (batch + throttle).
- Do not send a visitor to a dead Amazon page (the CTA greys out before that).
- Do not permanently mark a product dead (it can come back in stock).
- Do not record a click on a dead product (the CTA is disabled).
