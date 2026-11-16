# Report — Engagement 01, Sample: Dub

**Engagement:** 01 — Short-link redirect + click tracking + bot filter + rate limit
**Sample:** Dub (dubinc/dub), TypeScript / Next.js, AGPLv3 (open core)
**Commit analysed:** `6b463b4bdd9ed2fd9aa416f67b5b77d317b1471e` (2026-10-26)
**Mode:** A (open source under licence), static analysis only
**Date:** 2026-11-16

---

## 0. Licence note (critical)

Dub is **AGPLv3** for the open-core repo, with EE portions under a separate
commercial licence (`apps/web/app/(ee)/`). AGPLv3 §13 network-use copyleft would
require us to release our full app source under AGPLv3 if we adapt substantial
portions and deploy it. **Therefore: we extract rules and behaviour only. No
verbatim code is transplanted into our build.** Every rule below will be
re-implemented in fresh TypeScript. Build commit messages will record "rule derived
from Dub, re-implemented" where a pattern is closely followed.

## 1. What is it?

Dub is an open-source link attribution platform. Powers 250M+ clicks/month and 12M+
links, used by Twilio, Zillow, Vercel, Raycast. Turborepo monorepo: Next.js 16
+ Prisma + PlanetScale (MySQL, edge reads) + Upstash Redis (dedup + rate limit +
streams) + Tinybird (click analytics column store) + NextAuth + Axiom (logging).
2,375 files, 21 MB. Last commit 2026-10-26.

## 2. What does it do? (rules and behaviour)

### 2.1 Redirect behaviour

| Condition | HTTP status | Destination | Evidence |
|---|---|---|---|
| `key === "_root"` (root-domain link) | **301** | the link's URL | `link.ts:302, 488, 554, 584, 614` |
| Any other key | **302** | the link's URL | same |
| Unsupported key (e.g. `.php`) | 302 | root + `?dub-no-track=1` | `link.ts:79-90` |
| Link expired (`expiresAt` passed) | 302 | `expiredUrl` | `link.ts:254-259` |
| Link disabled (`disabledAt` set) | 302 | `expiredUrl` | `link.ts:254-259` |
| Link not found | 200 (rewrite) | `/[domain]/notfound` branded page | `link.ts:139-150` |
| Inspect mode (`key+`) | 200 | metadata page (no redirect) | `link.ts:54-58` |

**Rule (confirmed):** status code is `301` for permanent (root) links, `302` for
everything user-editable. This is the *opposite* of YOURLS (which used 301 for all
known links). **Decision rule for our build:** adopt Dub's stance — user-editable
affiliate links are 302, the platform's stable links are 301. This matches the
affiliate model where a product's ASIN/destination may change.

**Rule (confirmed):** unknown links → branded not-found page (not a 404, not a silent
homepage bounce). Better UX than YOURLS's silent 302-to-homepage.

**Rule (confirmed):** bot-magnet URL patterns (e.g. `.php` extensions) short-circuit
*before* the DB lookup, return a 302 with `dub-no-track=1` so no click is recorded.

### 2.2 Bot detection (6 layers, run on the click path)

| Layer | Check | Evidence |
|---|---|---|
| 1. Query param | `?bot=` present | `detect-bot.ts:11-13` |
| 2. HTTP method | `req.method === "HEAD"` | `detect-bot.ts:16-18` |
| 3a. UA built-in | `userAgent(req).isBot` (Next.js flag) | `detect-bot.ts:23-34` |
| 3b. UA list | `UA_BOTS.some(re => re.test(ua))` | `detect-bot.ts:30-33` |
| 3c. UA false-positive sanitizer | strip `Google/google` etc. before matching | `detect-bot.ts:20-29` |
| 4. Referer | `REFERRER_BOTS` regex list | `detect-bot.ts:36-43` |
| 5a. IP exact | `IP_BOTS.includes(ip)` | `detect-bot.ts:48-52` |
| 5b. IP CIDR | `IP_RANGES_BOTS.some(range => isIpInRange(ip, range))` | `detect-bot.ts:54-55` |

**Rule (confirmed):** bot detection runs on the *click path*, not the redirect path.
A bot still gets redirected to the destination; only the click event is suppressed.
This is the correct behaviour for an affiliate funnel — we never want to block a
potential buyer, only stop inflating our analytics.

**Rule (confirmed):** the UA list is fragment-based (substring regex, case-insensitive),
not full-UA-string match. More resilient to UA version drift. Requires the
false-positive sanitizer to avoid over-blocking (Instagram's in-app webview on Pixel
devices is the canonical example).

