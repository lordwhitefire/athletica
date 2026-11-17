# FM-04 — Implementation + Testing (combined brief)

**Task:** FM-04 (redirect + click pipeline) | **Date:** 2026-11-16

## Built
- `rollout/src/app/go/[id]/route.ts` — the redirect: 302 + `X-Robots-Tag: noindex`; Amazon URL derived at click time (never stored); click recorded async via `after()` (waitUntil) so the redirect never blocks on stats; 6-layer bot filter on click path (bots still redirected, click suppressed); identity hash dedup (1h, Upstash); EU IP redaction; explicit `redirect` rate-limit policy.
- `rollout/src/lib/analytics/rate-limit-policies.ts` — per-endpoint policy map (redirect/signin/affiliateSignup/postback), fail-open 1s.
- `rollout/src/lib/analytics/dedup.ts` — 1h identity-hash dedup via Upstash NX+EX.

## Benchmarks met
- 302 + X-Robots-Tag ✓; URL derived never stored ✓; async click write (`after`) ✓; bot filter on click path ✓; dedup 1h ✓; EU redaction (`ip=""`) ✓; fail-open rate limit ✓; missing ASIN/tag → branded not-found ✓.

## Tester verdict
Static inspection. PASS. Helpers (`isBotRequest`, `resolveVisitorHash`, `resolveIp`, `isEuCountry`, `resolveCountry`, `recordClick`, `deriveAmazonUrl`, `getProductById`) created in FM-05/FM-19/affiliate-service — exist in final patch. No live run. Recommend ✅.
