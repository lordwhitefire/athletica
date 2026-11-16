# Sample — Vercel Commerce

## Identity

| Field | Value |
|---|---|
| Name | Vercel Commerce (vercel/commerce) |
| Type | Next.js 15.6 canary + React 19 + Tailwind 4 storefront, Shopify GraphQL |
| Version / commit | `f7521d57d29f0eb3d23c1399cf9bb299d61fcd21` (2026-10-19) |
| Provenance | `git clone --depth 1 https://github.com/vercel/commerce.git` on 2026-11-16 |
| Licence | **MIT** (Copyright 2025 Vercel, Inc.) |
| Size | 1.2 MB |
| File count | 78 (excluding `.git/` and `node_modules/`) |

## Provenance handling

Shallow clone of the official repo. Working tree read-only. Note: the repo is
being archived per the README, but the UX patterns are still current and widely
copied across Next.js storefronts.

## Layout (key directories)

```
vercel-commerce/
  license.md                           MIT
  app/
    page.tsx                           homepage (ThreeItemGrid + Carousel + Footer)
    layout.tsx                         root layout
    product/[handle]/page.tsx         PRODUCT DETAIL PAGE (149 lines)
    search/                            search page + collection filter
    [page]/page.tsx                   static CMS pages
    sitemap.ts                         sitemap generation
    robots.ts                         robots.txt generation
    opengraph-image.tsx               dynamic OG image
    error.tsx                         error boundary
  components/
    cart/                              add-to-cart, cart drawer
    layout/                            navbar, footer, search
    product/
      gallery.tsx                      image gallery (left column)
      product-description.tsx          buy-box composition (right column)
      variant-selector.tsx             URL-params-based variant selection
    grid/
      tile.tsx                         one product tile (image + link)
      three-items.tsx                  3-up hero grid
      index.tsx                        grid wrapper
    icons/                             icon set
  lib/
    shopify/                           Shopify GraphQL client
      types.ts                         Product, Variant, Image types
      fragments/                       GraphQL fragments
      queries/                         product, collection, cart, menu, page queries
      mutations/                       cart mutations
    constants.ts                       HIDDEN_PRODUCT_TAG etc.
    utils.ts
    type-guards.ts
```

## Lab status

Not applicable. Mode A, static-only.

## Handling rule

Treat as read-only reference under MIT. Direct adaptation permitted. We extract
UX rules and re-implement in our affiliate storefront (with "Buy on Amazon"
instead of "Add to Cart").

## Open triage questions

1. Homepage hierarchy?
2. Product card information hierarchy?
3. Product detail page split?
4. Variant selector state pattern?
5. SEO + JSON-LD rules?
6. CTA placement?
7. How to adapt for affiliate (external redirect)?
