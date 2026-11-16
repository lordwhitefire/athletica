# 01 — Build Layers

**Blueprint:** Athletica (FULL MARKETPLACE)
**Mode:** Plan
**Study order:** UI → Data → Business logic → Functionality
**Build order (confirmed 2026-11-08):** Functionality → Business logic → Data → UI

The UX Thread runs through every layer. Each layer ends with its UX Thread question, answered.

---

## Layer 1 — UI

### Decided

- **Storefront:** `/` = homepage (3-up hero grid + carousel + footer). `/shop` = catalog grid (search + filter + sort + pagination). `/product/[slug]` = detail. `/go/[id]` = affiliate redirect. *(RE-07 §2.1)*
- **Product detail layout:** 4/6 image + 2/6 buy-box desktop; stacked mobile. Gallery in `<Suspense>`, aspect-square skeleton, cap 5 images, max-h-550px. Buy-box: title + (price pill omitted publicly) → variant selector → description → reviews summary → SHOP PRODUCT CTA last. *(RE-07 §2.2–2.3; locked)*
- **CTA states:** active (ASIN + tag + live) → SHOP PRODUCT → `/go/[id]` → Amazon; inactive (missing ASIN/tag, dead-link, out-of-stock) → greyed, disabled, "Link coming soon" or "Out of stock", no click. *(locked)*
- **Visual system:** black/lemon, Tailwind v4, `admin.css` dark. Price as pill (admin only). *(Study BLUEPRINT.md)*
- **Variant selector:** URL search params as state (`?size=M&color=blue`). Unavailable options visible-but-disabled (strike-through + "Out of Stock"). `router.replace {scroll:false}` on change. Single-variant products → no selector. *(RE-07 §2.4)*
- **Admin UI:** `/admin/products` (+ variants, bulk), `/admin/categories`, `/admin/collections`, `/admin/media`, `/admin/analytics` (live), `/admin/affiliates`, `/admin/payouts`, `/admin/settings`, `/admin/signin` + `/admin/signup`. *(Study BLUEPRINT.md; RE-04)*
- **Affiliate UI:** `/affiliate/signup` (multi-step), `/affiliate/verify-email`, `/affiliate/dashboard`, `/affiliate/trackers`, `/affiliate/balance`, `/affiliate/payouts`. *(RE-02)*
- **Reuse:** toast, confirm-dialog, action-state helper. *(Study BLUEPRINT.md)*

### Build (in UI order)

1. Storefront layout + homepage (ThreeItemGrid + Carousel + Footer). *(RE-07 §2.1)*
2. Product detail page with gallery, variant selector, reviews, JSON-LD, generateMetadata. *(RE-07 §2.2)*
3. Catalog grid with search + filter + sort + pagination (URL params as state). *(RE-07 §2.4)*
4. Greyed CTA component. *(locked)*
5. Admin workspace shell + all admin pages. *(RE-04)*
6. Affiliate dashboard shell + all affiliate pages. *(RE-02)*
7. 404 states (root, missing, unpublished). *(locked)*
8. i18n locale switch. *(RE-03 §2.1)*

### UX Thread (UI)

*For every screen, what does it look like when empty, loading, failed, successful?*
- Storefront: loading = skeleton tiles; failed = error + retry; empty = "No products yet."
- Product page: loading = gallery + buy-box skeleton; failed = plain 404; success = full story + active/greyed CTA.
- Admin list: empty = "No products" + add; loading = skeleton rows; failed = error toast.
- Analytics: empty = "No data yet" (no fake zeros); loading = skeleton; live = SSE updates.
- Affiliate balance: empty = "No clicks yet"; live = balance updates.

### Areas that live here

03 (Decided) · 04 (Decided) · 09 (Decided) · 10 (Decided) · 12 (Decided) · 23 (Decided) · 79 (Decided).

---

## Layer 2 — Data

### Decided

**Entities (all modeled from day one):**

