# ROLL-14 — Implementation Plan

## Overview

Build the affiliate redirect route and wire the product CTA so it actually goes somewhere. The CTA stays disabled ("Link coming soon") until the product has an ASIN **and** the Amazon tag/marketplace are supplied via env. When ready, clicking the CTA navigates to `/go/[id]?source=...`, which records the click server-side and then 302-redirects to the Amazon affiliate URL. Depends on ROLL-12 (schema scoping + analytics helpers) and ROLL-13 (product page with source prop).

## Decisions carried in

| # | Decision |
|---|----------|
| 1 | `AMAZON_TAG` and `AMAZON_MARKETPLACE` from server env only; `affiliate-service.ts` reads `process.env.AMAZON_TAG` / `process.env.AMAZON_MARKETPLACE`. No hardcoded `athletica-20`. |
| 2 | CTA stays disabled when product has no ASIN, or `AMAZON_TAG`/`AMAZON_MARKETPLACE` missing. |
| 3 | New file `rollout/src/app/go/[id]/route.ts`. `GET /go/[id]?source=...` — look up product by id, derive affiliate URL, record click server-side, then 302 redirect. |
| 4 | Click recording server-side in `/go/[id]`. Skip silently for bots, missing IP, missing salt, or rate-limited. Pass `source` + `visitorHash` to `recordClick`. |
| 5 | CTA uses Next.js `useRouter().push()` client-side navigation to `/go/${product.id}?source=${source}`. No `window.open`. |
| 6 | `page.tsx` already passes `source` to `ProductDetailsClient`; client passes it as query param to `/go/[id]`. |
| 7 | Add `AMAZON_TAG` and `AMAZON_MARKETPLACE` to `.env.example` (blank) and `.env.local` (blank, owner adds real values). |
| 8 | Add public `getProductById(id)` to `product-service.ts` using `createPublicClient` with `status='published'` filter. |
| 9 | `ctaEnabled` computed server-side in `page.tsx` and passed as prop to `ProductDetailsClient`. |
| 10 | Update `/api/affiliate/route.ts` and `/api/analytics/route.ts` for env-based consistency. |

## Dependency graph

```
AMAZON_TAG/AMAZON_MARKETPLACE env vars (.env.example + .env.local)
     │
     └─ affiliate-service.ts env reads
            │
            ├─ /api/affiliate/route.ts update
            └─ /go/[id]/route.ts (redirect + click recording)
                   │
                   └─ getProductById in product-service.ts
                          │
                          └─ page.tsx ctaEnabled computation
                                 │
                                 └─ ProductDetailsClient.tsx CTA enable/disable + navigation
```

## Task list

### Phase 1: Foundation

### Task 1 — Affiliate env vars + affiliate-service.ts env reads

**Description:** Add `AMAZON_TAG` and `AMAZON_MARKETPLACE` blank keys to `.env.example` and `.env.local`. Replace hardcoded `AFFILIATE_CONFIG` in `affiliate-service.ts` with `process.env.AMAZON_TAG` / `process.env.AMAZON_MARKETPLACE`. Remove `athletica-20` placeholder entirely. `getAffiliateUrl` and `getAffiliateUrlByAsin` return `{ url: null, error: 'Affiliate not configured' }` when tag or marketplace missing.

**Acceptance criteria:**
- [ ] `.env.example` has `AMAZON_TAG=` and `AMAZON_MARKETPLACE=` blank lines.
- [ ] `.env.local` has `AMAZON_TAG=` and `AMAZON_MARKETPLACE=` blank lines (owner adds real values).
- [ ] `affiliate-service.ts` reads `process.env.AMAZON_TAG` and `process.env.AMAZON_MARKETPLACE`; no `athletica-20` anywhere.
- [ ] `getAffiliateUrlByAsin` returns `{ url: null, error: 'Affiliate not configured' }` when tag/marketplace missing.
- [ ] `getAmazonHost` logic unchanged.
- [ ] `npx tsc --noEmit` passes (CP1).

**Verification:** read `.env.example` / `.env.local`; `rg` for `athletica-20` (expect none); `rg` for `process.env.AMAZON_TAG` / `process.env.AMAZON_MARKETPLACE` in affiliate-service.ts; `tsc`.

