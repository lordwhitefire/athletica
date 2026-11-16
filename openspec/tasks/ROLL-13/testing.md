# ROLL-13: Testing Task — Production product page + view measurement

This document is for the tester. Run these checks **after** the implementation task is claimed done. The tester did **not** do the building; verify from scratch.

**Read-only rule:** do not edit files, install packages, run SQL, commit, or push. Commands are allowed only with the owner's explicit approval. Do not "fix" anything you find — report it.

## Pre-checks

1. Confirm the working directory is the repository root:
   `/home/lordwhitefire/current-project/athletica/athletica`
2. Read `openspec/tasks/ROLL-13/task.md` so you know the exact scope.
3. Confirm these files exist:
   - `rollout/src/app/product/[slug]/page.tsx`
   - `rollout/src/app/product/[slug]/ProductDetailsClient.tsx`
   - `rollout/src/lib/analytics/analytics-service.ts`
   - `rollout/src/lib/analytics/source.ts`
   - `rollout/src/lib/analytics/visitor.ts`
   - `rollout/src/lib/analytics/bots.ts`
   - `rollout/src/lib/analytics/rate-limit.ts`

## Checks

### C1 — Plain 404 for missing/unpublished products

Read `rollout/src/app/product/[slug]/page.tsx`.

Pass only when:

- `notFound()` is called when `getProductBySlug` returns no product.
- `notFound()` is called when `status !== 'published'` (unpublished → 404).
- No product-specific copy appears in the 404 path (no product name, slug, or "we couldn't find this product" style text that references the missing item).
- The 404 happens **before** any analytics recording.

### C2 — View recording is server-side with source and hash

Read `page.tsx` and `analytics-service.ts`.

Pass only when:

- `recordView` is called on the server (page component, not client).
- `recordView` receives `(product.id, source, visitorHash)` — not just `product.id`.
- `source` comes from `searchParams.get('source')`, normalized via `normalizeSource`.
- `visitorHash` comes from `getVisitorHash(ip, userAgent)`.
- IP comes from `getClientIp(await headers())`.
- UA comes from `headers.get('user-agent')`.
- `isBotUserAgent(ua)` is checked before recording; bots skip recording.
- `checkAnalyticsRateLimit(hash)` is checked before recording; limited visitors skip recording.
- `getVisitorHash` salt-missing errors are caught so the page never breaks.
- `recordView` errors are caught (fire and forget) so the page never breaks.

### C3 — No price on the public page

Read `ProductDetailsClient.tsx`.

Pass only when:

- No `product.price` display exists (delete the `typeof product.price === 'number'` block).
- No `$` or currency formatting tied to `product.price`.
- No price label, tag, or badge rendered from product data.
- The `price` field still exists in `database.types.ts` and the DB — only public display is removed.

### C4 — Real content only, no mock Unsplash

Read `ProductDetailsClient.tsx` and any imported placeholder files.

Pass only when:

- `mockBoxContents` and `FALLBACK_BOX_IMAGE` are **not** imported or used.
- No Unsplash URLs appear in the component or imports.
- "What's inside the box" section shows only when `product.box_contents` is present; otherwise it is omitted (not faked).
- No placeholder image fallbacks for missing product images.

### C5 — next/image usage

Read `ProductDetailsClient.tsx` and `rollout/next.config.ts` (or `.js`).

Pass only when:

- Product images use `next/image`, not bare `` tags.
- Hero/main image has `priority`.
- Other images (thumbnails, gallery) use `lazy` (default).
- Every `next/image` has `alt` text (hero: product name; others: descriptive).
- `cdn.sanity.io` is in `next/image` `remotePatterns` (or `domains` if older Next).

### C6 — CTA disabled, no window.open

Read `ProductDetailsClient.tsx`.

Pass only when:

- No `window.open` anywhere in the page or client component.
- No `/api/affiliate` fetch.
- No `/go/:id` navigation (that route is ROLL-14).
- The shop/CTA button is disabled with "Link coming soon" (or equivalent disabled state).
- Button has no `onClick` that opens a new tab or calls an affiliate API.

### C7 — Amazon Associates disclosure

Read `ProductDetailsClient.tsx`.

Pass only when:

- An Amazon Associates disclosure line is present on the page (near the CTA or in the footer area).
- The disclosure is visible text, not hidden or commented out.

### C8 — Source prop passed through

Read `page.tsx` and `ProductDetailsClient.tsx`.

Pass only when:

- `page.tsx` passes `source` to `ProductDetailsClient` as a prop.
- `ProductDetailsClient` accepts `source?: AnalyticsSource | null` (or equivalent).
- ROLL-14 will use this for click attribution; ROLL-13 only needs to pass it through.

### C9 — TypeScript passes

With owner approval, run:

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Pass only when it exits with code 0. If it fails, list every error with file and line. Do not fix anything.

### C10 — Scope check

List the changed files. The allowed set is:

- `rollout/src/app/product/[slug]/page.tsx`
- `rollout/src/app/product/[slug]/ProductDetailsClient.tsx`
- `rollout/next.config.ts` (or `.js`) — only for `next/image` remotePatterns

Fail if the builder changed:

- `/go/:id` route (ROLL-14)
- Click recording (ROLL-14)
- Admin pages/auth (ROLL-15)
- Price DB columns or types (ROLL-16)
- Sentry (ROLL-17)
- Test setup (ROLL-18)
- Any analytics helper from ROLL-12 (do not modify `source.ts`, `visitor.ts`, `bots.ts`, `rate-limit.ts`, `analytics-service.ts`)

### C11 — No new dependencies

Pass only when no new npm packages were installed. ROLL-13 uses only existing packages (`next`, `@supabase/supabase-js`, `@upstash/*` already installed in ROLL-12).

### C12 — Pre-existing errors noted, not touched

Confirm the report states:

- Any pre-existing `tsc` errors unrelated to ROLL-13 were listed, not fixed.
- The RLS "not enabled" and `product_id` nullability notices from ROLL-12 still apply (not touched in ROLL-13).

## Verdict

Return exactly one of:

- **PASS** — every check above passed.
- **FAIL** — one or more checks failed. List the check number, the file and line, what was expected, and what was found. Do not fix it.

Also include a short note on anything the owner must still do before ROLL-14 can start (e.g., Vercel env vars are already set from ROLL-12 — confirm nothing new is needed for ROLL-13).
