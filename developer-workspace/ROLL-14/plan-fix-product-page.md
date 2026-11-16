# ROLL-14 — Product Page 404 Fix Plan

## Problem

The product page (`/product/bench1-430706`) shows a Next.js 404 error page in the browser instead of loading the product.

## Root Cause (to be confirmed at runtime)

The `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `rollout/.env.local` line 2 is being rejected by Supabase as "Invalid API key". When `createPublicClient()` uses this key, Supabase rejects the request, `getProductBySlug()` returns `null`, and `notFound()` fires → 404 page.

The product exists in the database (`bench1-430706`, status=published, asin=B0CBENCH01), confirmed via `supabase db query --db-url`.

## Plan

### Task 1 — Confirm the problem at runtime

Test both keys from `.env.local` against Supabase REST API:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — confirm if invalid
- `SUPABASE_SERVICE_ROLE_KEY` — confirm if valid or also invalid

This tells us whether only the anon key is bad, or both keys are bad.

### Task 2 — Get a valid anon key

If the anon key is invalid:
- Go to Supabase project dashboard (Settings → API)
- Get a valid `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Update `rollout/.env.local` line 2 with the new key

### Task 3 — Restart the dev server

Restart `next dev -p 3011` so it picks up the new key from `.env.local`.

### Task 4 — Verify in the browser

Attach to Chrome on `:9222`, one tab:
- Navigate to `/product/bench1-430706` — confirm product loads (not 404)
- Check CTA button shows "Link coming soon" (expected until AMAZON_TAG/MARKETPLACE are added)
- Full DOM extraction — extract everything from the page
- Navigate to `/go/V4qZOE?source=instagram` — confirm 404 (expected until AMAZON_TAG/MARKETPLACE set)
- No `window.open` fired

### Task 5 — Write report

Save results to `developer-workspace/ROLL-14/report.md` — what worked, what didn't, what the owner still needs to do.

## What the owner still needs to do after this plan

- Add real `AMAZON_TAG` and `AMAZON_MARKETPLACE` values to `.env.local` (currently blank)
- Add same values to Vercel Production
- Then CTA will show "SHOP PRODUCT", navigate to `/go/[id]?source=...`, and `/go/[id]` will 302-redirect to Amazon affiliate URL

---

**Nothing is committed yet for this plan.** I will not run any commands until you say go.
