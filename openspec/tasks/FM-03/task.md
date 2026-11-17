# FM-03 — Product page

**Phase:** 1 | **Spec:** foundation | **Depends on:** FM-02 | **Status:** ⬜ Pending

## What we're building

The public product detail page `/product/[slug]` — a Server Component that loads a published product (3-condition gate), renders a gallery + buy-box + variant selector + description + SHOP PRODUCT CTA, records a view server-side with source + visitor_hash, emits generateMetadata + JSON-LD, and shows no price.

## Why it matters

This is the only page a visitor sees in Phase 1 (the storefront expands in Phase 2). It is where the affiliate funnel starts: a visitor lands from a backlink, sees the product, and taps the CTA. If the page is wrong (shows a dead product, shows a price, fails to record the view, has no metadata), the funnel leaks.

## What success looks like (benchmarks)

- After this, when a visitor opens `/product/[slug]` for an `active` product with no `deleted_at` and `available_on <= now`, the page renders with gallery + buy-box + CTA.
- After this, when a visitor opens `/product/[slug]` for a `draft`, `archived`, soft-deleted, or future-`available_on` product, the response is a plain 404.
- After this, when a visitor opens `/product/[slug]` for a non-existent slug, the response is a plain 404.
- After this, the page never displays a price or currency anywhere.
- After this, the page's `<head>` carries a correct title, description, and OG image (with explicit width/height/alt), sourced from the product's `meta`/SEO fields with fallbacks.
- After this, the page emits JSON-LD `schema.org/Product` with `AggregateOffer` (availability flips with the product's `availableForSale`).
- After this, each page load records one view row in `analytics` with the `source` from `utm_source` and a `visitor_hash`; known bots are skipped.
- After this, the page renders real content (title, images, details from the DB) — no mock box contents, no Unsplash fallback.

## Context the Builder needs

- Existing: `rollout/src/app/product/[slug]/page.tsx` (Server Component), `ProductDetailsClient.tsx`, `product-service.ts` (`getProductBySlug`), `analytics-service.ts` (view recording), the `rollout1-pixel-match.css` visual system.
- The blueprint requires: 4/6 image + 2/6 buy-box desktop, stacked mobile; gallery in `<Suspense>`; CTA links to `/go/[id]` (not `window.open`); greyed CTA when ASIN/tag missing.
- The 3-condition publish gate: `status='active' AND deleted_at IS NULL AND (available_on IS NULL OR available_on <= now)`.
- `generateMetadata` uses `seo.title || title` fallbacks. Tag-based visibility (`HIDDEN_PRODUCT_TAG` → `robots: noindex`).
- The view recording uses the analytics pipeline from FM-05 (visitor_hash, bot skip, source).

## Boundaries

- Do not show a price or currency anywhere on the public page.
- Do not use `window.open` for the CTA (blocked in in-app browsers).
- Do not render mock box contents or Unsplash fallback images.
- Do not fetch from the Creators API in this task (that is FM-20/22, Phase 5). The page runs on owner-entered data only.
- Do not record a view for known bots.
- Do not store the raw IP in the analytics row (only the hash).
