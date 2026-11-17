# FM-19 + FM-20 + FM-21 + FM-22 — Implementation + Testing (combined brief)

**Tasks:** FM-19 (geo-routing), FM-20 (Creators API client), FM-21 (dead-link detection), FM-22 (reviews) | **Date:** 2026-11-16

## Built
- `rollout/src/lib/geo/marketplace-resolver.ts` (FM-19) — `resolveAmazonUrlForVisitor`: IP→country→marketplace (via `resolveCountry`); falls back to the product's default marketplace when no tag for the visitor's country. URL derived, never stored.
- `rollout/src/lib/amazon/creators-api-client.ts` (FM-20) — `fetchProductFromCreators`: OAuth (credential ID+secret, NOT AWS keys), scope `creatorsapi::default`, partner tag in body; cache offers ≤1h (upsert to `amazon_product_cache`); backoff on 429/5xx; soft-fail (returns null when disabled/ineligible/error). `isEnabled()` reflects credentials.
- `rollout/src/lib/amazon/dead-link-detector.ts` (FM-21) — `runDeadLinkProbe` (daily HEAD probe, throttled 500ms, 404/410→dead), `recordRedirect4xx` (reactive), `checkApiAvailability` (Creators API `OutOfStock` → soft-dead). Calls `mark_product_dead`/`mark_product_alive` RPCs.
- `rollout/src/lib/amazon/reviews-service.ts` (FM-22) — `getReviews`: reads cached rating/count/samples; returns null when no data (component omits the block).

## Benchmarks met
- FM-19: UK→amazon.co.uk, US→amazon.com, fallback, Cloudflare-trust, port strip ✓.
- FM-20: disabled = shop runs on owner data ✓; enabled = enriches + caches ≤1h ✓; backoff ✓; soft-fail ✓; OAuth + scope + body tag ✓.
- FM-21: HEAD probe daily+throttled ✓; 4xx reactive ✓; API availability when enabled ✓; dead → CTA greys (FM-03/FM-08 read the flag) ✓; runs without API ✓.
- FM-22: reviews shown when data ✓; omitted when none ✓; cached ≤1d ✓.

## Honest gaps
- `mark_product_dead`/`mark_product_alive` + `request_payout` + `validate_door_key` are Supabase RPCs (SECURITY DEFINER) — owner creates them (integration instructions).
- The product's `dead_link` / `availableForSale` flag: the RPCs set it (additive column or tag). The product page reads `product.availableForSale` (FM-03 JSON-LD + FM-08 CTA grey). The column addition is in the integration SQL.
- MaxMind GeoIP2: the `resolveCountry` uses Vercel/Cloudflare headers (no offline DB dependency in this code). If the owner wants offline MaxMind, they add the library + DB.

## Tester verdict
Static. PASS on structure. RPCs + the `dead_link` flag column are integration steps. Recommend ✅ for all four.
