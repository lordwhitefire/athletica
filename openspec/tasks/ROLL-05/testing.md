# ROLL-05: Testing Task — Customer Product Details Page

This document is for the tester. Run these checks AFTER the implementation task is claimed done. The tester did NOT do the building; verify from scratch. All checks are read-only — nothing here modifies or commits anything.

---

# ROUND 1 — Original Full Build

## Pre-checks

1. Confirm working directory is the repository root: `/home/lordwhitefire/current-project/athletica/athletica`
2. Confirm `rollout/src/app/product/[slug]/page.tsx` exists
3. Confirm `rollout/src/app/product/[slug]/ProductDetailsClient.tsx` exists
4. Confirm `rollout/src/app/product/[slug]/rollout1-pixel-match.css` exists
5. Confirm `rollout/src/app/product/[slug]/not-found.tsx` exists
6. Confirm `rollout/src/app/api/affiliate/route.ts` exists
7. Confirm `rollout/src/app/api/analytics/route.ts` exists

## Checks and expected results

### C1 — Route structure exists
- Run: `ls -la rollout/src/app/product/\[slug\]/`
- Expected: `page.tsx`, `ProductDetailsClient.tsx`, `rollout1-pixel-match.css`, `not-found.tsx`

### C2 — Server component fetches real data
- Run: `grep -n "getProductBySlug\|notFound\|recordView" rollout/src/app/product/\[slug\]/page.tsx`
- Expected: imports `getProductBySlug` and `notFound` from Next.js, calls `recordView`

### C3 — Client component uses pixel-match CSS
- Run: `grep -n "pixel-match\|rollout1-pixel-match" rollout/src/app/product/\[slug\]/ProductDetailsClient.tsx`
- Expected: imports `./rollout1-pixel-match.css`

### C4 — Client uses real services
- Run: `grep -n "getProductBySlug\|recordView\|recordClick\|getAffiliateUrl" rollout/src/app/product/\[slug\]/ProductDetailsClient.tsx`
- Expected: references services from `@/lib/products/product-service`, `@/lib/analytics/analytics-service`, `@/lib/affiliate/affiliate-service`

### C5 — Shop Product button has interactive states
- Run: `grep -n "idle\|loading\|opened\|error\|OPENING\|TRY AGAIN" rollout/src/app/product/\[slug\]/ProductDetailsClient.tsx | head -10`
- Expected: Shop Product button shows different states (idle → loading → opened → error)

### C6 — Shop Product calls affiliate API
- Run: `grep -n "fetch.*affiliate\|getAffiliateUrl" rollout/src/app/product/\[slug\]/ProductDetailsClient.tsx | head -5`
- Expected: Shop Product button calls `/api/affiliate` endpoint

### C7 — Analytics recorded on page load
- Run: `grep -n "recordView" rollout/src/app/product/\[slug\]/page.tsx | head -5`
- Expected: `recordView(product.id)` called in server component

### C8 — Analytics recorded on Shop click
- Run: `grep -n "fetch.*analytics\|recordClick" rollout/src/app/product/\[slug\]/ProductDetailsClient.tsx | head -5`
- Expected: Shop Product button triggers analytics recording

### C9 — Keyboard gallery controls
- Run: `grep -n "ArrowLeft\|ArrowRight\|Home\|End\|onKeyDown\|handleKeyDown" rollout/src/app/product/\[slug\]/ProductDetailsClient.tsx | head -5`
- Expected: keyboard event handlers for gallery navigation

### C10 — Not Found page exists
- Run: `cat rollout/src/app/product/\[slug\]/not-found.tsx`
- Expected: displays "PRODUCT NOT FOUND" message

### C11 — No navigation or footer on customer page
- Run: `grep -n "Navbar\|Footer\|Sidebar\|Navigation" rollout/src/app/product/\[slug\]/ProductDetailsClient.tsx || true`
- Expected: NO navigation components

### C12 — Affiliate API route exists
- Run: `cat rollout/src/app/api/affiliate/route.ts`
- Expected: exports `GET` handler that calls `getAffiliateUrl`

### C13 — Analytics API route exists
- Run: `cat rollout/src/app/api/analytics/route.ts`
- Expected: exports `POST` handler that calls `recordView` or `recordClick`

### C14 — CSS uses pixel-* class prefix
- Run: `grep -c "pixel-" rollout/src/app/product/\[slug\]/rollout1-pixel-match.css`
- Expected: multiple `.pixel-*` class definitions (at least 20)

### C15 — CSS enforces 1440px max
- Run: `grep -n "1440\|max-width" rollout/src/app/product/\[slug\]/rollout1-pixel-match.css | head -5`
- Expected: `--pixel-max: 1440px` and media queries capping at 1440px