**Rule (confirmed):** `trigger === "deeplink"` skips bot detection. Deep links from
iOS/Android apps have odd UAs and Dub accepts them.

**UA list composition (50+ fragments):** generic (`bot`, `crawler`, `spider`, `http`,
`scraper`, `fetch`, `curl`, `wget`, `python`, `node`, `ruby`), search engines
(`google`, `baidu`, `bing`, `msn`, `duckduckbot`, `teoma`, `slurp`, `yandex`),
social (`facebookexternalhit`, `meta-externalagent`, `meta-externalads`,
`meta-externalfetcher`, `meta-webindexer`, `WhatsApp`, `Slackbot`, `Tumblr`, `vkShare`,
`SkypeUriPreview`), AI crawlers (`chatgpt`, `anthropic-ai`, `Claude-Web`,
`Applebot-Extended`, `perplexity`, `Omigili`, `timpi`), monitoring (`upptime`,
`Hyperping`, `cron-job`, `HostTracker`, `Expanse`), headless (`HeadlessChrome`),
special (`thirdLandingPageFeInfra` = TikTok preloader, `ShortLinkTranslate` =
Vercel-detected, `MetaInspector`, `iframely`).

### 2.3 Rate limiting (Upstash sliding window, per-endpoint policies)

**Core** (`upstash/ratelimit.ts:1-21`):
- `@upstash/ratelimit` library, `slidingWindow(requests, seconds)` limiter.
- Default: 10 req / 10 s.
- `timeout: 1000` — **fails open** if Redis doesn't respond in 1 second.
- `analytics: true` — publishes anonymous usage to Upstash.
- `prefix: "dub"` — Redis key namespace.

**Rule (confirmed):** the limiter fails *open* on Redis outage. Redirects are never
blocked by rate-limiter failure.

