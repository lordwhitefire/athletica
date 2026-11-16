# Analysis — Engagement 01, Sample: YOURLS

**Date:** 2026-11-16
**Mode:** A (open source under MIT licence), static only
**Working record** — separates what was *observed* from what is *inferred*.

## Files read

| File | Lines | Purpose |
|---|---|---|
| `yourls-go.php` | 1–28 | Public redirect entry point |
| `yourls-api.php` | 1–55 | JSON API entry point (read for completeness) |
| `includes/load-yourls.php` | 1–35 | Bootstrap |
| `includes/functions.php` | 140–305, 322–368, 470–622, 740–794 | Redirect, click update, click log, flood check, UA/referrer getters |
| `includes/functions-install.php` | 235–275 | Log table DDL |
| `includes/functions-shorturls.php` | grep only | `yourls_get_keyword_longurl`, `yourls_is_page`, `yourls_sanitize_keyword` |
| `includes/functions-formatting.php` | grep only | `yourls_sanitize_keyword` location |
| `LICENSE` | head | MIT confirmed |

## Observed: the redirect flow

`yourls-go.php` is the public redirect endpoint. It is reached after `yourls-loader.php`
(a rewrite dispatcher in the web root, not read in full) populates `$keyword` from the
URL path. The flow is:

1. If `$keyword` is unset → fire `redirect_no_keyword` action → 301 to `YOURLS_SITE`
   (the site homepage). *No error page; silent bounce home.*
2. `$keyword = yourls_sanitize_keyword($keyword)` — normalize the keyword.
3. If `yourls_is_page($keyword)` → render the static page and `return`. (Pages are a
   separate feature; out of scope here.)
4. If `$url = yourls_get_keyword_longurl($keyword)` → call
   `yourls_redirect_shorturl($url, $keyword)` and `return`.
5. Otherwise → fire `redirect_keyword_not_found` action → **302** to `YOURLS_SITE`,
   with the explicit comment *"no 404 to tell browser this might change, and also to
   not pollute logs"*. Then `exit()`.

**Decision rule observed:** unknown keyword → **302 (not 404)**, redirect to homepage.
This is a deliberate SEO/log-cleanliness choice.

## Observed: what `yourls_redirect_shorturl` does

`includes/functions.php:355–368`. Four steps, in order, before the actual redirect:

1. `yourls_do_action('redirect_shorturl', $url, $keyword)` — plugin hook.
2. `yourls_update_clicks($keyword)` — increment `clicks` counter in the main URL table.
3. `yourls_log_redirect($keyword)` — insert a row into the log table.
4. `yourls_robots_tag_header()` — send `X-Robots-Tag: noindex`.
5. `yourls_redirect($url, 301)` — final 301 redirect.

**Decision rule observed:** redirect is **301 (permanent)** for known keywords, **302**
for unknown. The click count and log row are written **before** the redirect is issued,
on the same request — synchronous, not queued.

## Observed: `yourls_redirect()` itself

`includes/functions.php:322–342`. It:

1. Fires `pre_redirect` action with `$location` and `$code`.
2. Filters `redirect_location` and `redirect_code` — both are *filterable*, so a plugin
   can rewrite the destination or change the HTTP code at runtime.
3. If `headers_sent()` is false → send status header + `Location:` header. Return 1.
4. Else if not CLI → fall back to a JS redirect. Return 2.
5. Else (CLI) → return 3 (no redirect; caller must handle).

**Decision rule observed:** the system **degrades gracefully** when headers are already
sent (templates already started output) — it does not crash, it uses a JS meta-refresh
fallback. This is a robustness pattern worth keeping.

## Observed: the click-log row

`yourls_log_redirect()` at `includes/functions.php:577–610`. Columns written:

| Column | Source | Length cap |
|---|---|---|
| `click_time` | `date('Y-m-d H:i:s')` (server local time) | — |
| `shorturl` | sanitized keyword | varchar(100) |
| `referrer` | `yourls_get_referrer()` | 200 chars |
| `user_agent` | `yourls_get_user_agent()` | 255 chars |
| `ip_address` | `yourls_get_IP()` | varchar(41) (IPv6 max) |
| `country_code` | `yourls_geo_ip_to_countrycode($ip)` | char(2) |

The schema (`functions-install.php:240–251`) confirms there is **no `is_bot` column**,
no `is_human` flag, no `bot_score`. Every request — including bots — is logged
identically.

The DB insert is wrapped in try/catch and *swallows exceptions silently*
(`$result = 0` on catch). Comment says: *"An error probably means a concurrency
problem : just skip the logging"*. **Decision rule:** logging failure must never break
the redirect. The user always reaches the destination even if stats break.

`yourls_get_user_agent()` (`functions.php:285–294`) **sanitizes** the UA string with
a regex whitelist `[^0-9a-zA-Z\':., /{}\(\)\[\]\+@&\!\?;_\-=~\*\#]` and truncates to
255 chars. This is *sanitization*, not *classification* — there is no check against
any bot list.

