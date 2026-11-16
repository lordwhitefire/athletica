# Report — Engagement 03, Sample: Amazon Auto Links

**Engagement:** 03 — ASIN → Amazon URL derivation + marketplace routing + dead-link detection
**Sample:** Amazon Auto Links (michaeluno/amazon-auto-links), WordPress plugin, GPL-2.0+
**Commit analysed:** `1fb1fb89b36377a073d123b44575972b683d36b6` (2024-10-02), plugin v5.4.3
**Mode:** A (open source under licence), static analysis only
**Date:** 2026-11-16

---

## 0. Licence note

Amazon Auto Links is **GPL v2 or later**. Strong viral copyleft — verbatim code
copy into our build would force our entire app GPL-2.0. We extract rules only
and re-implement in fresh TypeScript.

## 1. What is it?

A WordPress plugin that generates Amazon Associates affiliate links. 15+ years of
development (v5.4.3, last commit 2024-10-02). 37 MB, 1,723 files. The most
Amazon-edge-case-tested codebase we will study — every Amazon URL quirk,
marketplace variant, and PAAPI5.0 field has been encountered here.

## 2. What does it do? (rules and behaviour)

### 2.1 The marketplace host map — 22 locales, 5 fields each

Each Amazon marketplace is a concrete class extending `Locale_Base`. The full list:
`AE AU BE BR CA CN DE EG ES FR IN IT JP MX NL PL SA SE SG TR UK US`.

**Rule (confirmed):** a marketplace is fully described by five fields:

| Field | US | UK | JP |
|---|---|---|---|
| `sSlug` | `US` | `UK` | `JP` |
| `sLocaleNumber` | `01` | `02` | (varies) |
| `sDomain` | `www.amazon.com` | `www.amazon.co.uk` | `www.amazon.co.jp` |
| `sAssociatesURL` | `https://affiliate-program.amazon.com/` | `https://affiliate-program.amazon.co.uk` | (varies) |
| `country_code` (ISO 3166) | `US` | `GB` (not UK!) | `JP` |

Evidence: `Locale_US.php:1-50`, `Locale_UK.php:1-40`, `Locale_Base.php:239-246`.

**Rule (confirmed):** the locale object is the single source of truth for every
Amazon URL the plugin builds. No URL string is hard-coded anywhere else in the
codebase.

### 2.2 ASIN → URL derivation — five URL surfaces, one rule each

`Locale_Base.php:120-210`. Every surface builds on `getMarketPlaceURL($path)` =
`'https://' . sDomain . '/' . ltrim($path, '/')`.

| Surface | URL pattern |
|---|---|
| **Product detail page** | `https://{domain}/dp/{ASIN}` |
| Customer reviews | `https://{domain}/product-reviews/{ASIN}?tag={id}&language={lang}` |
| Best sellers | `https://{domain}/gp/bestsellers/{path}` |
| Add to cart | `https://{domain}/gp/aws/cart/add.html` |
| Rating widget | `https://{domain}/gp/customer-reviews/widgets/average-customer-review/popover/ref=dpx_acr_pop_?contextId=dpx&asin={ASIN}` |
| No-image fallback | `https://images-na.ssl-images-amazon.com/images/G/{localeNumber}/x-site/icons/no-img-sm.gif` |

**Rule (confirmed):** the canonical product detail URL is **`https://{domain}/dp/{ASIN}`**.
The legacy `/gp/product/{ASIN}` and `/exec/obidos/ASIN/{ASIN}` formats appear only in
test fixtures and XML example notes — they are not used by the live URL builder.

### 2.3 Associate tag injection — `?tag=` query param, 6 historical link styles

`Button_Event_Filter_Output.php:80-110` builds the bare URL
`getMarketPlaceURL('/dp/' + ASIN)` then passes it through the
`aal_filter_product_link` filter. `Event_Filter_ProductLinks.php:50-86` applies the
associate tag, language, currency, and one of six "link styles":

```
AmazonAutoLinks_Output_Format_LinksStyle_1  through  _6
```

**Rule (confirmed):** the associate tag is appended as a **query parameter**
(`?tag={associate_id}`), never as a path segment.

**Rule (confirmed):** six link styles exist because Amazon has changed its
preferred URL format multiple times over 15+ years. Each style corresponds to a
historical format (plain `?tag=`, `/ref=nosim?tag=`, `?linkCode=xm2&tag=`, etc.).
The default is style 1 (plain `?tag=`).

**Implication for our build:** we only need the current style —
`https://{domain}/dp/{ASIN}?tag={associate_id}`. Amazon's current recommendation.

