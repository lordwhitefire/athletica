# Feature Cards — Athletica FULL marketplace

**Date:** Mon Nov 16 2026
**Mode:** Plan
**Scope:** Full marketplace. Every surface, every entity, every capability the 7 RE engagements studied. No "later phase."

Template per `blueprint` skill `build-layers.md`: Feature, UI, UX Thread, Data, Business logic, Engine, Evidence, Not seen.

Cards grouped by phase. Build order confirmed.

---

## Phase 1 — Foundation

### Card 1 — Visitor views a product page

```
Feature:        A visitor opens /product/[slug] and sees the product story, images (gallery + carousel), variants, sizes, reviews, and a SHOP PRODUCT CTA.
UI:             4/6 image + 2/6 buy-box desktop; stacked mobile. Gallery in <Suspense>, aspect-square skeleton, cap 5 images. Buy-box: title + (price pill omitted on public page) → variant selector → description → reviews summary → CTA last. generateMetadata (title, desc, OG w/h/alt). JSON-LD schema.org/Product + AggregateOffer (availability flips with PAAPI).
UX Thread:      Phone-first; in-app browser primary. First screen answers DM questions. Loading skeleton, plain 404 for missing/unpublished, greyed CTA when ASIN/tag missing or dead-link. No mock content, no Unsplash fallback.
Data:           rollout.products (status='active', deleted_at IS NULL, available_on <= now). rollout.product_variants (SKU, stock-from-PAAPI). main_image + images[] from Sanity. amazon_product_cache (TTL + error + availability + integer-cents price — NOT displayed publicly).
Business logic: getProductBySlug(slug) returns published only (3-condition gate). View recorded server-side with utm_source + visitor_hash. Bot skipped. Variant availability from PAAPI. Reviews fetched via PAAPI.
Engine:         Next.js Server Component (SSR). getClaims() where applicable. next/image with Sanity domains. Sentry captures render errors.
Evidence:       RE-07 §2.2–2.5; RE-04 §2.3; RE-06 §2.1; RE-03 §2.4 (PAAPI cache + reviews); locked (no-price, SHOP PRODUCT).
Not seen:       Real mobile LCP number. In-app-browser rendering quirks (real-device check needed).
```

### Card 2 — Visitor clicks SHOP PRODUCT → Amazon (with geo-routing)

```
Feature:        A visitor taps SHOP PRODUCT and is redirected to Amazon in their local marketplace with the affiliate tag; the click is recorded and attributed to an affiliate tracker if present.
UI:             CTA is the last element in the buy-box. Active: SHOP PRODUCT, navigates externally. Inactive (missing ASIN/tag, dead-link, out-of-stock): greyed, disabled, "Link coming soon" or "Out of stock", no click recorded.
UX Thread:      No pop-up (blocked in-app). Use /go/[id] server redirect → 302 to Amazon. target="_blank" rel="nofollow noopener". Honest disabled state.
Data:           /go/[id] looks up the product's ASIN + the visitor's marketplace (geo-routed) + the tag for that marketplace + the tracker id (if /go/[id] is an affiliate tracker URL). Click row: timestamp, identity_hash, click_id, link_id, tracker_id (nullable), ip_or_empty, country, region, ua, referer, bot, qr, trigger. Dedup: 1 click/identity/link/hour.
Business logic: IP → country (6-header chain, Cloudflare-trusted first) → marketplace. Amazon URL derived: https://{marketplace.domain}/dp/{ASIN}?tag={marketplace.tag}. NEVER stored. Bot check (6-layer) on click path. EU IP redaction. Identity hash = SipHash64(salt, ua+ip+domain+root_domain). Salt rotates every 90s.
Engine:         Route handler /go/[id]. waitUntil + Promise.allSettled for click write. Upstash sliding-window rate limit (explicit redirect policy, fail-open 1s). X-Robots-Tag: noindex. 302 for user-editable affiliate link. MaxMind GeoIP2 (offline) for geo-routing.
Evidence:       RE-01 YOURLS §2.1–2.2; RE-01 Dub §2.2–2.4; RE-03 §2.1–2.2 + §2.6 (geo-routing); RE-06 §2.1–2.2 + §2.5 (IP chain); RE-07 §2.5.
Not seen:       Real CTR (launch reveals). Amazon PAAPI TPS under our load. Whether the client has Associates tags in multiple marketplaces.
```

