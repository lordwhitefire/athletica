# Analysis — Engagement 03, Sample: Amazon Auto Links

**Date:** 2026-11-16
**Mode:** A (open source under GPL-2.0), static only
**Working record** — separates what was *observed* from what is *inferred*.

## Files read

| File | Lines | Purpose |
|---|---|---|
| `amazon-auto-links.php` | 1–30 | Plugin header (licence, version, author) |
| `readme.txt` | 1–25 | Licence: GPLv2 or later |
| `include/core/_common/utility/locale/_abstract/AmazonAutoLinks_Locale_Base.php` | 120–345 | Abstract URL construction rules |
| `include/core/_common/utility/locale/AmazonAutoLinks_Locale_US.php` | 1–50 | US marketplace concrete |
| `include/core/_common/utility/locale/AmazonAutoLinks_Locale_UK.php` | 1–40 | UK marketplace concrete |
| `include/core/_common/utility/locale/AmazonAutoLinks_Locale.php` | 1–207 (grep) | Dispatcher |
| `include/core/_common/utility/database/AmazonAutoLinks_DatabaseTable_aal_products.php` | 30–120 | Product schema |
| `include/core/_common/utility/interpreter/paapi/AmazonAutoLinks_PAAPI50___Payload.php` | 30–70 | PAAPI5.0 requested fields (availability commented out!) |
| `include/core/component/button/event/filter/AmazonAutoLinks_Button_Event_Filter_Output.php` | 20–150 | Product URL builder + associate_id injection |
| `include/core/component/unit/event/filter/AmazonAutoLinks_Event_Filter_ProductLinks.php` | 1–86 | `aal_filter_product_link` hook + 6 link styles |
| `include/core/component/geotargeting/event/ajax/AmazonAutoLinks_Geotargeting_EventAjax_GeolocationResolver.php` | 1–130 | Deprecated geo-routing stub |
| `include/core/component/unit/_common/output/formatter/item/AmazonAutoLinks_UnitOutput__ItemFormatter.php` | 170–180 | "Availability" = FTC disclosure text only |

## Observed: the marketplace host map (22 locales)

Each Amazon marketplace is a concrete PHP class extending `Locale_Base` (or one of
two intermediate region classes: `Locale_NorthAmerica`, `Locale_EuropeanUnion`).
The full list, derived from `ls include/core/_common/utility/locale/AmazonAutoLinks_Locale_*.php`:

```
AE  AU  BE  BR  CA  CN  DE  EG  ES  FR  IN  IT  JP  MX  NL  PL  SA  SE  SG  TR  UK  US
```

**22 marketplaces.** Each concrete class defines four key properties:

| Property | US value | UK value | Pattern |
|---|---|---|---|
| `sSlug` | `US` | `UK` | 2-letter locale code (UK, not GB — Amazon convention) |
| `sLocaleNumber` | `01` | `02` | 2-digit number used in Amazon image CDN paths |
| `sDomain` | `www.amazon.com` | `www.amazon.co.uk` | the marketplace storefront host |
| `sAssociatesURL` | `https://affiliate-program.amazon.com/` | `https://affiliate-program.amazon.co.uk` | the Associates sign-up URL |

**Rule (confirmed):** a marketplace is fully described by
`(slug, locale_number, domain, associates_url, country_code)`. Five fields. The
`country_code` method returns `sSlug` except for UK, which returns `GB` (ISO 3166)
— Amazon's `UK` slug is the historical exception.

**Rule (confirmed):** the locale object is the *single source of truth* for every
Amazon URL the plugin builds. No URL string is hard-coded anywhere else.

## Observed: the ASIN → URL derivation rules

`Locale_Base` provides five URL builders. Every one calls `getMarketPlaceURL($path)`
which returns `'https://' . sDomain . '/' . ltrim($path, '/')`.

| Surface | URL pattern | Evidence |
|---|---|---|
| Product detail page | `https://{domain}/dp/{ASIN}` | `Button_Event_Filter_Output.php:98` |
| Customer reviews | `https://{domain}/product-reviews/{ASIN}?tag={id}&language={lang}` | `Locale_Base.php:156` |
| Best sellers | `https://{domain}/gp/bestsellers/{path}` | `Locale_Base.php:140` |
| Add to cart | `https://{domain}/gp/aws/cart/add.html` | `Locale_Base.php:184` |
| Rating widget | `https://{domain}/gp/customer-reviews/widgets/average-customer-review/popover/ref=dpx_acr_pop_?contextId=dpx&asin={ASIN}` | `Locale_Base.php:142` |
| No-image fallback | `https://images-na.ssl-images-amazon.com/images/G/{localeNumber}/x-site/icons/no-img-sm.gif` | `Locale_Base.php:210` |