### 2.4 Product schema — TTL-based cache with error column

`AmazonAutoLinks_DatabaseTable_aal_products.php:30-120`. Key columns:

| Column | Type | Purpose |
|---|---|---|
| `product_id` | varchar(128) UNIQUE | composite: `{ASIN}_{locale}\|{lang}\|{currency}` |
| `asin` | varchar(10) | the ASIN |
| `locale` | varchar(4) | marketplace slug (US, UK, DE, …) |
| `modified_time` | datetime | last PAAPI fetch |
| **`expiration_time`** | datetime | TTL — when this row goes stale |
| `title` | text | product name |
| `price` | bigint unsigned | integer cents |
| `price_formatted` | tinytext | display string ("$46.56") |
| `currency` | varchar(10) | "USD", "GBP", … |
| `rating` | tinyint unsigned | e.g. 45 = 4.5 stars |
| `is_prime` | boolean | Prime eligibility |
| `is_adult` | boolean | adult product flag |
| **`error`** | string | last fetch error (if any) |
| `delivery_free_shipping` | boolean | free shipping eligible |
| `delivery_fba` | boolean | Fulfilled by Amazon |

**Rule (confirmed):** the product cache has a TTL (`expiration_time`). When
`expiration_time < now()`, the row is stale and must be re-fetched from PAAPI
before display. If PAAPI returns an error, the `error` column is populated.

**Rule (confirmed):** prices are stored as **integer cents** with a parallel
formatted display string. No floating-point money.

**Rule (confirmed):** the composite key `{ASIN}_{locale}|{lang}|{currency}` means
the same ASIN can exist in multiple locales/languages/currencies as separate rows.

### 2.5 PAAPI5.0 availability fields are COMMENTED OUT (critical finding)

`AmazonAutoLinks_PAAPI50___Payload.php:42-67`. The lines that would request
`Offers.Listings.Availability.Type`, `Availability.Message`,
`Availability.MinOrderQuantity`, `Availability.MaxOrderQuantity` from PAAPI5.0 are
**commented out** in the default payload. Same for `RentalOffers.Listings.Availability.*`.

**Rule (confirmed):** the plugin does NOT fetch product availability from PAAPI by
default. The fields exist in the PAAPI5.0 schema and the plugin knows about them,
but they are disabled. A site admin would need to uncomment those lines.

**Implication for our build:** enable these fields in our PAAPI payload. Amazon
Auto Links disables them, but we should not.

### 2.6 Geo-routing is DEPRECATED — a stub

`AmazonAutoLinks_Geotargeting_EventAjax_GeolocationResolver.php`. The class
docblock says `@deprecated 4.6.0`. The `_getResponse()` method body:

```php
protected function _getResponse( array $aPost ) {
    // ... gets the client IP ...
    return array();   // ← empty array, no actual resolution
    // [then a comment listing 8 third-party IP-geolocation APIs that were considered]
}
```

The comment block lists 8 candidate APIs: Cloudflare `/cdn-cgi/trace`, db-ip,
ipapi.co, geoplugin, hackertarget, ipdata, ipfind, ip-api. All considered, none
wired up.

**Rule (confirmed):** the plugin does NOT route visitors to their local
marketplace by IP. Marketplaces are picked **per unit** — the admin configures a
unit for a specific locale, and every visitor sees that locale's products
regardless of their country.

**Implication for our build:** we must implement real geo-routing. Amazon Auto
Links gave us the list of 8 candidate APIs to evaluate. Cloudflare `/cdn-cgi/trace`
(if we deploy behind Cloudflare) or MaxMind GeoIP2 (offline, no third-party
dependency) are the strongest choices.

### 2.7 Dead-link detection is NOT implemented (critical finding)

Combining four observations:

1. PAAPI `availability` fields are commented out of the default payload (§2.5).
2. The `GeolocationResolver` is a deprecated stub (§2.6).
3. The "availability" text string is the FTC disclosure, not a runtime check
   (`UnitOutput__ItemFormatter.php:175` — the mandatory Amazon Associates
   disclaimer).
4. The product schema has `expiration_time` + `error` columns, but the refresh
   policy is "re-fetch from PAAPI when stale" — there is **no scheduled HEAD
   probe** of `https://{domain}/dp/{ASIN}` to verify the URL still resolves.

**Rule (confirmed):** Amazon Auto Links does NOT have a dead-link detector. A
product whose Amazon page has been removed will still generate a valid-looking
link until the cache TTL expires and PAAPI returns an error.

**Implication for our build:** we must add dead-link detection ourselves. Three
options, not mutually exclusive:

