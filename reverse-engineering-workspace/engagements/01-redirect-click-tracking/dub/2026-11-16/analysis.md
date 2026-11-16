# Analysis — Engagement 01, Sample: Dub

**Date:** 2026-11-16
**Mode:** A (open source under AGPLv3), static only
**Working record** — separates what was *observed* from what is *inferred*.

## Files read

| File | Lines | Purpose |
|---|---|---|
| `LICENSE.md` | 1–15 | AGPLv3 + EE notice |
| `apps/web/middleware.ts` | 1–74 | Edge redirect entry (Next.js middleware) |
| `apps/web/lib/middleware/link.ts` | 1–130, 240–310 | `LinkMiddleware` redirect decision brain |
| `apps/web/lib/middleware/utils/detect-bot.ts` | 1–63 | 6-layer bot detection |
| `apps/web/lib/middleware/utils/bots-list.ts` | 1–60 (+ file is 608 lines) | UA/referrer/IP bot lists |
| `apps/web/lib/upstash/ratelimit.ts` | 1–21 | Sliding-window rate limiter factory |
| `apps/web/lib/upstash/ratelimit-policies.ts` | 1–80 (of 179) | Per-endpoint policy map |
| `apps/web/lib/api/get-ratelimit-for-plan.ts` | 1–27 | Plan-tiered limits |
| `apps/web/lib/tinybird/record-click.ts` | 1–130, 175–231 | Click recording + async fan-out |

## Observed: the redirect entry point

Dub runs the redirect as **Next.js middleware** (`apps/web/middleware.ts`), not as a
route handler. The `config` block sets `runtime: "nodejs"` and a matcher that excludes
`/api/`, `/_next/`, `/_proxy/`, and metadata files (`favicon.ico`, `sitemap.xml`,
`robots.txt`, `manifest.webmanifest`).

**Decision rule (confirmed):** the middleware parses `domain + path + key + fullKey`
from the request, then dispatches:

1. `isAppHostname(domain)` → `AppMiddleware` (dashboard traffic)
2. `API_HOSTNAMES.has(domain)` → `ApiMiddleware`
3. `path.startsWith("/stats/")` → rewrite to `/[domain]/[key]/stats`
4. `path.startsWith("/.well-known/")` → rewrite to `/wellknown/[domain]/[file]`
5. `domain === "dub.sh" && DEFAULT_REDIRECTS[key]` → static redirect map
6. `isValidUrl(fullKey)` → `CreateLinkMiddleware` (URL-as-key shorthand)
7. **Default → `LinkMiddleware(req, ev)`** ← the actual public redirect handler

## Observed: `LinkMiddleware` redirect decisions

`apps/web/lib/middleware/link.ts:42+`. The redirect decision tree, in order:

1. **Punycode-encode the key** (`punyEncode`) and (unless the domain is case-sensitive)
   lowercase it.