### Card 3 — Analytics pipeline (views + clicks + visitor hashing)

```
Feature:        Every view and click is recorded server-side with bot filtering, identity hashing, salt rotation, EU redaction, and drop-reason telemetry.
UI:             No direct UI; feeds the dashboards (Cards 8, 11).
UX Thread:      Invisible to the visitor. Never blocks the redirect.
Data:           rollout.analytics (product_id, event_type, source, visitor_hash BIGINT, tracker_id, created_at). Partitioned by month. Drop-reason enum (bot, spam_referrer, invalid, dc_ip, threat_ip, persist_error).
Business logic: Pipeline order: bot filter (ua-parser-js + Headless Chrome override; unparseable UAs accepted) → enrichment (timestamp, source, tracker) → identity hash (SipHash64) → dedup (Upstash 1h) → EU redaction → persist. Salt rotation: every 90s, current + previous, 48h retention, in-memory cache.
Engine:         waitUntil + Promise.allSettled. Upstash for dedup + salt cache. Scheduled salt-rotation job (Vercel cron, 90s). Drop-reason telemetry → Sentry/Sentry-like grouped count.
Evidence:       RE-06 §2.1–2.7 (entire Plausible pipeline); RE-01 Dub §2.2–2.4 (bot + dedup + EU + waitUntil).
Not seen:       Real bot precision/recall (needs labelled stream). UAInspector → ua-parser-js parity (library swap, not benchmarked).
```

---

## Phase 2 — Storefront

### Card 4 — Visitor browses the storefront homepage

```
Feature:        A visitor lands on / and sees a curated 3-up hero grid, a browse carousel, and a footer.
UI:             ThreeItemGrid (3 curated products, above the fold) → Carousel (horizontal scroller of GridTileImage) → Footer. Black/lemon tokens. generateMetadata (Athletica, OG).
UX Thread:      Leads with editorial curation, not exhaustive listing. Three picks, not twelve. Fast first screen on mobile data. Skeleton tiles while loading.
Data:           rollout.products where status='active' && available. Curated picks (a `featured` flag or a `collections` row). Carousel = recent or category-scoped.
Business logic: getFeaturedProducts(limit=3), getCarouselProducts(limit=N). Views recorded on tile clicks.
Engine:         Next.js Server Component. <Suspense> around grid + carousel. next/image. CDN-cached at the edge.
Evidence:       RE-07 §2.1 (homepage hierarchy); RE-04 §2.1 (collections M2M).
Not seen:       Carousel component internals (RE-07 §4 — likely GridTileImage scroller, not read).
```

### Card 5 — Visitor browses the catalog grid + searches

```
Feature:        A visitor opens /shop, sees a product grid with search, category filter, sort, and pagination.
UI:             Grid of product cards (image, name, CTA hint). Search bar. Faceted filter (category, gender, color). Sort (newest, popular). Pagination (8-12/page).
UX Thread:      Empty = "No products match." Loading = skeleton grid. Failed = error + retry. URL search params as filter state (shareable, back-button works).
Data:           rollout.products + product_variants + categories (M2M). Search index on name, tags, slug.
Business logic: listProducts({query, category, sort, page}) returns published only. Search via Postgres ILIKE (or pg_trgm for fuzzy). Unavailable variants visible-but-disabled.
Engine:         Server Component. URL search params as state (router.replace {scroll:false} on filter change). Pagination via cursor or offset.
Evidence:       RE-07 §2.4 (URL params as state, visible-but-disabled); RE-04 §2.5 (tags); RE-07 §2.1 (grid pattern).
Not seen:       Search relevance tuning (needs real catalog + queries). pg_trgm vs ILIKE performance at catalog scale.
```

### Card 6 — Visitor sees reviews on a product page

