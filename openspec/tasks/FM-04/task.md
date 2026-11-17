# FM-04 — Redirect + click pipeline

**Phase:** 1 | **Spec:** redirect-click | **Depends on:** FM-02 | **Status:** ⬜ Pending

## What we're building

The `/go/[id]` route that derives the Amazon URL at click time, returns a 302 + `X-Robots-Tag: noindex`, and records the click asynchronously (`waitUntil` + `Promise.allSettled`) through a 6-layer bot filter, identity hash, 1-hour dedup, and EU IP redaction — without ever letting a stats-write failure break the redirect.

## Why it matters

This is the revenue path. Every affiliate click flows through it. If it breaks, the shop earns nothing. If it inflates counts (bots, duplicates), the analytics lie. If it stores the raw IP, it breaks GDPR. The single most important rule: the redirect must never fail because the analytics store is slow or down.

## What success looks like (benchmarks)

- After this, when a visitor taps SHOP PRODUCT for a product with a valid ASIN + tag, the browser is redirected (302) to `https://{domain}/dp/{ASIN}?tag={tag}` within one redirect.
- After this, the redirect response carries `X-Robots-Tag: noindex`.
- After this, a click row is written asynchronously (the redirect returns before the write completes) with: timestamp, identity_hash, click_id, link_id, tracker_id (nullable), ip_or_empty, country, region, ua, referer, bot, trigger.
- After this, when a known bot hits `/go/[id]`, it is redirected to Amazon but **no click row is written**.
- After this, when the same human identity clicks the same link twice within an hour, only one click row is written (dedup).
- After this, when a visitor from an EU country clicks, the click row's `ip` field is `""` (redacted).
- After this, when Upstash Redis is unavailable, the redirect still works and the click write is silently skipped (no 500).
- After this, when the ASIN or tag is missing, the storefront CTA is greyed and `/go/[id]` returns a branded not-found (not a bare 404, not a redirect to a broken Amazon URL).
- After this, the `/go/[id]` endpoint is rate-limited via an explicit `redirect` policy (Upstash sliding window, fail-open 1s).

## Context the Builder needs

- Existing: `rollout/src/app/api/affiliate/route.ts` (returns the affiliate URL), `affiliate-service.ts` (derives URL from ASIN + config), `analytics-service.ts` (records clicks), `rollout/src/lib/affiliate/`. ROLL-14 built the `/go/[id]` redirect + `recordClick(id, source, visitorHash)`.
- The 6-layer bot filter (RE-01 Dub §2.2): query param `?bot=`, HEAD method, Next.js `isBot`, UA fragment list (50+ incl. AI crawlers), UA false-positive sanitizer, Referer, IP exact, IP CIDR. Use a maintained UA-parser library (e.g. `ua-parser-js`) + explicit Headless Chrome override. Unparseable UAs are **accepted**.
- Identity hash: `SipHash64(salt, user_agent + ip + domain + root_domain)` — BIGINT.
- Dedup: Upstash Redis, key `{domain, key, identityHash}`, TTL 1h.
- EU IP redaction: if `geo.country` in EU_COUNTRY_CODES, `ip = ""`.
- Rate limit: Upstash `slidingWindow`, `timeout: 1000` (fail-open).
- The Amazon URL is **never stored**. Derived at click time.

## Boundaries

- Do not use `window.open` (the storefront CTA links to `/go/[id]`).
- Do not let a stats-write failure (Redis down, Supabase slow) break the redirect. Uptime > analytics accuracy.
- Do not store the raw IP. Only the hash (+ `""` for EU).
- Do not block bots from being redirected — suppress only the click row.
- Do not store the Amazon URL in any table.
- Do not skip the explicit `redirect` rate-limit policy (Dub doesn't have one; affiliate bots are aggressive, so we do).
- The Creators API is NOT used here (no availability check at redirect time — that's FM-21's job, and it's a separate signal).
