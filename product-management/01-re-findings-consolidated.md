# RE Findings Consolidated — every rule extracted from the 7 engagements

**Date:** Mon Nov 16 2026
**Source:** `reverse-engineering-workspace/engagements/01–07/*/2026-11-16/report.md` (10 samples, 7 capabilities, all `reported`).
**Purpose:** the single working sheet of rules the Plan-mode blueprint is built from. Every rule cites the engagement report it came from. "Take" = carry into the build. "Do not take" = explicitly reject. "Implication" = a gap the sample exposed that we must fill ourselves.

**Scope note:** the rules below do not change with scope — they are what each engagement proved. What changes between an MVP and the **full marketplace** is which rules are in-scope vs deferred. For the full build, **every "Take" rule is in-scope**; nothing is deferred to a "later phase." The affiliate ledger (RE-02), geo-routing + dead-link detection (RE-03), full catalog model (RE-04), the analytics pipeline (RE-06), and the storefront UX (RE-07) are all built as real subsystems.

This file is evidence, not the deliverable. The deliverable is `blueprint/`.

---

## Engagement 01 — Redirect + click tracking + bot filter + rate limit
**Samples:** YOURLS (MIT), Dub (AGPLv3 — rules only)

### Take

1. **Status code rule (adopt Dub's stance):** 302 for user-editable affiliate links (ASIN/destination may change); 301 only for stable platform links. *Opposite of YOURLS.* — Dub `report.md` §2.1
2. **Synchronous click-write, error-tolerant:** update fast counter + insert detailed log row, both before the redirect, both wrapped in try/catch — the redirect never fails because of a stats-write failure. Uptime wins over analytics accuracy. — YOURLS `report.md` §2.2
3. **Minimal log schema:** `click_time, product_id, referrer, user_agent, ip_address, country_code`. Add `is_bot` (bool) + `affiliate_id` (nullable) on top. — YOURLS `report.md` §2.2
4. **`X-Robots-Tag: noindex`** on every redirect response. — YOURLS `report.md` §2.1
5. **Filterable redirect hook** — keep `redirect_location` and `redirect_code` overridable at runtime (future A/B destination testing). — YOURLS `report.md` §2.1
6. **6-layer bot filter** (run on the click path, not the redirect path — bots still get redirected, only clicks are suppressed): (1) `?bot=` query param, (2) HEAD method, (3a) Next.js `isBot` flag, (3b) UA fragment list (50+ fragments including AI crawlers: `chatgpt`, `anthropic-ai`, `Claude-Web`, `perplexity`, `Applebot-Extended`), (3c) false-positive sanitizer (strip `Google/google` before matching — Instagram in-app webview on Pixel is the canonical false positive), (4) Referer regex, (5a) IP exact, (5b) IP CIDR. — Dub `report.md` §2.2
7. **Per-endpoint rate-limit policy map** `{attempts, window, keyPrefix, message?}` via Upstash sliding window, `timeout: 1000` (fail-open if Redis doesn't respond in 1s). Redirects are never blocked by rate-limiter failure. Add an **explicit `redirect` policy** (Dub doesn't have one — affiliate bots are more aggressive than short-link bots). — Dub `report.md` §2.3
8. **Click dedup via identity hash + Redis 1h window:** 1 click per identity per link per hour. The single most important rule for honest affiliate analytics. — Dub `report.md` §2.4
9. **EU IP redaction** (GDPR): if `geo.country` in EU_COUNTRY_CODES, set `ip = ""`. — Dub `report.md` §2.4
10. **`waitUntil` + `Promise.allSettled` click pipeline:** redirect returns immediately; click recording continues in the background; any one operation can reject without breaking the others. Make the click path failure-isolated from the redirect path. — Dub `report.md` §2.4
11. **Branded not-found page** instead of silent 302-to-homepage (YOURLS) or bare 404. — Dub `report.md` §2.1
12. **Expiry / disable / `expiredUrl` 302** — affiliate products go out of stock; the link needs an expiry/disable path. — Dub `report.md` §2.6
13. **Cache-miss writeback via `ev.waitUntil`** — never block the response on cache repopulation. — Dub `report.md` §2.5

### Do not take

- The Tinybird + PlanetScale + Upstash Streams + Axiom stack — overkill. Postgres + Upstash Redis + a partitioned `click_events` table scales to millions of clicks/month. — Dub `report.md` §5
- The full 30-field click row — slim to ~12 for v1: `timestamp, identity_hash, click_id, link_id, ip_or_empty, country, region, ua, referer, bot, qr, trigger`. — Dub `report.md` §5
- YOURLS's assumption that bot filtering is somebody else's problem. — YOURLS `report.md` §2.3
- YOURLS's absence of redirect-endpoint rate limiting. — YOURLS `report.md` §2.4
- YOURLS's lack of dead-link detection and expiry. — YOURLS `report.md` §2.6–2.7

---

## Engagement 02 — Affiliate tracking + commissions + payout
**Samples:** Raider (MPL-2.0 — rules only), Weferral (MIT — UI contract only, backend not in repo)

### Take

1. **5-entity data model:** `account, tracker, balance, payout` (+ `account_recovery`). Minimal, proven in production. — Raider `report.md` §2.1
2. **`balance` as an append-only ledger** with `released` flag — audit-friendly, easy to sum, easy to lock for payout. — Raider `report.md` §2.1
3. **Commission configuration on the campaign, not the affiliate** (Weferral's richer model). One affiliate can be in multiple campaigns with different rates, types, and terms. — Weferral `report.md` §2.1
4. **Decouple `reward_type` (cash vs discount) from `commission_type` (percentage vs fixed).** Two-step selection; the `reward` field's meaning depends on `commission_type`. — Weferral `report.md` §2.1
5. **Recurring commission as toggle + nullable `recurring_limit`.** `NULL` = lifetime. Do not add a separate lifetime boolean. — Weferral `report.md` §2.2
6. **Per-campaign `minimum_payout`** with a global default in config. — Weferral `report.md` §2.3
7. **Per-campaign `payout_term`** (net-30 etc.) — delays payout eligibility, protects against refund clawbacks within the term window. — Weferral `report.md` §2.4
8. **`trace` field for caller-supplied idempotency** — enforce UNIQUE on `(account_id, trace)` or `(tracker_id, trace)` in Postgres (Raider doesn't). — Raider `report.md` §2.3
9. **Payout `number` per-account sequential** — affiliate-facing invoice numbers. — Raider `report.md` §2.5
10. **FX normalization at insert time** — store one currency, simplify reporting. — Raider `report.md` §2.2
11. **Server-to-server postback with shared bearer token** for the conversion API. No browser-side pixel for the conversion event. — Raider `report.md` §2.3
12. **Email on a separate thread** — never block the API on email. — Raider `report.md` §5
13. **Payout is affiliate-initiated, never automatic.** No scheduled payout job. — Raider `report.md` §2.5
14. **Payout status state machine:** `requested → scheduled → paid` and `→ rejected`, with `scheduled_for` set when the admin approves and picks a payment date. — Weferral `report.md` §2.5

### Do not take / implications (fill the gaps Raider left)

- **Non-atomic counter pattern (Raider bug):** NEVER do read-then-increment in app code. Use SQL `UPDATE tracker SET statistics_signups = statistics_signups + 1 WHERE id = ?`. — Raider `report.md` §2.4
- **Two-step payout without a transaction (Raider bug):** wrap the `balance.released = true` UPDATE and the `payout` INSERT in a single Postgres transaction. — Raider `report.md` §2.5
- **No payout status state machine (Raider gap):** add the real one (rule 14 above). — Raider `report.md` §2.6
- **No refund handling (Raider gap):** support commission reversals (Amazon claws back on returns). — Raider `report.md` §5
- **No browser attribution (Raider gap):** layer Dub's click pipeline (engagement 01) on top. — Raider `report.md` §5
- **No recurring / lifetime commissions (Raider gap):** take from Weferral (rule 5 above). — Raider `report.md` §5

---

## Engagement 03 — ASIN → Amazon URL + marketplace routing + dead-link
**Sample:** Amazon Auto Links (GPL-2.0+ — rules only)

### Take

1. **The 22-marketplace host map.** Seed a `marketplaces` table with all 22 locales and their 5 fields each: `sSlug, sLocaleNumber, sDomain, sAssociatesURL, country_code` (ISO 3166 — note `UK` → `GB`). Locales: `AE AU BE BR CA CN DE EG ES FR IN IT JP MX NL PL SA SE SG TR UK US`. — `report.md` §2.1
2. **Canonical product URL:** `https://{domain}/dp/{ASIN}?tag={associate_id}`. One builder function, one source of truth. — `report.md` §2.2
3. **The Locale_Base pattern:** one function that knows how to build every Amazon URL surface (product, reviews, best sellers, add-to-cart, rating widget, no-image fallback). One place to change if Amazon changes URL format. — `report.md` §2.2
4. **Associate tag as query param** (`?tag=`), never path segment. — `report.md` §2.3
5. **Product cache schema** with `expiration_time` TTL + `error` column + **integer-cents prices** (no floating-point money) + composite key `{ASIN}_{locale}|{lang}|{currency}`. Same ASIN can exist in multiple locales as separate rows. — `report.md` §2.4

### Do not take / implications (fill the gaps)

- **PAAPI availability disabled (Amazon Auto Links gap):** enable `Offers.Listings.Availability.Type` and `Availability.Message` in our PAAPI payload. If `Type === "OutOfStock"` or offers list empty, mark soft-dead. — `report.md` §2.5
- **No dead-link detection (gap):** add (1) PAAPI availability check, (2) scheduled HEAD probe of `/dp/{ASIN}` for products whose PAAPI fetch errored or `expires_at` is far past (batch + throttle — beware Amazon rate limits), (3) redirect-time signal: high rate of HTTP 4xx from outbound Amazon clicks → dead-link signal (reactive). — `report.md` §2.7
- **No geo-routing (gap — the plugin's is a deprecated stub):** implement real visitor-IP → marketplace routing. Cloudflare `/cdn-cgi/trace` (if behind Cloudflare) or MaxMind GeoIP2 (offline, no third-party dependency) are the strongest choices. — `report.md` §2.6
- **Six historical link styles:** only need the current one (`?tag=`). Discard the rest. — `report.md` §2.3
- **WordPress integration** (hooks, shortcodes, widgets) — irrelevant to Next.js. — `report.md` §5

---

## Engagement 04 — Product catalog + admin CRUD + bulk import
**Sample:** Spree (BSD-3 — rules only, Ruby → TypeScript)

### Take

1. **Product + Variant as separate entities**, even for single-variant affiliate products (model from day one). — `report.md` §2.1
2. **5-status state machine:** `draft / active / archived` (operator-set, bulk-updateable) + `proposed / rejected` (review only, NOT bulk-updateable). Default on create: `draft`. — `report.md` §2.2
3. **3-condition publish gate:** `available? = (status == 'active') && (deleted_at IS NULL) && (available_on IS NULL OR available_on <= now)`. The `available_on` field enables future-publish scheduling without a cron job. — `report.md` §2.3
4. **Status transitions in service workflows**, not model methods. Side-effects (events, notifications, cache invalidation) in the workflow. — `report.md` §2.2
5. **`discontinue()` action** that bypasses validation (`save(validate: false)`), sets `discontinue_on = now`, `status = 'archived'`. A sold product can be discontinued even if stale validations no longer pass. — `report.md` §2.4
6. **Soft-delete via `deleted_at` column.** Default query scope excludes deleted. — `report.md` §2.5
7. **Tags scoped per-tenant** (composite index on `(store_id, tag)`). — `report.md` §2.5
8. **Bulk operations as a shared module**, not duplicated per entity. All guarded by `require_ids!` (validates the `ids` array is present and non-empty — no accidental "destroy everything" by passing empty array). Skip-counting in response ("N products skipped"). — `report.md` §2.6–2.7
9. **Two-phase CSV import:** MAPPING (parse + validate rows in memory) → PROCESSING (persist to DB). Separates "is the data shape right?" from "did the DB writes succeed?" Per-row status. Grouped COUNT for progress ("10,000 rows: 9,998 completed, 1 failed") in one query. No delete mid-processing. — `report.md` §2.8

### Do not take

- Multi-vendor seller/submission workflow — we're the only seller in v1. — `report.md` §5
- Spree's full checkout/payments/shipping/tax logic — Amazon handles money. — `report.md` §5
- The Rails admin dashboard UI — we model our own. — `report.md` §5
- The `acts_as_paranoid` / `acts_as_taggable` gems directly — re-implement the patterns in Postgres + TypeScript. — `report.md` §5

---

## Engagement 05 — Multi-lock admin auth + RLS-at-DB
**Samples:** athletica/rollout (own — documented), NextBase (MIT — comparison)

### Take (keep from our own three-locks design)

1. **Three independent locks:** invite code → door-key cookie → JWT role. Each rejects independently. Defense in depth. — athletica-own `report.md` §2.1
2. **One `admin_access_keys` table** for both invite codes and door keys, distinguished by `kind` CHECK constraint (`'invite'` / `'door'`). — athletica-own `report.md` §2.4
3. **SHA-256 hash all tokens** before storage. Never persist raw tokens. — athletica-own `report.md` §2.1
4. **Re-validate invite codes at submit time** (query `kind='invite' AND used_at IS NULL AND revoked_at IS NULL AND expires_at > now()`) — prevents race conditions where two browsers redeem the same code. — athletica-own `report.md` §2.1
5. **Sliding renewal on door keys** (30 days on each valid check). Active admins never re-issue; idle admins expire. — athletica-own `report.md` §2.1
6. **Fail closed + fail silent: 404, not 401/403.** A 404 says "this URL doesn't exist"; an attacker probing cannot distinguish a real-but-protected URL from a non-existent one. — athletica-own `report.md` §2.1
7. **Role in JWT `app_metadata.role`**, not a separate `admins` table. No extra DB lookup. Only service_role can write `app_metadata`. — athletica-own `report.md` §2.1
8. **Per-route `requireAdmin()` one-liner.** Optionally add Next.js middleware for the door-key check (Lock #2) as a first-line filter. — athletica-own `report.md` §2.2
9. **RLS enabled on every table, deny-by-default.** `products`: anon SELECT where published; authenticated ALL where `JWT.app_metadata.role = 'admin'` (USING + WITH CHECK). `analytics`: anon INSERT only; authenticated SELECT where role=admin. `admin_access_keys`: service_role only (no anon/authenticated policy → deny by default). — athletica-own `report.md` §2.3
10. **Neutral error messages** ("Invalid email or password" regardless of whether the email exists) — no user enumeration. — athletica-own `report.md` §2.5
11. **Cookie config:** HttpOnly, SameSite=Lax, Path=/admin, Max-Age 30d, Secure if https. — athletica-own `report.md` §2.1

### Take (from NextBase — the optimizations our three-locks was missing)

12. **Fix the RLS performance bug:** wrap `auth.jwt()` in `(select ...)` in every policy to cache the result once per query, not per row. Our unwrapped version is slow on large tables. — NextBase `report.md` §2.3
13. **Use `FORCE ROW LEVEL SECURITY`** on sensitive tables (admin_access_keys, products, analytics). Without FORCE, the table owner (postgres role in Supabase) bypasses RLS. — NextBase `report.md` §2.3
14. **Use `getClaims()` in the auth gate** (`requireAdmin` / `validateDoorKey`), not `getUser()`. Eliminates a 50–200ms network call per admin page load. Use `getUser()` only when the full user object is needed. — NextBase `report.md` §2.4
15. **Layered action-client pattern:** `actionClient → authActionClient (requires session) → adminActionClient (requires role=admin)`. Cleaner than inline `if (admin.response) return admin.response;` per route. — NextBase `report.md` §2.5
16. **`SECURITY DEFINER` functions** in a private schema for complex membership checks (team/org — if added later). Always include `auth.uid()` inside the body. Revoke EXECUTE from public roles. — NextBase `report.md` §2.3
17. **Centralize Lock #2 (door-key) in middleware**, keep Lock #3 (JWT role) per-route. — NextBase `report.md` §2.1
18. **Role-based RLS for admin tables; ownership-based for any future user-scoped tables** (e.g. an affiliate's own dashboard). — NextBase `report.md` §2.2

### Implications (gaps in our own design)

- **Invite-code issuance script** is not in the repo — the validation/redeem path is proven, the issuance path is not. Document and add it. — athletica-own `report.md` §4
- **Rate limiting on the signin endpoint** — Upstash Redis is in deps but not seen in the signin route. Confirm and add if missing. — athletica-own `report.md` §4

---

## Engagement 06 — Privacy-first click analytics + visitor hashing
**Sample:** Plausible (AGPLv3 — rules only)

### Take

1. **Visitor hash formula:** `SipHash64(salt, user_agent + remote_ip + domain + root_domain + replay_session_id)`. Include the site domain so the same visitor on two of our sites gets two different hashes (cross-site unlinkability). — `report.md` §2.1
2. **Salt rotation:** every 90 seconds (configurable). Two valid salts at any time (`current` + `previous`) for the grace window. Salt generation: 16 random bytes via `crypto.randomBytes(16)`. Delete salts older than 48h. Cache in memory (module-level Map + refresh timer). — `report.md` §2.2
3. **Grace window:** hash with `current`; if no session matches, retry with `previous`. One-rotation (90s) grace where a visitor whose salt rotated between two events is still linked. — `report.md` §2.2
4. **Hash storage:** `BIGINT` in Postgres (not hex string — ~50% smaller, faster to index/join). — `report.md` §2.1
5. **Bot filter:** use a maintained UA-parser library (e.g. `ua-parser-js` for Node) that classifies bot vs client. Add explicit override for Headless Chrome. Do NOT drop unparseable UAs — accept them (rather over-count than under-count a real visitor with an odd UA). — `report.md` §2.3
6. **Drop reasons as a named enum**, telemetry per reason (count "N dropped for bot, M for dc_ip, K for spam_referrer" in one grouped query). At minimum: `bot, spam_referrer, invalid, dc_ip, threat_ip, persist_error`. — `report.md` §2.4
7. **IP resolution priority chain (6 headers):** `x-plausible-ip` → `cf-connecting-ip` → `x-forwarded-for` (first IP) → `b-forwarded-for` → `forwarded` (RFC 7239) → `conn.remote_ip`. Order matters — a spoofed `x-forwarded-for` must NOT override Cloudflare's `cf-connecting-ip` when behind Cloudflare. Strip the port from IPv4/IPv6. — `report.md` §2.5
8. **Client payload: minimal** — name, URL, referrer, props, hostname. No client-side cookies, no fingerprinting. The visitor identifier is computed SERVER-SIDE. — `report.md` §2.6
9. **Pipeline order:** bot filter (cheap) → enrichment → expensive lookups (GeoIP) → shield checks → persistence. Composable small functions; each returns enriched or dropped event. — `report.md` §2.7
10. **Exclusion rules:** client-side path matcher (`/admin/*`) + `localStorage.plausible_ignore` opt-out flag. — `report.md` §2.6

### Do not take

- The ClickHouse dependency — Postgres with a partitioned `events` table scales to millions of events/month. Add ClickHouse only if we hit a real bottleneck. — `report.md` §5
- The Phoenix/Elixir stack — we're on Next.js + Supabase. — `report.md` §5
- The EE-licensed features (session replay) — out of scope. — `report.md` §5

---

## Engagement 07 — Storefront UX (product grid, detail page, "Buy on Amazon" CTA)
**Sample:** Vercel Commerce (MIT)

### Take

1. **Homepage hierarchy:** curated 3-up hero grid (above the fold) → browse carousel (below) → footer. Lead with editorial curation, not exhaustive listing. Three picks, not twelve. — `report.md` §2.1
2. **Product detail layout:** 4/6 image + 2/6 buy-box on desktop; stacked (`flex-col` → `flex-row` at `lg`) on mobile. Gallery in `<Suspense>` with aspect-square skeleton fallback, capped at 5 images, `max-h-[550px]`. — `report.md` §2.2
3. **Buy-box composition (4 stacked elements):** (1) title (h1) + price pill in a `border-b pb-6` container, (2) variant selector if applicable, (3) description (rendered HTML via Prose), (4) CTA button — the LAST element, at the bottom. — `report.md` §2.3
4. **Price as a pill/badge** (rounded-full), not inline text. — `report.md` §2.3
5. **`generateMetadata` async function** with fallbacks (`seo.title || title`). SEO visibility is **tag-based** (`HIDDEN_PRODUCT_TAG` controls `robots.index`), not a status enum — a product can be published but hidden from search. — `report.md` §2.2
6. **OpenGraph image with explicit width/height/alt** (essential for OG previews). — `report.md` §2.2
7. **JSON-LD `schema.org/Product` with `AggregateOffer`** on every product page. Google uses this for rich results. `availability` flips between `InStock` / `OutOfStock` based on `availableForSale`. — `report.md` §2.2
8. **URL search params as variant state** (`?size=M&color=blue`), not React state. Shareable URLs, working back button, server-component readable. — `report.md` §2.4
9. **Unavailable options visible-but-disabled:** `aria-disabled`, `disabled`, strike-through CSS, title "Out of Stock". — `report.md` §2.4
10. **`router.replace` with `{ scroll: false }`** on variant change — changing the variant does NOT scroll the page. — `report.md` §2.4
11. **`<BuyOnAmazon>` CTA replacing `<AddToCart>`:** external link, `target="_blank" rel="nofollow noopener"` (security + Amazon Associates compliance), records a click event per engagement 01's rules (bot check, dedup, identity hash, EU IP redaction), disabled state mirrors the OOS pattern. — `report.md` §2.5
12. **Affiliate buy-box is simpler than Vercel's:** (1) title + price pill, (2) NO variant selector (single-variant affiliate products), (3) description, (4) `<BuyOnAmazon>` button. — `report.md` §2.5

### Do not take

- The Shopify GraphQL integration — we use Amazon. — `report.md` §5
- The cart + checkout flow — we redirect to Amazon, no cart. — `report.md` §5
- The full navbar / search / footer — extract pattern only. — `report.md` §5

---

## Cross-engagement constraints (carried forward from the locked product decisions)

These predate the RE findings but are product constraints the owner already locked; they stand:

- **No price on the product page** (Amazon Associates policy forbids hand-typed prices; the live price is on Amazon). CTA says **SHOP PRODUCT**. Greyed out + disabled when ASIN or tag is missing; no click recorded.
- **Phone-first; PC must work.** In-app browsers (Instagram, WhatsApp) are the primary environment for the public storefront.
- **Plain 404** for `/` (no homepage at root — the homepage lives at `/shop` or similar; root is a 404 or a redirect to the storefront).
- **Sentry** for error monitoring (server + client, email alert, PII off). A free uptime ping on key URLs is still recommended.
- **Images live in Sanity.** Supabase stores only the image link. The Sanity write token stays server-side.
- **Admin auth = three locks** (invite + door-key + JWT role). Server-side `getClaims()` on every admin route. No permanent route that can create admins.
- **Server-side counting.** Views and clicks recorded on the server; known bots skipped; visitor hash = SipHash64(salt, ua+ip+domain+root_domain); only the hash saved, never the raw IP.
- **Amazon owns the transaction.** We are an affiliate marketplace, not a retailer — no cart, no checkout, no payment processing, no inventory, no shipping, no order management on our side. The CTA redirects to Amazon.
- **No mobile app.** Full web software. Mobile-app surfaces (app store, push, device, offline-mobile, deep links) are Not applicable.

**What is IN scope for the full build (was deferred in the MVP, now built):**
- Affiliate program (accounts, trackers, campaigns, balance, payouts) — RE-02.
- Geo-routing to 22 Amazon marketplaces — RE-03.
- Dead-link detection (PAAPI availability + scheduled HEAD probe + redirect-time signal) — RE-03.
- Full product catalog with variants, homepage, browse, search, categories — RE-04, RE-07.
- Reviews (via PAAPI) on product pages — RE-03, RE-07.
- Affiliate onboarding + self-serve signup — RE-02.
- Live analytics dashboard — RE-06, RE-07.
- i18n for marketplace locales — RE-03.

---

## What this gives the blueprint

Every Plan-mode decision in `02-area-decisions-evidence.md` and every layer section in `blueprint/` cites a rule from this file by engagement number. No rule is invented; every rule traces to a `report.md` `file:line` or a locked product constraint.
