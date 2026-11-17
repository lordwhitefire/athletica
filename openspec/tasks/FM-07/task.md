# FM-07 — Catalog browse (`/shop`)

**Phase:** 2 | **Spec:** storefront | **Depends on:** FM-03 | **Status:** ⬜ Pending

## What we're building

The `/shop` catalog page — a product grid with search, faceted filter (category, gender, color — not price), sort (newest, popular), and pagination. URL search params are the filter state (shareable, back-button works). Unavailable options are visible-but-disabled.

## Why it matters

The homepage curates 3; the catalog is where browsing happens. Without it, the visitor can only reach products via a backlink. With it, the visitor can search, filter, and discover. URL-param state means links are shareable and the back button works — both essential for social-traffic affiliates.

## What success looks like (benchmarks)

- After this, when a visitor opens `/shop`, they see a grid of active products with a search bar, filter controls, sort, and pagination.
- After this, when a visitor searches "boot", the grid shows only products matching "boot" (name/tag/slug), and the URL reflects the query (`/shop?q=boot`).
- After this, when a visitor filters by category, the grid filters and the URL reflects it (`/shop?category=boots`); the back button restores the previous view.
- After this, when a visitor changes filter or sort, the page does NOT scroll to the top (`router.replace {scroll:false}`).
- After this, when a product variant is out of stock, its tile is visible but visually disabled (strike-through + "Out of Stock"), not hidden.
- After this, when no products match, the page shows "No products match" (not an empty grid, not a fake count).
- After this, the filter does NOT include price (price is never displayed publicly).
- After this, a shareable URL (`/shop?category=boots&q=indoor&sort=newest`) loads the exact filtered view for anyone who opens it.

## Context the Builder needs

- The Vercel Commerce variant-selector pattern (RE-07 §2.4): URL search params as state, `router.replace {scroll:false}`, visible-but-disabled unavailable options.
- Existing: `rollout/src/app/product/[slug]/page.tsx` (Server Component pattern), `product-service.ts`.
- The `categories` M2M (FM-02) is the filter source.
- Search: Postgres ILIKE on name/tags/slug, or `pg_trgm` for fuzzy if the catalog grows.
- Pagination: cursor or offset, 8–12 per page.

## Boundaries

- Do not put price in the filter or sort (it is never displayed).
- Do not hide out-of-stock products (visible-but-disabled, RE-07 §2.4).
- Do not use React state for filters (URL params, so links share + back works).
- Do not scroll to top on filter change.
- Do not show a fake count when empty.
- The Creators API is NOT used here (owner-entered availability only in this phase; API availability enriches in FM-21).