**Dependencies:** none.

**Files:**
- `rollout/.env.example`
- `rollout/.env.local`
- `rollout/src/lib/affiliate/affiliate-service.ts`

**Size:** M (3 files).

**Commit:** `ROLL-14 T1: add affiliate env vars and env-based affiliate service`

---

### Task 2 — Add `getProductById` to product-service.ts

**Description:** Add public `getProductById(id: string)` to `rollout/src/lib/products/product-service.ts` using `createPublicClient` with `status='published'` filter, same pattern as `getProductBySlug`.

**Acceptance criteria:**
- [ ] `getProductById` exported from `rollout/src/lib/products/product-service.ts`.
- [ ] Uses `createPublicClient()` (public client, respects RLS).
- [ ] Filters by `.eq('id', id)` and `.eq('status', 'published')`.
- [ ] Returns `ProductRow | null`; returns null on error/no match.
- [ ] `npx tsc --noEmit` passes (CP1).

**Verification:** read product-service.ts; `tsc`.

**Dependencies:** none (independent of T1).

**Files:** `rollout/src/lib/products/product-service.ts` (1 file).

**Size:** S (1 file).

**Commit:** `ROLL-14 T2: add getProductById to product-service.ts`

---

### Checkpoint 1 — after T1–T2

- [ ] `npx tsc --noEmit` exits 0.
- [ ] No `athletica-20` in affiliate-service.ts.
- [ ] `getProductById` exported and uses public client.

---

### Phase 2: Redirect route + click recording

### Task 3 — Create `/go/[id]/route.ts` redirect route

**Description:** Create `rollout/src/app/go/[id]/route.ts`. `GET /go/[id]?source=...` looks up product by id via `getProductById`, derives affiliate URL via `getAffiliateUrlByAsin`, records click server-side with `source` + `visitorHash` (skipping silently for bots/missing IP/missing salt/rate-limited), then 302 redirects to affiliate URL. Returns 404 for missing product/ASIN or unconfigured affiliate.

**Acceptance criteria:**
- [ ] `rollout/src/app/go/[id]/route.ts` exists.
- [ ] `GET /go/[id]?source=...` route handler.
- [ ] Reads `source` from `searchParams`, normalizes via `normalizeSource`.
- [ ] Reads headers via `await headers()`; IP via `getClientIp(headers)`; UA via `headers.get('user-agent')`.
- [ ] `isBotUserAgent(ua)` → true skips recording entirely (silently).
- [ ] IP null → skips recording silently.
- [ ] `getVisitorHash(ip, ua)` called; missing salt caught, recording skipped silently.
- [ ] `checkAnalyticsRateLimit(hash)` → `success: false` skips recording silently.
- [ ] `recordClick(id, source, visitorHash)` fire-and-forget, errors swallowed.
- [ ] Product lookup via `getProductById(id)`; 404 if no product or no ASIN.
- [ ] Affiliate URL via `getAffiliateUrlByAsin(product.asin)`; 404 if no URL.
- [ ] `NextResponse.redirect(affiliate.url, 302)` on success.
- [ ] `npx tsc --noEmit` passes (CP2).

**Verification:** read route.ts; `rg` for all key patterns; `tsc`; runtime check on `:3011/go/<id>?source=instagram`.

**Dependencies:** T1, T2.

**Files:** `rollout/src/app/go/[id]/route.ts` (1 new file).

**Size:** S (1 file).

**Commit:** `ROLL-14 T3: create /go/[id] redirect route with click recording`

---

### Task 4 — Update `/api/affiliate/route.ts` and `/api/analytics/route.ts`

**Description:** Update `/api/affiliate/route.ts` to use env-based affiliate service (it already calls `getAffiliateUrl` which now reads env). Update `/api/analytics/route.ts` to accept and pass `source` and `visitorHash` through to `recordView`/`recordClick`.

**Acceptance criteria:**
- [ ] `/api/affiliate/route.ts` uses env-based `getAffiliateUrl` (no hardcoded tag).
- [ ] `/api/analytics/route.ts` accepts `source` and `visitorHash` from request body.
- [ ] `/api/analytics/route.ts` passes `source` and `visitorHash` to `recordView`/`recordClick`.
- [ ] `npx tsc --noEmit` passes (CP2).