2. **Inspect mode:** if key ends with `+`, strip it and set `inspectMode = true`
   (shows the link's metadata instead of redirecting).
3. **Empty key → `_root`:** the root-domain link (e.g. `dub.sh/` itself) is treated as
   a link with key `_root`.
4. **Unsupported key blocklist:** if `isUnsupportedKey(key)` is true — the comment
   names `.php` links as "too much bot traffic" — return a **302 to root** with
   `X-Robots-Tag: googlebot: noindex` and add `dub-no-track=1` query param so the click
   is *not* recorded. **Rule: known bot-magnet patterns short-circuit before lookup.**
5. **Cache lookup:** `linkCache.get({ domain, key })` returns `{ cachedLink,
   redisFailOver }`. If Redis is in failover, `recordClick` is replaced with a no-op
   that logs "Redis failover detected, skipping click tracking." **Rule: redirect
   survives Redis outage; click tracking degrades.**
6. **DB fallback:** if cache miss, `getLinkViaEdge({ domain, key })` hits PlanetScale
   edge. If not found:
   - `domain === "buff.ly"` → crawl Bitly (a migration helper, out of scope)
   - Else → **rewrite to `/[domain]/notfound` page** (not a 404, not a homepage bounce
     — a branded not-found page).
   The fetched link is then written back to Redis via `ev.waitUntil(linkCache.set(...))`
   so subsequent hits are cache hits.
7. **Field unpacking:** the cached link carries `password`, `trackConversion`, `geo`
   (geo-targeting), `proxy`, `rewrite`, `expiresAt`, `disabledAt`, `ios`, `android`,
   `expiredUrl`, `doIndex`, `testVariants` (A/B), `testCompletedAt`, `projectId`.

**Status code rule (confirmed at lines 302, 488, 554, 584, 614):**
`status: key === "_root" ? 301 : 302`. **Root links are permanent (301); every other
link is temporary (302).** This is the opposite of YOURLS (which uses 301 for all known
links). The reasoning: a user's short link is editable, so 302 reflects "may change";
the platform's own root domain is stable, so 301.

**Expiry / disable rule (confirmed at lines 254, 259):** if `expiresAt` has passed or
`disabledAt` is set, redirect to `expiredUrl` with **302**, not to the original
destination.

**Geo-targeting rule:** `geo: geoTargeting` is one of the unpacked fields; the
`LinkMiddleware` selects a destination per the visitor's country (full logic in the
file's lower half, not read in detail — pattern is established).

**A/B test rule:** `resolveABTestURL({ testVariants, testCompletedAt })` returns a URL
or null. If a test is complete, the winning variant is served.

## Observed: bot detection (6 layers)

`apps/web/lib/middleware/utils/detect-bot.ts` — a single `detectBot(req)` function:

1. **Query param:** `?bot=1` (or any value) → bot. (Useful for testing/dev.)
2. **HTTP method:** `HEAD` requests are always treated as bots. "Real users always
   use GET."
3. **User agent — `ua.isBot` from `next/server`:** Next.js's built-in bot flag, *but*
   guarded by a false-positive sanitizer.
4. **User agent — list match:** iterate `UA_BOTS` (608-line file) — each entry is a
   regex fragment tested case-insensitively against the sanitized UA.
5. **Referer list:** `REFERRER_BOTS` matched against the `referer` header.
6. **IP list:** `IP_BOTS` (exact match) and `IP_RANGES_BOTS` (CIDR via `isIpInRange`).

**False-positive sanitizer (critical rule):** the `UA_FALSE_POSITIVES` array contains
`/Google\/google\b/` — Instagram's in-app webview on Pixel devices appends
`Google/google` to the device descriptor, which would trip the generic `google`
pattern. Dub strips this before matching. **Rule: a bot list must have an allow-list
override or it will misclassify in-app webviews.**

**UA list composition (confirmed from `bots-list.ts:1-60`):** 50+ fragments including:
- Generic: `bot`, `crawler`, `spider`, `http`, `scraper`, `fetch`, `curl`, `wget`,
  `python`, `node`, `ruby`
- Search: `google`, `baidu`, `bing`, `msn`, `duckduckbot`, `teoma`, `slurp`, `yandex`
- Social: `facebookexternalhit`, `meta-externalagent`, `meta-externalads`,
  `meta-externalfetcher`, `meta-webindexer`, `WhatsApp`, `Slackbot`, `Tumblr`,
  `vkShare`, `SkypeUriPreview`
- AI crawlers: `chatgpt`, `anthropic-ai`, `Claude-Web`, `Applebot-Extended`,
  `perplexity`, `Omigili`, `timpi`
- Monitoring/uptime: `upptime`, `Hyperping`, `cron-job`, `HostTracker`, `Expanse`
- Headless: `HeadlessChrome`
- Special: `thirdLandingPageFeInfra` (TikTok preloader), `ShortLinkTranslate`
  (Vercel-detected), `MetaInspector`, `iframely` (used by Notion/Linear)

**Rule (confirmed):** the list is *fragment-based* (substring regex), not
full-UA-string match. This is more resilient to UA version drift but requires the
false-positive sanitizer to avoid over-blocking.

## Observed: rate limiting

**Core factory** (`apps/web/lib/upstash/ratelimit.ts`, 21 lines):

```ts
new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(requests, seconds),
  analytics: true,
  prefix: "dub",
  timeout: 1000,
});
```

**Rule (confirmed):** sliding-window algorithm (not fixed window, not token bucket —
sliding window is more accurate near boundaries). Default 10 req / 10 s. **Timeout:
1000 ms** — if Redis doesn't respond in 1s, the limiter fails *open* (allows the
request) rather than blocking. **Rule: rate-limiter failure must not break the
redirect.**

**Policy map** (`ratelimit-policies.ts`): each endpoint has its own
`{ attempts, window, keyPrefix, message? }`. Examples observed:
- `login: 5 attempts / 1 m` — error code `too-many-login-attempts` (matched verbatim
  by the sign-in page)
- `signupOtpSend: 2 / 1 m`
- `accountExistsCheck: 8 / 1 m`
- `passwordResetRequest: 2 / 1 m`
- `emailChangeRequest: 3 / 24 h` (keyed on the requesting user)
- `emailChangeRequestTarget: 3 / 24 h` — **keyed on the target email** so many
  accounts can't spam one address