- `rollout.products` — id TEXT PK, slug UNIQUE, name, status (`draft/active/archived/proposed/rejected`), gender, color, asin, sku, main_image (Sanity URL), images[], collection, tagline, subtitle, intro, key_benefits JSONB, technical_details, meta JSONB, tags[], box_contents, sizes[], sizes_detail, deleted_at, available_on, discontinue_on, timestamps. *(Study BLUEPRINT.md; RE-04 §2.1–2.5)*
- `rollout.product_variants` — id UUID, product_id, sku UNIQUE, price (integer cents, nullable), attributes JSONB, status, deleted_at. Multi-variant from day one. *(RE-04 §2.1)*
- `rollout.categories` + `rollout.product_categories` (M2M) + `rollout.collections` + `rollout.product_collections` (M2M). *(RE-04 §2.1)*
- `rollout.analytics` — id UUID, product_id, event_type (`view`/`click`), source, visitor_hash BIGINT, tracker_id (nullable), created_at. Partitioned by month. *(RE-01 §2.2; RE-06 §2.1)*
- `rollout.admin_access_keys` — id UUID, kind (`invite`/`door`), user_id, token_hash UNIQUE, browser_label, issued_at, expires_at, used_at, revoked_at. *(RE-05 §2.4)*
- `marketplaces` — slug, locale_number, domain, associates_url, country_code (22 rows). *(RE-03 §2.1)*
- `amazon_product_cache` — product_id (composite `{ASIN}_{locale}|{lang}|{currency}`), asin, locale, modified_time, expiration_time (TTL), title, price (integer cents), price_formatted, currency, rating, review_count, review_samples JSONB, is_prime, is_adult, error, availability, delivery_free_shipping, delivery_fba. *(RE-03 §2.4)*
- `affiliate.accounts` — id UUID, email, password_hash, commission_default, full_name, address, country, payout_method, payout_instructions, notify_balance, status (`pending/active/suspended/closed`), timestamps. *(RE-02 Raider §2.1)*
- `affiliate.trackers` — id (varchar, public tracking code), label, account_id, timestamps. *(RE-02 Raider §2.1)*
- `affiliate.campaigns` — id UUID, commission_type (`percentage`/`fixed`), reward, recurring (bool), recurring_limit (nullable, NULL=lifetime), minimum_payout, payout_term, timestamps. *(RE-02 Weferral §2.1–2.4)*
- `affiliate.campaign_trackers` (M2M) — campaign_id, tracker_id. *(RE-02 Weferral §2.1)*
- `affiliate.balance` — id UUID, account_id, tracker_id, campaign_id, amount, currency, released (bool), trace (nullable), created_at. Append-only. UNIQUE(`account_id`, `trace`). *(RE-02 Raider §2.1–2.3)*
- `affiliate.payouts` — id UUID, account_id, number (per-account sequential), amount, currency, status (`requested/scheduled/paid/rejected`), scheduled_for, created_at, updated_at. *(RE-02 Raider §2.5; RE-02 Weferral §2.5)*
- `audit_log` — id UUID, actor_id, action, entity_type, entity_id, metadata JSONB, created_at. *(RE-04 §2.2 lifecycle events)*

**Rules:**

- Amazon URL **never stored** — derived at click time. *(RE-03 §2.2)*
- `price` stored as integer cents; **never displayed** publicly. *(locked; RE-03 §2.4)*
- Visitor hash: `SipHash64(salt, ua + ip + domain + root_domain)` — BIGINT. *(RE-06 §2.1)*
- Salt rotation: every 90s; current + previous; 48h retention; in-memory cache. *(RE-06 §2.2)*
- Soft-delete via `deleted_at`; default scope excludes. *(RE-04 §2.5)*
- Tags scoped per-schema. *(RE-04 §2.5)*
- UTC for all timestamps. *(RE-03 §2.1)*
- RLS on every table: admin tables role-based (`JWT.role='admin'`); affiliate tables ownership-based (`auth.uid()=account_id`). `FORCE ROW LEVEL SECURITY` + `(select auth.jwt())` / `(select auth.uid())` wrappers everywhere. *(RE-05 §2.3; RE-05 NextBase §2.2–2.3)*

### Build (in Data order)