```
Feature:        A product page displays the Amazon rating + sample reviews fetched via PAAPI.
UI:             Rating summary (stars, count) + 2-3 review excerpts + "See all on Amazon" link.
UX Thread:      Loading = skeleton. No reviews = omit the section (no fake reviews). Stale cache = show last-known + "refreshing" hint.
Data:           amazon_product_cache.rating, .review_count, .review_samples (JSONB). TTL-based refresh.
Business logic: PAAPI fetch on cache miss/stale. Enable Offers.Listings.Availability.Type (Amazon Auto Links disables — we don't). Store rating + sample reviews in cache.
Engine:         PAAPI client (rate-limited, 1 TPS). Scheduled refresh job (Vercel cron). waitUntil for non-blocking fetch on view.
Evidence:       RE-03 §2.4 (PAAPI cache schema); RE-03 §2.5 (enable availability fields); RE-07 §2.2 (JSON-LD AggregateOffer references rating).
Not seen:       PAAPI review-field availability (Amazon may restrict). Review freshness vs Amazon's actual display.
```

---

## Phase 3 — Admin workspace

### Card 7 — Admin signs in (three locks)

```
Feature:        An admin signs in via invite code → door-key cookie → email/password + JWT role.
UI:             /admin/signin (SSR, split-screen). /admin/signup?code=... (invite-gated). /admin/* → 404 until door-key present.
UX Thread:      Neutral error ("Invalid email or password"). Plain 404 on missing door-key. Sliding renewal (active admins never re-issue).
Data:           rollout.admin_access_keys (kind='invite'|'door', token_hash UNIQUE, user_id, expires_at, used_at, revoked_at). auth.users with app_metadata.role='admin'.
Business logic: Lock 1: invite re-validated at submit. Lock 2: door-key SHA-256, sliding 30d, 404 if invalid. Lock 3: getClaims() checks role='admin'. Fail-silent 404.
Engine:         Per-route requireAdmin() + Next.js middleware (Lock #2 first-line filter). Layered action-client: actionClient → authActionClient → adminActionClient. RLS: admin_access_keys service_role only; FORCE RLS + (select auth.jwt()) wrapper.
Evidence:       RE-05 athletica-own §2.1–2.4; RE-05 NextBase §2.3–2.5.
Not seen:       Invite issuance script (not in repo — document + add). Signin rate limit (add).
```

### Card 8 — Admin manages products + variants + bulk import

```
Feature:        Admin creates/edits/publishes/unpublishes/archives products with variants, categories, collections; bulk-updates status; CSV-imports products.
UI:             /admin/products (search, filter, sort, pagination, add/edit modals). /admin/products/[id]/edit (variants, images, categories, collections). Bulk-action bar (require_ids! + skip count). /admin/import (two-phase CSV wizard).
UX Thread:      Toast on success, confirm on delete/archive. Dirty-state protection. Price optional. Per-row status during import. Empty/loading/error states.
Data:           rollout.products + product_variants + categories (M2M) + collections (M2M). 5-status state machine. deleted_at soft-delete. available_on future-publish.
Business logic: Status transitions in service workflows. discontinue() bypasses validation. Publish gate: active && !deleted && available_on<=now. Bulk: require_ids!, skip proposed/rejected. Two-phase import: mapping → processing, per-row status, grouped COUNT, no delete mid-processing.
Engine:         /api/admin/products + /api/admin/products/[id]. Layered admin action-client. RLS role-based. Sanity upload secured. CSV parse (PapaParse).
Evidence:       RE-04 §2.1–2.8 (entire Spree); RE-05 §2.3 (RLS); Study BLUEPRINT.md (existing admin).
Not seen:       CSV row-processor mapping (RE-04 §4 — located, not read line-by-line).
```

### Card 9 — Admin manages the media library

```
Feature:        Admin uploads, browses, and deletes images in Sanity.
UI:             /admin/media (grid of assets, upload dropzone, asset detail, delete).
UX Thread:      Upload progress. Drag-drop. 5MB limit, JPEG/PNG/WebP/AVIF. Delete confirmation.
Data:           Sanity assets (CDN URLs). rollout.products.main_image + images[] reference the Sanity URLs.
Business logic: Service-role upload to Sanity. Returns _id + url. No public upload route.
Engine:         /api/admin/media/upload + /api/admin/media/assets. Admin-auth secured. Sanity write token server-side.
Evidence:       Study BLUEPRINT.md (Sanity upload); RE-05 §2.1 (auth).
Not seen:       Sanity rate limits at scale.
```

