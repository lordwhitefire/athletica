# Spec — Storefront

**Change:** athletica-full-marketplace | **Phase:** 2 | **Tasks:** FM-06…FM-09
**Sources:** `blueprint/01-build-layers.md` (UI, Functionality), RE-07 (Vercel Commerce).

## Intent

The storefront is the public surface — the whole reason the marketplace exists. A visitor lands on a curated homepage, browses a catalog with search and filters, opens a product page with variants and reviews, and every page is indexable, shareable, fast on a phone, and honest about what's available and what isn't.

## Requirements

**Homepage (FM-06):** `/` shows a curated 3-up hero grid (above the fold) + a browse carousel (below) + footer. Leads with editorial curation, not exhaustive listing. Fast first screen on mobile data. `generateMetadata` ("Athletica" + OG). Skeleton tiles while loading.

**Catalog browse (FM-07):** `/shop` shows a product grid with search, faceted filter (category, gender, color — not price, since price isn't displayed), sort (newest, popular), pagination. URL search params are the filter state (shareable, back-button works). `router.replace {scroll:false}` on filter change. Empty = "No products match." Loading = skeleton grid. Unavailable variants visible-but-disabled (strike-through + "Out of Stock").

**Product detail with variants + reviews (FM-08):** 4/6 image + 2/6 buy-box desktop; stacked mobile. Gallery in `<Suspense>`, aspect-square skeleton, cap 5 images, max-h-550px. Buy-box: title + (no price) → variant selector (URL params as state) → description → reviews summary → SHOP PRODUCT CTA last. Variant selector returns null for single-variant products (no empty UI). Reviews summary: rating + count + 2-3 excerpts + "See all on Amazon" — fetched via the Creators API **only when enabled**; when unavailable/ineligible, the reviews block is omitted (no fake reviews, no broken section). JSON-LD `AggregateOffer` references the rating when present.

**SEO suite (FM-09):** `generateMetadata` with fallbacks (`seo.title || title`) on every public page. Tag-based visibility (`HIDDEN_PRODUCT_TAG` → `robots: noindex`). OG image with explicit w/h/alt. JSON-LD `schema.org/Product` + `AggregateOffer` on product pages (availability flips). Sitemap. `robots.txt`. Homepage + category pages indexable.

## Behavior boundaries

- No price is ever displayed on a public page (Amazon Associates policy).
- Reviews are never fabricated. If there's no data (API off / ineligible / empty), the section is omitted.
- Variant state lives in URL search params, not React state.
- No `window.open` for the CTA. The SHOP PRODUCT button links to `/go/[id]`.
- Phone-first. In-app browsers (Instagram, WhatsApp) are the primary environment.

## What success looks like (phase gate)

- A visitor lands on `/`, sees 3 curated picks + a carousel, and the first screen loads fast on mobile data.
- A visitor opens `/shop`, searches, filters by category, sorts, paginates — the URL reflects the state, the back button works, and shareable URLs load the right view.
- A visitor opens a multi-variant product page, selects a variant via URL param, sees unavailable options greyed with "Out of Stock."
- Google can index the homepage + category pages + product pages (sitemap + robots + JSON-LD present).
- With the Creators API off, the product page still renders fully (owner data) — the reviews block is simply omitted.
