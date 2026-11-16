# Report — Engagement 01, Sample: YOURLS

**Engagement:** 01 — Short-link redirect + click tracking + bot filter + rate limit
**Sample:** YOURLS (Your Own URL Shortener), PHP, MIT licence
**Commit analysed:** `b5b94b944b945ff91963ca02d456e48034e1778c` (2026-11-10)
**Mode:** A (open source under licence), static analysis only
**Date:** 2026-11-16

---

## 1. What is it?

YOURLS is a self-hosted PHP URL shortener, in continuous production since 2009. The
analysed tree is 779 files / 14 MB, MIT-licensed, last commit 2026-11-10. Provenance:
shallow clone of the official `github.com/YOURLS/YOURLS` (no fork, no mirror). SHA of
the head commit recorded in `evidence/provenance.txt`.

## 2. What does it do? (rules and behaviour)

### 2.1 Redirect behaviour

| Condition | HTTP status | Destination | Evidence |
|---|---|---|---|
| No keyword in request | 301 | Site homepage | `yourls-go.php:6–9` |
| Keyword resolves to a known long URL | 301 | The long URL | `yourls-go.php:19–23` + `functions.php:355–368` |
| Keyword unknown / reserved | 302 | Site homepage | `yourls-go.php:25–27` |
| Keyword refers to a static "page" | 200 | Rendered page (no redirect) | `yourls-go.php:13–17` |

**Rule (confirmed):** unknown keywords return **302, not 404** — a deliberate choice
documented inline as *"no 404 to tell browser this might change, and also to not
pollute logs."*

**Rule (confirmed):** redirect is issued only after click count + log row are written.
Order is: hook → update counter → insert log row → `X-Robots-Tag: noindex` header →
`Location:` header → exit. (`functions.php:355–368`)

**Rule (confirmed):** if PHP output has already started (headers sent), the system
**falls back to a JavaScript meta-refresh redirect** rather than crashing.
(`functions.php:334–338`)

**Rule (confirmed):** `redirect_location` and `redirect_code` are filterable — plugins
may rewrite either at runtime. (`functions.php:324–325`)

### 2.2 Click recording

Two parallel writes per redirect, both synchronous on the request:

1. **Fast counter** — `UPDATE url_table SET clicks = clicks + 1 WHERE keyword = ?`.
   Wrapped in try/catch; on exception the counter update is **silently skipped** so the
   redirect still completes. (`functions.php:151–198`)
2. **Detailed log row** — `INSERT INTO log_table (click_time, shorturl, referrer,
   user_agent, ip_address, country_code)`. Also wrapped in try/catch; on exception the
   log row is **silently skipped**. (`functions.php:577–610`)

**Rule (confirmed):** redirect never fails because of a stats-write failure. Uptime
wins over analytics accuracy.

**Rule (confirmed):** the log schema stores six fields only — no `is_bot`, no
`is_human`, no `bot_score`, no `device_type`. Every request is logged identically.

| Field | Source | Cap |
|---|---|---|
| click_time | `date('Y-m-d H:i:s')` server time | none |
| shorturl | sanitized keyword | 100 chars |
| referrer | `yourls_get_referrer()` | 200 chars; defaults to `'direct'` |
| user_agent | `yourls_get_user_agent()` | 255 chars; regex-sanitized, **not classified** |
| ip_address | `yourls_get_IP()` | 41 chars (IPv6) |
| country_code | `yourls_geo_ip_to_countrycode($ip)` | 2 chars (MaxMind GeoIP2) |

### 2.3 Bot filtering

**Not present in core.** Grep for `googlebot|bingbot|crawler|spider|facebookexternalhit|twitterbot`
across `includes/`, `admin/`, `user/` (excluding vendored libraries) returns **zero
matches**. YOURLS relies entirely on plugins for bot classification. The plugin hook
`yourls_do_action('log_redirect', $binds)` at `functions.php:600` is the documented
extension point — a plugin can intercept the binds array and modify or suppress it.

**Implication for our build:** YOURLS does not give us a bot-filter rule. We must
source it elsewhere (Dub, Plausible).

### 2.4 Rate limiting

**Not present on the redirect endpoint.** The only throttle in the codebase,
`yourls_check_IP_flood()` at `functions.php:741–784`, gates **short URL creation**
(the `shorturl` API action), not the redirect endpoint. Its error message is literally
*"Too many URLs added too fast. Slow down please."* with HTTP 429.

