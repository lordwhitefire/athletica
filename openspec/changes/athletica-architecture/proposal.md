## Why

Athletica is a product discovery and affiliate platform: customers browse products, build a selection, and are sent to Amazon to purchase. Today product data lives in more than one place — Sanity documents and local JSON snapshots (`data/products/*.json`, `data/brands.json`, `data/navigation.json`, `data/homepage.json`) — and product/navigation logic depends heavily on that scattered data. It is impossible to know which data is correct, and the owner cannot operate the business without touching Sanity Studio. This change establishes the target architecture: **Supabase is the single source of truth for all text and product data**, Sanity stores image assets only (referenced by links in Supabase), one product data layer serves every page, and the admin becomes a business operating tool for a one-person operator.

## What Changes

- **BREAKING** — Supabase becomes the source of truth for all text data: product data (products, categories, brands, **model hierarchy**, attributes, ASINs, status, relationships, image links) AND website content (homepage sections, banners, marketing copy, editorial text, navigation, settings). No second database for any of it — not in Sanity, not in JSON files.
- **BREAKING** — Sanity is redefined as **image storage only**. Sanity stores image assets; every reference to an image (product images, brand logos, content images) is a link stored in Supabase. Sanity stops storing product records, homepage sections, navigation, and all other text.
- A single **product data layer** (Product Service) is created; all pages (homepage, categories, product details, search) query Supabase through it — never ad-hoc database queries, never browser-side filtering of the full catalog.
- Filtering, sorting, searching, and pagination happen in the database.
- Categories are split into two concepts: product classification (owned by the product database) and website navigation (content stored in Supabase, pointing at categories, never duplicating products).
- Brands become first-class catalog entities in Supabase (identity, logo link to a Sanity image, product counts, performance).
- **Model hierarchy** is a first-class catalog entity: products belong to leaf models; models form a tree (model → sub-model → sub-sub-model) with attributes inherited or overridden at each level.
- The homepage combines product data and editorial content — both text, both stored in Supabase — with images served from Sanity via stored links. Homepage sections reference products (never copied product records).
- The cart becomes a product selection cart storing product IDs + quantities (no payment, no copied product objects).
- A new **Amazon Affiliate Service** isolates all Amazon link/cart generation (single product links, multi-product cart links, affiliate configuration, ASIN validation). The rest of the application never builds Amazon URLs manually.
- The admin is a business operating tool: dashboard, catalog (products, import center, categories, brands, **models**), content (homepage, navigation, media), analytics (overview, products, traffic), affiliate (Amazon settings, link/cart generator), system (data quality, settings). **The admin UI already exists as 13 pages with complete interactions** — the work is replacing their mock/seed and Sanity-backed data sources with Supabase through the product data layer, not building new screens. Product management no longer requires Sanity Studio.
- A **Data Quality** area answers "what is wrong with my catalog" (missing ASINs, missing images, missing categories, duplicates, invalid products), each problem clickable.
- Analytics focus on the business goal: product views, Amazon clicks, click-through rate, top products/brands/categories, search activity.
- Migration is executed in controlled, verifiable steps (schema → data import → data layer → website → admin wiring → content move → affiliate service → data quality/analytics). The old system is not deleted until the new one is verified against it.

## Capabilities

### New Capabilities
- `product-catalog`: The Supabase-owned product catalog — product records, categories, brands, **model hierarchy**, attributes, ASINs, status, relationships, and image links; the authoritative answer to "what is this product".
- `product-data-access`: The single product data layer every page uses — getProduct, getProducts(filters), category/brand/**model** queries, search, related products, featured products, with filtering/sorting/pagination in the database.
- `content`: Website content and media — homepage sections, banners, marketing copy, editorial text, navigation — all stored as text in Supabase, with image assets stored in Sanity and referenced by links from Supabase records.
- `cart`: The product selection cart — add/remove/change quantity of product IDs, view current selection with live product info.
- `amazon-affiliate`: The Amazon affiliate service — product links, multi-product cart links, affiliate configuration, ASIN validation; the only place Amazon URLs are built.
- `admin`: The business operating tool — dashboard, catalog management, bulk import, content management, data quality, analytics views, affiliate settings; product operations never require Sanity Studio. The admin screens already exist; the work wires them to Supabase data.
- `analytics`: Business-focused measurement — product views, Amazon clicks, click-through rate, top products/brands/categories, search activity, traffic sources where available.

### Modified Capabilities
<!-- None — this project has no existing OpenSpec capabilities yet. -->

## Impact

- **`frontend/`** (Next.js 16): the 13 admin pages (overview, products, import-center, categories, brands, homepage, media, analytics ×3, affiliate-settings, settings, system-health) already exist with full UI and interactions; their data comes from seed/mock data, localStorage, or Sanity-backed server actions (`src/lib/actions/*`). Product queries move from JSON/Sanity reads to the product data layer backed by Supabase; homepage/category/product/search pages consume the service; cart and Amazon links route through the affiliate service. `@supabase/supabase-js` + `@supabase/ssr` are already installed; `@sanity/client` remains for image assets only.
- **`studio-athletica/`** (Sanity Studio): schemas are reduced to image assets only — product, brand, category, navigation, and homepage content documents move to Supabase; Sanity keeps only media/asset upload.
- **`data/`**: JSON snapshots (products, brands, navigation, homepage) are replaced by Supabase as the source; existing files become legacy until migration verification completes.
- **Supabase project**: new schema for the product catalog AND website content (tables for products, categories, brands, **models**, homepage sections, navigation, editorial content, settings; relationships, indexes, RLS); migrations only via migration files, TypeScript types regenerated.
- **New admin surface**: the business tool already exists as 13 pages; the work is wiring each page's data source (interaction layers and server actions) to Supabase through the product data layer.