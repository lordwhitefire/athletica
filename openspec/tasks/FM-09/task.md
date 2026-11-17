# FM-09 — SEO suite

**Phase:** 2 | **Spec:** storefront | **Depends on:** FM-06, FM-07 | **Status:** ⬜ Pending

## What we're building

The SEO layer across all public pages: `generateMetadata` with fallbacks on every page, tag-based visibility (`HIDDEN_PRODUCT_TAG` → `robots: noindex`), OG images with explicit width/height/alt, JSON-LD where applicable, a sitemap, and `robots.txt`. Homepage + category pages are indexable; individual products follow their own visibility.

## Why it matters

Social-traffic affiliates share links. The link preview (OG image + title + description) is the first thing a visitor sees in Instagram/WhatsApp — if it's wrong or missing, the click never happens. Google indexing the catalog means organic discovery. Tag-based visibility (not a status enum) lets a product be published but hidden from search when needed.

## What success looks like (benchmarks)

- After this, every public page (`/`, `/shop`, `/product/[slug]`, category pages) emits `generateMetadata` with `seo.title || title` fallbacks.
- After this, every page's OG image has explicit width, height, and alt.
- After this, a product tagged `HIDDEN_PRODUCT_TAG` emits `robots: { index: false, follow: false }` (and `googleBot: { index: false, follow: false }`); a product without the tag is indexable.
- After this, `/sitemap.xml` exists and lists the homepage, `/shop`, category pages, and all active non-hidden products.
- After this, `/robots.txt` exists and references the sitemap.
- After this, product pages emit JSON-LD `schema.org/Product` + `AggregateOffer` (from FM-03/FM-08); the homepage + category pages emit `schema.org/CollectionPage` or similar where appropriate.
- After this, the root layout metadata is "Athletica" (not "Create Next App") with a site-wide OG default.

## Context the Builder needs

- The Vercel Commerce pattern (RE-07 §2.2): `generateMetadata` async with fallbacks, tag-based visibility, OG with explicit dimensions.
- Existing: `rollout/src/app/layout.tsx` (root metadata — replace "Create Next App").
- Next.js App Router: `generateMetadata` per route, `app/sitemap.ts`, `app/robots.ts`.
- The `HIDDEN_PRODUCT_TAG` convention (a tag string, not a DB column).
- JSON-LD: `Product` + `AggregateOffer` on product pages; `CollectionPage` or `ItemList` on `/shop` + category pages.

## Boundaries

- Do not use a boolean `is_hidden` column — tag-based visibility is the design (more flexible).
- Do not emit `noindex` on the homepage or `/shop` (they are indexable).
- Do not list hidden/draft/archived products in the sitemap.
- Do not omit OG image dimensions (essential for previews).
- Do not leave "Create Next App" anywhere in the metadata.
