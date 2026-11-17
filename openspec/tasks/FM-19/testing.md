# FM-19 — Testing (22-marketplace geo-routing)

**Task:** FM-19 | **Verify behavior, not UI.**

## What behavior to verify

1. Does a UK visitor go to `amazon.co.uk` with the UK tag?
2. Does a US visitor go to `amazon.com` with the US tag?
3. Does a no-tag country fall back to the default marketplace?
4. Does a spoofed `x-forwarded-for` NOT override `cf-connecting-ip`?
5. Is the port stripped from the resolved IP?
6. Is the `marketplaces` table the source of truth?

## How to verify (behavioral)

- **UK routing:** simulate a UK IP (set `cf-connecting-ip` to a UK IP range) → the redirect goes to `https://www.amazon.co.uk/dp/{ASIN}?tag={UK_TAG}`.
- **US routing:** simulate a US IP → `https://www.amazon.com/dp/{ASIN}?tag={US_TAG}`.
- **Fallback:** simulate an IP from a country with no configured tag → the redirect uses the product's default marketplace (no error, no broken link).
- **Spoof resistance:** send `cf-connecting-ip: <UK IP>` + `x-forwarded-for: <US IP>` → the redirect goes to the UK marketplace (Cloudflare header wins).
- **Port strip:** send `x-forwarded-for: 1.2.3.4:5678` (no CF) → the resolved IP is `1.2.3.4` (port stripped); the geo lookup succeeds.
- **Source of truth:** change the `domain` or `country_code` for a marketplace in the `marketplaces` table → the next redirect reflects the change (the table is the source, not hardcoded values).

## What "working" means

- Each visitor goes to their local marketplace with the right tag.
- Spoofing doesn't bypass Cloudflare trust.
- Missing tags fall back gracefully.
- The table is the single source of truth.

## What to report

- The redirect URL for a UK IP + for a US IP.
- The fallback behavior for a no-tag country.
- The redirect URL when `cf-connecting-ip` + spoofed `x-forwarded-for` disagree (CF wins).
- Whether the port was stripped + the geo lookup succeeded.
- Whether a `marketplaces` table change reflected in the next redirect.
