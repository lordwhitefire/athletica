# Design — athletica-full-marketplace

**Date:** 2026-11-16
**Architect:** openspec-architect (Moment 1)
**Source:** `blueprint/` (full marketplace) + `product-management/04-creators-api-recommendation.md`.

This is the plain-language architecture for the full marketplace. Every decision traces to the blueprint (which traces to the RE engagements). It is **intent**, not implementation detail — the Builder decides how.

---

## 1. The shape

One Next.js 16.3.4 App Router app, deployed on Vercel. Three shells, one codebase:

- **Public storefront** (`/`, `/shop`, `/product/[slug]`, `/go/[id]`, legal pages) — what visitors see.
- **Admin workspace** (`/admin/*`) — the client + delegates manage the marketplace.
- **Affiliate dashboard** (`/affiliate/*`) — affiliates manage trackers, balance, payouts.

One Supabase project, two schemas: `rollout` (products, analytics, admin keys, marketplaces, amazon cache) and `affiliate` (accounts, trackers, campaigns, balance, payouts). Sanity for images. Upstash Redis for rate-limiting, click dedup, and salt cache. Sentry for errors. The Amazon Creators API as an optional booster.

## 2. The data model (intent)

The system stores these things (full list in `blueprint/05-gap-questions.md` D1):

- **Products + variants + categories + collections** — the catalog. Product is the grouping; variant is the purchasable unit (even when single-variant, modeled separately). 5-status state machine (`draft/active/archived` + `proposed/rejected`). Soft-delete via `deleted_at`.
- **Analytics** — views + clicks, partitioned by month, with `source` + `visitor_hash` (BIGINT SipHash64) + `tracker_id`. Never raw IP.
- **Admin access keys** — one table, `kind='invite'|'door'`, SHA-256 hashed tokens, sliding 30-day renewal.
- **Marketplaces** — 22 Amazon locales (slug, domain, associates_url, country_code). Seeded once.
- **Amazon product cache** — composite key `{ASIN}_{locale}|{lang}|{currency}`, TTL `expiration_time`, `error` column, integer-cents prices, availability, rating, reviews. Refreshed only when the Creators API is enabled.
- **Affiliate ledger** — accounts, trackers, campaigns (commission config), balance (append-only, `released` flag, UNIQUE(`account_id`,`trace`)), payouts (status state machine, `scheduled_for`, per-account sequential `number`).
- **Audit log** — actor, action, entity, metadata, timestamp.

**The one rule that shapes everything:** the Amazon URL is **never stored**. It is derived at click time from `ASIN + tag + marketplace`. The product cache stores data *about* the product, never the link.

## 3. The three locks (admin auth, intent)

Three independent gates, each can reject alone:

1. **Invite code** — one-time, hashed, re-validated at submit (prevents race), 24h expiry. Issued out-of-band by the owner.
2. **Door-key cookie** — HttpOnly, SameSite=Lax, Path=/admin, 30-day sliding renewal, SHA-256 hashed. Checked in middleware as a first-line filter. Does not authenticate — only lets the signin page load.
3. **JWT role** — `app_metadata.role === 'admin'`, checked via `getClaims()` (not `getUser()` — saves 50–200ms/page). Set only by the service role.

**Fail-silent 404** on any failure — a 404 conceals the admin surface; a 401/403 confirms it exists. Affiliates use a separate email/password + email-verify + admin-approval flow with ownership-based RLS.

## 4. RLS (intent)

Every table has RLS enabled + `FORCE ROW LEVEL SECURITY` + the `auth.jwt()`/`auth.uid()` expression wrapped in `(select ...)` to cache it once per query (the unwrapped form is a performance bug).

- **Admin tables** (products, analytics, admin keys, cache, marketplaces): role-based — `JWT.app_metadata.role = 'admin'` for write; anon reads published products; anon inserts analytics.
- **Affiliate tables** (accounts, trackers, campaigns, balance, payouts): ownership-based — `auth.uid() = account_id`. An affiliate sees only their own rows.
- **admin_access_keys:** service_role only. No anon/authenticated policy → deny by default.

## 5. The redirect + click pipeline (intent)

`/go/[id]` is the heart. When a visitor taps SHOP PRODUCT:

