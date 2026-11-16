# 05 — Gap Questions (D1–D9, R1–R5, C1–C3)

**Blueprint:** Athletica (FULL MARKETPLACE)
**Mode:** Plan

17 gap questions — extras, not part of the 80. All **Decided**. Full rationale in `product-management/02-area-decisions-evidence.md`.

---

## Data gap questions (D1–D9)

| ID | Question | Decision | Answer |
|---|---|---|---|
| D1 | What are the main things stored? | Decided | `products` + `product_variants` + `categories` + `collections`; `analytics`; `admin_access_keys`; `marketplaces` (22 rows); `amazon_product_cache`; `affiliate.accounts` + `.trackers` + `.campaigns` + `.campaign_trackers` + `.balance` + `.payouts`; `media_assets`; `audit_log`. |
| D2 | How do they connect? | Decided | `product 1—* variants`; `product *—* categories` (M2M); `product *—* collections` (M2M); `product 1—* analytics`; `product *—1 marketplaces`; `affiliate_account 1—* tracker`; `tracker 1—* balance`; `account 1—* payout`; `campaign *—* tracker` (M2M); `payout *—* balance` (released flag). |
| D3 | Required + unique? | Decided | `products.slug` UNIQUE; `product_variants.sku` UNIQUE; `admin_access_keys.token_hash` UNIQUE; `affiliate_balance` UNIQUE(`account_id`,`trace`); `amazon_product_cache.product_id` composite UNIQUE; `affiliate_trackers.id` (public code) UNIQUE; `affiliate_payouts` UNIQUE(`account_id`,`number`). |
| D4 | ID kind? | Decided | `products.id` TEXT; `product_variants.id` UUID; `analytics.id` UUID; `admin_access_keys.id` UUID; `affiliate.*` UUID; `amazon_product_cache.product_id` composite varchar; `affiliate_trackers.id` varchar (public tracking code). |
| D5 | States + order? | Decided | Product: `draft→active→archived` (+`proposed/rejected`). Variant: same. Payout: `requested→scheduled→paid / →rejected`. Invite: `issued→used / →revoked`. Door-key: `issued→(sliding)→revoked/expired`. Amazon cache: `fresh→stale→refetched / →error`. Affiliate account: `pending→active→suspended / →closed`. |
| D6 | Who owns each record? | Decided | Products/variants/categories/analytics/cache: platform (service_role). Admin keys: issuing admin. Affiliate entities: the affiliate (`account_id`). Payouts: affiliate (requested), admin (scheduled/paid). |
| D7 | What never changes after create? | Decided | `products.id`, `products.slug`, `product_variants.id`, `analytics.id`, `admin_access_keys.token_hash`, `affiliate_balance` rows (append-only — UPDATE only `released`), `affiliate_payouts.number`, `affiliate_trackers.id` (public code). |
| D8 | Stored vs worked-out? | Decided | Amazon URL: **never stored** — derived at click time. Commission amount: stored (balance row). `balance_due`: worked out (sum `released=false`). Visitor hash: worked out at request time. Price: stored as integer cents in cache, **never displayed** publicly. `availableForSale`: worked out from PAAPI availability + dead-link state. |
| D9 | How will shape change later? | Decided | Additive migrations. `variants` + `categories` + `collections` modeled from day one. `campaign` table built (not deferred). Future seller/submission workflow (RE-04 §2.9) can be added without restructuring. |

---

## Runtime environment gap questions (R1–R5)

| ID | Question | Decision | Answer |
|---|---|---|---|
| R1 | Where does it run? | Decided | Server: Vercel (Node.js, Next.js 16.3.4). Browser: client components. SSE on route handlers (Vercel Pro for long-lived). |
| R2 | Versions? | Decided | Node 20+, Next.js 16.3.4, React 19.2.8, Postgres 15, `@supabase/ssr`, `@upstash/ratelimit`, `ua-parser-js`, `@sentry/nextjs`, PAAPI client, `next-intl`, `zod`. |
| R3 | Limits? | Decided | Vercel default (10s serverless, 60s Pro). Click write < 50ms or backgrounded. PAAPI 1 TPS / 86400/day. SSE long-lived (Pro). |
| R4 | Real conditions? | Decided | Slow mobile (Nigeria), in-app browsers, power cuts. Mobile LCP target. SSE degrades to polling on flaky connections. |
| R5 | Environments? | Decided | Dev (local, `.env.local`), Preview (Vercel preview), Production (`*.vercel.app` or custom). Same Supabase project, schema-isolated (`rollout` + `affiliate`). |

---

## Communication gap questions (C1–C3)

| ID | Question | Decision | Answer |
|---|---|---|---|
| C1 | How do the parts talk? | Decided | Direct calls (Server Component → service → Supabase). Click pipeline via `waitUntil`. PAAPI via scheduled fetch. Live dashboards via SSE (degrade to short-polling). No message queue. |
| C2 | Late or lost message? | Decided | Click writes best-effort (`Promise.allSettled`). Redirect survives stats outage. Dedup cache absorbs replays. SSE reconnects on drop. |
| C3 | Duplicate message? | Decided | Identity-hash dedup (1 click/identity/link/hour). Postback UNIQUE(`account_id`,`trace`). Idempotent SSE (event IDs). |

---

## Gap count

| Group | Count | All Decided |
|---|---|---|
| Data (D1–D9) | 9 | yes |
| Runtime (R1–R5) | 5 | yes |
| Communication (C1–C3) | 3 | yes |
| **Total** | **17** | **17 Decided, 0 Pending** |

Total reviewed across checklist + gap questions: 80 + 17 = 97.