**Verification:** read both route files; `tsc`; static greps for `athletica-20` (none).

**Dependencies:** T1.

**Files:**
- `rollout/src/app/api/affiliate/route.ts`
- `rollout/src/app/api/analytics/route.ts`

**Size:** S (2 files).

**Commit:** `ROLL-14 T4: update affiliate and analytics API routes`

---

### Checkpoint 2 — after T3–T4

- [ ] `npx tsc --noEmit` exits 0.
- [ ] `/go/[id]/route.ts` exists with redirect + click recording.
- [ ] `/api/affiliate/route.ts` and `/api/analytics/route.ts` updated.

---

### Phase 3: CTA + page wiring

### Task 5 — CTA enable/disable + navigation in ProductDetailsClient.tsx

**Description:** Rewrite CTA button in `ProductDetailsClient.tsx`. Button disabled when `!ctaEnabled`; shows "Link coming soon". When enabled, navigates to `/go/${product.id}?source=${encodeURIComponent(source ?? '')}` via `useRouter().push()`. No `window.open`. No `/api/affiliate` fetch. Accepts `source?: AnalyticsSource | null` and `ctaEnabled?: boolean` props. Keeps Amazon Associates disclosure.

**Acceptance criteria:**
- [ ] `ProductDetailsClientProps` has `ctaEnabled?: boolean`.
- [ ] CTA button `disabled={!ctaEnabled}`.
- [ ] CTA label "Link coming soon" when disabled, "SHOP PRODUCT" when enabled.
- [ ] CTA onClick calls `router.push('/go/${product.id}?source=${encodeURIComponent(source ?? '')}')` when enabled.
- [ ] No `window.open`. No `/api/affiliate` fetch.
- [ ] `'use client'` directive kept.
- [ ] Amazon Associates disclosure kept.
- [ ] `npx tsc --noEmit` passes (CP3).

**Verification:** read ProductDetailsClient.tsx; `rg` for `window.open` (expect none); `rg` for `/api/affiliate` (expect none); `tsc`.

**Dependencies:** T1 (env vars), T9 (page.tsx ctaEnabled).

**Files:** `rollout/src/app/product/[slug]/ProductDetailsClient.tsx` (1 file).

**Size:** S (1 file).

**Commit:** `ROLL-14 T5: CTA enable/disable + navigation in client component`

---

### Task 6 — page.tsx ctaEnabled computation + `.env.example` + `.env.local`

**Description:** Compute `ctaEnabled` server-side in `page.tsx` (`Boolean(product.asin && process.env.AMAZON_TAG && process.env.AMAZON_MARKETPLACE)`) and pass as prop to `ProductDetailsClient`. `.env.example` already updated in T1; `.env.local` already updated in T1.

**Acceptance criteria:**
- [ ] `page.tsx` computes `ctaEnabled` from `product.asin && process.env.AMAZON_TAG && process.env.AMAZON_MARKETPLACE`.
- [ ] `page.tsx` passes `ctaEnabled` to `<ProductDetailsClient product={product} source={source} ctaEnabled={ctaEnabled} />`.
- [ ] `npx tsc --noEmit` passes (CP3).

**Verification:** read page.tsx; `tsc`.

**Dependencies:** T1, T5.

**Files:** `rollout/src/app/product/[slug]/page.tsx` (1 file).

**Size:** S (1 file).

**Commit:** `ROLL-14 T6: page.tsx ctaEnabled computation`

---

### Checkpoint 3 — after T5–T6

- [ ] `npx tsc --noEmit` exits 0.
- [ ] CTA disabled when no ASIN/missing env; enabled otherwise.
- [ ] CTA navigates to `/go/[id]?source=...` on click.

---

### Phase 4: Verify + report

### Task 7 — Verify: tsc + static checks + runtime browser check + report

**Description:** Run `npx tsc --noEmit` and static checks; run interaction-driven runtime browser check (attach to Chrome on `:9222`, one tab, verify CTA disabled/enabled, `/go/[id]` redirect, no `window.open`, click recording silent fail-open); write implementation report.

