# Analysis — Engagement 07, Sample: Vercel Commerce

**Date:** 2026-11-16
**Mode:** A (open source under MIT), static only
**Working record** — separates what was *observed* from what is *inferred*.

## Files read

| File | Lines | Purpose |
|---|---|---|
| `license.md` | full | MIT confirmed |
| `app/page.tsx` | 1–21 (full) | Homepage composition |
| `app/product/[handle]/page.tsx` | 1–149 (full) | Product detail page |
| `components/product/product-description.tsx` | 1–29 (full) | Buy-box composition |
| `components/product/variant-selector.tsx` | 1–106 (full) | Variant selector |
| `lib/shopify/fragments/product.ts` | 1–50 (head) | Product GraphQL shape |

## Observed: homepage hierarchy — curated > browse > meta

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

**Rule (confirmed):** the homepage is three sections in priority order:

1. **`ThreeItemGrid`** — a 3-up hero grid of curated products. The most prominent
   real estate; above the fold.
2. **`Carousel`** — a horizontal scroller of more products for browsing. Below the
   fold.
3. **`Footer`** — meta content (links, legal).

The hierarchy is **curated (3 picks) → browse (carousel) → meta (footer)**. Not
"12 products in a 4x3 grid." The storefront leads with editorial curation, not
exhaustive listing.

## Observed: product detail page — JSON-LD + SEO + 4/6-2/6 split

`app/product/[handle]/page.tsx` (149 lines). Two distinct concerns:

### SEO metadata (lines 12–42)

```tsx
export async function generateMetadata(props) {
  const product = await getProduct(params.handle);
  if (!product) return notFound();
  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);
  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: { index: indexable, follow: indexable },
    },
    openGraph: url ? { images: [{ url, width, height, alt }] } : null,
  };
}
```

**Rule (confirmed):** `generateMetadata` is a Next.js App Router async function.
It fetches the product, then builds the metadata with fallbacks
(`seo.title || title`, `seo.description || description`).

**Rule (confirmed):** SEO visibility is **tag-based**, not a status enum. A
product with the `HIDDEN_PRODUCT_TAG` tag gets `robots: { index: false, follow:
false }`. Products without the tag are indexable. This is more flexible than a
boolean `is_hidden` field — a product can be published but hidden from search.

**Rule (confirmed):** OpenGraph image comes from `product.featuredImage` with
explicit width/height/alt — essential for OG previews.

### JSON-LD structured data (lines 56–72)

```tsx
const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.title,
  description: product.description,
  image: product.featuredImage.url,
  offers: {
    "@type": "AggregateOffer",
    availability: product.availableForSale
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    priceCurrency: product.priceRange.minVariantPrice.currencyCode,
    highPrice: product.priceRange.maxVariantPrice.amount,
    lowPrice: product.priceRange.minVariantPrice.amount,
  },
};
```

Rendered via `<script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(productJsonLd)}} />`.

**Rule (confirmed):** every product page emits a `schema.org/Product` JSON-LD
script with an `AggregateOffer`. Google uses this for rich results (price,
availability, image). The `availability` field flips between `InStock` and
`OutOfStock` based on `product.availableForSale`.

**Rule (confirmed):** `AggregateOffer` (not `Offer`) is used because a product
has multiple variants with a price range. `lowPrice` + `highPrice` represent the
range.

### Layout split (lines 95–149)

```tsx
<div className="flex flex-col rounded-lg border ... lg:flex-row lg:gap-8">
  <div className="h-full w-full basis-full lg:basis-4/6">
    <Suspense fallback={<div className="relative aspect-square h-full max-h-[550px] w-full" />}>
      <Gallery images={...} />
    </Suspense>
  </div>
  <div className="basis-full lg:basis-2/6">
    <ProductDescription product={product} />
  </div>
</div>
```

