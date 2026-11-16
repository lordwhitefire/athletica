# ROLL-06: Testing Task — Admin Product Database

This document is for the tester. Run these checks AFTER the implementation task is claimed done. The tester did NOT do the building; verify from scratch. All checks are read-only — nothing here modifies or commits anything.

## Pre-checks

1. Confirm working directory is the repository root: `/home/lordwhitefire/current-project/athletica/athletica`
2. Confirm `rollout/src/app/admin/products/page.tsx` exists
3. Confirm `rollout/src/lib/ui/toast.tsx` exists
4. Confirm `rollout/src/lib/ui/confirm-dialog.tsx` exists
5. Confirm `rollout/src/lib/ui/action-state.ts` exists
6. Confirm `rollout/docs/athletica_rollout1_pixel_match_patch.md` exists
7. Confirm `rollout/docs/athletica_rollout1_final_interactive_layer_patch.md` exists
8. Confirm `rollout/supabase-rollout-schema-updates.sql` exists

## Checks and expected results

### C1 — Admin route exists
- Run: `ls -la rollout/src/app/admin/products/`
- Expected: `page.tsx` present (plus any local CSS/components)

### C2 — Client component uses real service (no mock rows in list)
- Run: `grep -n "getProductsAdmin\|initialProducts\|const products = \[" rollout/src/app/admin/products/page.tsx | head -5`
- Expected: uses `getProductsAdmin` from the service; **no hardcoded product arrays** (`initialProducts` or `const products = [` should NOT exist)

### C3 — No fabricated counts
- Run: `grep -nE "views: [0-9]|clicks: [0-9]|totalViews|totalClicks" rollout/src/app/admin/products/page.tsx || true`
- Expected: NO fabricated analytics counts

### C4 — Search present
- Run: `grep -n "search\|Search" rollout/src/app/admin/products/page.tsx | head -5`
- Expected: search input wired to service (`search` option) or client-side filter with service-backed data

### C5 — Status filter, NO category filter
- Run: `grep -n "Published\|Unpublished\|All Statuses\|status\|categor" rollout/src/app/admin/products/page.tsx | head -8`
- Expected: status filter (All/Published/Unpublished) present; **no category filter, no category/brand rendering**

### C6 — Sort present
- Run: `grep -n "Newest\|Oldest\|A–Z\|Z–A\|Low–High\|High–Low\|sort" rollout/src/app/admin/products/page.tsx | head -8`
- Expected: 6 sort options wired to service

### C7 — Pagination
- Run: `grep -n "pageSize\|Showing\|page" rollout/src/app/admin/products/page.tsx | head -8`
- Expected: `pageSize = 8`, "Showing X to Y of N" text, previous/next controls

### C8 — Loading skeletons
- Run: `grep -n "Loading\|skeleton\|Skeleton" rollout/src/app/admin/products/page.tsx | head -5`
- Expected: loading state renders skeletons, not fake rows

### C9 — Error + retry
- Run: `grep -n "COULDN'T BE LOADED\|TRY AGAIN\|retry\|Retry" rollout/src/app/admin/products/page.tsx | head -5`
- Expected: "PRODUCTS COULDN'T BE LOADED" + retry button

### C10 — Empty states
- Run: `grep -n "NO PRODUCTS FOUND\|CLEAR SEARCH\|No products yet" rollout/src/app/admin/products/page.tsx | head -5`
- Expected: both empty states present (search-empty + catalog-empty)

### C11 — Publish/Unpublish mutation
- Run: `grep -n "publishProductAdmin\|unpublishProductAdmin\|Publishing\|Unpublishing" rollout/src/app/admin/products/page.tsx | head -5`
- Expected: publish/unpublish calls service functions; busy state on button

### C12 — Delete requires confirmation
- Run: `grep -n "ConfirmDialog\|confirm\|Delete" rollout/src/app/admin/products/page.tsx | head -8`
- Expected: delete opens a confirmation dialog before calling `deleteProductAdmin`

### C13 — Toast system used
- Run: `grep -n "ToastViewport\|showToast\|toast" rollout/src/app/admin/products/page.tsx rollout/src/lib/ui/toast.tsx | head -8`
- Expected: toast components exist in `src/lib/ui/` and are used in the page

