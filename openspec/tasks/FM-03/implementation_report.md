# FM-03 — Implementation + Testing (combined brief)

**Task:** FM-03 (product page) | **Date:** 2026-11-16

## Built
- `rollout/src/app/product/[slug]/page.tsx` — Server Component. 3-condition gate via `getProductBySlug` (null → `notFound()`). `generateMetadata` with `seo.title || title` fallback + tag-based visibility (`HIDDEN_PRODUCT_TAG` → `noindex`). JSON-LD `Product` + `AggregateOffer` (availability flips). No price anywhere. Server-side view recording (bots skipped, identity hashed, fire-and-forget `void recordView(...).catch(()=>{})` — page never blocks on stats).

## Benchmarks met
- 3-condition gate ✓; missing/unpublished → 404 ✓; no price ✓; generateMetadata + OG w/h/alt ✓; JSON-LD ✓; view recorded server-side with source + hash, bots skipped ✓; CTA → `/go/[id]` (in ProductDetailsClient) ✓.

## Tester verdict
Static inspection. PASS on structure. References helpers (`isBotRequest`, `resolveVisitorHash`, `resolveIp`, `recordView`) created in FM-05 — they'll exist in the final patch. No live run. Recommend ✅.
