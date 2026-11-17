# Spec — Redirect + Click pipeline

**Change:** athletica-full-marketplace | **Phase:** 1 (FM-04) + reinforced in Phase 5 (FM-19 geo-routing, FM-21 dead-link)
**Sources:** `blueprint/01-build-layers.md` (Business logic), RE-01 (YOURLS + Dub), RE-06 (Plausible).

## Intent

The redirect + click pipeline is the revenue heart. It sends a visitor to Amazon with the affiliate tag, records the click honestly (bots filtered, duplicates deduped, EU IPs redacted, identity hashed not stored), never breaks the redirect when the analytics store is slow, and feeds the dashboards. Geo-routing and dead-link detection plug into it in Phase 5.

## Requirements

**The redirect:** `/go/[id]` derives the Amazon URL at click time from `ASIN + tag + marketplace` (the visitor's marketplace, geo-routed in Phase 5) and returns **302** + `X-Robots-Tag: noindex`. The URL is never stored. If ASIN/tag missing or the product is dead → the storefront CTA is already greyed; if a redirect is somehow hit anyway, return a branded not-found, not a bare 404.

**The click write:** asynchronous via `waitUntil` + `Promise.allSettled`. The redirect returns immediately. Any one of the click-pipeline operations can reject without breaking the others. The redirect never fails because of a stats-write outage.

**Bot filter (6-layer, on the click path — bots still get redirected, only the click is suppressed):** (1) `?bot=` query param, (2) HEAD method, (3a) Next.js `isBot` flag, (3b) UA fragment list (50+ including AI crawlers: chatgpt, anthropic-ai, Claude-Web, perplexity, Applebot-Extended), (3c) false-positive sanitizer (strip Google/google before matching — Instagram in-app webview on Pixel is the canonical false positive), (4) Referer regex, (5a) IP exact, (5b) IP CIDR. Uses a maintained UA-parser library + explicit Headless Chrome override. Unparseable UAs are **accepted**, not dropped.

**Identity hash + dedup:** `SipHash64(salt, user_agent + ip + domain + root_domain)` — BIGINT, not hex. Includes domain + root_domain for cross-site unlinkability. Dedup: 1 click per identity per link per hour (Upstash Redis 1h window).

**Salt rotation:** every 90s (configurable). Two valid salts (current + previous) for the grace window. Salts older than 48h deleted. Cached in memory. Generated via `crypto.randomBytes(16)`. Grace window: hash with current; if no session matches, retry with previous.

**EU IP redaction:** if `geo.country` in EU_COUNTRY_CODES, set `ip = ""` (GDPR).

**IP resolution (6-header chain, order matters):** `x-plausible-ip` → `cf-connecting-ip` → `x-forwarded-for` (first IP) → `b-forwarded-for` → `forwarded` (RFC 7239) → `conn.remote_ip`. Strip the port from IPv4/IPv6.

**Drop reasons (named enum + telemetry):** `bot, spam_referrer, invalid, dc_ip, threat_ip, persist_error` (at minimum). Per-reason grouped count for observability.

**Rate limiting:** Upstash sliding window, per-endpoint policy map `{attempts, window, keyPrefix}`, fail-open (1s timeout — redirects never blocked by rate-limiter failure). Explicit `redirect` policy (affiliate bots are aggressive; Dub doesn't have one — we do).

**Click row (~12 fields):** `timestamp, identity_hash, click_id, link_id, tracker_id (nullable), ip_or_empty, country, region, ua, referer, bot, trigger`.

## Behavior boundaries

- The redirect must never fail because a stats write is slow or errors. Uptime > analytics accuracy.
- Bots are redirected to the destination; only the click event is suppressed.
- The raw IP is never persisted. Only the hash (and `ip=""` for EU).
- No client-side cookies, no fingerprinting. The visitor identifier is computed server-side.
- The `/go/[id]` route is a server redirect, not a `window.open` (blocked in in-app browsers).

## What success looks like

- A visitor taps SHOP PRODUCT and lands on Amazon with `?tag=` in the URL, within one redirect.
- A bot hitting `/go/[id]` is redirected but no click row is written.
- A human clicking the same link twice within an hour produces one click row, not two.
- A visitor from the EU has `ip=""` in the click row.
- If Upstash Redis is down, the redirect still works and the click write is silently skipped (not crashed).
- The salt has rotated at least once during a session, and a visitor whose salt rotated between two events is still linked (grace window).
- Drop reasons are observable as a grouped count ("N bot, M dc_ip, K spam_referrer").