### C14 — ConfirmDialog has focus trap + Escape-when-idle
- Run: `grep -n "focus\|Escape\|trap" rollout/src/lib/ui/confirm-dialog.tsx | head -8`
- Expected: focus trap, Escape closes when idle, Escape ignored while submitting, focus restore

### C15 — Action states (no double-submit)
- Run: `grep -n "loading\|disabled" rollout/src/app/admin/products/page.tsx | head -8`
- Expected: busy buttons disabled during async ops (no double submission)

### C16 — Admin CSS follows visual system
- Run: `grep -n "#000000\|#d1fd40\|1440" rollout/src/app/admin/products/admin.css | head -8`
- Expected: black background token, lemon accent token, 1440px max

### C17 — UI spec files moved into repo
- Run: `ls rollout/docs/`
- Expected: both `athletica_rollout1_pixel_match_patch.md` and `athletica_rollout1_final_interactive_layer_patch.md` present

### C18 — Schema: box_contents added via SQL file
- Run: `grep -n "box_contents" rollout/supabase-rollout-schema-updates.sql rollout/src/lib/database.types.ts`
- Expected: `ADD COLUMN IF NOT EXISTS box_contents JSONB NOT NULL DEFAULT '[]'` in SQL; `box_contents: string[];` in types

### C19 — No Mature schema references
- Run: `grep -E "brands|categories|models|hierarchy|leaf_model" rollout/src/app/admin/products/page.tsx rollout/src/lib/database.types.ts || true`
- Expected: NO references to Mature schema/tables

### C20 — Currency is dollars ($)
- Run: `grep -n "€\|EUR\|USD\|currency" rollout/src/app/admin/products/page.tsx rollout/src/app/product/\[slug\]/ProductDetailsClient.tsx 2>/dev/null | head -10`
- Expected: prices render with `$`; **no euro symbol, no currency column usage**

### C21 — Mock/Unsplash usage is CONTAINED
- Run: `grep -rn "FALLBACK_BOX_IMAGE\|FALLBACK_PRODUCT_IMAGE\|MOCK_BOX_CONTENTS\|images.unsplash.com" rollout/src/ | head -15`
- Expected: any mock/Unsplash references are limited to clearly-named fallback constants (in the customer page or a `placeholder.ts`), with "temporary until ROLL-07" comments — NOT inside the admin list logic

### C22 — Customer page uses real box_contents when present
- Run: `grep -n "box_contents" rollout/src/app/product/\[slug\]/*.tsx rollout/src/lib/product-service.ts 2>/dev/null | head -10`
- Expected: customer page reads `box_contents` and only falls back to mock when the array is empty

### C23 — Icons standardized via BenefitIcon union (D4)
- Run: `grep -n "BenefitIcon" rollout/src/lib/database.types.ts`
- Expected: `export type BenefitIcon = 'boot' | 'bolt' | 'target' | 'speed';` exists and `ProductBenefit.icon` uses it (`icon: BenefitIcon`). This is a type-only change — the SVG components are NOT altered (check no changes in the icon map file if one exists)

### C24 — TypeScript compiles
- Run: `cd rollout && npx tsc --noEmit`
- Expected: no errors

### C25 — No push performed
- Run: `git status`
- Expected: local branch ahead of origin; remote unchanged

## Verdict

- **PASS** only if ALL checks C1–C25 produce expected results
- **FAIL** if any check fails, especially:
  - C2: hardcoded mock rows instead of `getProductsAdmin`
  - C3: fabricated counts
  - C5: category/brand filter added (out of scope now)
  - C11: publish/unpublish doesn't call service
  - C12: delete without confirmation
  - C14: ConfirmDialog missing focus handling
  - C18: box_contents not added via SQL file
  - C20: euro symbol appears
  - C21: mock data leaked into admin list logic
  - C23: icon standardization altered SVG rendering

## Security Notes

- **Never** read `.env.local` files directly
- **Never** expose API keys or secrets in test output
- Use `process.env` for loading environment variables
- If you need to verify env vars exist, check `.env.example` (committed) not `.env.local` (secret)
- Schema changes are done via SQL files the owner runs — never direct DB modification