1. Resolve the visitor's marketplace (IP → country → marketplace, 6-header chain, Cloudflare-trusted first, MaxMind offline).
2. Derive `https://{marketplace.domain}/dp/{ASIN}?tag={marketplace.tag}` — never stored.
3. Return **302** (user-editable affiliate link) + `X-Robots-Tag: noindex`.
4. **Asynchronously** (`waitUntil` + `Promise.allSettled`): 6-layer bot check on the click path → identity hash (SipHash64 with rotating 90s salt) → dedup (1 click/identity/link/hour via Upstash) → EU IP redaction → persist.
5. The redirect **never fails** on a stats-write outage. Uptime wins over analytics accuracy.

Rate-limited per endpoint (Upstash sliding window, fail-open 1s). An explicit `redirect` policy (affiliate bots are aggressive).

## 6. The Creators API (intent — Option B, locked)

**Own data first. API optional.** The owner enters product data via the admin catalog. The Creators API is a background booster, enabled only when the owner has credentials + eligibility:

- Used for: availability checks + reviews (when eligible).
- NOT used for: the core product page (owner data), dead-link detection (HEAD probe + 4xx signal run without it), the redirect (derived from ASIN+tag).
- **Soft-fail:** API unavailable/ineligible/erroring → nothing breaks. The shop runs on owner data. The reviews block hides when there's no data.
- **Limits:** 1 TPS / 8,640/day (grows with API-link revenue). Cache offers ≤ 1h, other data ≤ 1d. Retry with backoff on 429/5xx.
- **Auth:** OAuth credential ID + secret (not AWS keys). Scope `creatorsapi::default`. Partner tag in the request body.

## 7. Dead-link detection (intent)

Three signals, only two always on:

1. **HEAD probe** (scheduled, daily, batched + throttled) — HTTP 404/410 from `/dp/{ASIN}` → mark dead.
2. **Redirect-time 4xx signal** — high 4xx rate from outbound Amazon clicks → dead-link signal (reactive).
3. **Creators API availability** — `Offers.Listings.Availability.Type === "OutOfStock"` or empty offers → soft-dead. **Only when the API is enabled.**

A dead product → CTA greyed + "Out of stock" or "Link coming soon" + no click recorded. The visitor is never sent to a 404 on Amazon.

## 8. The affiliate ledger (intent)

Append-only balance. Commission credited on server-to-server postback (shared bearer token). Payouts are affiliate-initiated, never automatic. The payout flow is **one transaction** (balance.released=true UPDATE + payout INSERT) — Raider's two-step non-transactional flow is the bug we avoid. Status state machine: `requested → scheduled → paid` or `→ rejected`, with `scheduled_for` set on admin approval. Counters use SQL `x = x + 1`, never read-then-write.

## 9. The storefront (intent)

- **Homepage:** curated 3-up hero grid + browse carousel + footer. Editorial curation, not exhaustive listing.
- **Catalog:** `/shop` grid with search + faceted filter + sort + pagination. URL search params as state (shareable, back-button works). Unavailable options visible-but-disabled.
- **Product detail:** 4/6 image + 2/6 buy-box desktop, stacked mobile. Gallery in `<Suspense>`. Buy-box: title + (no price) → variant selector → description → reviews summary → SHOP PRODUCT CTA last. JSON-LD `schema.org/Product` + `AggregateOffer` (availability flips). `generateMetadata` with fallbacks.
- **Phone-first.** In-app browsers (Instagram, WhatsApp) are the primary environment.

## 10. Monitoring, legal, i18n (intent)

- **Sentry:** server + client errors, email alert, PII off. Uptime ping on key URLs. Drop-reason telemetry (named enum, grouped count). Payout-pipeline stuck-request alerts. Creators API error-rate alert.
- **Legal:** Amazon Associates disclosure on every product page. Privacy policy (hashing, Sentry, affiliate data). Cookie notice. GDPR (EU IP redaction + affiliate data deletion on request). Terms + affiliate agreement. Payout tax docs per jurisdiction.
- **i18n:** 22 marketplace locales. URL param switch (`?locale=fr`). English base.

## 11. What the Builder never does without the Architect

- Change the data model shape (additive migrations only; new tables OK, restructuring is not).
- Change the three-locks design or the fail-silent 404 rule.
- Store the Amazon URL.
- Make the Creators API a hard dependency (it is always optional + soft-fail).
- Skip the Tester (every task ships with `testing.md` and gets verified).
- Write code for a task that isn't in the registry.

## 12. Phase gates

Between phases, the owner reviews. The Architect does not start Phase N+1 until the owner says go after Phase N's verification. Inside a phase, one task at a time.
