# Sample — Amazon Auto Links

## Identity

| Field | Value |
|---|---|
| Name | Auto Amazon Links (formerly Amazon Auto Links) |
| Type | WordPress plugin source tree (PHP) |
| Version / commit | `1fb1fb89b36377a073d123b44575972b683d36b6` (2024-10-02), plugin version 5.4.3 |
| Provenance | `git clone --depth 1 https://github.com/michaeluno/amazon-auto-links.git` on 2026-11-16 |
| Licence | **GPL v2 or later** — `const LICENSE = 'GPL v2 or later'` in plugin header; `readme.txt` confirms |
| Size | 37 MB |
| File count | 1,723 (excluding `.git/`) |

## Provenance handling

Shallow clone of the official `michaeluno/amazon-auto-links` repository on GitHub.
No fork, no mirror. Working tree read-only.

## Layout (key directories)

```
amazon-auto-links/
  amazon-auto-links.php              plugin entry + header (NAME, VERSION, LICENSE)
  include/
    core/
      _common/utility/
        locale/                      THE MARKETPLACE HOST MAP (22 concrete locale classes)
          _abstract/Locale_Base.php  abstract: URL construction rules per marketplace
          Locale_US.php              sDomain='www.amazon.com', sLocaleNumber='01'
          Locale_UK.php              sDomain='www.amazon.co.uk', sLocaleNumber='02'
          Locale_DE.php              sDomain='www.amazon.de'
          Locale_JP.php              sDomain='www.amazon.co.jp'
          ... (22 total: AE AU BE BR CA CN DE EG ES FR IN IT JP MX NL PL SA SE SG TR UK US)
          Locale.php                 dispatcher: getMarketPlaceURL(), getCustomerReviewURL(), etc.
        database/                    aal_products table schema (asin, locale, expiration_time, error, ...)
        interpreter/paapi/           PAAPI5.0 payload + response parsing
      component/
        button/event/filter/          product URL builder + associate_id injection
        unit/event/filter/            the 'aal_filter_product_link' hook → 6 link styles
        geotargeting/event/ajax/      GeolocationResolver (DEPRECATED — returns empty)
  readme.txt                          plugin metadata, GPL-2.0 licence
```

## Lab status

Not applicable. Mode A, static-only. No lab named, none required.

## Handling rule

Treat as read-only reference under GPL-2.0. **No verbatim code transplant** — GPL-2.0
viral copyleft would force our entire app GPL-2.0. Re-implement rules in fresh
TypeScript. Excerpts in `evidence/` are for understanding only.

## Open triage questions for static analysis

1. **Marketplace host map** — what fields does each locale define? (slug, domain,
   locale number, associates URL, country code.)
2. **ASIN → URL rule** — `/dp/{ASIN}` or `/gp/product/{ASIN}` or `/exec/obidos/ASIN/{ASIN}`?
3. **Associate tag injection** — `?tag=`, path segment, or both? How many link styles?
4. **Product schema** — what columns? Is there an `expiration_time`? An `error` column?
5. **Geo-routing** — is there a visitor-IP → marketplace router?
6. **Dead-link detection** — PAAPI `availability` field? Scheduled probe? Re-fetch on click?
