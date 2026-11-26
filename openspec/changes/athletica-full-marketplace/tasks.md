# Tasks — athletica-full-marketplace

**Change:** athletica-full-marketplace
**Date:** 2026-11-16
**Architect:** openspec-architect (Moment 1)
**Total tasks:** 26 (FM-01 … FM-26), grouped into 6 phases.
**Rule:** one task at a time. Phase gates between phases (owner reviews before the next phase). Each task ships with `task.md` (intent + benchmarks) + `testing.md` (behavioral verification), written in Moment 2.

These tasks are **plans/intent**, not instructions. Each `task.md` states what to achieve + why + what success looks like. The Builder figures out how.

## Phase 1 — Foundation

| # | Task | Spec | Depends on | Status |
|---|---|---|---|---|
| FM-01 | Three-locks admin auth (invite + door-key + JWT role, fail-silent 404, getClaims, `proxy.ts` door-key check, signin rate limit, invite issuance script) | foundation | — | ⬜ Pending |
| FM-02 | Core data model migrations (products 5-status + variants + categories + collections + analytics fields + admin_access_keys + marketplaces seed + amazon_product_cache + affiliate.* schema + audit_log + RLS with FORCE + select-wrappers) | foundation | — | ⬜ Pending |
| FM-03 | Product page (`/product/[slug]`, 3-condition publish gate, gallery, buy-box, CTA states, generateMetadata, JSON-LD, no price, server-side view recording) | foundation | FM-02 | ⬜ Pending |
| FM-04 | Redirect + click pipeline (`/go/[id]` 302, X-Robots-Tag, async click write, 6-layer bot filter, identity hash, 1h dedup, EU redaction, explicit redirect rate-limit policy) | redirect-click | FM-02 | ⬜ Pending |
| FM-05 | Analytics pipeline (salt rotation 90s + grace window, drop-reason enum + telemetry, 6-header IP chain, UA-parser bot filter + Headless Chrome override, pipeline order) | redirect-click | FM-02 | ⬜ Pending |

## Phase 2 — Storefront

| # | Task | Spec | Depends on | Status |
|---|---|---|---|---|
| FM-06 | Storefront homepage (`/`, 3-up hero grid + carousel + footer, curated picks, generateMetadata, fast mobile first screen) | storefront | FM-03 | ⬜ Pending |
| FM-07 | Catalog browse (`/shop`, grid + search + faceted filter + sort + pagination, URL params as state, visible-but-disabled OOS) | storefront | FM-03 | ⬜ Pending |
| FM-08 | Product detail with variants + reviews (variant selector URL-params, reviews via Creators API when enabled else omit, JSON-LD AggregateOffer) | storefront | FM-03, FM-20 | ⬜ Pending |
| FM-09 | SEO suite (generateMetadata fallbacks, tag-based visibility, OG w/h/alt, sitemap, robots.txt, indexable homepage + category pages) | storefront | FM-06, FM-07 | ⬜ Pending |

## Phase 3 — Admin workspace

| # | Task | Spec | Depends on | Status |
|---|---|---|---|---|
| FM-10 | Product CRUD + variants + categories + collections (5-status, 3-condition gate, discontinue, soft-delete, price optional) | admin | FM-01, FM-02 | ⬜ Pending |
| FM-11 | Bulk operations module (require_ids!, skip-counting, bulk status/archive/tag/category/collection) | admin | FM-10 | ⬜ Pending |
| FM-12 | Two-phase CSV import (mapping → processing, per-row status, grouped COUNT, no delete mid-processing) | admin | FM-10 | ⬜ Pending |
| FM-13 | Media library (Sanity upload + browse + delete, admin-auth secured, token server-side) | admin | FM-01 | ⬜ Pending |
| FM-14 | Live analytics dashboard (SSE + polling fallback, CTR, source split, per product, per affiliate, payout pipeline, drop-reason counts) | admin | FM-05 | ⬜ Pending |

## Phase 4 — Affiliate program

| # | Task | Spec | Depends on | Status |
|---|---|---|---|---|
| FM-15 | Affiliate signup + onboarding (multi-step, email verify, admin approval, ownership RLS, tracker issuance) | affiliate | FM-02 | ⬜ Pending |
| FM-16 | Affiliate trackers + campaigns (create tracker, campaign config, commission_type/reward/recurring/minimum/term, M2M) | affiliate | FM-15 | ⬜ Pending |
| FM-17 | Balance ledger (append-only, UNIQUE(account_id,trace), S2S postback bearer token, FX normalization, reversal support) | affiliate | FM-16 | ⬜ Pending |
| FM-18 | Payout request + admin review (transactional flow, state machine requested→scheduled→paid/rejected, scheduled_for, per-account sequential number, email on transitions, payout-term eligibility check) | affiliate | FM-17 | ⬜ Pending |

## Phase 5 — Amazon integration

| # | Task | Spec | Depends on | Status |
|---|---|---|---|---|
| FM-19 | 22-marketplace geo-routing (IP→country→marketplace, 6-header chain, MaxMind/Cloudflare, fallback to default) | amazon-integration | FM-04 | ⬜ Pending |
| FM-20 | Creators API client (OAuth creds, optional booster, soft-fail, cache ≤1h offers/≤1d other, retry backoff, scope + body tag) | amazon-integration | FM-02 | ⬜ Pending |
| FM-21 | Dead-link detection (HEAD probe daily + redirect-time 4xx + API availability when eligible, CTA greys out) | amazon-integration | FM-20 | ⬜ Pending |
| FM-22 | Reviews via Creators API (customerReviews, cached in amazon_product_cache, JSON-LD reference, omit block when no data) | amazon-integration | FM-20 | ⬜ Pending |

## Phase 6 — Hardening

| # | Task | Spec | Depends on | Status |
|---|---|---|---|---|
| FM-23 | i18n (22 marketplace locales, next-intl, URL param switch, English fallback) | hardening | FM-06 | ⬜ Pending |
| FM-24 | Legal pages (privacy, terms, cookie-notice, affiliate-agreement, Amazon disclosure, GDPR deletion/export, payout tax docs) | hardening | — | ⬜ Pending |
| FM-25 | Sentry + uptime + monitoring (Sentry PII-off + email, uptime ping, drop-reason telemetry, payout stuck-request alert, Creators API error-rate alert, Vercel cron for salt/dead-link/PAAPI/payout-term) | hardening | FM-05, FM-18, FM-21 | ⬜ Pending |
| FM-26 | Documentation + handoff (README, .env.example, changelog, API docs, admin guide, affiliate guide, architect handoff, smoke test notes per phase) | hardening | all | ⬜ Pending |

## Dependencies (the critical path)

FM-02 (data model) is the root — most tasks depend on it. FM-01 (auth) gates all admin tasks. FM-03 (product page) gates the storefront. FM-04 (redirect) gates geo-routing. FM-05 (analytics) gates the dashboard. FM-20 (Creators API) gates reviews + dead-link-via-API. FM-18 (payouts) gates the monitoring alert for stuck requests.

Within a phase, tasks may run in dependency order (not necessarily strictly sequential where independent — but one-at-a-time per the registry rule unless the owner says otherwise).
