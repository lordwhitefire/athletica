# FM-04 — Testing (redirect + click pipeline)

**Task:** FM-04 | **Verify behavior, not UI.**

## What behavior to verify

1. Does `/go/[id]` return a 302 to the correct Amazon URL with the tag?
2. Is `X-Robots-Tag: noindex` present?
3. Are bots redirected but not counted?
4. Does the 1-hour identity-hash dedup work?
5. Are EU IPs redacted (`ip=""`)?
6. Does the redirect survive a Redis/Supabase outage?
7. Does the explicit `redirect` rate-limit policy fire?
8. Is the raw IP never stored?

## How to verify (behavioral)

- **Happy path:** tap SHOP PRODUCT → expect one 302 to `https://{domain}/dp/{ASIN}?tag={tag}`. Confirm `X-Robots-Tag: noindex` in the response headers.
- **Bot:** hit `/go/[id]` with a Googlebot UA → expect 302 to Amazon, but query `analytics` for a click row with that click_id/time → expect none.
- **Dedup:** click the same link twice within an hour from the same identity (same UA + IP) → expect one click row. Click a third time after 61 minutes → expect a second row.
- **EU redaction:** simulate a request from a French IP (or set the geo header) → the click row's `ip` is `""`. Simulate a US IP → `ip` is... still not the raw IP (only the hash is stored; the `ip` field is either `""` or absent — the raw IP never persists).
- **Outage:** with Upstash Redis deliberately unreachable (bad URL), tap `/go/[id]` → expect 302 to Amazon (redirect succeeds); the click write is silently skipped (no 500, no thrown error to the visitor).
- **Rate limit:** hit `/go/[id]` rapidly (above the policy threshold) → expect a 429 (or the policy's configured response) after the threshold; confirm the limiter fails open if Redis is down (no 429 when Redis is unreachable).
- **Missing ASIN/tag:** a product with no ASIN → storefront CTA is greyed; hitting `/go/[id]` directly returns a branded not-found, not a redirect to a broken Amazon URL.
- **No raw IP:** query the `analytics` table for any click row → no column contains a raw IPv4/IPv6 address (only the BIGINT hash + the `""`-or-absent `ip` field).

## What "working" means

- The redirect is fast, correct, and never breaks on a stats outage.
- Clicks are honest (bots skipped, duplicates deduped).
- Privacy is real (no raw IP, EU redacted).
- The rate limit defends the endpoint but fails open.

## What to report

- The 302 destination + the `X-Robots-Tag` header for a sample click.
- Whether the bot was redirected without a click row.
- The click row count after the dedup test (1, not 2).
- The `ip` field value for an EU vs non-EU request.
- The redirect's behavior with Redis down (must be 302, not 500).
- The rate-limit threshold observed + fail-open behavior.
- Any raw IP found in the analytics table (there should be none).
