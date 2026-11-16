# ROLL-14: Testing Task — Affiliate config + CTA redirect + click measurement

This document is for the tester. Run these checks **after** the implementation task is claimed done. The tester did **not** do the building; verify from scratch.

**Read-only rule:** do not edit files, install packages, run SQL, commit, or push. Commands are allowed only with the owner's explicit approval. Do not "fix" anything you find — report it.

## Pre-checks

1. Confirm the working directory is the repository root:
   `/home/lordwhitefire/current-project/athletica/athletica`
2. Read `openspec/tasks/ROLL-14/task.md` so you know the exact scope.
3. Confirm these files exist:
   - `rollout/src/app/go/[id]/route.ts`
   - `rollout/src/app/product/[slug]/ProductDetailsClient.tsx`
   - `rollout/src/app/product/[slug]/page.tsx`
   - `rollout/src/lib/affiliate/affiliate-service.ts`
   - `rollout/src/lib/products/product-service.ts`
   - `rollout/src/lib/analytics/analytics-service.ts`
   - `rollout/src/lib/analytics/source.ts`
   - `rollout/src/lib/analytics/visitor.ts`
   - `rollout/src/lib/analytics/bots.ts`
   - `rollout/src/lib/analytics/rate-limit.ts`
   - `rollout/.env.example`

## Checks

### C1 — Affiliate config from env, no hardcoded tag

Read `rollout/src/lib/affiliate/affiliate-service.ts`.

Pass only when:

- `tag` comes from `process.env.AMAZON_TAG`.
- `marketplace` comes from `process.env.AMAZON_MARKETPLACE`.
- No `athletica-20` string anywhere in the file.
- `locale` remains `'en_US'`.
- `getAmazonHost` logic is unchanged (defaults to `www.amazon.com` when marketplace is unrecognized).
- When `tag` or `marketplace` is missing, `getAffiliateUrl` / `getAffiliateUrlByAsin` return `{ url: null, error: 'Affiliate not configured' }` or equivalent.

### C2 — Redirect route exists and records clicks

Read `rollout/src/app/go/[id]/route.ts`.

Pass only when:

- Route is at `rollout/src/app/go/[id]/route.ts`.
- Exports `GET(request, { params })`.
- Reads `source` from `searchParams.get('source')`, normalizes via `normalizeSource`.
- Looks up product by `id` (params), requiring `status: 'published'` and a non-null `asin`.
- Returns 404 when product not found or no ASIN.
- Calls `getAffiliateUrlByAsin(asin)` to derive the affiliate URL.
- Returns 404 when affiliate URL cannot be derived (e.g., not configured).
- Calls `recordClick(id, source, visitorHash)` server-side.
- Checks `isBotUserAgent(ua)` before recording; bots skip recording silently.
- Checks `checkAnalyticsRateLimit(hash)` before recording; limited visitors skip recording silently.
- Missing IP → skip recording silently.
- Missing salt → caught, skip recording silently, redirect still happens.
- `recordClick` errors are swallowed; redirect still happens.
- Returns `NextResponse.redirect(affiliate.url, 302)`.
- No raw IP logged or stored.

### C3 — CTA disabled when not ready, navigates when ready

Read `rollout/src/app/product/[slug]/ProductDetailsClient.tsx` and `rollout/src/app/product/[slug]/page.tsx`.

Pass only when:

- `page.tsx` computes `ctaEnabled` from `product.asin` + `AMAZON_TAG` + `AMAZON_MARKETPLACE` env, passes it to `ProductDetailsClient`.
- `ProductDetailsClient` accepts `ctaEnabled?: boolean`.
- Button disabled when `ctaEnabled` is false (label "Link coming soon").
- Button enabled when `ctaEnabled` is true (label "SHOP PRODUCT").
- On click (enabled), navigates to `/go/${product.id}?source=${encodeURIComponent(source ?? '')}`.
- No `window.open` anywhere.
- No `/api/affiliate` fetch from the client.
- `source?: AnalyticsSource | null` prop still accepted.

### C4 — Env example has affiliate vars

Read `rollout/.env.example`.

Pass only when:

- `AMAZON_TAG=` present (blank).
- `AMAZON_MARKETPLACE=` present (blank).
- No real values in `.env.example`.

### C5 — `getProductById` added to product service

Read `rollout/src/lib/products/product-service.ts`.

Pass only when:

- `getProductById(id)` exists.
- Uses `createPublicClient()` (anon key, respects RLS).
- Filters by `id` and `status: 'published'`.
- Selects `asin` and other needed fields.
- Returns `ProductRow | null`.

### C6 — Click recording skips silently

Read `rollout/src/app/go/[id]/route.ts`.

Pass only when:

- Bot → no `recordClick` call, no error logged, redirect still happens.
- Rate-limited → no `recordClick` call, no error logged, redirect still happens.
- Missing salt → caught, no error logged, redirect still happens.
- Missing IP → no `recordClick` call, redirect still happens.

### C7 — TypeScript passes

With owner approval, run:

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Pass only when it exits with code 0. If it fails, list every error with file and line. Do not fix anything.

### C8 — Scope check

List the changed files. The allowed set is:

- `rollout/src/app/go/[id]/route.ts` (new)
- `rollout/src/app/product/[slug]/page.tsx`
- `rollout/src/app/product/[slug]/ProductDetailsClient.tsx`
- `rollout/src/lib/affiliate/affiliate-service.ts`
- `rollout/src/lib/products/product-service.ts`
- `rollout/.env.example`

Fail if the builder changed:

- Analytics helpers from ROLL-12 (`source.ts`, `visitor.ts`, `bots.ts`, `rate-limit.ts`, `analytics-service.ts`)
- Admin pages/auth (ROLL-15)
- Price DB columns or types (ROLL-16)
- Sentry (ROLL-17)
- Test setup (ROLL-18)
- Any other unrelated file

### C9 — No new dependencies

Pass only when no new npm packages were installed. ROLL-14 uses only existing packages.

## Verdict

Return exactly one of:

- **PASS** — every check above passed.
- **FAIL** — one or more checks failed. List the check number, the file and line, what was expected, and what was found. Do not fix it.

Also include a short note on anything the owner must still do before ROLL-15 can start (e.g., Vercel Production env needs `AMAZON_TAG` and `AMAZON_MARKETPLACE` added).