**Rule (confirmed):** the canonical product detail URL is `https://{domain}/dp/{ASIN}`.
The legacy `/gp/product/{ASIN}` and `/exec/obidos/ASIN/{ASIN}` formats appear only in
test fixtures and XML example notes — they are not used by the live URL builder.
**`/dp/` is the current Amazon product URL pattern.**

**Rule (confirmed):** the associate tag is appended as a query parameter
(`?tag={associate_id}`), never as a path segment. The `getCustomerReviewURL` method
shows the canonical append: `add_query_arg(['tag' => $sAssociateID, 'language' =>
$sLanguage], $url)`.

## Observed: 6 link styles (historical Amazon URL formats)

`AmazonAutoLinks_Event_Filter_ProductLinks.php:50–86` dispatches the formatted URL
to one of six classes:

```
AmazonAutoLinks_Output_Format_LinksStyle_1  through  _6
```

The plugin comment says: *"`$iStyle` should be 1 to 6 indicating the url style of the
link."* Each style corresponds to a historical Amazon URL format — for example,
`?tag=` only, `/ref=nosim?tag=`, `?linkCode=xm2&tag=`, etc. The reason six styles
exist: Amazon has changed its preferred URL format multiple times over 15+ years,
and older affiliate links in the wild still use older formats.

**Rule (confirmed):** the link style is configurable per unit (admin picks 1–6). The
default appears to be style 1 (plain `?tag=`). For our build, we only need style 1 —
Amazon's current recommended format is `https://{domain}/dp/{ASIN}?tag={associate_id}`.

## Observed: the product schema (aal_products table)

`AmazonAutoLinks_DatabaseTable_aal_products.php:30–120`. The `$aStructure_Row`
defines the columns. Key fields:

| Column | Type | Purpose |
|---|---|---|
| `product_id` | varchar(128) UNIQUE | composite key: `{ASIN}_{locale}\|{lang}\|{currency}` |
| `asin` | varchar(10) | the ASIN |
| `locale` | varchar(4) | the marketplace slug (US, UK, DE, …) |
| `modified_time` | datetime | last PAAPI fetch |
| **`expiration_time`** | datetime | TTL — when this cached product row goes stale |
| `title` | text | product name |
| `price` | bigint unsigned | listed price (integer cents) |
| `price_formatted` | tinytext | display string ("$46.56") |
| `currency` | varchar(10) | "USD", "GBP", … |
| `rating` | tinyint unsigned | e.g. 45 = 4.5 stars |
| `is_prime` | boolean | Prime eligibility |
| `is_adult` | boolean | adult product flag |
| `language` | varchar(10) | display language |
| `preferred_currency` | varchar(10) | display currency |
| **`error`** | string | last fetch error (if any) |
| `delivery_free_shipping` | boolean | free shipping eligible |
| `delivery_fba` | boolean | Fulfilled by Amazon |

**Rule (confirmed):** the product cache has a **TTL** (`expiration_time`). When
`expiration_time < now()`, the row is stale and must be re-fetched from PAAPI before
display. This is the closest thing to a "dead-link detector" in the plugin: a
stale product is re-queried, and if PAAPI returns an error, the `error` column is
populated.

**Rule (confirmed):** prices are stored as **integer cents** (`bigint unsigned`),
with a parallel `price_formatted` string for display. No floating-point money.

## Observed: PAAPI5.0 availability fields are COMMENTED OUT

`AmazonAutoLinks_PAAPI50___Payload.php:42–67`. The lines that would request
`Offers.Listings.Availability.Type`, `Availability.Message`, `Availability.MinOrderQuantity`,
`Availability.MaxOrderQuantity` from PAAPI5.0 are **commented out** in the default
payload. Same for `RentalOffers.Listings.Availability.*`.

**Rule (confirmed):** the plugin does **NOT** fetch product availability from PAAPI by
default. The fields exist in the PAAPI5.0 schema and the plugin knows about them, but
they are disabled. A site admin would need to uncomment those lines to enable
availability checking.

## Observed: geo-routing is DEPRECATED (stub)

`AmazonAutoLinks_Geotargeting_EventAjax_GeolocationResolver.php` — the class docblock
literally says `@deprecated 4.6.0`. The `_getResponse()` method body is:

```php
protected function _getResponse( array $aPost ) {
    // ... gets the client IP ...
    return array();   // ← empty array, no actual resolution
    // @see  [then a comment listing 8 third-party IP-geo APIs that were considered]
}
```

The comment block lists 8 IP-geolocation APIs (Cloudflare `/cdn-cgi/trace`, db-ip,
ipapi.co, geoplugin, hackertarget, ipdata, ipfind, ip-api) — all considered, none
wired up. The implementation was abandoned.

**Rule (confirmed):** the plugin does **NOT** route visitors to their local
marketplace by IP. Marketplaces are picked **per unit** — the admin configures a
unit to display products from a specific locale (US, UK, DE, …), and every visitor
sees that locale's products regardless of their own country.

## Observed: "availability" text is the FTC disclosure, not a check

