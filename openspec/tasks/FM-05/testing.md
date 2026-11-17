# FM-05 — Testing (analytics pipeline)

**Task:** FM-05 | **Verify behavior, not UI.**

## What behavior to verify

1. Is the visitor hash SipHash64 (BIGINT, not hex)?
2. Does the salt rotate every 90s with a grace window?
3. Is the same visitor on two domains hashed differently (cross-site unlinkability)?
4. Does the 6-header IP chain work, with Cloudflare-trusted order + port stripping?
5. Is Headless Chrome dropped; are unparseable UAs accepted?
6. Are drop-reasons named + queryable as a grouped count?
7. Is the pipeline order correct (bot → enrich → expensive → shield → persist)?

## How to verify (behavioral)

- **Hash type:** inspect a `visitor_hash` value in `analytics` → it is a BIGINT (fits in a 64-bit integer), not a hex string.
- **Salt rotation:** record the current salt; wait 91 seconds; confirm a new salt is current and the old one is `previous`. Wait past the grace window; confirm the old salt is no longer valid.
- **Grace window:** fire two events for the same identity 95 seconds apart (salt rotated between them) → both should resolve to the same visitor hash/session (the second matches via `previous`).
- **Cross-site unlinkability:** compute the hash for the same UA + IP on `athletica-shop.com` vs `athletica-affiliate.com` → the two hashes differ (domain is in the input).
- **IP chain:** send a request with `cf-connecting-ip: 1.2.3.4` and a spoofed `x-forwarded-for: 9.9.9.9` → the resolved IP is `1.2.3.4` (Cloudflare wins). Send `x-forwarded-for: 1.2.3.4:5678` (no CF header) → resolved to `1.2.3.4` (port stripped).
- **Headless Chrome:** send a `HeadlessChrome` UA → event dropped with `drop_reason='bot'`. Send a completely unparseable/garbage UA → event **accepted** (not dropped).
- **Drop-reason telemetry:** fire a mix of bot, spam-referrer, and datacenter-IP requests → query the grouped count → each reason appears with its count.
- **Pipeline order:** (if observable via logs/telemetry) confirm bot-filter runs before GeoIP lookup (no GeoIP call wasted on a bot).

## What "working" means

- Hashes are BIGINT, stable within a salt window, unlinkable across domains.
- The grace window prevents double-counting on rotation.
- The IP chain respects Cloudflare + strips ports.
- Bots (including Headless Chrome) are dropped; odd UAs are not.
- Drop reasons are observable.

## What to report

- The `visitor_hash` value type (BIGINT confirmed).
- The salt rotation timeline (when current became previous, when previous was deleted).
- Whether the grace-window test linked the two events.
- The two cross-domain hashes (must differ).
- The resolved IP for the Cloudflare-trust test + the port-strip test.
- Whether Headless Chrome was dropped + whether the unparseable UA was accepted.
- The grouped drop-reason counts.