**Rule (confirmed):** on desktop, the product detail page is a **4/6 image +
2/6 buy-box** split (image-first). On mobile, stacked (flex-col → flex-row at
`lg`). The gallery is wrapped in `<Suspense>` with an aspect-square skeleton
fallback — the gallery streams in.

**Rule (confirmed):** the gallery is capped at 5 images
(`product.images.slice(0, 5)`) and the fallback is `max-h-[550px]` — image
height is bounded to prevent layout shift.

## Observed: the buy-box composition (4 stacked elements)

`components/product/product-description.tsx` (29 lines, full):

```tsx
export function ProductDescription({ product }) {
  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6">
        <h1 className="mb-2 text-5xl font-medium">{product.title}</h1>
        <div className="mr-auto w-auto rounded-full bg-blue-600 p-2 text-sm text-white">
          <Price amount={...} currencyCode={...} />
        </div>
      </div>
      <VariantSelector options={product.options} variants={product.variants} />
      {product.descriptionHtml ? (
        <Prose className="mb-6 text-sm" html={product.descriptionHtml} />
      ) : null}
      <AddToCart product={product} />
    </>
  );
}
```

**Rule (confirmed):** the buy-box is **4 stacked elements** in this order:

1. **Title (h1, text-5xl)** + **price pill** (rounded-full, bg-blue-600). The
   price is a *pill/badge*, not inline text. The `mr-auto` keeps it left-aligned
   under the title.
2. **VariantSelector** — size/color options.
3. **Description** (rendered HTML via Prose).
4. **AddToCart** button — the LAST element, at the bottom of the buy-box.

**Rule (confirmed):** the title + price are in a `border-b pb-6` container — a
visual separator between the title block and the rest of the buy-box.

## Observed: variant selector — URL params as state, availability-aware

`components/product/variant-selector.tsx` (106 lines, full). The most
interesting UX pattern:

```tsx
"use client";
export function VariantSelector({ options, variants }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (hasNoOptionsOrJustOneOption) return null;

  const combinations = variants.map(v => ({
    id: v.id, availableForSale: v.availableForSale,
    ...v.selectedOptions.reduce((acc, o) => ({...acc, [o.name.toLowerCase()]: o.value}), {}),
  }));

  const updateOption = (name, value) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return options.map(option => (
    <form>
      <dt>{option.name}</dt>
      <dd>
        {option.values.map(value => {
          const isAvailableForSale = combinations.find(c => /* match */);
          return (
            <button
              formAction={() => updateOption(optionNameLowerCase, value)}
              aria-disabled={!isAvailableForSale}
              disabled={!isAvailableForSale}
              title={`${option.name} ${value}${!isAvailableForSale ? " (Out of Stock)" : ""}`}
              className={clsx(/* active / hover / disabled styles */)}
            >
              {value}
            </button>
          );
        })}
      </dd>
    </form>
  ));
}
```

**Rule (confirmed):** variant state lives in **URL search params**
(`?size=M&color=blue`), NOT React state. Benefits:
- The selected variant is **shareable** (copy the URL).
- The back button works naturally.
- Server components can read the selected variant from the URL on first render.

**Rule (confirmed):** a `combinations` map is precomputed from all variants
upfront. For each option value, the selector checks if any matching variant
is `availableForSale`. Unavailable options are **visible-but-disabled**:
`aria-disabled`, `disabled`, a strike-through CSS pseudo-element, and a title
showing "Out of Stock". The user sees what's OOS rather than having options
silently hidden.

**Rule (confirmed):** the selector returns `null` for simple products (no
options or one option with one value). No empty selector UI.

**Rule (confirmed):** `router.replace` with `{ scroll: false }` — changing
the variant does NOT scroll the page. Important UX detail.

## Observed: the product GraphQL shape (what the UI consumes)