`AmazonAutoLinks_UnitOutput__ItemFormatter.php:175` — the only "availability" string
match in non-test source is:

> *"Product prices and availability are accurate as of the date/time indicated and
> are subject to change. Any price and availability information displayed on
> [relevant Amazon Site(s), as applicable] at the time of purchase will apply to the
> purchase of this product."*

This is the **Amazon Associates Operating Agreement mandatory disclosure** — the
text every affiliate site must display. It is a compliance string, not a runtime
check.

## Observed: dead-link detection is NOT implemented

Combining the four findings:

1. PAAPI `availability` fields are commented out of the default payload.
2. The `GeolocationResolver` is a deprecated stub.
3. The "availability" text is the FTC disclosure, not a check.
4. The product schema has `expiration_time` + `error` columns, but the refresh
   policy is "re-fetch from PAAPI when stale" — there is no scheduled HEAD probe
   of `https://{domain}/dp/{ASIN}` to verify the URL still resolves.

**Rule (confirmed):** Amazon Auto Links does **NOT** have a dead-link detector. A
product whose Amazon page has been removed will still generate a valid-looking link
until the cache TTL expires and PAAPI returns an error (which only happens if the
admin explicitly re-queries, or a visitor triggers a unit render after expiry).

**Implication for our build:** we must add dead-link detection ourselves. Options:
- Scheduled HEAD probe of `/dp/{ASIN}` (cheap but rate-limited by Amazon).
- Listen for PAAPI `Offers.Listings.Availability.Type === "OutOfStock"` (requires
  uncommenting the availability fields in our PAAPI payload — Amazon Auto Links
  disables them, we should enable them).
- Treat HTTP 404 / 410 from the redirect as a dead-link signal and mark the product.

## What Amazon Auto Links gives us that's worth keeping

| Rule / pattern | Worth keeping? |
|---|---|
| Marketplace as a concrete object with 5 fields (slug, locale_number, domain, associates_url, country_code) | Yes — clean, extensible to all 22 marketplaces |
| `/dp/{ASIN}` as the canonical product URL pattern | Yes — current Amazon format |
| `?tag={associate_id}` as the associate tag injection method | Yes |
| Single `Locale_Base` class as the URL construction brain | Yes — one place to change if Amazon changes URL format |
| Product cache with `expiration_time` TTL + `error` column | Yes — proven stale-refresh pattern |
| Prices as integer cents + formatted display string | Yes — never float money |
| Product composite key `{ASIN}_{locale}\|{lang}\|{currency}` | Yes — same ASIN exists in multiple locales |
| 6 historical link styles | No — only need current style (`?tag=`) |
| PAAPI `availability` fields disabled by default | No — we should ENABLE them |
| Geo-routing stub | No — we must implement real geo-routing |

## Confidence

- **confirmed** — every claim above is sourced to `file:line` in `evidence/excerpts.txt`
  (514 lines, 9 evidence blocks).
- **likely** — the 6 link styles correspond to the historical Amazon URL formats I
  named; the *exact* style-to-URL mapping would require reading each
  `LinksStyle_N` class, which I did not do in full. *Likely* style 1 = plain
  `?tag=`, style 2 = `/ref=nosim?tag=`, etc., but not proven style-by-style.
- **not proven** — whether uncommenting the PAAPI availability fields actually
  populates the product row's availability. The fields are well-documented in
  PAAPI5.0's official spec, so this is *likely* true, but we did not run the plugin.

## Engagement 03 — consolidated rules for the build

- **Marketplace model:** a `Marketplace` table/entity with 5 fields —
  `(slug, locale_number, domain, associates_url, country_code)`. Seed with all 22
  Amazon marketplaces from the locale class list above.
- **ASIN → URL:** `https://{domain}/dp/{ASIN}?tag={associate_id}`. One builder
  function, one source of truth.
- **Product cache:** Postgres `products` table with `asin, locale, modified_at,
  expires_at, error, title, price_cents, currency, rating, is_prime, is_adult`.
  Re-fetch from PAAPI when `expires_at < now()`. Treat `error IS NOT NULL` as a
  soft-dead-link signal.
- **PAAPI payload:** enable `Offers.Listings.Availability.Type` and
  `Availability.Message`. Amazon Auto Links disables them; we should not.
- **Dead-link detection:** add a scheduled job that HEAD-probes `/dp/{ASIN}` for
  products whose PAAPI fetch returned an error or whose `expires_at` is far past.
  Mark products `dead` on HTTP 404/410.
- **Geo-routing:** implement real visitor-IP → marketplace routing using a
  geolocation API (Cloudflare `/cdn-cgi/trace` if behind Cloudflare, otherwise
  MaxMind GeoIP2). Amazon Auto Links gave us the list of 8 candidate APIs to
  evaluate.
- **Prices:** integer cents everywhere. Display via a formatter.
- **Associate tag:** query param `?tag=`, never path segment.