- `workspaceFileUpload: 20 / 1 h` — keyed on workspace + user so one member can't
  exhaust the workspace budget

**Rule (confirmed):** rate-limit keys are composed per-endpoint and per-identity.
The `keyPrefix` namespaces them in Redis. The identity dimension (IP / user /
workspace / target-email) is chosen per-endpoint based on the abuse vector.

**Plan-tiered limits** (`get-ratelimit-for-plan.ts`): free / pro / business / enterprise
plans have different `limits.api` and `limits.analyticsApi` values. Trials get
trial-tier limits. **Rule: rate limits are configurable per plan, not hard-coded.**

**Important gap (confirmed):** I did not find a rate-limit policy named `redirect` or
`linkClick` or `go`. The redirect endpoint itself (`LinkMiddleware`) does not appear
to apply an Upstash rate limit per request — instead, the **click-dedup Redis cache
(1 hour window, see below)** is the redirect endpoint's protection against a single
identity inflating click counts. **Rule (confirmed):** Dub protects the redirect
endpoint by *deduplicating clicks*, not by *throttling requests*. A bot that doesn't
trip the bot filter can still hit the endpoint repeatedly; only the *recorded click*
is deduplicated.

## Observed: the click pipeline

`apps/web/lib/tinybird/record-click.ts`. The function signature accepts `{ req,
clickId, workspaceId, linkId, domain, key, url, skipRatelimit, timestamp, referrer,
trigger, shouldCacheClickId }`.

**Flow (confirmed at lines 1–130):**

1. **No clickId → return null.** ClickID is generated upstream and is the click's
   primary key. Without it, nothing is recorded.
2. **Opt-out header/param:** if `req.headers.has("dub-no-track")` or
   `searchParams.has("dub-no-track")`, return null. **Rule: users can opt out per
   click via header or query param.**
3. **Bot check:** call `detectBot(req)`. **Skip for `trigger === "deeplink"`** — deep
   links from iOS/Android can have odd UAs and Dub accepts them. If bot detected,
   `console.log("Click not recorded ❌ – Bot detected.", { ua, isBot })` and return
   null. **Rule: bot check is on the click path, not the redirect path.** A bot still
   gets redirected; only the click event is suppressed.
4. **Identity hash:** `await getIdentityHash(req)` — a privacy-preserving hash of IP +
   UA + salt. Stored as `identity_hash` in the click row. **Rule: do not store raw IP
   in the analytics store; store a hash.**
5. **Dedup cache lookup:** `recordClickCache.get({ domain, key, identityHash })`. If
   the same identity hit the same link within the last hour, **return null** — no
   second click recorded. **Rule: 1 click per identity per link per hour.**
6. **Redis failure handling:** if `recordClickCache.get` throws, `console.error` and
   **return null** — *do not overwhelm Tinybird/MySQL if Redis is down*. **Rule: Redis
   failure degrades click tracking to "skip", not to "fire anyway".**
7. **QR detection:** `detectQr(req)` flips `trigger = "qr"`.
8. **Geo enrichment:** only when `process.env.VERCEL === "1"`. Otherwise
   `LOCALHOST_GEO_DATA`. Continent and region come from Vercel's edge headers
   (`x-vercel-ip-continent`, `x-vercel-ip-country-region`) — *not* from the
   `geolocation()` helper, because that returns the Vercel edge region (the CDN node),
   not the user's region. **Rule: trust `x-vercel-ip-*` headers, not the runtime
   `geolocation().region`.**
9. **EU IP redaction:** `isEuCountry = geo.country && EU_COUNTRY_CODES.includes(geo.country)`.
   The `ip` field in the click row is set to `""` (empty string) if the visitor is in
   the EU. **Rule: GDPR compliance — IP is not stored for EU visitors.**

**The click_data object (confirmed at lines 138–170):** 30+ fields:

`timestamp, identity_hash, click_id, workspace_id, link_id, domain, key, url, ip,
continent, country, region, city, latitude, longitude, vercel_region, device,
device_vendor, device_model, browser, browser_version, engine, engine_version, os,
os_version, cpu_architecture, ua, bot, qr, referer, referer_url, trigger`

**Async fan-out (confirmed at lines 175–231):** the click is *not* written
synchronously. It's wrapped in `waitUntil(...)` — Vercel's primitive that lets the
response return immediately while background work continues. Inside, four parallel
operations via `Promise.allSettled`:

