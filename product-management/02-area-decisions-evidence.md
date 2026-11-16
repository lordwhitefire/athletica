# Area Decisions + Evidence — 80 areas + 17 gap questions (FULL MARKETPLACE)

**Date:** Mon Nov 16 2026
**Mode:** Plan (every area ends Decided / Skip / Pending)
**Scope:** FULL marketplace — storefront, catalog, admin workspace, affiliate program, geo-routing, analytics, dead-link detection, Amazon integration. Not an MVP.
**Purpose:** the evidence behind every decision in `blueprint/`. Each row names the decision, the one-line rationale, and the citation. Citations: `RE-01`…`RE-07` = `reverse-engineering-workspace/engagements/NN-*/<sample>/2026-11-16/report.md`; `Study BLUEPRINT.md` = the existing app; `locked` = owner's carried-forward constraints.

**What changed from the MVP draft:** 7 areas flipped from Skip → Decided (26 i18n, 42 reviews, 45 onboarding, 47 real-time, 51 search→public+admin, 60 collaboration, 64 multi-step). Several Decided areas expanded scope (35 catalog → full browsable; 56 admin → full workspace; 46 dashboard → live). Affiliate ledger + geo-routing + dead-link detection are no longer "later phase."

---

## UI (Home: 7 areas)

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 03 | Design system | **Decided** | Black/lemon visual system, Tailwind v4. Price as pill/badge (omitted on public page per Amazon policy; shown in admin only). Reuse Vercel Commerce tile + gallery patterns. | Study BLUEPRINT.md; RE-07 §2.2–2.3 |
| 04 | Brand and identity | **Decided** | Athletica football affiliate marketplace. Full navbar, footer, brand metadata across all surfaces. | locked |
| 09 | Responsive and cross-device | **Decided** | Phone-first storefront; PC must work. Admin optimized for desktop. Media queries at 900/720/420. | locked; Study BLUEPRINT.md |
| 10 | Cross-browser compatibility | **Decided** | Instagram + WhatsApp in-app browsers, Chrome, Safari, Firefox. Admin: evergreen browsers. | RE-07 §2.4; locked |
| 12 | Assets and media | **Decided** | Sanity (project `cuiis46d`); full media library in admin (browse, upload, delete). Supabase stores the URL only. Token server-side. | Study BLUEPRINT.md; RE-07 §2.2 |
| 23 | Animation and interactions | **Decided** | Carousel scroller, gallery keyboard controls, CTA hover/active, toast/confirm/action-state. No `window.open` pop-up (blocked in-app) — use `/go/[id]` redirect. | RE-07 §2.1; Study BLUEPRINT.md |
| 79 | Design tokens and theming | **Decided** | Tailwind v4 tokens; admin.css dark; storefront black/lemon. | Study BLUEPRINT.md |

---

## UX Thread (Home: 8 areas)

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 06 | Routing and navigation | **Decided** | `/` → storefront homepage (3-up grid + carousel). `/shop` → catalog grid. `/product/[slug]` → detail. `/go/[id]` → Amazon redirect. `/admin/*` → workspace (404 until auth). `/affiliate/*` → affiliate dashboard. `/admin/analytics` → live dashboard. | RE-07 §2.1; locked; Study BLUEPRINT.md |
| 11 | Accessibility | **Decided** | Contrast, focus, alt text, keyboard nav on gallery + carousel + admin. axe check before launch. | locked |
| 24 | Notifications and feedback | **Decided** | Toast + confirm-dialog + action-state across all surfaces. Honest states (loading, empty, error, success) everywhere. | Study BLUEPRINT.md; RE-07 §2.3 |
| 25 | Forms and validation | **Decided** | Admin product editor (with variants), affiliate signup/payout forms, CSV import mapping. Dirty-state protection. Price optional (Amazon policy). | RE-04 §2.6; RE-02 Weferral §2.1; locked |
| 26 | Internationalization | **Decided** | Marketplace-locale UI strings for the 22 Amazon locales (RE-03). Storefront + affiliate dashboard localize per visitor/affiliate locale. English base; locale switch on URL param. | RE-03 §2.1 |
| 29 | Redirect and URL management | **Decided** | `/go/[id]` → 302 to Amazon (user-editable link). Unknown product → branded not-found. `X-Robots-Tag: noindex` on every redirect. Affiliate tracker URLs `/go/[id]` carry the tracker id. | RE-01 Dub §2.1; RE-01 YOURLS §2.1; RE-02 §2.3 |
| 45 | Onboarding flow | **Decided** | Affiliate self-serve signup → email verify → admin approval → tracker issuance → dashboard. Admin onboarding = Supabase invite (three-locks). | RE-02 §2.1 (account entity); RE-05 §2.1 (invite) |
| 64 | Multi-step flows and wizards | **Decided** | Affiliate signup (multi-step: profile → payout details → terms), payout request (balance check → amount → confirm), product submission (if sellers added later), CSV import mapping wizard. | RE-02 Weferral §2.3–2.5; RE-04 §2.8 |

