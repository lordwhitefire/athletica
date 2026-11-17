# FM-02 — Core data model migrations

**Phase:** 1 | **Spec:** foundation | **Depends on:** — | **Status:** ⬜ Pending

## What we're building

The full data model for the marketplace: products + variants + categories + collections, analytics with source/visitor_hash/tracker_id, admin_access_keys (existing), the 22-marketplace seed, the amazon_product_cache, the entire affiliate.* schema (accounts, trackers, campaigns, campaign_trackers, balance, payouts), and the audit_log — all with RLS enabled, FORCE'd, and the `(select auth.jwt())`/`(select auth.uid())` wrappers.

## Why it matters

Every later task depends on this shape. Modeling variants separately (even single-variant v1) avoids a painful migration later. The affiliate schema modeled now means Phase 4 builds on real tables, not a deferred stub. The RLS perf fix (the select-wrapper) + FORCE means the security boundary is real and fast.

## What success looks like (benchmarks)

- After this, `rollout.products` has the 5-status enum, `deleted_at`, `available_on`, `discontinue_on`, nullable integer-cents `price`.
- After this, `rollout.product_variants` exists (id UUID, product_id, sku UNIQUE, price, attributes, status, deleted_at) — even if v1 products have one variant each.
- After this, `rollout.categories` + `product_categories` + `rollout.collections` + `product_collections` (M2M) exist.
- After this, `rollout.analytics` has `source`, `visitor_hash` (BIGINT), `tracker_id`; partitioned by month.
- After this, `marketplaces` is seeded with all 22 Amazon locales (slug, locale_number, domain, associates_url, country_code — UK→GB).
- After this, `amazon_product_cache` exists with the composite key, TTL `expiration_time`, `error`, integer-cents price, availability, rating, review_count, review_samples.
- After this, `affiliate.accounts/trackers/campaigns/campaign_trackers/balance/payouts` exist; `balance` is append-only with UNIQUE(`account_id`,`trace`); `payouts` has the status enum + `scheduled_for` + per-account sequential `number`.
- After this, `audit_log` exists.
- After this, every table has RLS enabled + `FORCE ROW LEVEL SECURITY` + the `auth.jwt()`/`auth.uid()` wrapped in `(select ...)`.
- After this, the Amazon URL is stored **nowhere** in any table.

## Context the Builder needs

- Existing: `rollout.products`, `rollout.analytics`, `rollout.admin_access_keys` (from ROLL-01/03/15). `analytics` already has `source`/`visitor_hash` from ROLL-12.
- The blueprint's `05-gap-questions.md` (D1–D9) is the full entity/field/state/ownership spec.
- Migrations are additive only — no destructive changes to existing tables.
- Schema isolation: `rollout.*` for the platform; `affiliate.*` for the affiliate ledger.
- The 22 marketplaces list: `AE AU BE BR CA CN DE EG ES FR IN IT JP MX NL PL SA SE SG TR UK US` (RE-03 §2.1).

## Boundaries

- Do not store the Amazon URL anywhere (it is derived at click time).
- Do not make `price` required or non-nullable (it is optional, admin-only, never on the public page).
- Do not skip `FORCE ROW LEVEL SECURITY` or the `(select ...)` wrapper on any policy.
- Do not create affiliate tables without ownership-based RLS (`auth.uid() = account_id`).
- Do not use floating-point for money — integer cents everywhere.
- Do not hard-delete products or balance rows (soft-delete via `deleted_at`; balance is append-only).
