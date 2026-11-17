# FM-21 — Testing (dead-link detection)

**Task:** FM-21 | **Verify behavior, not UI.**

## What behavior to verify

1. Does the HEAD probe mark a 404/410 product dead (daily, batched)?
2. Does a dead product's CTA grey out + record no click?
3. Does the redirect-time 4xx signal flag high-4xx products?
4. Does the Creators API availability signal work when enabled?
5. Does detection run with the API disabled (HEAD probe + 4xx only)?
6. Is the HEAD probe throttled (not flooding Amazon)?
7. Does a product that comes back in stock un-mark dead?

## How to verify (behavioral)

- **HEAD probe dead:** seed a product with an ASIN whose `/dp/{ASIN}` returns 404 (or mock it); run the probe job → the product is marked dead; its storefront CTA is greyed + "Out of stock"; tapping it records no click.
- **4xx reactive:** simulate a high 4xx rate from outbound clicks on a product → the product is flagged for review (dead-link signal).
- **API availability:** with the Creators API enabled + eligible, a product with `Availability.Type=OutOfStock` (or empty offers) → marked soft-dead.
- **API disabled:** with the Creators API off, the HEAD probe + 4xx signal still run + still mark products dead.
- **Throttling:** inspect the probe job's request rate → it does not exceed a sane batch/throttle (no flood); Amazon does not block the probe IP.
- **Recovery:** a dead product whose next HEAD probe returns 200 (back in stock) → un-marked dead; the CTA re-activates.

## What "working" means

- Dead products are detected by multiple signals.
- The CTA greys out before a visitor is sent to a dead page.
- Detection works without the API.
- The probe is polite (throttled).
- Recovery is automatic.

## What to report

- Whether the 404-ASIN product was marked dead + its CTA greyed.
- Whether the 4xx-rate signal flagged the product.
- The API availability signal behavior (when enabled).
- Whether detection ran with the API off.
- The probe's actual request rate vs the throttle limit.
- Whether the recovered product's CTA re-activated.
