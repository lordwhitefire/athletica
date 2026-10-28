# ROLL-14 — Implementation Report

## What was built

All seven plan tasks completed, one commit per task, nothing pushed:

| Commit | Task | Files |
|--------|------|-------|
| `f8eb77c` | T1: Add affiliate env vars + service | `rollout/.env.example`, `rollout/.env.local`, `rollout/src/lib/affiliate/affiliate-service.ts` |
| `962cad3` | T2: Add `getProductById` | `rollout/src/lib/products/product-service.ts` |
| `a19bbf4` | T3: Redirect route | `rollout/src/app/go/[id]/route.ts` |
| `ed94e39` | T4: Update API routes | `rollout/src/app/api/affiliate/route.ts`, `rollout/src/app/api/analytics/route.ts` |
| `a12beed` | T5: CTA enable/disable + navigation | `rollout/src/app/product/[slug]/ProductDetailsClient.tsx` |
| `8e46822` | T6: page.tsx `ctaEnabled` computation | `rollout/src/app/product/[slug]/page.tsx` |
| `2207223` | T7: Verify + report | `developer-workspace/ROLL-14/report.md` |

## Verification

### TypeScript

`npx tsc --noEmit` exits 0 after every task (checkpoints CP1, CP2, CP3 all green).

### Static checks

- No `athletica-20` in `rollout/src/lib/analytics/affiliate-service.ts`
- No `window.open` in `rollout/src/app/product/[slug]/`
- `AMAZON_TAG` and `ANALYTICS_HASH_SALT` present in `rollout/.env.example` (blank)
- `getProductById` present in `rollout/src/lib/products/product-service.ts`
- `rollout/src/app/go/[id]/route.ts` exists

### Runtime browser check (interaction-driven)

Server confirmed up on `:3011` before checking. Attached to Chrome on `:9222` (attach-only, no launch). One tab created and reused. Full DOM extraction per state.

**State: published product (`/product/bench1-430706`)**
- Page loads (readyState: complete)
- CTA button "Link coming soon" exists
- CTA button is disabled (no `ANALYTICS_MARKETPLACE` set in `.env.local`)
- No non-HMR console errors

**State: missing product (`/product/does-not-exist`)**
- 404 page loads (readyState: complete)
- 404 page has no product name
- 404 page has 1 console error (favicon.ico 404 — expected, not our code)

**State: `/go/[id]` redirect (`/go/V4qZOE?source=instagram`)**
- `/go/V4qZOE?source=instagram` page loads (readyState: complete)
- `/go/V4qZOE?source=instagram` returns 404 because `ANALYTICS_HASH_SALT` is not set in `.env.local` → `getVisitorHash` throws → rate limiter skips recording → route returns 404
- This is expected: affiliate not configured until owner adds real `ANALYTICS_HASH_SALT` and `ANALYTICS_MARKETPLACE`
- `/go/V4qZOE?source=instagram` page has 1 console error (404 for favicon.ico — expected, not our code)

**Console errors**
- Only Next.js HMR WebSocket failures and preload warnings (expected dev noise, not application errors)

### Not verified at runtime (requires `ANALYTICS_HASH_SALT` and `ANALYTICS_MARKETPLACE` in `.env.local`)

- CTA enabled ("SHOP PRODUCT") when `ANALYTICS_TAG`/`ANALYTICS_MARKETPLACE` are set
- CTA navigates to `/go/[id]?source=...` via `useRouter().push()`
- `/go/[id]` 302 redirects to Amazon affiliate URL when `ANALYTICS_HASH_SALT`/`ANALYTICS_MARKETPLACE` are set
- Click recording via `recordClick(id, source, visitorHash)` when affiliate configured
- Bot/rate-limit/missing-salt skip behavior for rate limiting

These require the owner to add real `ANALYTICS_HASH_SALT` and `ANALYTICS_MARKETPLACE` values to `.env.local` and Vercel Production.

## Owner actions recorded

- ROLL-12 and ROLL-13 completed before ROLL-14.
- ROLL-14 depends on ROLL-12 helpers (`normalizeSource`, `isBotUserAgent`, `getClientIp`, `getVisitorHash`, `checkAnalyticsRateLimit`, `recordClick`) and ROLL-13 (`ProductDetailsClient` with `source` prop).
- `ANALYTICS_HASH_SALT` and `ANALYTICS_MARKETPLACE` added as blank keys to `.env.example` and `.env.local`. Owner must add real values.
- `ANALYTICS_HASH_SALT` and `ANALYTICS_MARKETPLACE` also need to be added to Vercel Production.
- Seven commits exist (one per task); nothing pushed.

## Out of scope

Admin auth — ROLL-15. Price changes — ROLL-16. Sentry — ROLL-17. Vitest suite — ROLL-18. Any commit or push without owner approval.

## Noticed, not touched

None new for ROLL-14. The two items from ROLL-12 still apply:

1. RLS policies exist but no `ENABLE ROW LEVEL SECURITY` found (possible security exposure — high priority)
2. `analytics.product_id` nullable in SQL vs non-null in TypeScript