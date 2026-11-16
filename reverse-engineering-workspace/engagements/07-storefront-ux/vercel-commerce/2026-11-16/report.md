# Report — Engagement 07, Sample: Vercel Commerce

**Engagement:** 07 — Storefront UX (product grid, detail page, "Buy on Amazon" CTA)
**Sample:** Vercel Commerce (vercel/commerce), Next.js + Shopify, MIT
**Commit analysed:** `f7521d57d29f0eb3d23c1399cf9bb299d61fcd21` (2026-10-19)
**Mode:** A (open source under licence), static analysis only
**Date:** 2026-11-16

---

## 0. Licence note

Vercel Commerce is **MIT** — most permissive. Direct adaptation permitted. The
repo is being archived per the README, but the UX patterns are still current and
widely copied across Next.js storefronts.

## 1. What is it?

The canonical Next.js + Shopify storefront template by Vercel. Next.js 15.6
canary + React 19 + Tailwind 4 + Shopify GraphQL. Small and focused: 78 files,
1.2 MB. Last commit 2026-10-19.

## 2. What does it do? (rules and behaviour)

### 2.1 Homepage hierarchy — curated > browse > meta

`app/page.tsx` (21 lines, full):

```tsx
export default function HomePage() {
  return (
    <>
      <ThreeItemGrid />
      <Carousel />
      <Footer />
    </>
  );
}
```

**Rule (confirmed):** homepage is three sections in priority order:
1. `ThreeItemGrid` — 3-up hero grid of curated products (above the fold)
2. `Carousel` — horizontal scroller for browsing (below the fold)
3. `Footer` — meta content

**Rule (confirmed):** the storefront leads with **editorial curation**, not
exhaustive listing. Three picks, not twelve.

### 2.2 Product detail page — JSON-LD + SEO + 4/6-2/6 split

`app/product/[handle]/page.tsx` (149 lines). Three concerns:

#### SEO metadata (lines 12–42)

```tsx
export async function generateMetadata(props) {
  const product = await getProduct(params.handle);
  if (!product) return notFound();
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);
  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
    robots: { index: indexable, follow: indexable, googleBot: { index: indexable, follow: indexable } },
    openGraph: url ? { images: [{ url, width, height, alt }] } : null,
  };
}
```

**Rule (confirmed):** `generateMetadata` is a Next.js App Router async function
with fallbacks (`seo.title || title`).

**Rule (confirmed):** SEO visibility is **tag-based**, not a status enum. A
product with `HIDDEN_PRODUCT_TAG` gets `robots: { index: false, follow: false }`.
More flexible than a boolean `is_hidden` field — a product can be published but
hidden from search.

**Rule (confirmed):** OpenGraph image has explicit width/height/alt (essential
for OG previews).

#### JSON-LD structured data (lines 56–72)

```tsx
const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.title,
  description: product.description,
  image: product.featuredImage.url,
  offers: {
    "@type": "AggregateOffer",
    availability: product.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    priceCurrency: product.priceRange.minVariantPrice.currencyCode,
    highPrice: product.priceRange.maxVariantPrice.amount,
    lowPrice: product.priceRange.minVariantPrice.amount,
  },
};
```

**Rule (confirmed):** every product page emits a `schema.org/Product` JSON-LD
script. Google uses this for rich results (price, availability, image).
`availability` flips between `InStock` and `OutOfStock` based on
`product.availableForSale`.

**Rule (confirmed):** `AggregateOffer` (not `Offer`) because a product has
multiple variants with a price range. `lowPrice` + `highPrice`.

#### Layout split (lines 95–149)

**Rule (confirmed):** desktop is a **4/6 image + 2/6 buy-box** split
(image-first). Mobile is stacked (`flex-col` → `flex-row` at `lg`). Gallery
wrapped in `<Suspense>` with an aspect-square skeleton fallback, capped at 5
images, `max-h-[550px]`.

### 2.3 Buy-box composition — 4 stacked elements

`components/product/product-description.tsx` (29 lines, full):

**Rule (confirmed):** the buy-box is 4 stacked elements:

1. **Title (h1, text-5xl)** + **price pill** (rounded-full, bg-blue-600). Price
   is a *pill/badge*, not inline text. Title + price in a `border-b pb-6`
   container (visual separator).
2. **VariantSelector** — size/color options.
3. **Description** (rendered HTML via Prose).
4. **AddToCart** button — the LAST element, at the bottom of the buy-box.

### 2.4 Variant selector — URL params as state, availability-aware

`components/product/variant-selector.tsx` (106 lines, full).

**Rule (confirmed):** variant state lives in **URL search params**
(`?size=M&color=blue`), NOT React state. Benefits: shareable URLs, working
back button, server-component readable.

**Rule (confirmed):** a `combinations` map is precomputed from all variants.
For each option value, checks if any matching variant is `availableForSale`.
Unavailable options are **visible-but-disabled**: `aria-disabled`, `disabled`,
strike-through CSS pseudo-element, title "Out of Stock".

**Rule (confirmed):** returns `null` for simple products (no options or one
option with one value). No empty selector UI.

**Rule (confirmed):** `router.replace` with `{ scroll: false }` — changing
the variant does NOT scroll the page.

### 2.5 Affiliate adaptation — "Buy on Amazon" CTA

Vercel Commerce's `<AddToCart>` adds to a Shopify cart. For our affiliate
model, replace with `<BuyOnAmazon>`:

