# FM-20 — Creators API client (optional booster, soft-fail)

**Phase:** 5 | **Spec:** amazon-integration | **Depends on:** FM-02 | **Status:** ⬜ Pending

## What we're building

The Amazon Creators API client — an **optional background booster** for product availability + reviews, enabled only when the owner has OAuth credentials + eligibility (10 qualifying sales / 30 days). It soft-fails (API unavailable/ineligible/erroring → nothing breaks; the shop runs on owner data). Caches offers ≤ 1 hour, other data ≤ 1 day. Retries with backoff on 429/5xx. Sends the partner tag in the body, uses the `creatorsapi::default` scope.

## Why it matters

PA-API 5 is dead (deprecated, returns 403). The Creators API is the replacement — but it requires eligibility the owner won't have at launch, and it can be lost (no sales for 30 days). Per the locked recommendation (Option B), the shop must run on owner-entered data first; the API is a bonus, not a dependency. Soft-fail means the shop never breaks because of the API.

## What success looks like (benchmarks)

- After this, with the Creators API **disabled** (no credentials), the product page renders fully on owner-entered data; availability is "unknown" (CTA active unless dead-link detection says otherwise); reviews are omitted.
- After this, with the Creators API **enabled + eligible**, a product's availability is fetched + cached in `amazon_product_cache` (≤ 1h TTL for offers, ≤ 1d for other data).
- After this, when the API returns 429 or 5xx, the client retries with backoff (not a crash, not a flood).
- After this, when the API is ineligible (lost access) or errors persistently, the product page falls back to owner data (soft-fail); no broken page.
- After this, the client sends the partner tag in the request body, uses scope `creatorsapi::default` (the three things amazon-flash-catalog got wrong — RE-08 flash-catalog §2.3).
- After this, the client uses OAuth credential ID + secret (not AWS access/secret keys — PA-API 5 is dead).
- After this, the rate limit (1 TPS / 8,640 per day) is respected; requests are throttled, not fired above the limit.

## Context the Builder needs

- The locked recommendation: `product-management/04-creators-api-recommendation.md` (Option B).
- RE-08 (`reverse-engineering-workspace/engagements/08-amazon-creators-api/`): goark/pa-api + amazon-flash-catalog samples; the official-docs-crosscheck rows D1–D9.
- The `amazon_product_cache` table (FM-02): composite key, `expiration_time` TTL, `error`, availability, rating, reviews.
- OAuth credentials (credential ID + secret, version 3.1/3.2/3.3), scope `creatorsapi::default`, partner tag in body.
- Rate limits: 1 TPS / 8,640 per day (grows with API-link revenue).
- Cache TTLs: offers ≤ 1 hour, other data ≤ 1 day.
- Retry: backoff on 429/5xx.

## Boundaries

- Do not make the Creators API a hard dependency — the shop runs on owner data without it.
- Do not use AWS access/secret keys (PA-API 5 is dead).
- Do not exceed 1 TPS / 8,640 per day.
- Do not cache offers for > 1 hour or other data for > 1 day.
- Do not retry without backoff (don't flood on 429/5xx).
- Do not omit the partner tag from the body or use the wrong scope.
- Do not edit the links the API returns (Amazon's terms — D8).