### Card 10 — Admin views the live analytics dashboard

```
Feature:        Admin sees total views, clicks, CTR, per product, per source, per affiliate, 7/30/90 days, payout pipeline — live.
UI:             /admin/analytics. Charts (CTR over time, source split, affiliate leaderboard, payout pipeline status). Live indicator. Date-range selector.
UX Thread:      Live updates (SSE or short-polling). Empty = "No data yet" (no fake zeros). Loading = skeleton. Failed = error + retry.
Data:           rollout.analytics (partitioned by month). affiliate_balance + affiliate_payouts. Drop-reason counts.
Business logic: CTR = clicks/views per product per source per period. Daily uniques = distinct visitor_hash. Affiliate performance = clicks attributed to tracker. Payout pipeline = payouts by status.
Engine:         SSE endpoint (or short-polling fallback on flaky connections). Server Component for initial data. Grouped COUNT queries. Charts dynamic-imported.
Evidence:       RE-06 §2.4 (drop-reason telemetry); RE-07 §2.3 (states); RE-02 §2.1 (affiliate entities).
Not seen:       Real traffic volumes. SSE scalability on Vercel (may need Pro or fallback to polling).
```

---

## Phase 4 — Affiliate program

### Card 11 — Affiliate signs up + onboards

```
Feature:        An affiliate signs up, verifies email, gets admin approval, receives a tracker, and lands on their dashboard.
UI:             /affiliate/signup (multi-step: profile → payout details → terms accept). /affiliate/verify-email. /affiliate/dashboard (on approval).
UX Thread:      Multi-step wizard with progress. Dirty-state protection. Clear "pending approval" state. Email verify before dashboard access.
Data:           affiliate_accounts (email, password, commission default, full_name, address, country, payout_method, payout_instructions, notify_balance, status: pending→active→suspended/closed).
Business logic: Signup creates account (status=pending). Email verify. Admin reviews → status=active. Tracker issued (public tracking code). Ownership-based RLS: affiliate sees only own rows.
Engine:         /api/affiliate/signup + /api/affiliate/dashboard. Affiliate session JWT. RLS: ownership-based (auth.uid() = account_id) + (select auth.uid()) wrapper. Email (separate thread).
Evidence:       RE-02 Raider §2.1 (account entity); RE-05 NextBase §2.2 (ownership RLS); RE-02 Weferral §2.3 (payout details gate).
Not seen:       Email deliverability for verification (depends on SMTP/Resend setup).
```

### Card 12 — Affiliate gets trackers + views balance

```
Feature:        An affiliate creates trackers (one per campaign/backlink), views their balance, and sees click attribution.
UI:             /affiliate/trackers (create, list, copy-link). /affiliate/balance (current due, per-tracker breakdown). /affiliate/clicks (per-tracker, per-day).
UX Thread:      Copy-link button. Balance updates live (SSE). Empty = "No clicks yet."
Data:           affiliate_trackers (id = public tracking code, label, account_id). affiliate_balance (append-only, released flag, trace, tracker_id, amount, currency). affiliate_campaigns (commission_type, reward, recurring, recurring_limit, minimum_payout, payout_term).
Business logic: Tracker URL = /go/[tracker-id] (or /go/[id]?ref=[tracker-id]). Click attributed to tracker at redirect time. Balance = sum of released=false rows for the account. Commission per campaign rules (percentage/fixed, recurring+limit).
Engine:         /api/affiliate/trackers + /api/affiliate/balance. Ownership RLS. SSE for live balance.
Evidence:       RE-02 Raider §2.1 (5-entity model, tracker); RE-02 Raider §2.2 (commission calc); RE-02 Weferral §2.1 (campaign config).
Not seen:       Recurring commission actual payout cadence (per-transaction vs per-month — Weferral UI ambiguous).
```

### Card 13 — Affiliate requests a payout; admin reviews + pays