1. Migrations: `product_variants`, `categories`, `collections`, M2M junctions. *(RE-04 §2.1)*
2. Migration: `analytics` gains `source`, `visitor_hash`, `tracker_id`; partition by month. *(RE-06; RE-01)*
3. Migration: `products` gains `deleted_at`, `available_on`, `discontinue_on`, `status` enum. *(RE-04 §2.2–2.5)*
4. Seed `marketplaces` (22 rows). *(RE-03 §2.1)*
5. Create `amazon_product_cache`. *(RE-03 §2.4)*
6. Create `affiliate.*` schema (accounts, trackers, campaigns, campaign_trackers, balance, payouts). *(RE-02)*
7. Create `audit_log`. *(RE-04 §2.2)*
8. RLS rewritten: `FORCE` + `(select ...)` wrappers; ownership-based for affiliate tables. *(RE-05 NextBase §2.2–2.3)*

### UX Thread (Data)

*No data yet, or slow?*
- No products: storefront empty state. No clicks: "No clicks yet." Dead Amazon cache: greyed CTA. Stale dashboard: skeleton + "loading."

### Areas that live here

49 (Decided — single tenant, schema isolation + ownership RLS for affiliate) · 52 (Decided) · 59 (Decided — soft delete) · 62 (Decided — UTC). Gap D1–D9 (all Decided — see `05-gap-questions.md`).

---

## Layer 3 — Business logic

### Decided (rules as "when X, then Y")

- **When** a visitor opens `/product/[slug]`, **then** returned only if `status='active' AND deleted_at IS NULL AND available_on <= now`. *(RE-04 §2.3)*
- **When** a visitor clicks SHOP PRODUCT, **then** `/go/[id]` resolves the visitor's marketplace (geo-routed), derives `https://{domain}/dp/{ASIN}?tag={tag}`, returns 302. URL never stored. *(RE-03 §2.2)*
- **When** the ASIN/tag missing OR dead-link OR out-of-stock, **then** CTA greyed; no click recorded. *(locked; RE-03 §2.7)*
- **When** a click is recorded, **then**: 6-layer bot check on click path → identity hash (SipHash64) → dedup (1h) → EU redaction → `waitUntil` write. *(RE-01 Dub; RE-06)*
- **When** an admin hits `/admin/*`, **then** three locks (door-key → JWT role via `getClaims()`) → fail-silent 404. *(RE-05; RE-05 NextBase)*
- **When** an affiliate hits `/affiliate/*`, **then** ownership-based RLS (`auth.uid() = account_id`) → redirect to login if no session. *(RE-05 NextBase §2.2)*
- **When** a product is discontinued, **then** `discontinue()` bypasses validation, sets `discontinue_on`, `status='archived'`. *(RE-04 §2.4)*
- **When** a bulk status update runs, **then** `require_ids!` + skip proposed/rejected + count skipped. *(RE-04 §2.6)*
- **When** a CSV import runs, **then** two-phase (mapping → processing), per-row status, grouped COUNT, no delete mid-processing. *(RE-04 §2.8)*
- **When** an affiliate conversion postback arrives, **then**: bearer token verified → commission = amount × campaign.reward (or fixed) → FX-normalized → balance INSERT (`released=false`) → UNIQUE(`account_id`,`trace`) dedup. *(RE-02 Raider §2.2–2.3)*
- **When** an affiliate requests a payout, **then**: config_failure / amount_neutral / amount_failure / request_success; flow wrapped in ONE transaction (balance.released=true + payout INSERT). *(RE-02 Raider §2.5; RE-02 Weferral §2.3)*
- **When** a payout transitions, **then**: `requested → scheduled → paid` or `→ rejected`; `scheduled_for` set on approval. *(RE-02 Weferral §2.5)*
- **When** a counter increments, **then** SQL `x = x + 1` (never read-then-write). *(RE-02 Raider §2.4)*
- **When** the dead-link job runs, **then** three signals (PAAPI availability, HEAD probe, redirect-time 4xx) → mark dead → CTA greys out. *(RE-03 §2.7)*
- **When** geo-routing, **then** IP → country (6-header chain) → marketplace → URL with that marketplace's tag. Fallback to default marketplace if no tag. *(RE-03 §2.1, §2.6; RE-06 §2.5)*

**Limits:** PAAPI 1 TPS / 86400/day. Rate limit per-endpoint (Upstash, fail-open 1s). Click dedup 1h. Payout_term delays eligibility.