`lib/shopify/fragments/product.ts` + `lib/shopify/types.ts`. The `Product` type
has:
- `id, handle, title, description, descriptionHtml`
- `availableForSale` (bool), `totalInventory`
- `priceRange { minVariantPrice, maxVariantPrice }` (each `{amount, currencyCode}`)
- `featuredImage { url, width, height, altText }`
- `images[]` (gallery)
- `options[]` (variant dimensions like Color, Size)
- `variants[]` (each with `selectedOptions` + `availableForSale` + `price`)
- `tags[]` (string array; `HIDDEN_PRODUCT_TAG` is one of them)
- `seo { title, description }`

**Rule (confirmed):** the UI consumes a product shape with `availableForSale`
(bool) + `priceRange` + `variants`. For our affiliate adaptation, we simplify:
no variants (one ASIN = one buyable thing), no cart, no inventory. Our product
type needs: `asin, title, description, image_url, price_cents, currency,
available (bool), destination_url (the Amazon URL with affiliate tag)`.

## Affiliate adaptation — "Buy on Amazon" CTA

Vercel Commerce's `<AddToCart>` adds to a Shopify cart. For our affiliate
model, we replace it with a `<BuyOnAmazon>` that:

1. Renders the same visual prominence (last element in the buy-box).
2. On click, navigates to `product.destination_url` (the Amazon URL with our
   affiliate tag, built per engagement 03's rule:
   `https://{domain}/dp/{ASIN}?tag={associate_id}`).
3. Uses `target="_blank" rel="nofollow noopener"` (the affiliate link is
   external — `noopener` for security, `nofollow` per Amazon Associates
   Operating Agreement).
4. Records a click event (per engagement 01's Dub rules: bot check, dedup,
   identity hash, EU IP redaction).
5. Shows `available: false` products as a disabled button with "Out of Stock"
   label (mirroring the variant-selector pattern).

**Rule (proposed):** the buy-box for an affiliate product is:

1. Title (h1) + price pill
2. (No variant selector — we have single-variant products)
3. Description (rendered HTML)
4. **`<BuyOnAmazon>` button** — the CTA, last element

## Confidence

- **confirmed** — every claim above is sourced to `file:line` in
  `evidence/excerpts.txt` (445 lines, 6 evidence blocks).
- **likely** — the `Carousel` component (browse row) was not read in full; its
  pattern is *likely* a horizontal scroller of `GridTileImage` components
  (same tile as the hero grid). Not proven.
- **not proven** — whether the archived status of the repo affects any pattern's
  currency. The patterns are standard Next.js App Router; *likely* still current
  even if the repo is archived.

## Engagement 07 consolidated rules for the build

- **Homepage hierarchy:** curated 3-up hero grid → browse carousel → footer.
  Lead with editorial curation, not exhaustive listing.
- **Product detail layout:** 4/6 image gallery + 2/6 buy-box on desktop; stacked
  on mobile. Gallery wrapped in Suspense with aspect-square skeleton. Cap at 5
  images.
- **Buy-box composition:** (1) title + price pill, (2) variant selector if
  applicable, (3) description, (4) CTA button. Title+price in a border-b
  container.
- **Variant selector:** URL search params as state (shareable, back-button
  works). Precompute combinations map. Unavailable options visible-but-disabled
  with strike-through + "Out of Stock" title. Return null for simple products.
  `router.replace` with `{ scroll: false }`.
- **SEO metadata:** `generateMetadata` async function with fallbacks
  (`seo.title || title`). Tag-based visibility (`HIDDEN_PRODUCT_TAG`).
  OpenGraph image with explicit width/height/alt.
- **JSON-LD structured data:** `schema.org/Product` with `AggregateOffer`
  (`availability: InStock|OutOfStock`, `lowPrice`, `highPrice`,
  `priceCurrency`). Emitted as a `<script type="application/ld+json">`.
- **Affiliate CTA:** `<BuyOnAmazon>` replaces `<AddToCart>`. External
  `target="_blank" rel="nofollow noopener"`. Records a click event per
  engagement 01's Dub rules. Disabled state mirrors variant-selector's
  "Out of Stock" pattern.
