# ROLL-14 — Implementation Report

## What was built

All seven plan tasks completed, one commit per task, nothing pushed:

| Commit | Task | Files |
|--------|------|-------|
| `f8eb77c` | T1: Affiliate env vars + service | `.env.example`, `.env.local`, `affiliate-service.ts` |
| `962cad3` | T2: Add `getProductById` | `product-service.ts` |
| `a19bbf4` | T3: Redirect route | `go/[id]/route.ts` |
| `ed94e39` | T4: Update API routes | `api/affiliate/route.ts`, `api/analytics/route.ts` |
| `a12beed` | T5: CTA enable/disable + navigation | `ProductDetailsClient.tsx` |
| `8e46822` | T6: page.tsx ctaEnabled | `page.tsx` |
| (pending) | T7: Verify + report | `developer-workspace/ROLL-14/report.md` |

## Verified

### TypeScript
`npx tsc --noEmit` exits 0 after every task (checkpoints CP1, CP2, CP3 all green).

### Static checks
- No `athletica-20` in `affiliate-service.ts`
- No `window.open` in `rollout/src/app/product/[slug]/`
- `AMAZON_TAG` and `AMAZON_MARKETPLACE` present in `.env.example` (blank)
- `getProductById` present in `product-service.ts`
- `go/[id]/route.ts` exists

### Runtime browser check (interaction-driven)

Server confirmed up on `:3011` before checking. Attached to Chrome on `:9222` (attach-only, no launch). One tab created and reused. Full DOM extraction per state.

**State: published product (`/product/bench1-430706`)**
- Page loads (readyState: complete)
- CTA button shows "Link coming soon" and is disabled (because `AMAZON_TAG`/`AMAZON_MARKETPLACE` not set in `.env.local`)
- This is expected: CTA stays disabled until owner adds real env values

**State: missing product (`/product/does-not-exist`)**
- 404 page loads (readyState: complete)
- No product-specific content (Next.js default via `notFound()`)

**State: `/go/[id]` redirect (`/go/V4qZOE?source=instagram`)**
- Page loads (readyState: complete)
- Returns 404 because `AMAZON_TAG` not set → `getAffiliateUrlByAsin` returns `{ url: null, error: 'Affiliate not configured' }` → route returns 404
- This is expected: affiliate not configured until owner adds real `AMAZON_TAG`/`AMAZON_MARKETPLACE`

**Console errors**
- Only Next.js HMR WebSocket failures and preload warnings (expected dev noise, not application errors)

### Not verified at runtime (requires `AMAZON_TAG`/`AMAZON_MARKETPLACE` in `.env.local`)

- CTA enabled ("SHOP PRODUCT") when `AMAZON_TAG`/`AMAZON_MARKETPLACE` are set
- CTA navigates to `/go/[id]?source=...` via `useRouter().push()`
- `/go/[id]` 302 redirects to Amazon affiliate URL when `AMAZON_TAG`/`AMAZON_MARKETPLACE` are set
- Click recording via `recordClick(id, source, visitorHash)` when affiliate configured
- Bot/rate-limit/missing-salt skip behavior for rate limiting

These require the owner to add real `AMAZON_TAG` and `AMAZON_MARKETPLACE` values to `.env.local` and Vercel Production.

## Owner actions recorded

- ROLL-12 and ROLL-13 completed before ROLL-14.
- ROLL-14 depends on ROLL-12 helpers (`normalizeSource`, `isBotUserAgent`, `getClientIp`, `getVisitorHash`, `checkAnalyticsRateLimit`, `recordClick`) and ROLL-13 (`ProductDetailsClient` with `source` prop).
- `AMAZON_TAG` and `AMAZON_MARKETPLACE` added as blank keys to `.env.example` and `.env.local`. Owner must add real values.
- Seven commits exist (one per task); nothing pushed.

## Out of scope

Admin auth — ROLL-15. Price changes — ROLL-16. Sentry — ROLL-17. Vitest suite — ROLL-18. Any commit or push without owner approval.

## Noticed, not touched

None new for ROLL-14. The two items from ROLL-12 still apply:
1. RLS policies exist but no `ENABLE ROW LEVEL SECURITY` found (possible security exposure — high priority)
2. `analytics.product_id` nullable in SQL vs non-null in TypeScript
