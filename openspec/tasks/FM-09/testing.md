# FM-09 — Testing (SEO suite)

**Task:** FM-09 | **Verify behavior, not UI.**

## What behavior to verify

1. Does every public page emit `generateMetadata` with fallbacks?
2. Do OG images have explicit width/height/alt?
3. Does `HIDDEN_PRODUCT_TAG` produce `noindex`?
4. Does `/sitemap.xml` list the right pages (and exclude hidden/draft/archived)?
5. Does `/robots.txt` reference the sitemap?
6. Is the root metadata "Athletica" (not "Create Next App")?
7. Is JSON-LD present on product + collection pages?

## How to verify (behavioral)

- **Metadata fallback:** a product with no `seo.title` → the page `<title>` is the product `title`. A product with `seo.title` → the `<title>` is `seo.title`.
- **OG dimensions:** inspect `<head>` on `/`, `/shop`, `/product/[slug]` → OG image has `width`, `height`, `alt` attributes (not just a URL).
- **Tag visibility:** a product tagged `HIDDEN_PRODUCT_TAG` → `robots` meta is `noindex, nofollow` (and `googleBot: noindex, nofollow`). A product without the tag → `index, follow`.
- **Sitemap:** fetch `/sitemap.xml` → it lists `/`, `/shop`, category pages, and active non-hidden products. Draft/archived/hidden products are **absent**.
- **Robots:** fetch `/robots.txt` → it references the sitemap URL.
- **Root metadata:** inspect `layout.tsx` output → "Athletica", not "Create Next App".
- **JSON-LD:** product page → `Product` + `AggregateOffer`. `/shop` → `CollectionPage` or `ItemList`. Homepage → appropriate structured data.

## What "working" means

- Link previews work (OG dimensions present).
- Hidden products are hidden from Google.
- The sitemap is honest (no stale/draft entries).
- The site is indexable where it should be.

## What to report

- The `<title>` for a product with vs without `seo.title`.
- The OG image attributes on each public page.
- The `robots` meta for a hidden vs visible product.
- The sitemap contents (which URLs, which excluded).
- The `robots.txt` content.
- The root metadata string.
- The JSON-LD types on product + collection pages.