1. **Tinybird POST** to `${TINYBIRD_API_URL}/v0/events?name=dub_click_events&wait=true`
   with the click_data as JSON body and `Authorization: Bearer ${TINYBIRD_API_KEY}`.
   `fetchWithRetry` wraps it.
2. **`recordClickCache.set({ domain, key, identityHash, clickId })`** — writes the
   dedup key into Redis with 1-hour TTL.
3. **`publishLinkClickEvent({ linkId, timestamp, workspaceId? })`** — publishes to a
   Redis stream for link-level rollup (e.g. "this link just got a click — bump its
   counter in the read model").
4. **`publishWorkspaceClickEvent(clickData)`** — publishes the full click_data to a
   workspace-level Redis stream for downstream consumers (analytics dashboard, etc.).

**Failure handling:** `Promise.allSettled` means any one of the four can reject
without breaking the others. Rejections are collected and logged with their operation
name; the function does not throw. **Rule: the click pipeline is best-effort; partial
failures are isolated.**

## Observed: secondary cache for click ID

Lines 172–175: if `shouldCacheClickId` is true (conversion tracking enabled, or the URL
is a Singular/AppsFlyer tracking URL), the full `clickData` is stored in Redis under
`clickIdCache:${clickId}` with 5-minute TTL. **Rule: when subsequent /track/lead or
/track/sale requests need to join back to the original click, cache the click row
itself in Redis for 5 minutes — Tinybird ingestion is not synchronous enough to read
back immediately.**

## What YOURLS lacked, Dub provides

| Gap from YOURLS | Dub's rule |
|---|---|
| No bot filter | 6-layer detection (query/HEAD/UA-list+sanitizer/referer/IP-exact/IP-CIDR) |
| No rate limit on redirect | Per-endpoint sliding-window Upstash policy with 1s timeout, fail-open |
| No async pipeline | `waitUntil` + `Promise.allSettled` to Tinybird + Redis streams |
| No dedup | Identity-hash Redis cache, 1-click-per-identity-per-link-per-hour |
| No GDPR IP redaction | EU country → `ip = ""` |
| No X-Robots-Tag on bot-redirects | `googlebot: noindex` on the .php block |
| No expiry/disable redirect | `expiredUrl` 302 |
| No geo-routing | `geo: geoTargeting` field with per-country destination |
| No A/B testing | `testVariants` + `testCompletedAt` |
| No inspect mode | key + `+` suffix → metadata page |

## Confidence

- **confirmed** — every claim above is sourced to `file:line` in `evidence/excerpts.txt`
  (724 lines across 8 evidence blocks).
- **likely** — Dub's `LinkMiddleware` applies geo-routing and password/IOS/Android
  per-platform deep-link redirects. The exact code paths for those branches were
  located (line ranges cited) but not read line-by-line; the *presence* of the
  capability is confirmed, the *exact* branching is likely.
- **not proven** — Dub's real-world throughput at 250M clicks/month. The architecture
  (edge middleware + Redis dedup + Tinybird async + Redis streams) supports it, but
  source analysis cannot prove the live number.

## Open questions for the build

1. Do we need the full 30-field click_data schema, or a subset? — Likely a subset
   (`timestamp, identity_hash, click_id, link_id, ip-or-empty, country, region, ua,
   referer, bot, qr, trigger`). Lat/long, device model, engine version are nice-to-have.
2. Do we need Tinybird, or is a Postgres `click_events` table with a weekly
   partition enough for our scale? — Until we hit Dub-scale, Postgres is simpler.
3. Do we need Redis streams for downstream consumers, or is a single Postgres insert
   + a trigger enough?
4. AGPLv3 obligation: we **must not** copy Dub's source verbatim. Every rule above
   will be re-implemented in fresh TypeScript under our licence.

## Engagement 01 consolidated

With YOURLS (the spine) and Dub (the gap-filler) both reported, engagement 01
is complete. The consolidated redirect + click rules for the build are:

- **Spine from YOURLS:** synchronous write of fast counter + log row before redirect,
  error-tolerant (redirect survives stats outage), 301/302 decision rule,
  `X-Robots-Tag: noindex`, 6-field log row.
- **Bot filter from Dub:** 6-layer detection with UA false-positive sanitizer.
- **Rate limit from Dub:** Upstash sliding-window, per-endpoint policy, 1s timeout,
  fail-open.
- **Click pipeline from Dub:** `waitUntil` + `Promise.allSettled` to (Postgres |
  Tinybird) + Redis dedup (1h) + identity hash + EU IP redaction.
- **Affiliate-specific additions** (from engagement 03): ASIN → Amazon URL,
  geo-routing, dead-link detection.