The flood check works by querying the **URL table's creation timestamp** for the
caller's IP — `SELECT timestamp FROM url_table WHERE ip = ? ORDER BY timestamp DESC
LIMIT 1` — and rejecting if the gap is below `flood_delay` seconds. Logged-in users and
whitelisted IPs bypass it.

**Implication for our build:** YOURLS does not give us a redirect-endpoint rate-limit
rule. We must source it from Dub (Upstash Redis token bucket is the proven pattern
there).

### 2.5 Geo-routing

**Not present.** `country_code` is stored in the log for analytics but is **not used
to vary the destination**. The same keyword resolves to the same URL regardless of
visitor country. (`functions.php:355–368` — the URL is fetched purely by keyword, no
geo branch.)

### 2.6 Dead-link detection

**Not present.** No scheduled job, no HEAD-probe, no health check anywhere in the
codebase. YOURLS will happily redirect to a 404 destination forever and never know.

### 2.7 Expiry / disable

**Not present in the URL table schema.** Columns are `keyword`, `url`, `title`,
`timestamp`, `ip`, `clicks` — no `expires_at`, no `status`, no `disabled` flag.
Disabling a link is not a core capability.

## 3. How do we know? (evidence)

Every claim above cites a `file:line` range. The full excerpts with line numbers are
in `evidence/excerpts.txt` (211 lines, 6 evidence blocks). The provenance anchor
(commit hash + date + author) is in `evidence/provenance.txt`. The licence is MIT,
read directly from `LICENSE` at the sample root.

## 4. What did we not prove?

- **Behaviour under load.** We did not run YOURLS. The synchronous write-per-redirect
  pattern is confirmed in source, but its real-world throughput ceiling is *not proven*
  here. Dub's engagement will provide the high-scale comparison.
- **Server-level rate limiting.** The source has no application-layer redirect throttle,
  but deployers commonly add nginx `limit_req` or Apache `mod_evasive`. That layer is
  invisible to source analysis. *Likely present in mature deployments; not proven.*
- **Plugin ecosystem behaviour.** Several hooks (`shunt_log_redirect`,
  `redirect_location`, `redirect_code`) can alter behaviour. We did not survey plugins.
  Core *as shipped* is what this report describes.
- **GeoIP accuracy.** The MaxMind GeoIP2 reader is bundled, but the database file is
  not (it is downloaded at install time). We did not verify country-code accuracy.

## 5. What should the owner do next?

For the **football affiliate marketplace build**, take from YOURLS:

1. **The redirect decision rule** — 301 known, 302 unknown, no 404 on the redirect path.
2. **The synchronous click-write pattern** — update fast counter, insert detailed log
   row, both before the redirect, both failure-tolerant (redirect survives stats outage).
3. **The log row schema** — `click_time, product_id, referrer, user_agent, ip_address,
   country_code` is a proven minimal set. *We will add `is_bot` (boolean) and
   `affiliate_id` (nullable) on top of this base.*
4. **`X-Robots-Tag: noindex`** on every redirect response.
5. **The filterable redirect hook** — keep `redirect_location` and `redirect_code`
   overridable at runtime so we can later add A/B destination testing.

Do **not** take from YOURLS:

1. Its assumption that bot filtering is somebody else's problem. We must implement it
   in core.
2. Its absence of redirect-endpoint rate limiting. We must add it.
3. Its lack of dead-link detection and expiry. Both are required for an affiliate
   catalogue whose destinations go out of stock.

## 6. Confidence summary

| Finding | Confidence |
|---|---|
| 301/302 redirect decision rule | confirmed |
| Synchronous click + log write, error-tolerant | confirmed |
| Log schema (6 fields, no bot flag) | confirmed |
| No bot filter in core | confirmed |
| No redirect-endpoint rate limit in core | confirmed |
| No geo-routing in core | confirmed |
| No dead-link detection in core | confirmed |
| No expiry/disable column in URL schema | confirmed |
| YOURLS at scale behaves the same as in source | not proven (would need a run) |
| Server-level rate limiting exists in mature deployments | likely (not visible in source) |

---

**Engagement 01 — YOURLS sample: complete.** Next sample in this engagement: Dub, for
the bot-filter + rate-limit + high-scale click-pipeline rules YOURLS lacks.