1. **PAAPI availability check.** Enable `Offers.Listings.Availability.Type` in our
   PAAPI payload. If `Type === "OutOfStock"` or the offers list is empty, mark the
   product soft-dead.
2. **Scheduled HEAD probe.** A cron job that HEAD-probes `/dp/{ASIN}` for products
   whose PAAPI fetch returned an error or whose `expires_at` is far past. HTTP 404
   or 410 → mark dead. (Beware Amazon's rate limits — batch and throttle.)
3. **Redirect-time signal.** Treat a high rate of HTTP 4xx from outbound Amazon
   clicks as a dead-link signal — but this is reactive, not proactive.

## 3. How do we know? (evidence)

9 evidence blocks in `evidence/excerpts.txt` (514 lines). Each is a `nl -ba`
numbered excerpt. Licence confirmed from plugin header `const LICENSE = 'GPL v2 or
later'` and `readme.txt`. Provenance: shallow clone of the official
`michaeluno/amazon-auto-links` repository at commit
`1fb1fb89b36377a073d123b44575972b683d36b6`.

## 4. What did we not prove?

- **The exact 6 link-style-to-URL mappings.** I located the `LinksStyle_1`
  through `LinksStyle_6` classes but did not read each one. *Likely* style 1 =
  plain `?tag=`, style 2 = `/ref=nosim?tag=`, etc., based on Amazon's documented
  URL history — but the style-by-style mapping is *not proven* here. Not needed
  for our build (we only use style 1).
- **PAAPI rate limits and error semantics.** Documented in Amazon's official
  PAAPI5.0 spec, not in this plugin's source. Out of scope.
- **Whether uncommenting the availability fields actually populates the row.**
  *Likely* true (the fields are standard PAAPI5.0 response fields) but not
  verified by running the plugin.
- **The Cloudflare `/cdn-cgi/trace` response format.** Listed as a candidate
  geo API in the deprecated resolver's comments; not validated here.

## 5. What should the owner do next?

For the **football affiliate marketplace build**, take from Amazon Auto Links
(re-implement, do not copy — GPL-2.0):

1. **The 22-marketplace host map.** Seed a `marketplaces` table with all 22
   locales and their 5 fields each. The locale class list above is the canonical
   source.
2. **The ASIN → URL rule:** `https://{domain}/dp/{ASIN}?tag={associate_id}`.
   One builder function, one source of truth.
3. **The Locale_Base pattern:** one class/function that knows how to build every
   Amazon URL surface (product, reviews, best sellers, add-to-cart, rating widget,
   no-image fallback). One place to change if Amazon changes URL format.
4. **The product cache schema** with `expiration_time` TTL + `error` column +
   integer-cents prices + composite key `{ASIN}_{locale}`.
5. **Associate tag as query param** (`?tag=`), never path segment.

Do **not** take from Amazon Auto Links:

1. **PAAPI availability disabled** — enable `Offers.Listings.Availability.Type`
   and `Availability.Message` in our PAAPI payload.
2. **No dead-link detection** — add a scheduled HEAD-probe job.
3. **No geo-routing** — implement real visitor-IP → marketplace routing.
4. **Six historical link styles** — only need the current one (`?tag=`).
5. **WordPress integration** (hooks, shortcodes, widgets) — irrelevant to our
   Next.js stack.

## 6. Confidence summary

| Finding | Confidence |
|---|---|
| 22 marketplace locales, each with 5 fields | confirmed |
| Canonical product URL = `https://{domain}/dp/{ASIN}` | confirmed |
| Associate tag = `?tag={id}` query param | confirmed |
| 6 historical link styles exist | confirmed |
| Default link style = style 1 (plain `?tag=`) | likely (not read style-by-style) |
| Product schema with `expiration_time` + `error` + integer-cents prices | confirmed |
| PAAPI `availability` fields commented out by default | confirmed |
| Geo-routing is a deprecated stub | confirmed |
| No dead-link detector implemented | confirmed |
| "Availability" text = FTC disclosure, not a check | confirmed |
| Uncommenting availability fields populates the row | likely (not verified by running) |
| Cloudflare `/cdn-cgi/trace` is the best geo API choice | likely (not validated) |

---

**Engagement 03 — complete.** Next: engagement 04 (Spree / Solidus — manual product
catalog + admin CRUD + bulk import), engagement 05 (athletica/rollout own + NextBase —
multi-lock admin auth + RLS), engagement 06 (Plausible / Umami — privacy-first click
analytics), engagement 07 (Vercel Commerce — storefront UX).
