# Spec — Amazon integration

**Change:** athletica-full-marketplace | **Phase:** 5 | **Tasks:** FM-19…FM-22
**Sources:** `blueprint/02-engine.md` (Integration), RE-03 (Amazon Auto Links), `product-management/04-creators-api-recommendation.md` (Option B, locked).

## Intent

The Amazon integration is what connects Athletica to the real world of 22 marketplaces, product availability, and reviews. Per the locked Creators API recommendation (Option B), it is **own-data-first**: the owner enters product data; the Creators API is an optional background booster for availability + reviews, switched on only when the owner has credentials + eligibility, and it soft-fails. Dead-link detection runs without it. Geo-routing sends each visitor to their local marketplace.

## Requirements

**22-marketplace geo-routing (FM-19):** a `marketplaces` table seeded with all 22 Amazon locales (slug, locale_number, domain, associates_url, country_code — note UK → GB). At click time, the visitor's IP → country (6-header chain: `x-plausible-ip`→`cf-connecting-ip`→`x-forwarded-for`→`b-forwarded-for`→`forwarded`→`conn.remote_ip`, port stripped) → marketplace → URL `https://{domain}/dp/{ASIN}?tag={marketplace.tag}`. MaxMind GeoIP2 offline (no third-party dependency) preferred, or Cloudflare `/cdn-cgi/trace` if behind Cloudflare. Fallback to the product's default marketplace if geo fails or no tag for that marketplace.

**Creators API client (FM-20 — optional booster, soft-fail):** OAuth credential ID + secret (not AWS keys — PA-API 5 is deprecated). Scope `creatorsapi::default`. Partner tag in the request body. **Enabled only when the owner has credentials + eligibility** (10 qualifying sales / 30 days — the owner confirms in Associates Central). Used for: availability checks + reviews. **Not** used for: the core product page (owner data), the redirect (derived from ASIN+tag), dead-link detection (runs without it). **Soft-fail:** API unavailable/ineligible/erroring → nothing breaks; the shop runs on owner data. **Limits:** 1 TPS / 8,640 per day (grows with API-link revenue). Cache offers ≤ 1 hour, other data ≤ 1 day. Retry with backoff on 429/5xx. Send the partner tag in the body, use the right scope, retry with backoff — three things amazon-flash-catalog got wrong (RE-08 flash-catalog §2.3).

**Dead-link detection (FM-21):** three signals, only two always on: (1) **HEAD probe** — scheduled job (daily, batched + throttled to respect rate limits), HTTP 404/410 from `/dp/{ASIN}` → mark dead; (2) **redirect-time 4xx signal** — high 4xx rate from outbound Amazon clicks → dead-link signal (reactive); (3) **Creators API availability** — `Offers.Listings.Availability.Type === "OutOfStock"` or empty offers → soft-dead — **only when the API is enabled**. A dead product → CTA greyed + "Out of stock" or "Link coming soon" + no click recorded. The visitor is never sent to a 404 on Amazon.

**Reviews via Creators API (FM-22):** rating + count + 2-3 review excerpts fetched via the API's `customerReviews` resource (when enabled + eligible). Cached in `amazon_product_cache` (rating, review_count, review_samples). JSON-LD `AggregateOffer` references the rating when present. **When the API is off / ineligible / returns nothing → the reviews block is omitted** (no fake reviews, no broken section). Stale cache → show last-known + a "refreshing" hint.

## Behavior boundaries

- The Creators API is **never** a hard dependency. With it switched off, the storefront + redirect + dead-link detection all still work.
- The owner enters product data (title, images, details) via the admin catalog. The API only enriches availability + reviews.
- The Amazon URL is never stored — always derived at click time.
- Geo-routing falls back gracefully (no tag for a marketplace → default marketplace + greyed note if needed).
- The HEAD probe is batched + throttled (respect Amazon's rate limits; don't get blocked).
- Dead-link detection does not depend on the Creators API being eligible.

## What success looks like (phase gate)

- A visitor from the UK is routed to `amazon.co.uk` with the UK-registered tag; a visitor from the US to `amazon.com` with the US tag. (Assuming the owner has tags for both; otherwise graceful fallback.)
- With the Creators API **off**, the product page still renders fully (owner data), the redirect works, and dead-link detection runs.
- With the Creators API **on + eligible**, a product's availability is checked via the API, and reviews render on the product page.
- A product whose Amazon page is gone (404) is detected by the HEAD probe within 24 hours; its CTA greys out; no visitor is sent to a dead Amazon page.
- A high 4xx rate from outbound clicks on a product raises a dead-link signal (reactive).
- The Creators API cache respects the ≤1h (offers) / ≤1d (other) TTLs; a 429 triggers backoff, not a crash.