**Rule (proposed):**
1. Same visual prominence (last element in the buy-box).
2. On click, navigate to `product.destination_url` (the Amazon URL with affiliate
   tag, built per engagement 03: `https://{domain}/dp/{ASIN}?tag={associate_id}`).
3. `target="_blank" rel="nofollow noopener"` (external link, security +
   Amazon Associates compliance).
4. Records a click event per engagement 01's Dub rules (bot check, dedup,
   identity hash, EU IP redaction).
5. Shows `available: false` products as a disabled button with "Out of Stock"
   label (mirroring the variant-selector pattern).

**Rule (proposed):** the affiliate buy-box is simpler than Vercel's: (1) title +
price pill, (2) NO variant selector (single-variant affiliate products), (3)
description, (4) `<BuyOnAmazon>` button.

## 3. How do we know? (evidence)

6 evidence blocks in `evidence/excerpts.txt` (445 lines). Each is a `nl -ba`
numbered excerpt. Licence confirmed from `license.md`. Provenance: shallow clone
of the official repo at commit `f7521d57d29f0eb3d23c1399cf9bb299d61fcd21`.

## 4. What did we not prove?

- **The `Carousel` component's internals.** Not read in full; *likely* a
  horizontal scroller of `GridTileImage` components (same tile as the hero
  grid). Not proven.
- **The `Gallery` component's internals.** Not read in full; *likely* a main
  image + thumbnail strip. Not proven.
- **The `AddToCart` mutation flow.** Not read in full (we're replacing it with
  `BuyOnAmazon` anyway).
- **Real-world performance** of the Suspense-streamed gallery. Source-confirmed
  pattern; no benchmark.
- **Whether the archived status affects pattern currency.** *Likely* still
  current (standard Next.js App Router patterns).

## 5. What should the owner do next?

For the **football affiliate marketplace build**, take from Vercel Commerce:

1. **Homepage hierarchy:** curated 3-up hero grid → browse carousel → footer.
   Lead with editorial curation.
2. **Product detail layout:** 4/6 image + 2/6 buy-box on desktop; stacked on
   mobile. Gallery in Suspense with aspect-square skeleton. Cap at 5 images.
3. **Buy-box composition:** title + price pill → (variant selector if
   applicable) → description → CTA button. Title+price in a border-b container.
4. **Price as a pill/badge**, not inline text.
5. **`generateMetadata` async function** with fallbacks (`seo.title || title`).
   Tag-based visibility (`HIDDEN_PRODUCT_TAG` controls `robots.index`).
6. **OpenGraph image with explicit width/height/alt.**
7. **JSON-LD `schema.org/Product` with `AggregateOffer`** on every product page.
   `availability` flips with `availableForSale`.
8. **URL search params as variant state** (shareable, back-button works).
9. **Unavailable options visible-but-disabled** with strike-through + "Out of
   Stock" title.
10. **`router.replace` with `{ scroll: false }`** on variant change.
11. **`<BuyOnAmazon>` CTA** replacing `<AddToCart>`: external
    `target="_blank" rel="nofollow noopener"`, records click event, disabled
    state mirrors variant-selector's OOS pattern.

Do **not** take from Vercel Commerce:

- The Shopify GraphQL integration (we use Amazon).
- The cart + checkout flow (we redirect to Amazon — no cart).
- The full navbar / search / footer (extract pattern only).

## 6. Confidence summary

| Finding | Confidence |
|---|---|
| Homepage = 3-up hero grid + carousel + footer | confirmed |
| Product detail = 4/6 image + 2/6 buy-box, Suspense gallery | confirmed |
| Buy-box = title+price pill → variants → description → CTA | confirmed |
| Price as a pill/badge | confirmed |
| SEO: `generateMetadata` with fallbacks + tag-based visibility | confirmed |
| JSON-LD `schema.org/Product` with `AggregateOffer` | confirmed |
| Variant selector uses URL search params as state | confirmed |
| Unavailable options visible-but-disabled with strike-through | confirmed |
| `router.replace` with `{ scroll: false }` | confirmed |
| Carousel is a horizontal scroller of GridTileImage | likely (not read) |
| Gallery is main image + thumbnail strip | likely (not read) |
| Patterns still current despite repo archive | likely |

---

## Engagement 07 — Consolidated

Engagement 07 is **complete**. One sample reported (Vercel Commerce, MIT). The
storefront UX rules for the build are documented above.

---

## All engagements — final status

All seven engagements are now **complete**:

| # | Capability | Samples | Status |
|---|---|---|---|
| 01 | Redirect + click tracking + bot filter + rate limit | YOURLS (MIT), Dub (AGPLv3) | complete |
| 02 | Affiliate tracking + commissions + payout | Raider (MPL-2.0), Weferral (MIT) | complete |
| 03 | ASIN → Amazon URL + marketplace routing + dead-link | Amazon Auto Links (GPL-2.0) | complete |
| 04 | Manual product catalog + admin CRUD + bulk import | Spree (BSD-3) | complete |
| 05 | Multi-lock admin auth + RLS | athletica/rollout (own), NextBase (MIT) | complete |
| 06 | Privacy-first click analytics + visitor hashing | Plausible (AGPLv3) | complete |
| 07 | Storefront UX | Vercel Commerce (MIT) | complete |

**10 samples studied across 7 capabilities.** All evidence is in
`reverse-engineering-workspace/`. The next step is to consolidate the rules into
the master architecture + data model document for the new single-app build —
that lives in the repo, not in this workspace.
