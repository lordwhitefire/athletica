# ROLL-13 — Implementation Report

## What was built

All five plan tasks completed, one commit per task, nothing pushed:

| Commit | Task | Files |
|--------|------|-------|
| `a87d9e0` | T1: Image config | `rollout/next.config.ts` |
| `2ec3172` | T2: Delete custom 404 | `rollout/src/app/product/[slug]/not-found.tsx` (deleted) |
| `75191a3` | T3: Server component | `rollout/src/app/product/[slug]/page.tsx` |
| `ac5a6f0` | T4: Client component | `rollout/src/app/product/[slug]/ProductDetailsClient.tsx` |
| `ad43da8` | T5: Verify + report | `developer-workspace/ROLL-13/report.md` |

## Verified

### TypeScript
`npx tsc --noEmit` exits 0 after every task (checkpoints CP1, CP2, CP3 all green).

### Static checks
- No `price` display in `ProductDetailsClient.tsx`
- No `window.open` in `rollout/src/app/product/[slug]/`
- No `mockBoxContents`/`FALLBACK_BOX_IMAGE` in `rollout/src/app/product/`
- `next/image` imported in `ProductDetailsClient.tsx`
- `recordView(product.id, source, visitorHash)` called in `page.tsx`
- `cdn.sanity.io` in `next.config.ts` remotePatterns
- `not-found.tsx` deleted

### Runtime browser check (interaction-driven)

Server confirmed up on `:3011` before checking. Attached to Chrome on `:9222` (attach-only, no launch). One tab created and reused. Full DOM extraction per state.

**State: missing product (`/product/does-not-exist`)**
- ✅ 404 page loads (readyState: complete)
- ✅ No product-specific content in 404 (Next.js default via `notFound()`)
- ✅ `not-found.tsx` deleted — default 404 used

**State: published product (`/product/TS-1001`)**
- Returns 404 because `TS-1001` is a product `id`, not a `slug`; `getProductBySlug` filters by `slug` AND `status: 'published'`
- No published product slugs are available in the database to test the happy path
- The 404 path works correctly (missing/unpublished → `notFound()`)

**Console errors**
- Only Next.js HMR WebSocket failures (expected with `next dev` + CDP, not application errors)

### Not verified at runtime (requires published product in database)

- Published product page loads real content (no Unsplash/mock images)
- No price/currency anywhere on the public page
- `next/image` used for hero (priority) and gallery/thumbnails (lazy), all with `alt`
- CTA disabled ("Link coming soon"), no `window.open`
- Amazon Associates disclosure present
- Box contents section shows when `box_contents` present, omitted when empty
- `recordView` called server-side with `source` and `visitorHash`
- Bot user agents → no analytics write
- Rate-limited visitor → no analytics write
- Missing salt → page still renders, recording skipped

These require a published product with a known slug in the database, which is not available for testing.

## Pre-existing errors

None found. `tsc` was clean at every checkpoint; no pre-existing type errors block this task.

## Owner actions recorded

- ROLL-12 was completed before ROLL-13 (schema scoping + analytics helpers).
- ROLL-13 depends on ROLL-12 helpers: `normalizeSource`, `isBotUserAgent`, `getClientIp`, `getVisitorHash`, `checkAnalyticsRateLimit`, `recordView`.
- Five commits exist (T1–T5); nothing pushed.
- Code review and commit/push remain with the owner.

## Out of scope

`/go/:id` redirect route, click recording, affiliate tag/store config, admin auth, price changes, Sentry, Vitest suite, any commit or push without owner approval.