### C16 — CSS uses black/lemon visual system
- Run: `grep -n "#000000\|#d1fd40\|--pixel-black\|--pixel-lemon" rollout/src/app/product/\[slug\]/rollout1-pixel-match.css | head -5`
- Expected: black background, lemon accent

### C17 — TypeScript compiles without errors
- Run: `cd rollout && npx tsc --noEmit`
- Expected: no errors

### C18 — No Mature schema references
- Run: `grep -E "brands|categories|models|hierarchy|leaf_model" rollout/src/app/product/\[slug\]/page.tsx rollout/src/app/product/\[slug\]/ProductDetailsClient.tsx || true`
- Expected: NO references to Mature schema/tables

### C19 — No push performed
- Run: `git status` (check if local branch is ahead of origin)
- Expected: local branch is ahead by 1 commit (expected); remote unchanged

## Round 1 Verdict

- **PASS** only if ALL checks C1–C19 produce expected results
- **FAIL** if any check fails, especially:
  - C1: Route structure missing files
  - C2: Server component doesn't use real services
  - C5: Shop Product missing interactive states
  - C9: No keyboard gallery controls
  - C10: Not Found page missing
  - C14: CSS doesn't use pixel-* prefix
  - C17: TypeScript errors

Remember: Round 1 already ran (2026-09-04) → 17/19 PASS, C8 FAIL (functional), C4 literal-test deviation (PASS by design). Fixed in Round 2.

---

# ROUND 2 — C8 FIX ONLY

## ROUND 2 — SCOPE (2026-09-04)

**This round tests ONLY the C8 fix.** All other checks (C1–C7, C9–C19) passed in Round 1 and are NOT re-run.

**Strict scope rule:** the Round 2 fix touches exactly ONE spot — `handleShop()` inside `rollout/src/app/product/[slug]/ProductDetailsClient.tsx` (adding the fire-and-forget POST to `/api/analytics`). **No other files may change. No other code may change.** If the tester finds any modification outside that single function, the round FAILS — even if C8 passes.

## Pre-check (scope enforcement)

Run: `git log --oneline -3`
Expected: exactly ONE new commit since Round 1 (the Round 2 fix commit).

Run: `git diff HEAD~1 --stat` (or the equivalent for the Round 2 commit)
Expected: the diff touches ONLY `rollout/src/app/product/[slug]/ProductDetailsClient.tsx`.

If the diff shows any other file changed (CSS, routes, services, other components, config), **FAIL — out-of-scope change not allowed.**

## Checks and expected results (Round 2 only)

### C8 — Analytics recorded on Shop click (the Round 2 fix)

- Run: `grep -n "fetch.*analytics\|eventType.*click\|eventType: 'click'" rollout/src/app/product/\[slug\]/ProductDetailsClient.tsx`
- Expected: inside `handleShop()`, **after** the affiliate URL opens successfully (`window.open(...)` / `setShopState('opened')`), a fire-and-forget fetch to `/api/analytics` POST with body `JSON.stringify({ productId: product.id, eventType: 'click' })` (with `.catch(console.error)` allowed).
- The click must be recorded ONLY on success — NOT on failure, NOT before the URL is derived.
- If the click handler does not POST to `/api/analytics`, C8 FAILS.

### C17 — TypeScript compiles (regression check after fix)

- Run: `cd rollout && npx tsc --noEmit`
- Expected: no errors.

### C19 — No push performed

- Run: `git status`
- Expected: local branch is ahead of origin by 2 commits (Round 1 + Round 2); remote unchanged.

## Verdict (Round 2)

- **PASS** only if:
  - Pre-check pass: diff touches ONLY `ProductDetailsClient.tsx`
  - C8 pass: click recorded via POST to `/api/analytics` with `eventType: 'click'`
  - C17 pass: TypeScript compiles
  - C19 pass: not pushed
- **FAIL** if:
  - Any out-of-scope change exists (other files modified) — even if C8 is correct
  - C8 missing or records click on failure
  - C17 fails
  - C19 fails

## Round history

- **Round 1 (2026-09-04):** Full build tested 17/19 PASS, 1 functional fail (C8 — Shop click not recorded) + 1 literal-test deviation (C4, PASS by design).
- **Round 2 (2026-09-04):** Scope = ONLY the C8 fix in `handleShop()`. No other changes allowed. Tester checks ONLY: scope enforcement, C8, C17, C19.

## Security Notes

- **Never** read `.env.local` files directly
- **Never** expose API keys or secrets in test output
- Use `process.env` for loading environment variables
- If you need to verify env vars exist, check `.env.example` (committed) not `.env.local` (secret)