---

## Data (Home: 4 areas + gap questions D1–D9)

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 49 | Multi-tenancy | **Decided** | Single platform tenant. Affiliate accounts are per-affiliate (ownership-based RLS for the affiliate's own dashboard). `rollout` schema for products/analytics/admin; `affiliate` schema for the ledger. | RE-05 NextBase §2.2 (ownership RLS); RE-02 §2.1 |
| 52 | Audit logs and activity history | **Decided** | `analytics` (views/clicks with source + visitor_hash). Admin action log (publish/unpublish/delete/bulk with actor + timestamp). Payout status transitions logged. Affiliate balance ledger is append-only (audit by design). | RE-01 §2.2; RE-02 §2.1; RE-04 §2.2 |
| 59 | Soft delete vs hard delete | **Decided** | Soft-delete via `deleted_at` on products + affiliates. `discontinue()` bypasses validation, sets `discontinue_on`, `status='archived'`. Balance rows never deleted (append-only). Payouts never deleted (status transitions only). | RE-04 §2.4–2.5; RE-02 §2.1 |
| 62 | Timezone and localization | **Decided** | UTC storage. Display in visitor locale (storefront) or affiliate locale (dashboard). Per-product marketplace locale config. | RE-03 §2.1; RE-02 §2.2 |

### Gap questions D1–D9 (Home: Data)

| ID | Question | Decision | Answer | Citation |
|---|---|---|---|---|
| D1 | Main things stored | **Decided** | `products` + `product_variants` + `categories` + `collections`; `analytics` (views/clicks); `admin_access_keys`; `marketplaces` (22 rows); `amazon_product_cache` (TTL + error + integer-cents + availability); `affiliate_accounts` + `affiliate_trackers` + `affiliate_campaigns` + `affiliate_balance` (append-only) + `affiliate_payouts`; `media_assets` (Sanity references); `audit_log`. | RE-04 §2.1; RE-02 §2.1; RE-03 §2.4; RE-05 §2.4; RE-07 §2.2 |
| D2 | How do they connect | **Decided** | `product 1—* variants`; `product *—* categories` (M2M); `product *—* collections` (M2M); `product 1—* analytics`; `product *—1 marketplaces`; `affiliate_account 1—* tracker`; `tracker 1—* balance`; `affiliate_account 1—* payout`; `campaign *—* tracker` (M2M); `payout *—* balance` (released flag). | RE-04 §2.1; RE-02 §2.1 |
| D3 | Required + unique fields | **Decided** | `products.slug` UNIQUE; `product_variants.sku` UNIQUE; `admin_access_keys.token_hash` UNIQUE; `affiliate_balance` UNIQUE(`account_id`,`trace`); `amazon_product_cache.product_id` composite UNIQUE; `affiliate_trackers.id` (public tracking code) UNIQUE; `affiliate_payouts` UNIQUE(`account_id`,`number`). | RE-05 §2.4; RE-02 §2.3; RE-03 §2.4; RE-02 Raider §2.5 |
| D4 | ID kind | **Decided** | `products.id` TEXT (existing); `product_variants.id` UUID; `analytics.id` UUID; `admin_access_keys.id` UUID; `affiliate_*` UUID; `amazon_product_cache.product_id` composite varchar; `affiliate_trackers.id` varchar (public tracking code, like Raider). | Study BLUEPRINT.md; RE-02 §2.1; RE-03 §2.4 |
| D5 | States + order | **Decided** | Product: `draft→active→archived` (+`proposed/rejected`). Variant: `draft→active→archived`. Payout: `requested→scheduled→paid / →rejected`. Invite: `issued→used / →revoked`. Door-key: `issued→(sliding)→revoked/expired`. Amazon cache: `fresh→stale→refetched / →error`. Affiliate account: `pending→active→suspended / →closed`. | RE-04 §2.2; RE-02 §2.5; RE-05 §2.4; RE-02 Weferral §2.5 |
| D6 | Who owns each record | **Decided** | Products/variants/categories/analytics/cache: platform (service_role). Admin keys: issuing admin. Affiliate entities: the affiliate (`account_id`). Payouts: the affiliate (requested), admin (scheduled/paid). | RE-05 §2.3–2.4; RE-02 §2.1 |
| D7 | What never changes after create | **Decided** | `products.id`, `products.slug`, `product_variants.id`, `analytics.id`, `admin_access_keys.token_hash`, `affiliate_balance` rows (append-only — UPDATE only `released`), `affiliate_payouts.number`, `affiliate_trackers.id` (public code). | RE-02 §2.1; RE-04 §2.2 |
| D8 | Stored vs worked-out | **Decided** | Amazon URL: **never stored** — derived at click time. Commission amount: stored (balance row). `balance_due`: worked out (sum `released=false`). Visitor hash: worked out at request time. Price: stored as integer cents in cache, **never displayed** publicly. `availableForSale`: worked out from PAAPI availability + dead-link state. | RE-03 §2.2; RE-02 §2.2; RE-06 §2.1; locked |
| D9 | How shape changes later | **Decided** | Additive migrations. `variants` + `categories` + `collections` modeled from day one. `campaign` table built (not deferred). Future seller/submission workflow (RE-04 §2.9) can be added without restructuring. | RE-04 §2.1; RE-04 §2.9 |

---

## Business logic (Home: 6 areas)

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 36 | Inventory management | **Skip** | Amazon holds inventory. We redirect; we do not track stock. (Dead-link detection + PAAPI availability cover the "is it buyable" question.) | locked; RE-03 §2.5 |
| 38 | Shipping and delivery | **Skip** | Amazon ships. | locked |
| 39 | Discount and promotions | **Decided** | Affiliate commissions + payouts (full): per-campaign commission_type (percentage/fixed), recurring + nullable limit, per-campaign minimum_payout + payout_term, FX normalization, reversal support. No product-level discounts. | RE-02 §2.1–2.5 (entire) |
| 40 | Order management | **Skip** | Amazon is the order system. We track clicks + commissions, not orders. | locked |
| 54 | Subscription and feature gating | **Decided** | Recurring commission as toggle + nullable `recurring_limit` (NULL=lifetime). No product subscription gating. | RE-02 Weferral §2.2 |
| 60 | Collaboration features | **Decided** | Affiliate ↔ admin payout review workflow: affiliate requests, admin reviews (approve/reject/schedule), status transitions visible to both. Comment thread on payout requests (optional). | RE-02 Weferral §2.5; RE-02 Raider §2.5 |

---

## Functionality (Home: 18 areas)

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 07 | SEO and discoverability | **Decided** | `generateMetadata` with fallbacks on every public page. Tag-based visibility (`HIDDEN_PRODUCT_TAG`→`noindex`). OG image with w/h/alt. JSON-LD `schema.org/Product` + `AggregateOffer` on product pages. Sitemap. `robots.txt`. Homepage + category pages indexable. | RE-07 §2.2 |
| 34 | Payment integration | **Skip** | Amazon handles payment. Affiliate payouts are manual (affiliate requests → admin approves → wires out-of-band). No Stripe/gateway. | locked; RE-02 §2.5 |
| 35 | Product catalog | **Decided** | Full manual catalog + admin CRUD + bulk import. Product + Variant separate. 5-status state machine. 3-condition publish gate. Categories + collections (M2M). Public browse: homepage (3-up grid + carousel), `/shop` grid with search + filter + sort + pagination. | RE-04 (entire); RE-07 §2.1 |
| 37 | Cart and checkout | **Skip** | No cart. CTA → Amazon. | locked |
| 41 | CMS integration | **Decided** | Sanity (project `cuiis46d`). Full media library: upload (JPEG/PNG/WebP/AVIF, 5MB), browse, delete, asset metadata. Service-role only. | Study BLUEPRINT.md; RE-07 §2.2 |
| 42 | Reviews and testimonials | **Decided** | Amazon reviews fetched via PAAPI and displayed on the product page (rating + sample reviews). JSON-LD `AggregateOffer` references the rating. On-site testimonials deferred (not needed — Amazon carries reviews). | RE-03 §2.4 (PAAPI fields); RE-07 §2.2 (JSON-LD) |
| 44 | User management | **Decided** | Two user classes: admins (three-locks, invite-only) and affiliates (self-serve signup + admin approval). Admin: full workspace. Affiliate: own dashboard (ownership-based RLS). No visitor accounts. | RE-05 §2.1; RE-02 §2.1 |
| 46 | Dashboard and data visualization | **Decided** | Admin analytics dashboard: total views, clicks, CTR, per product, per source, 7/30/90 days, affiliate performance, payout pipeline. **Live** (polling or SSE). Affiliate dashboard: own trackers, balance, payout history, click attribution. | RE-06 §2.4; RE-07 §2.3; RE-02 §2.1 |
| 47 | Real-time features | **Decided** | Live analytics dashboard (SSE or short-polling for the admin + affiliate dashboards). No real-time elsewhere. | RE-06 §2.4 (telemetry); RE-07 §2.3 |
| 48 | Notification system | **Decided** | Email: affiliate balance/payout events, admin error alerts (Sentry), invite emails. In-app: toast notifications. No push. | RE-02 §2.5; locked (Sentry) |
| 50 | File management | **Decided** | Full media library in admin (Sanity). Upload, browse, delete, asset metadata. Secured behind admin auth. | Study BLUEPRINT.md; RE-05 §2.1 |
| 51 | Search and filtering | **Decided** | Public storefront search (product name, category, tag) + faceted filter (category, gender, color, price-range — note: price filter is admin-only since price isn't displayed). Admin product search (existing). | RE-07 §2.1; RE-04 §2.5 (tags) |
| 53 | Import and export | **Decided** | Two-phase CSV import (mapping → processing) for products. Export: analytics CSV, affiliate ledger CSV, payout history CSV. | RE-04 §2.8 |
| 55 | Settings and configuration | **Decided** | Affiliate tag + marketplace store config (per-marketplace tags). Sentry DSN. Upstash rate-limit policies. Salt rotation interval. PAAPI keys. Affiliate program settings (default minimum_payout, payout_term). | RE-03 §2.3; RE-01 Dub §2.3; RE-06 §2.2; RE-02 Weferral §2.3 |
| 56 | Admin panel | **Decided** | Full workspace: `/admin/products` (+ variants, bulk), `/admin/categories`, `/admin/collections`, `/admin/media`, `/admin/analytics` (live), `/admin/affiliates` (review/approve/suspend), `/admin/payouts` (review/schedule/pay/reject), `/admin/settings`. Three-locks auth. | Study BLUEPRINT.md; RE-04 (entire); RE-02 §2.5 |
| 67 | Push notifications (mobile) | **Skip** | No mobile app. Email + in-app toast instead. | locked |
| 68 | Device features | **Skip** | No mobile app. | locked |
| 71 | Deep linking | **Skip** | No mobile app. `/go/[id]` is a web redirect. | locked |

---

## Engine — 10 Parts (Home: 25 areas + gap questions R1–R5, C1–C3)

### 1. Architecture

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 02 | Stack decisions | **Decided** | Next.js 16.3.4 App Router, React 19, Tailwind v4, Supabase (Postgres + Auth + RLS), Sanity CMS, Upstash Redis (rate limit + dedup + cache), Sentry, `ua-parser-js` (bot filter), PAAPI client. | Study BLUEPRINT.md; RE-01 Dub §2.3; RE-05 NextBase §2.4; RE-06 §2.3 |
| 05 | Frontend architecture | **Decided** | App Router. Server Components for data (storefront, product, admin lists). Client components for interactivity (gallery, carousel, CTA, editors, live dashboards). Route handlers for `/api/*`. `src/proxy.ts` fast-path gate. Layered action-client. | Study BLUEPRINT.md; RE-07 §2.2; RE-05 NextBase §2.5 |
| 65 | Platform targets | **Decided** | Web only. Phone + PC. No mobile/desktop app. | locked |
| 78 | Landing page vs app shell | **Decided** | Storefront homepage at `/` (3-up grid + carousel). Admin shell at `/admin/*`. Affiliate shell at `/affiliate/*`. Separate layouts. | RE-07 §2.1 |

### 2. Integration

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 57 | API design | **Decided** | REST `/api/admin/*` (CRUD + bulk), `/api/affiliate` (URL derivation), `/api/analytics` (view/click), `/api/affiliate/postback` (S2S conversion, bearer token), `/api/admin/payouts` (review), `/api/affiliate/dashboard` (own data). Server Components for initial data. | Study BLUEPRINT.md; RE-02 Raider §2.3 |
| 61 | Webhooks (outgoing) | **Skip** | None. Amazon PAAPI is polled (scheduled). No outgoing webhooks needed. | RE-03 §2.4 |
| 80 | Third party integrations | **Decided** | Supabase, Sanity, Amazon (PAAPI + Associates redirect, 22 marketplaces), Upstash Redis, Sentry, Vercel (edge headers for IP/geo), email (SMTP or Resend). | Study BLUEPRINT.md; RE-01 Dub §2.3; RE-03 §2.1; RE-06 §2.5 |

### 3. Communication between parts

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 58 | Background jobs and queues | **Decided** | `waitUntil` for click recording. Scheduled jobs: salt rotation (90s), dead-link HEAD probe (daily, batched + throttled), PAAPI refresh (TTL-based), payout-term eligibility check (daily). SSE for live dashboards. | RE-01 Dub §2.4; RE-06 §2.2; RE-03 §2.7; RE-02 Weferral §2.4 |

**Gap questions C1–C3:**

| ID | Question | Decision | Answer | Citation |
|---|---|---|---|---|
| C1 | How do parts talk | **Decided** | Direct calls (Server Component → service → Supabase). Click pipeline via `waitUntil`. PAAPI via scheduled fetch. Live dashboard via SSE (or short-polling). No message queue. | RE-01 Dub §2.4 |
| C2 | Late or lost message | **Decided** | Click writes best-effort (`Promise.allSettled`). Redirect survives stats outage. Dedup cache absorbs replays. SSE reconnects on drop. | RE-01 Dub §2.4; RE-01 YOURLS §2.2 |
| C3 | Duplicate message | **Decided** | Identity-hash dedup (1 click/identity/link/hour). Postback: UNIQUE(`account_id`,`trace`). Idempotent SSE (event IDs). | RE-01 Dub §2.4; RE-02 Raider §2.3 |

### 4. Runtime environment

**Gap questions R1–R5:**

| ID | Question | Decision | Answer | Citation |
|---|---|---|---|---|
| R1 | Where does it run | **Decided** | Server: Vercel (Node.js, Next.js 16.3.4). Browser: client components. SSE on route handlers. | Study BLUEPRINT.md |
| R2 | Versions | **Decided** | Node 20+, Next.js 16.3.4, React 19.2.8, Postgres 15, `@supabase/ssr`, `@upstash/ratelimit`, `ua-parser-js`, `@sentry/nextjs`, PAAPI client. | Study BLUEPRINT.md |
| R3 | Limits | **Decided** | Vercel default (10s serverless, 60s Pro). Click write < 50ms or backgrounded. PAAPI 1 TPS / 86400/day. SSE long-lived (Vercel Pro). | RE-01 Dub §2.4; RE-03 §2.7 |
| R4 | Real conditions | **Decided** | Slow mobile (Nigeria context), in-app browsers, power cuts. Mobile LCP target. Graceful 404/error. SSE must degrade to polling on flaky connections. | locked; blueprint skill §75 |
| R5 | Environments | **Decided** | Dev (local), Preview (Vercel preview), Production (`*.vercel.app` or custom domain). Same Supabase project, schema-isolated. | Study BLUEPRINT.md |

### 5. Deployment

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 18 | Deployment and DevOps | **Decided** | One public Vercel project. Preview per PR. Rollback = redeploy. Add `vercel.json` (config + cron for scheduled jobs). Cron: salt rotation, dead-link probe, PAAPI refresh, payout-term check. | Study BLUEPRINT.md gap; RE-06 §2.2; RE-03 §2.7 |
| 66 | App store and distribution | **Skip** | No mobile app. | locked |
| 70 | App updates | **Skip** | No mobile app. Web = redeploy. | locked |

### 6. Configuration

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 14 | Environment and configuration | **Decided** | `.env.local`/Vercel: Supabase URL + anon + service key, Sanity write token, Upstash Redis URL + token, Sentry DSN, Amazon Associates tags (per-marketplace, when supplied), PAAPI access/secret keys, email (SMTP/Resend). Service keys server-only. Leak plan: rotate Supabase service key + Sanity token; revoke door-keys/invites on compromise. | Study BLUEPRINT.md; RE-05 §2.4; RE-03 §2.3 |

### 7. Security

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 28 | Cookie and session management | **Decided** | Door-key cookie (HttpOnly, SameSite=Lax, Path=/admin, 30d, Secure). Supabase JWT. Affiliate session (JWT, ownership-scoped). No visitor cookies. Visitor identity hashed server-side. | RE-05 §2.1; RE-06 §2.6 |
| 43 | Authentication and authorization | **Decided** | Admins: three locks (invite → door-key → JWT role). Affiliates: email/password + email verify + admin approval. `getClaims()` in gates. Fail-silent 404 (admin); 401/redirect (affiliate). Layered action-client. Ownership-based RLS for affiliate's own tables; role-based for admin tables. | RE-05 (entire); RE-05 NextBase §2.2–2.5; RE-02 §2.1 |
| 63 | Rate limiting and abuse prevention | **Decided** | Upstash sliding window, per-endpoint policy map, fail-open 1s. Explicit `redirect` policy. Click dedup (1h). Signin rate limit. Affiliate signup rate limit. Postback rate limit. Bot filter on click path. | RE-01 Dub §2.3–2.4; RE-05 §4 |
| 77 | Security | **Decided** | HTTPS. SHA-256 tokens. Service-role isolated. RLS + `FORCE` + `(select auth.jwt())` wrapper on every table. EU IP redaction. `rel="nofollow noopener"` on Amazon CTA. `SECURITY DEFINER` for affiliate membership checks. Input validation (TS strict + zod). | RE-05 (entire); RE-05 NextBase §2.3; RE-01 Dub §2.4; RE-07 §2.5 |

### 8. Reliability

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 13 | Error handling | **Decided** | Neutral auth errors. Plain 404 for missing/unpublished. Sentry (server + client). Error-tolerant click writes. Branded not-found. Payout flow transactional (no partial state). | RE-05 §2.5; RE-01 YOURLS §2.2; RE-02 Raider §2.5 |
| 19 | Monitoring and observability | **Decided** | Sentry (server + client, email alert, PII off). Uptime ping on key URLs. Drop-reason telemetry (named enum, grouped count). Payout-pipeline observability (stuck-request alerts). PAAPI error-rate alert. | locked; RE-06 §2.4; RE-02 §2.6 |
| 27 | Offline and PWA | **Skip** | No PWA. One-shot visits + dashboards (dashboards degrade to polling). | locked |
| 31 | Backup and recovery | **Decided** | Supabase daily Postgres backups. Sanity CDN (versioned). Git. Rollback = redeploy. Point-in-time recovery for the affiliate ledger (Supabase Pro). | Study BLUEPRINT.md gap |
| 69 | Offline mode (mobile) | **Skip** | No mobile app. | locked |

### 9. Scalability

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 76 | Scalability planning | **Decided** | Single Supabase project (Pro). `analytics` partitioned by month. Upstash for hot dedup/cache. Vercel edge + Sanity CDN. Upgrade path: Supabase read replicas + ClickHouse for analytics at >~5M clicks/month. Affiliate ledger scales with Postgres (append-only, indexed). | RE-01 Dub §5; RE-06 §5; Study BLUEPRINT.md gap |

### 10. Resource management

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 08 | Performance | **Decided** | Mobile LCP target. `next/image` with Sanity domains. `getClaims()` not `getUser()`. `waitUntil` for click writes. Upstash cache for hot link + product records. Gallery + carousel in `<Suspense>`. SSE over polling for live dashboards (fewer requests). | RE-05 NextBase §2.4; RE-01 Dub §2.5; RE-07 §2.2 |
| 30 | Code splitting and bundle size | **Decided** | Next.js automatic splitting. Admin + affiliate dashboards lazy-loaded (not on public path). Gallery/carousel in `<Suspense>`. Heavy charts dynamic-imported. | RE-07 §2.2 |
| 72 | Performance (mobile specific) | **Skip** | No mobile app. Covered by 08. | locked |

---

## Project Ring (Home: 12 areas)

| # | Area | Decision | Rationale | Citation |
|---|---|---|---|---|
| 01 | Project setup | **Decided** | Name: Athletica. Owner: lordwhitefire (Victor). Domain: `*.vercel.app` → custom. Hosting: Vercel. Envs: dev/preview/prod. Currency: per-marketplace. Audience: football gear buyers + affiliates. Deadline: per owner. | locked; Study BLUEPRINT.md |
| 15 | Version control | **Decided** | Git at root. Protected `main`. Conventional commits. `.gitignore` tracks all except secrets + build output + RE samples. | Study BLUEPRINT.md; `.gitignore` |
| 16 | Development workflow | **Decided** | TS strict. ESLint + Prettier. Pre-commit. Code review. Read `rollout/AGENTS.md`. | Study BLUEPRINT.md; `rollout/AGENTS.md` |
| 17 | Testing | **Decided (smoke + critical-path)** | Owner ruling: no full suite. Smoke test before each phase launch: product page loads, CTA returns URL, unauthenticated admin → 404, affiliate signup flow, payout state machine. Critical-path manual check on real phone + PC each phase. | locked; Study BLUEPRINT.md |
| 20 | Legal and compliance | **Decided** | Amazon Associates disclosure on every product page. Privacy policy (analytics hashing, Sentry, affiliate data). Cookie notice (admin/affiliate session cookies). GDPR: EU IP redaction + affiliate data deletion on request. Terms of service (storefront + affiliate agreement). Affiliate payout tax docs (per jurisdiction). | locked; RE-01 Dub §2.4; RE-02 §2.5 |
| 21 | Documentation | **Decided** | `rollout/README.md` (real setup/run/deploy). `.env.example`. Changelog. API docs. Affiliate onboarding guide. Admin one-pager. This blueprint. Architect handoff (separate). | Study BLUEPRINT.md gap |
| 22 | Naming conventions | **Decided** | Files kebab-case; components PascalCase; fns/vars camelCase; tables/columns snake_case; constants UPPER_SNAKE; routes kebab-case. | Study BLUEPRINT.md |
| 32 | Client communication | **Decided** | Owner approves. Progress via `developer-workspace/PROGRESS.md`. Phase gates: owner reviews at end of each phase before next. | Study BLUEPRINT.md |
| 33 | Handoff and maintenance | **Decided** | Owner + next developer. Credentials handoff: Supabase, Sanity, Upstash, Sentry, Vercel, Amazon Associates (per-marketplace tags + PAAPI keys), email. Client training: admin + affiliate guide. Support period: per owner. | Study BLUEPRINT.md |
| 73 | Progress tracking | **Decided** | `developer-workspace/PROGRESS.md` + per-phase checklists + per-task ROLL folders. | Study BLUEPRINT.md |
| 74 | Session recovery | **Decided** | Reload rule files first after interruption. Log after each meaningful action. | Study BLUEPRINT.md |
| 75 | Constraint identification | **Decided** | Solo owner + affiliates. Vercel/Supabase Pro tiers. PAAPI 1 TPS / 86400/day. Amazon Associates tag per-marketplace. Nigerian connectivity (slow mobile, in-app browsers). Email deliverability for affiliate notifications. | locked; blueprint skill §75; RE-03 §2.4 |

---

## Summary

- **Decided:** 66 of 80 areas + 17 of 17 gap questions.
- **Skip:** 14 areas — all honest, not deferrals:
  - Amazon owns the transaction (5): 34 Payment, 36 Inventory, 37 Cart/checkout, 38 Shipping, 40 Order mgmt.
  - No mobile app (7): 66 App store, 67 Push, 68 Device, 69 Offline-mobile, 70 App updates, 71 Deep links, 72 Mobile-perf.
  - No PWA (1): 27 Offline/PWA.
  - No outgoing webhooks (1): 61 Webhooks.
- **Pending:** 0.

The 14 Skips are structural to the business model (affiliate marketplace, not retailer; web-only) — not MVP shortcuts. Everything the RE engagements studied is in scope and built.
