# FM-03 — Testing (product page)

**Task:** FM-03 | **Verify behavior, not UI.**

## What behavior to verify

1. Does the 3-condition publish gate work (active + not deleted + available_on ≤ now)?
2. Do draft/archived/deleted/future/unpublished/missing products all return a plain 404?
3. Is the view recorded server-side with the right source + visitor_hash, and are bots skipped?
4. Is there any price or currency anywhere on the page?
5. Does `generateMetadata` produce correct title/description/OG (with w/h/alt)?
6. Is JSON-LD `Product` + `AggregateOffer` present, with availability flipping?
7. Is the CTA a link to `/go/[id]` (not a `window.open`)?

## How to verify (behavioral)

- **Publish gate:** create products in each state (draft, active, archived, soft-deleted, future-available_on, missing-slug). Request each → only `active` returns 200; all others return 404.
- **View recording:** open an active product with `?utm_source=instagram` → one row appears in `analytics` with `source='instagram'` + a non-null `visitor_hash`. Open with a known-bot UA → no row appears.
- **No price:** scrape the rendered HTML → grep for `$`, `USD`, `price`, `currency` → expect none.
- **Metadata:** inspect `<head>` → title, description, OG image URL with explicit width/height/alt. Confirm `seo.title || title` fallback (a product with no `seo.title` uses the product `title`).
- **JSON-LD:** find the `application/ld+json` script → `@type: Product`, `offers.@type: AggregateOffer`, `availability` is `InStock` or `OutOfStock` matching `availableForSale`.
- **CTA:** inspect the SHOP PRODUCT button → it is an `<a href="/go/...">` (or a form posting to `/go`), not an `onclick` calling `window.open`.
- **Tag-based visibility:** a product with `HIDDEN_PRODUCT_TAG` → `robots: noindex, nofollow` in metadata.

## What "working" means

- Only published products are visible; everything else 404s.
- The view is recorded honestly (bots skipped, source captured, hash not raw IP).
- No price leaks.
- Google can index the page (metadata + JSON-LD present and correct).
- The CTA is an in-app-browser-safe link, not a pop-up.

## What to report

- The HTTP status for each product-state probe (must be 200 only for active).
- Whether the view row appeared with the right source + hash, and whether the bot was skipped.
- Any price/currency string found in the HTML.
- The actual metadata values for a sample product.
- The JSON-LD structure and the availability value.
- The CTA element type + href.
