# FM-08 — Testing (product detail with variants + reviews)

**Task:** FM-08 | **Verify behavior, not UI.**

## What behavior to verify

1. Does the variant selector use URL params + not scroll on change?
2. Are OOS variants visible-but-disabled?
3. Does a single-variant product render no selector?
4. Do reviews show when the Creators API is on + returns data?
5. Is the reviews block omitted (not broken, not faked) when the API is off / ineligible / empty?
6. Does JSON-LD `AggregateOffer` include the rating when reviews exist?

## How to verify (behavioral)

- **Multi-variant:** open a product with 3 variants → selector renders. Select "size M, color blue" → URL becomes `?size=M&color=blue`; page does not scroll; the selected variant's details update.
- **Single-variant:** open a product with 1 variant → no selector renders (no empty dropdown).
- **OOS option:** a variant that is out of stock → its option is present but `disabled` + `aria-disabled` + strike-through + "Out of Stock" title.
- **Reviews on (API eligible):** with the Creators API enabled + returning reviews → the reviews block shows rating (stars) + count + 2-3 excerpts + "See all on Amazon" link.
- **Reviews off (API disabled/ineligible/empty):** with the API off, or ineligible, or returning nothing → the reviews block is **absent from the page** (no "No reviews yet", no zero-stars, no broken section).
- **JSON-LD with reviews:** when reviews exist → `AggregateOffer` carries `ratingValue` + `reviewCount`. Without reviews → `AggregateOffer` still emits with `availability` only (no rating fields).
- **Shareable variant link:** copy `/product/[slug]?size=M&color=blue`, open fresh → the M/blue variant is selected on load.

## What "working" means

- Variants work via URL params, shareable, no scroll jump.
- OOS is honest.
- Reviews are honest: present when real, absent when not — never faked.
- JSON-LD is correct in both states.

## What to report

- The URL param changes on variant selection + whether scroll held.
- Whether the single-variant product rendered no selector.
- The OOS option's disabled/aria state.
- The reviews block content with API on vs off (must be absent when off).
- The JSON-LD `AggregateOffer` fields in both states.
- Whether the shareable variant link loaded the right variant.
