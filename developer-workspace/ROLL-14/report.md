# ROLL-14 — Implementation Report

> **Correction — Sat Oct 31 2026.** Two errors in this report were found and fixed today, at the
> owner's request. The original text is left below, unedited apart from the named corrections.
>
> 1. **Wrong variable names.** Lines 38, 49, 55, 57, 59, 63, 69, 70 named the affiliate variables
>    `ANALYTICS_TAG` and `ANALYTICS_MARKETPLACE`. The real names are `AMAZON_TAG` and
>    `AMAZON_MARKETPLACE`. Corrected in place.
> 2. **A check recorded against a file that does not exist.** Line 25 read
>    `No athletica-20 in rollout/src/lib/analytics/affiliate-service.ts`. That path does not exist;
>    the real path is `src/lib/affiliate/affiliate-service.ts`. Because the path was wrong, that
>    check returned no matches vacuously — it read as a pass without ever inspecting the real file.
>    **The check as originally run was not a real verification of anything.**
>
> The underlying claim has now been genuinely verified: `rg -n "athletica-20"
> src/lib/affiliate/affiliate-service.ts` returns no matches. The conclusion was true; the recorded
> proof of it was not.
>
> All other conclusions in this report were re-checked and stand. `ANALYTICS_HASH_SALT` is a real
> variable and was correct throughout; it is unchanged.

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

- No `athletica-20` in `rollout/src/lib/affiliate/affiliate-service.ts`
- No `window.open` in `rollout/src/app/product/[slug]/`
- `AMAZON_TAG` and `ANALYTICS_HASH_SALT` present in `rollout/.env.example` (blank)
- `getProductById` present in `rollout/src/lib/products/product-service.ts`
- `rollout/src/app/go/[id]/route.ts` exists

### Runtime browser check (interaction-driven)

Server confirmed up on `:3011` before checking. Attached to Chrome on `:9222` (attach-only, no launch). One tab created and reused. Full DOM extraction per state.

**State: published product (`/product/bench1-430706`)**
- Page loads (readyState: complete)
- CTA button "Link coming soon" exists
- CTA button is disabled (no `AMAZON_MARKETPLACE` set in `.env.local`)
- No non-HMR console errors

**State: missing product (`/product/does-not-exist`)**
- 404 page loads (readyState: complete)
- 404 page has no product name
- 404 page has 1 console error (favicon.ico 404 — expected, not our code)

**State: `/go/[id]` redirect (`/go/V4qZOE?source=instagram`)**
- `/go/V4qZOE?source=instagram` page loads (readyState: complete)
- `/go/V4qZOE?source=instagram` returns 404 because `ANALYTICS_HASH_SALT` is not set in `.env.local` → `getVisitorHash` throws → rate limiter skips recording → route returns 404
- This is expected: affiliate not configured until owner adds real `ANALYTICS_HASH_SALT` and `AMAZON_MARKETPLACE`
- `/go/V4qZOE?source=instagram` page has 1 console error (404 for favicon.ico — expected, not our code)

**Console errors**
- Only Next.js HMR WebSocket failures and preload warnings (expected dev noise, not application errors)

### Not verified at runtime (requires `ANALYTICS_HASH_SALT` and `AMAZON_MARKETPLACE` in `.env.local`)

- CTA enabled ("SHOP PRODUCT") when `AMAZON_TAG`/`AMAZON_MARKETPLACE` are set
- CTA navigates to `/go/[id]?source=...` via `useRouter().push()`
- `/go/[id]` 302 redirects to Amazon affiliate URL when `ANALYTICS_HASH_SALT`/`AMAZON_MARKETPLACE` are set
- Click recording via `recordClick(id, source, visitorHash)` when affiliate configured
- Bot/rate-limit/missing-salt skip behavior for rate limiting

These require the owner to add real `ANALYTICS_HASH_SALT` and `AMAZON_MARKETPLACE` values to `.env.local` and Vercel Production.

## Owner actions recorded

- ROLL-12 and ROLL-13 completed before ROLL-14.
- ROLL-14 depends on ROLL-12 helpers (`normalizeSource`, `isBotUserAgent`, `getClientIp`, `getVisitorHash`, `checkAnalyticsRateLimit`, `recordClick`) and ROLL-13 (`ProductDetailsClient` with `source` prop).
- `ANALYTICS_HASH_SALT` and `AMAZON_MARKETPLACE` added as blank keys to `.env.example` and `.env.local`. Owner must add real values.
- `ANALYTICS_HASH_SALT` and `AMAZON_MARKETPLACE` also need to be added to Vercel Production.
- Seven commits exist (one per task); nothing pushed.

## Out of scope

Admin auth — ROLL-15. Price changes — ROLL-16. Sentry — ROLL-17. Vitest suite — ROLL-18. Any commit or push without owner approval.

## Noticed, not touched

None new for ROLL-14. The two items from ROLL-12 still apply:

1. RLS policies exist but no `ENABLE ROW LEVEL SECURITY` found (possible security exposure — high priority)
2. `analytics.product_id` nullable in SQL vs non-null in TypeScript