`yourls_get_referrer()` (`functions.php:301–305`) sanitizes via
`yourls_sanitize_url_safe()` and defaults to `'direct'` when absent. Truncates to 200.

## Observed: what is *not* there

**No bot filter.** Grep for `googlebot|bingbot|crawler|spider|facebookexternalhit|twitterbot`
across `includes/`, `admin/`, `user/` (excluding `vendor/`) returns **zero matches**.
YOURLS core does not classify or exclude bots. The plugin hook
`yourls_do_action('log_redirect', $binds)` at `functions.php:600` is the documented
extension point — a plugin can intercept the binds and modify them, but the core ships
no list.

**No rate limit on the redirect endpoint.** `yourls_check_IP_flood()` at
`functions.php:741–784` is the only throttle in the codebase. Its message is literally
*"Too many URLs added too fast. Slow down please."* — it gates **short URL creation**,
not redirects. The query (`SELECT timestamp FROM url_table WHERE ip = ? ORDER BY
timestamp DESC LIMIT 1`) looks at the **URL table's creation timestamp**, not the log
table. So a single malicious client can hammer `/go/{keyword}` indefinitely and every
hit will: increment the counter, insert a log row, and redirect.

**No geo-routing.** `country_code` is stored in the log (via bundled MaxMind GeoIP2
reader in `includes/vendor/geoip2/`), but it is **not used** to vary the destination
URL. The same keyword → same destination regardless of country.

**No dead-link detection.** There is no scheduled job, no health check, no HEAD probe
of the destination URL anywhere in core. Dead Amazon product links would silently
redirect to a 404 on Amazon's side; YOURLS would never know.

**No expiry / disable flag.** The URL table has no `expires_at`, no `disabled` column
in the schema (only `keyword`, `url`, `title`, `timestamp`, `ip`, `clicks`).
Disabling a link is not a core capability.

## Observed: what *is* there and worth keeping

| Rule / pattern | Worth keeping? |
|---|---|
| 301 for known keyword, 302 for unknown (not 404) | Yes — clean SEO choice |
| Write click + log synchronously, before the redirect | Yes — simple, correct under low/medium load |
| Swallow logging errors silently so redirect never breaks | Yes — uptime over stats |
| `X-Robots-Tag: noindex` on every redirect | Yes — keeps short links out of search indices |
| Truncate UA (255) and referrer (200) before storing | Yes — bounds the log row |
| GeoIP country code stored per-click (for analytics) | Yes — useful, free with MaxMind DB |
| Filterable `redirect_location` and `redirect_code` | Yes — keeps the redirect extensible |
| Graceful header-sent fallback to JS redirect | Yes — robustness |
| Separate `clicks` counter (fast) vs `log` table (detailed) | Yes — counter for hot path, log for analytics |

## What this means for our build

YOURLS gives us a **proven, minimal redirect + click-log core** to model from. But it
is **insufficient on its own** for an affiliate funnel because:

1. **Bots inflate our click counts** → our affiliate analytics would be lies. We *must*
   add a bot filter (Dub, Plausible, and the WordPress Amazon Auto Links plugin will
   each contribute rules for this).
2. **No rate limit on redirect** → a competitor or scraper can drain our Supabase
   connection pool by hammering `/go/{id}`. We *must* add one (Dub's Upstash-based
   limiter is the proven pattern).
3. **No dead-link detection** → Amazon products go out of stock constantly. We need a
   scheduled HEAD-probe job. Amazon Auto Links plugin implements this.
4. **No expiry / disable** → we need an admin "pause this product's redirect" toggle.
   Spree / Solidus product-status rules cover this.
5. **No geo-routing** → affiliate marketplaces route `.com` vs `.co.uk` per visitor
   country for higher conversion. Amazon Auto Links implements this; YOURLS does not.

So YOURLS is the **spine** for engagement 01 (redirect + click log + synchronous
counter update + error swallowing + 301/302 decision). The **other samples in this
engagement (Dub)** will fill in bot filtering, rate limiting, and the high-scale
click-pipeline pattern. Amazon Auto Links (engagement 03) fills in geo-routing and
dead-link detection.

## Confidence

- **confirmed** — every claim above is sourced to `file:line` in `evidence/excerpts.txt`.
- **not proven** — YOURLS's behaviour under load (we did not run it); the absence of
  rate-limit *calls* in source is confirmed, but a server-level (nginx/apache) limiter
  configured by deployers is not visible in this repo. The build must assume the
  application layer provides it.
- **likely** — the `yourls_do_action('log_redirect', $binds)` hook was added in #3990
  (per inline comment) specifically to let plugins do their own logging; this strongly
  suggests the maintainers themselves treat bot filtering as out-of-scope for core.

## Open questions for the next sample (Dub)

1. How does Dub filter bots at 250M clicks/month scale — UA list, behavioural, or both?
2. How does Dub rate-limit the redirect endpoint — Redis token bucket? Per-IP or
   per-link?
3. Does Dub write click events synchronously or via a queue?
4. What is Dub's edge-case handling for dead destination URLs?
