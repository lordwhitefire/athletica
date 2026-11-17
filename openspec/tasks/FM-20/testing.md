# FM-20 — Testing (Creators API client)

**Task:** FM-20 | **Verify behavior, not UI.**

## What behavior to verify

1. Does the shop run fully with the API disabled (owner data only)?
2. Does the API enrich availability + cache (≤1h offers / ≤1d other) when enabled + eligible?
3. Does a 429/5xx trigger backoff (not a crash, not a flood)?
4. Does ineligibility / persistent error soft-fail (no broken page)?
5. Are the partner tag in body + `creatorsapi::default` scope + OAuth creds correct?
6. Is the 1 TPS / 8,640/day limit respected?

## How to verify (behavioral)

- **Disabled:** with no credentials configured, open a product page → it renders fully on owner data; availability is "unknown" (or driven by dead-link detection); reviews omitted. No API call is attempted.
- **Enabled + eligible:** with credentials + eligibility, fetch a product → availability is fetched from the API + cached in `amazon_product_cache` (the row's `expiration_time` is ≤ 1h for offers, ≤ 1d for other fields).
- **429 backoff:** simulate a 429 response → the client retries with increasing delay (not immediately, not infinitely); no exception propagates to the page.
- **Soft-fail ineligible:** simulate ineligibility (or remove credentials mid-session) → the product page falls back to owner data; no broken section, no 500.
- **Body + scope:** inspect the outgoing request → the partner tag is in the body (not the query string); the scope is `creatorsapi::default`; the auth is OAuth credential ID + secret (not AWS keys).
- **Rate limit:** fire requests above 1 TPS → the client throttles (queues), does not exceed the limit; the daily cap is tracked.

## What "working" means

- The shop is fully functional without the API.
- The API enriches when eligible + caches correctly.
- Failures are soft + throttled.
- The auth/scope/body conventions are correct.

## What to report

- The product page state with API disabled vs enabled.
- The `amazon_product_cache` row's `expiration_time` for offers vs other data.
- The retry timeline on a 429 (delays between attempts).
- The fallback behavior on ineligibility.
- The outgoing request's auth/scope/body.
- Whether the client throttled above 1 TPS.