**Acceptance criteria:**
- [ ] `npx tsc --noEmit` exits 0.
- [ ] `rg` for `athletica-20` in affiliate-service.ts (expect none).
- [ ] `rg` for `window.open` in rollout/src/app/product/[slug]/ (expect none).
- [ ] `rg` for `AMAZON_TAG`/`AMAZON_MARKETPLACE` in `.env.example` (expect both present).
- [ ] `rg` for `getProductById` in product-service.ts (expect present).
- [ ] `ls rollout/src/app/go/[id]/route.ts` (expect exists).
- [ ] Runtime: CTA disabled when no ASIN/env; enabled when present.
- [ ] Runtime: `/go/<id>?source=instagram` 302 redirects to affiliate URL.
- [ ] Runtime: no `window.open` fired on CTA click.
- [ ] Report written at `developer-workspace/ROLL-14/report.md`.
- [ ] Six commits exist (T1–T6); nothing pushed.

**Verification:** `tsc`; static greps; runtime browser check; `git log --oneline -7`; `git status --short`.

**Dependencies:** T1–T6.

**Files:** `developer-workspace/ROLL-14/report.md` (1 doc).

**Size:** S (1 doc).

**Commit:** `ROLL-14 T7: verify and report`

---

### Checkpoint 4 — after T7

- [ ] `npx tsc --noEmit` exits 0.
- [ ] All static checks pass.
- [ ] Runtime browser check passes.
- [ ] Report written; six commits exist; nothing pushed.

---

## Command batch (single approval)

```bash
cd /home/lordwhitefire/current-project/athletica/athletica

# Typecheck after each task group
cd rollout && npx tsc --noEmit

# Static checks
rg -n "athletica-20" rollout/src/lib/affiliate/affiliate-service.ts || echo "no athletica-20 (good)"
rg -n "window\.open" rollout/src/app/product/[slug]/ || echo "no window.open (good)"
rg -n "AMAZON_TAG\|AMAZON_MARKETPLACE" rollout/.env.example
rg -n "getProductById" rollout/src/lib/products/product-service.ts
ls rollout/src/app/go/[id]/route.ts

# Six commits (staging only task files; never git add -A)
git add rollout/.env.example rollout/.env.local rollout/src/lib/affiliate/affiliate-service.ts
git commit -m "ROLL-14 T1: add affiliate env vars and env-based affiliate service"

git add rollout/src/lib/products/product-service.ts
git commit -m "ROLL-14 T2: add getProductById to product-service.ts"

git add rollout/src/app/go/[id]/route.ts
git commit -m "ROLL-14 T3: create /go/[id] redirect route with click recording"

git add rollout/src/app/api/affiliate/route.ts rollout/src/app/api/analytics/route.ts
git commit -m "ROLL-14 T4: update affiliate and analytics API routes"

git add rollout/src/app/product/[slug]/ProductDetailsClient.tsx
git commit -m "ROLL-14 T5: CTA enable/disable + navigation in client component"

git add rollout/src/app/product/[slug]/page.tsx
git commit -m "ROLL-14 T6: page.tsx ctaEnabled computation"

git add developer-workspace/ROLL-14/
git commit -m "ROLL-14 T7: verify and report"
```

`git add -f` may be needed if `developer-workspace/` is gitignored; confirm before using.

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `AMAZON_TAG`/`AMAZON_MARKETPLACE` missing in `.env.local` | CTA stays disabled until owner adds real values | Add blank keys; note in report that owner must supply real values |
| `getProductById` name conflicts with existing `getProductByIdAdmin` | Compile error | Distinct name, different client (public vs admin) |
| `useRouter` not previously used in `src/app` | Import pattern new but standard Next.js | Add `'use client'` already present; import `useRouter` from `next/navigation` |
| Missing `ANALYTICS_HASH_SALT` breaks click recording | CTA still works, recording skipped | Catch error, skip silently (matches ROLL-12/13 pattern) |
| Upstash not configured | Rate limiter fails open, recording proceeds | Existing ROLL-12 behavior, no change needed |

## Out of scope

Admin auth — ROLL-15. Price changes — ROLL-16. Sentry — ROLL-17. Vitest suite — ROLL-18. Any commit or push without owner approval.