```
Feature:        An affiliate requests a payout; the admin reviews, schedules, approves/rejects; the affiliate sees the status.
UI:             /affiliate/payouts/request (form: amount, confirm). /affiliate/payouts (history with status). /admin/payouts (review queue: approve/reject/schedule).
UX Thread:      config_failure (missing payout details), amount_neutral (≤0), amount_failure (< minimum), request_success. Payout status visible to both sides.
Data:           affiliate_payouts (number per-account sequential, amount, currency, status enum, scheduled_for, account snapshot). affiliate_balance.released flipped true on schedule.
Business logic: Request: validate details + balance + minimum + payout_term. Flow wrapped in ONE Postgres transaction (balance.released=true UPDATE + payout INSERT). Status: requested → scheduled → paid / → rejected. Counter via SQL (not read-then-write).
Engine:         /api/affiliate/payouts/request + /api/admin/payouts. Transactional service. Email on each transition (separate thread). Scheduled payout-term eligibility check (Vercel cron).
Evidence:       RE-02 Raider §2.5 (payout flow + gaps); RE-02 Weferral §2.3–2.5 (minimum, term, state machine).
Not seen:       Real refund/clawback volume (Amazon-dependent). Tax-doc generation per jurisdiction.
```

---

## Phase 5 — Amazon integration

### Card 14 — Dead-link detection + PAAPI cache refresh

```
Feature:        A scheduled job detects dead/out-of-stock Amazon products and marks them; the CTA greys out on the storefront.
UI:             Dead product → CTA greyed, "Out of stock" or "Link coming soon", no click recorded. Admin sees dead-link flags in /admin/products.
UX Thread:      Honest state. Visitor never sent to a 404 on Amazon.
Data:           amazon_product_cache.expiration_time (TTL) + .error + .availability. products flagged dead via cache state.
Business logic: Three signals: (1) PAAPI availability — Offers.Listings.Availability.Type === "OutOfStock" or empty offers → soft-dead; (2) scheduled HEAD probe of /dp/{ASIN} for errored/stale products — HTTP 404/410 → dead; (3) redirect-time signal — high 4xx rate from outbound Amazon clicks → dead (reactive).
Engine:         Vercel cron (daily). PAAPI payload enables availability fields (Amazon Auto Links disables — we don't). waitUntil for non-blocking probes. Batched + throttled (1 TPS).
Evidence:       RE-03 §2.5 (enable availability) + §2.7 (no dead-link detector — add all three signals).
Not seen:       Amazon's PAAPI rate-limit enforcement under our batch size. HEAD-probe reliability (Amazon may rate-limit).
```

---

## Phase 6 — Hardening

### Card 15 — i18n + legal + handoff

```
Feature:        The storefront + affiliate dashboard localize per visitor/affiliate locale; legal pages exist; the system is documented and handed off.
UI:             Locale switch on URL param (?locale=fr). UI strings localized for the 22 Amazon marketplace locales. /privacy, /terms, /affiliate-agreement, /cookie-notice pages.
UX Thread:      Falls back to English if locale missing. Legal pages linked in footer + affiliate signup.
Data:           marketplaces table (22 locales). UI string catalog (JSON per locale).
Business logic: Locale resolved from URL param → visitor IP → affiliate preference → default English.
Engine:         next-intl (or similar). Static legal pages. Documentation: README, .env.example, changelog, API docs, admin guide, affiliate guide, this blueprint, architect handoff.
Evidence:       RE-03 §2.1 (22 locales); locked (legal: Amazon disclosure, GDPR, privacy, terms).
Not seen:       Translation quality for all 22 locales (English base; others may need human translation).
```

---

## Build order (confirmed — full system)

| Phase | Cards | What ships |
|---|---|---|
| 1 Foundation | 1, 2, 3 | Product page, redirect + click pipeline, analytics pipeline. The loop works. |
| 2 Storefront | 4, 5, 6 | Homepage, catalog browse + search, product page with reviews. Full public surface. |
| 3 Admin workspace | 7, 8, 9, 10 | Three-locks auth, product CRUD + variants + bulk import, media library, live analytics dashboard. |
| 4 Affiliate program | 11, 12, 13 | Affiliate signup + onboarding, trackers + balance, payout request + admin review. |
| 5 Amazon integration | 14 | Dead-link detection + PAAPI cache refresh + availability. |
| 6 Hardening | 15 | i18n, legal, documentation, handoff. |

Each phase ends with a phase gate: the owner reviews before the next phase begins. The full marketplace ships across all six phases.
