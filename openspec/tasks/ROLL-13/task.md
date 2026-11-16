# ROLL-13: Production product page + view measurement

## What and why

Build the first customer-facing Production page: `/product/[slug]`. It must show real content only, record views server-side with source attribution, never display price, and return a plain 404 for missing/unpublished products.

This depends on ROLL-12 (schema scoping + analytics helpers). ROLL-14 will wire the `/go/:id` redirect and click recording.

## What exists

- `rollout/src/app/product/[slug]/page.tsx` — fetches product by slug, 404s if missing, calls `recordView(product.id)` with no source/hash/bot/rate-limit.
- `rollout/src/app/product/[slug]/ProductDetailsClient.tsx` — shows price, uses `window.open`, mock Unsplash fallback (`@/lib/placeholder`), plain `` tags.
- ROLL-12 helpers exist: `normalizeSource`, `isBotUserAgent`, `getClientIp`, `getVisitorHash`, `checkAnalyticsRateLimit`.
- `analytics-service.ts` `recordView(productId, source, visitorHash)` accepts source/hash.
- `.env.local` has `ANALYTICS_HASH_SALT`; Production has the Upstash + salt env vars.

## Decisions

| # | Decision | Resolution |
|---|----------|------------|
| 1 | 404 rule | `notFound()` for: missing slug, `status !== 'published'`, or any non-published product. Minimal copy — no product-specific text in the 404. |
| 2 | Source extraction | `?source=instagram` or `?source=whatsapp` from `searchParams`; anything else → `null`. Case-insensitive via `normalizeSource`. |
| 3 | View recording | Server-side only, after the 404 check. Skip if `isBotUserAgent`. Skip if `checkAnalyticsRateLimit` returns `success: false`. Pass `source` + `visitorHash`. |
| 4 | No price | Remove all price display from the client page. `price` stays in the DB/admin but never on the public page. |
| 5 | Images | `next/image` with `cdn.sanity.io` remote pattern. Hero = `priority`, others = `lazy`, `alt` text required. |
| 6 | Mock content | Remove `mockBoxContents`/`FALLBACK_BOX_IMAGE` Unsplash fallback. Real content only — empty sections are omitted, not faked. |
| 7 | CTA | Disabled ("Link coming soon") until ROLL-14 provides `/go/:id`. No `window.open`. No `/api/affiliate` fetch. |
| 8 | Disclosure | Amazon Associates disclosure line on the page. |

## Steps

Run from the repository root: `/home/lordwhitefire/current-project/athletica/athletica`.

### 1. Product page server component — `rollout/src/app/product/[slug]/page.tsx`

Rewrite to:

- Accept `searchParams` alongside `params` (Next.js 16: both are Promises).
- Fetch product via `getProductBySlug(slug)`.
- `notFound()` when no product or `status !== 'published'`.
- Read `source` from `searchParams.get('source')`, normalize via `normalizeSource`.
- Read headers (`await headers()`), extract IP via `getClientIp`, UA via `user-agent`.
- `isBotUserAgent(ua)` → if true, skip recording entirely.
- `getVisitorHash(ip, ua)` → if salt missing, catch the error and skip recording (page must not break).
- `checkAnalyticsRateLimit(hash)` → if `success: false`, skip recording.
- `recordView(product.id, source, visitorHash)` — fire and forget, catch errors.
- Add `generateMetadata` with product title/description + OG tags.
- Pass `source` to `ProductDetailsClient` as a prop (ROLL-14 uses it for click attribution).

### 2. Product client component — `rollout/src/app/product/[slug]/ProductDetailsClient.tsx`

- Remove the price block entirely (`typeof product.price === 'number'` → delete).
- Remove `window.open` and the `/api/affiliate` fetch in `handleShop`.
- Replace `handleShop` with navigation to `/go/[id]`? **No** — `/go` does not exist yet (ROLL-14). Keep the button but disabled with label "Link coming soon". No click recording yet.
- Remove `mockBoxContents` and `FALLBACK_BOX_IMAGE` imports. Box contents: show only when `product.box_contents` is present; otherwise omit the "What's inside the box" section (no Unsplash fallback).
- Replace all `` tags with `next/image`:
  - Hero/main image: `priority`, fill or fixed dimensions, `alt={product.name}`.
  - Thumbnails and gallery images: `lazy`, `alt` text.
- Add Amazon Associates disclosure text near the CTA.
- Accept `source?: AnalyticsSource | null` prop (store it; ROLL-14 uses it).

### 3. Image configuration

Check `rollout/next.config.ts` (or `.js`) for `next/image` `remotePatterns`. Ensure `cdn.sanity.io` is listed. If missing, add it. No other config change.

### 4. Verify

With owner approval:

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Static checks:

```bash
rg -n "price" rollout/src/app/product/[slug]/ProductDetailsClient.tsx   # expect no price display
rg -n "window\.open" rollout/src/app/product/[slug]/                 # expect none
rg -n "mockBoxContents\|FALLBACK_BOX_IMAGE" rollout/src/app/product/ # expect none
rg -n "next/image" rollout/src/app/product/[slug]/ProductDetailsClient.tsx  # expect usage
rg -n "recordView" rollout/src/app/product/[slug]/page.tsx           # expect source + hash args
```

### 5. Stop

Do **not** commit or push. The owner reviews and commits. Do **not** build `/go/:id` — that is ROLL-14.

## Benchmarks (what must be true after this change)

- `/product/[slug]` returns 404 (plain, no product copy) for missing or unpublished products.
- Published product loads real content only — no Unsplash/mock images.
- No price/currency anywhere on the public page.
- `next/image` used for hero (priority) and gallery/thumbnails (lazy), all with `alt`.
- `recordView` called server-side with `source` and `visitorHash`.
- Bot user agents → no analytics write.
- Rate-limited visitor → no analytics write.
- Missing salt → page still renders, recording skipped.
- Amazon Associates disclosure present.
- CTA disabled ("Link coming soon"), no `window.open`.
- `npx tsc --noEmit` passes.
- No `/go/:id` route or click recording — ROLL-14.

## What is explicitly NOT done in this task

- `/go/:id` redirect route — ROLL-14.
- Click recording — ROLL-14.
- Affiliate tag/store config — ROLL-14/env.
- Admin auth — ROLL-15.
- Price changes — ROLL-16.
- Sentry — ROLL-17.
- Vitest suite — ROLL-18.
- Any commit or push.
