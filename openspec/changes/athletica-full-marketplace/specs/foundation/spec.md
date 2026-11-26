# Spec — Foundation (auth + data model + core services)

**Change:** athletica-full-marketplace | **Phase:** 1 | **Tasks:** FM-01…FM-05
**Sources:** `blueprint/01-build-layers.md`, `blueprint/02-engine.md`, RE-05, RE-01, RE-06.

## Intent

The foundation is what every later phase stands on: who can enter the admin door, what shape the data is, how a visitor sees a product, how a click is recorded, and how analytics are computed without ever storing a raw identity.

## Requirements (what must be true after this phase)

**Auth (FM-01):** three independent gates (invite code → door-key cookie → JWT role); any failure → 404 not 401/403. Invite is one-time, SHA-256 hashed, re-validated at submit, 24h expiry. Door-key: HttpOnly, SameSite=Lax, 30-day sliding, SHA-256 hashed, set on both `/admin` and `/api/admin` paths (same value), checked in `src/proxy.ts` for **both `/admin/*` and `/api/admin/*`** (Next 16 refuses a simultaneous `src/middleware.ts`; the door-key check lives in the proxy — merged and `middleware.ts` removed 2026-11-17). JWT role via `getClaims()` (not `getUser()`). `/admin/*` + `/api/admin/*` → 404 until door-key exists. Neutral signin errors. Signin rate limit (Upstash). Invite issuance script in repo.

**Data model (FM-02):** `products` with 5-status enum + `deleted_at` + `available_on` + `discontinue_on` + integer-cents nullable `price`. `product_variants` modeled (single-variant v1 but separate table). `categories` + `collections` (M2M). `analytics` with `source` + `visitor_hash` BIGINT + `tracker_id`, partitioned by month. `admin_access_keys` (`kind`, `token_hash` UNIQUE). `marketplaces` seeded (22 locales). `amazon_product_cache` (composite key, TTL, error, integer-cents, availability, rating, reviews). `affiliate.*` schema (accounts, trackers, campaigns, campaign_trackers, balance append-only with UNIQUE(`account_id`,`trace`), payouts with status + `scheduled_for`). `audit_log`. RLS + `FORCE` + `(select ...)` wrappers everywhere. Amazon URL **never stored**.

**Product page (FM-03):** `/product/[slug]` returns published only (3-condition gate: active + not deleted + available_on ≤ now). Missing/unpublished → plain 404. View recorded server-side with `source` + `visitor_hash`; bots skipped. Renders gallery, title (no price), variant selector, description, SHOP PRODUCT CTA. No mock content. `generateMetadata` (title/desc/OG with w/h/alt). JSON-LD `Product` + `AggregateOffer` (availability flips).

**Redirect + click (FM-04):** `/go/[id]` → 302 to derived `https://{domain}/dp/{ASIN}?tag={tag}` + `X-Robots-Tag: noindex`. Click recorded async via `waitUntil` + `Promise.allSettled`; redirect never fails on stats-write outage. 6-layer bot filter on click path (bots still redirected, click suppressed). Identity hash = SipHash64(salt, ua+ip+domain+root_domain). Dedup 1 click/identity/link/hour (Upstash). EU IP → `ip=""`. Explicit `redirect` rate-limit policy (fail-open 1s). Missing ASIN/tag → CTA greyed, no click.

**Analytics pipeline (FM-05):** salt rotation 90s (current + previous, 48h retention, in-memory cache, `crypto.randomBytes(16)`). Grace window: try current then previous salt. Drop reasons as named enum (`bot, spam_referrer, invalid, dc_ip, threat_ip, persist_error`) + per-reason telemetry. IP resolution 6-header chain (`x-plausible-ip`→`cf-connecting-ip`→`x-forwarded-for`→`b-forwarded-for`→`forwarded`→`conn.remote_ip`), port stripped. Bot filter via maintained UA-parser library + Headless Chrome override; unparseable UAs accepted. Pipeline order: bot → enrich → expensive lookups → shield → persist.

## Behavior boundaries

- The redirect must never fail because a stats write is slow or errors.
- The Creators API is **not** introduced in this phase. The product page runs on owner-entered data only.
- No visitor cookies. No client-side fingerprinting. Visitor identifier computed server-side.
- No `window.open` for the CTA (blocked in-app). Use the `/go/[id]` server redirect.

## What success looks like (phase gate)

- A visitor opens `/product/[slug]`, sees the product, taps SHOP PRODUCT, lands on Amazon with the tag in the URL.
- An unauthenticated request to `/admin/products` returns 404.
- A view + click are recorded with `source` + `visitor_hash`; bots skipped; a second click by the same identity within an hour is deduped.
- The redirect still works if Upstash Redis is down.
- The `analytics` table is partitioned by month; the salt has rotated at least once during a session.