**Policies** (`ratelimit-policies.ts`): each endpoint has its own
`{ attempts, window, keyPrefix, message? }`. The `keyPrefix` namespaces the Redis
key; the identity dimension (IP / user / workspace / target-email) is composed
into the key per-endpoint. Examples: `login: 5/1m`, `signupOtpSend: 2/1m`,
`passwordResetRequest: 2/1m`, `emailChangeRequest: 3/24h`,
`emailChangeRequestTarget: 3/24h` (keyed on the *target* email — so many accounts
can't spam one address), `workspaceFileUpload: 20/1h` (keyed on workspace+user).

**Plan-tiered limits** (`get-ratelimit-for-plan.ts`): free / pro / business /
enterprise plans have different `limits.api` and `limits.analyticsApi`. Trials get
trial-tier limits. **Rule: rate limits are configurable per plan, not hard-coded.**

**Critical gap (confirmed):** no rate-limit policy named `redirect` or `linkClick` or
`go`. The redirect endpoint itself (`LinkMiddleware`) does not apply a per-request
Upstash throttle. Instead, the **click-dedup Redis cache (1-hour window)** is the
redirect endpoint's protection against a single identity inflating click counts. A
non-bot client can still hit `/go/{id}` repeatedly; only the *recorded click* is
deduplicated. **Implication for our build:** if we need to defend the redirect
endpoint from a flood (not just click-inflation), we must add an explicit
redirect-path rate-limit policy ourselves. The click-dedup is not enough.

### 2.4 Click pipeline (async, multi-target, best-effort)

**Flow** (`record-click.ts`):

1. No `clickId` → return null. ClickID generated upstream, is the click's primary key.
2. Opt-out: `dub-no-track` header *or* query param → return null.
3. Bot check via `detectBot(req)`. Skip for `trigger === "deeplink"`. If bot, log
   and return null.
4. `getIdentityHash(req)` — hash of IP + UA + salt. Stored, not raw IP.
5. Dedup lookup: `recordClickCache.get({ domain, key, identityHash })`. If the same
   identity hit the same link in the last hour, return null. **Rule: 1 click per
   identity per link per hour.**
6. Redis failure on dedup lookup → `console.error` and return null. **Rule: do not
   overwhelm the analytics store if Redis is down.**
7. QR detection (flips `trigger = "qr"`).
8. Geo enrichment from `x-vercel-ip-continent`, `x-vercel-ip-country-region`,
   `geolocation(req)`. **Trust the headers, not the runtime's `.region`** (which is
   the Vercel edge node, not the user's region).
9. **EU IP redaction:** if `geo.country` is in `EU_COUNTRY_CODES`, set `ip = ""`.
   **GDPR compliance rule.**

**Click row schema** (30+ fields): `timestamp, identity_hash, click_id,
workspace_id, link_id, domain, key, url, ip (or empty for EU), continent, country,
region, city, latitude, longitude, vercel_region, device, device_vendor,
device_model, browser, browser_version, engine, engine_version, os, os_version,
cpu_architecture, ua, bot, qr, referer, referer_url, trigger`.

**Async fan-out** (`waitUntil` + `Promise.allSettled`):

| # | Operation | Target | Purpose |
|---|---|---|---|
| 1 | `fetchWithRetry POST /v0/events?name=dub_click_events&wait=true` | Tinybird | Append to analytics column store |
| 2 | `recordClickCache.set({ domain, key, identityHash, clickId })` | Upstash Redis | Dedup key, 1h TTL |
| 3 | `publishLinkClickEvent({ linkId, timestamp, workspaceId? })` | Redis stream | Bump link read-model counter |
| 4 | `publishWorkspaceClickEvent(clickData)` | Redis stream | Workspace rollup + downstream consumers |

**Rule (confirmed):** clicks are written *asynchronously* via Vercel's `waitUntil`.
The redirect response returns immediately; the click recording continues in the
background. This is the opposite of YOURLS's synchronous write. **For our scale
(affiliate marketplace, not 250M clicks/month) we may not need this** — a synchronous
Postgres insert is fine until we hit a real bottleneck. But the *pattern* matters:
make the click path failure-isolated from the redirect path.

**Rule (confirmed):** `Promise.allSettled` — any one of the 4 operations can reject
without breaking the others. Rejections are collected and logged with their
operation name. **Best-effort pipeline.**

**Secondary cache (lines 172–175):** if `shouldCacheClickId` (conversion tracking
enabled, or URL is a Singular/AppsFlyer tracking URL), cache the full `clickData`
in Redis under `clickIdCache:${clickId}` for 5 minutes — so subsequent
`/track/lead` or `/track/sale` requests can join back to the original click without
waiting for Tinybird's ingestion lag. **Rule: when the analytics store has ingestion
lag and a downstream request needs the row, cache it in Redis with a short TTL.**

### 2.5 Cache strategy

| Layer | What | TTL | Purpose |
|---|---|---|---|
| `linkCache` (Redis) | full link record by `{ domain, key }` | (configurable) | avoid PlanetScale edge read on hot links |
| `recordClickCache` (Redis) | clickId by `{ domain, key, identityHash }` | 1 hour | click dedup |
| `clickIdCache` (Redis) | full clickData by `clickId` | 5 min | join-back for conversion tracking |
| PlanetScale edge | source of truth | — | fallback on cache miss |
| Tinybird | click events column store | permanent | analytics queries |

**Rule (confirmed):** on cache miss, fetch from DB, *then* write back to cache via
`ev.waitUntil(...)` so the response isn't blocked by the cache repopulation.

### 2.6 Edge cases Dub handles (YOURLS didn't)

- **Password-protected links:** `password` field on the link; if set, redirect to a
  password-entry page first.
- **Link expiry:** `expiresAt` datetime; past it → 302 to `expiredUrl`.
- **Link disable:** `disabledAt` timestamp; set → 302 to `expiredUrl`.
- **Geo-targeting:** `geo: { [countryCode]: url }` map; per-visitor destination.
- **A/B testing:** `testVariants` array + `testCompletedAt`; winning variant served
  after completion.
- **iOS / Android deep links:** `ios`, `android` fields for in-app destination.
- **Proxy mode:** `proxy` boolean — serve the destination's content under Dub's
  domain (cloak the URL).
- **Rewrite mode:** `rewrite` boolean — show the destination's content at the
  short URL (like a reverse proxy).
- **Conversion tracking:** `trackConversion` flag enables `/track/lead` and
  `/track/sale` endpoints that join back via `clickId`.
- **`doIndex` flag:** opt-in to search-engine indexing (default noindex).

## 3. How do we know? (evidence)

8 evidence blocks in `evidence/excerpts.txt` (724 lines). Each is a `nl -ba`
numbered excerpt from the source file. Licence read directly from `LICENSE.md`.
Provenance: shallow clone of the official `dubinc/dub` repository at commit
`6b463b4bdd9ed2fd9aa416f67b5b77d317b1471e`.

## 4. What did we not prove?

- **Live throughput.** We did not run Dub. The 250M-clicks/month claim comes from
  Dub's README; the *architecture* supports it (edge + Redis + Tinybird), but source
  analysis cannot verify the live number.
- **Geo-routing exact branching.** The `geo: geoTargeting` field is unpacked and the
  capability is present, but the exact per-country selection code (lines 240–619 of
  `link.ts`) was located, not read line-by-line. *Likely* a simple `geo[countryCode]
  || url` fallback; *not proven*.
- **Tinybird schema.** We saw the POST body (30 fields) but not the Tinybird
  datasource definition. Field types are inferred from the JSON values.
- **Real-world false-positive rate of the bot filter.** We see the design (6 layers
  + sanitizer); the actual precision/recall would need a labelled click stream.
- **Redis failover behaviour under load.** The "skip click tracking on failover"
  rule is confirmed in source; the production trigger conditions are not visible.

## 5. What should the owner do next?

For the **football affiliate marketplace build**, take from Dub (re-implement, do
not copy — AGPLv3):

1. **6-layer bot filter** with the false-positive sanitizer. The 50+ UA fragments
   are the most valuable single artifact — re-implement as a TypeScript array.
   Include the AI-crawler entries (`chatgpt`, `anthropic-ai`, `Claude-Web`,
   `perplexity`, `Applebot-Extended`) — these are new since YOURLS was designed.
2. **Per-endpoint rate-limit policy map** with `{ attempts, window, keyPrefix,
   message? }`. Add an *explicit* `redirect` policy (Dub doesn't have one — we
   should, because affiliate bots are more aggressive than short-link bots).
3. **Click dedup via identity hash + Redis 1h window.** This is the single most
   important rule for honest affiliate analytics — without it, one refresh-happy
   user or one bot inflates the click count.
4. **EU IP redaction.** GDPR compliance, free.
5. **`waitUntil` + `Promise.allSettled` click pipeline pattern.** Even on Postgres
   (no Tinybird), write the click via `waitUntil` so the redirect returns instantly.
6. **Status code rule:** 302 for user-editable affiliate links, 301 for stable
   platform links. (Opposite of YOURLS, but correct for our model.)
7. **Branded not-found page** instead of silent 302-to-homepage (YOURLS) or 404.
8. **Expiry / disable / expiredUrl 302** — affiliate products go out of stock;
   we need this. YOURLS lacked it; Dub has the model.
9. **Cache-miss writeback via `ev.waitUntil`** — never block the response on cache
   repopulation.
10. **Bot check on click path, not redirect path.** Bots still get redirected;
    only clicks are suppressed.

Do **not** take from Dub:

- The Tinybird + PlanetScale + Upstash Streams + Axiom stack — overkill for an
  affiliate marketplace. Postgres + Upstash Redis + a partitioned `click_events`
  table will scale to millions of clicks/month.
- The full 30-field click row — slim to ~12 fields for v1
  (`timestamp, identity_hash, click_id, link_id, ip_or_empty, country, region, ua,
  referer, bot, qr, trigger`).
- The EE-licensed code under `apps/web/app/(ee)/` — out of scope, not read in depth.

## 6. Confidence summary

| Finding | Confidence |
|---|---|
| 6-layer bot detection design | confirmed |
| UA list contents (50+ fragments, AI crawlers included) | confirmed |
| Sliding-window rate limit, 1s timeout, fail-open | confirmed |
| Per-endpoint policy map with identity-keyed prefixes | confirmed |
| Plan-tiered limit configuration | confirmed |
| Async click pipeline via `waitUntil` + `Promise.allSettled` | confirmed |
| 1h identity-hash dedup via Redis | confirmed |
| EU IP redaction | confirmed |
| 301/302 status rule (root=301, else=302) | confirmed |
| Expiry/disable → 302 to expiredUrl | confirmed |
| Geo-targeting capability present | likely (field confirmed; exact branching not read line-by-line) |
| A/B test capability present | likely (same) |
| No rate limit on the redirect endpoint itself | confirmed |
| Dub at 250M clicks/month behaves as in source | not proven (would need a run) |

---

## Engagement 01 — Consolidated

Engagement 01 is now **complete**. Two samples reported:

| Sample | Licence | Contribution |
|---|---|---|
| YOURLS | MIT | The spine: synchronous click-write, 6-field log, 301/302 decision, error-tolerance, `X-Robots-Tag` |
| Dub | AGPLv3 (rules only) | The gap-filler: 6-layer bot filter, sliding-window rate limit, async `waitUntil` pipeline, identity-hash dedup, EU IP redaction, expiry/disable |

The **consolidated redirect + click rules** for the build are documented in
`dub/2026-11-16/analysis.md` §"Engagement 01 consolidated". The next engagement (02:
affiliate tracking + commissions) builds on this foundation.