**Where each rule lives (one place):** Amazon URL → `affiliate-service.ts`. Publish gate → `product-service.ts`. Three locks → `auth/admin.ts` + middleware. Commission → `affiliate/commission-service.ts`. Payout → `affiliate/payout-service.ts` (transactional). Geo → `lib/geo/marketplace-resolver.ts`. Dead-link → `cron/dead-link-probe.ts`.

### Build (in Business logic order)

1. Publish gate. 2. Amazon URL derivation (config-driven, per-marketplace). 3. Click pipeline (bot, hash, dedup, EU, waitUntil). 4. Three locks + getClaims + middleware. 5. Affiliate auth (ownership RLS). 6. discontinue + status workflows. 7. Bulk ops module. 8. Two-phase import. 9. Commission calc + postback. 10. Payout (transactional, state machine). 11. Geo-routing. 12. Dead-link job.

### UX Thread (Business logic)

*When a rule says no, how does the user find out why?*
- Missing ASIN/tag → greyed CTA + "Link coming soon." Dead link → "Out of stock." Unauthorized admin → plain 404. Affiliate below payout minimum → "Balance below $X minimum." Payout missing details → "Complete payout details first."

### Areas that live here

36 (Skip — Amazon) · 38 (Skip — Amazon) · 39 (Decided — affiliate commissions) · 40 (Skip — Amazon) · 54 (Decided — recurring) · 60 (Decided — affiliate-admin payout review).

---

## Layer 4 — Functionality

### Decided build order (6 phases)

| Phase | Ships |
|---|---|
| 1 Foundation | Product page, redirect + click pipeline, analytics pipeline. |
| 2 Storefront | Homepage, catalog browse + search, product detail with reviews. |
| 3 Admin workspace | Auth, product CRUD + variants + bulk import, media library, live analytics. |
| 4 Affiliate program | Signup + onboarding, trackers, balance, payouts. |
| 5 Amazon integration | Geo-routing, PAAPI cache, availability, dead-link detection, reviews. |
| 6 Hardening | i18n, real-time analytics, Sentry, legal, handoff. |

Per Feature Cards 1–15 in `product-management/03-feature-cards.md`.

### Functions (full)

- Storefront: homepage, catalog browse, search, filter, sort, pagination, product detail, variant selection, reviews, SHOP PRODUCT CTA → Amazon (geo-routed).
- Redirect + click: `/go/[id]` → 302 to Amazon; click recorded; bot-filtered; deduped; EU-redacted; attributed to tracker.
- Analytics pipeline: views + clicks, visitor hash, salt rotation, drop-reason telemetry.
- Admin: three-locks auth, product CRUD + variants + categories + collections, bulk status/archive, two-phase CSV import, media library, live analytics dashboard, affiliate review, payout review (approve/reject/schedule), settings.
- Affiliate: signup + email verify + admin approval, trackers, balance (live), payout request + history.
- Amazon: 22-marketplace geo-routing, PAAPI cache (TTL + error + availability), dead-link detection (3 signals), reviews via PAAPI.
- i18n: 22 locale UI strings. Legal: disclosure, privacy, terms, cookie, affiliate agreement.

### Out of scope (structural)

Cart, checkout, payment, inventory, shipping, order management (Amazon owns). Mobile-app surfaces (no mobile app). PWA. Outgoing webhooks.

### UX Thread (Functionality)

*Steps per feature, where lost?*
- Visitor loop: 1 step (tap → Amazon). Fixed: `/go/[id]` redirect, not `window.open`.
- Affiliate signup: 3 steps (profile → payout details → terms). Progress indicator.
- Payout request: 2 steps (amount → confirm). Validation feedback inline.
- CSV import: 2 phases (map → process). Per-row status surfaces bad rows without partial writes.

### Areas that live here

07 (Decided) · 34 (Skip — Amazon) · 35 (Decided — full catalog) · 37 (Skip — Amazon) · 41 (Decided — Sanity) · 42 (Decided — PAAPI reviews) · 44 (Decided — admins + affiliates) · 46 (Decided — live dashboard) · 47 (Decided — SSE) · 48 (Decided — email) · 50 (Decided — media library) · 51 (Decided — public + admin search) · 53 (Decided — import/export) · 55 (Decided) · 56 (Decided — full workspace) · 67 (Skip — no mobile) · 68 (Skip — no mobile) · 71 (Skip — no mobile).
