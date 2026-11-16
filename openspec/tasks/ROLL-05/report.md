# ROLL-05 — Task Completion Report

## Status
✅ **DONE (Round 1 + Round 2)** — Customer Product Details page built and committed (not pushed).

## 🔧 Round 2 — C8 fix (2026-09-04)
Testing found one functional gap: **Shop clicks were never recorded in analytics** (the `handleShop()` opened the affiliate URL but never sent a click event). Fixed in `ProductDetailsClient.tsx`:
- After `window.open(...)` + `setShopState('opened')` succeeds, fire-and-forget POST to `/api/analytics` with `{ productId, eventType: 'click' }`.
- Recorded only on success (not on error) — so clicks are counted only when the affiliate URL was actually derived and opened.
- Verified: `fetch('/api/analytics'` present in the click handler; `npx tsc --noEmit` passes.
- Committed separately as `fix(rollout): record shop clicks in analytics (C8 round 2)` (`6e8d72e`). C4 (literal grep for service imports in the client) was reviewed and is **PASS by design** — client components correctly avoid importing server-only services; they go through API routes.

## What was done

1. **Route `/product/[slug]`** — App Router dynamic route (`rollout/src/app/product/[slug]/`).
2. **Server component `page.tsx`** — resolves `slug`, calls `getProductBySlug(slug)`, calls `notFound()` when missing/unpublished, fire-and-forget `recordView(product.id)`, renders the client component with real product data.
3. **Client component `ProductDetailsClient.tsx`** — pixel-match structure (from `athletica_rollout1_pixel_match_patch.md`, File 4):
   - Hero split, thumbnails, story + benefits, technical details + gallery, bottom strip.
   - Bound to **real DB data** via `ProductRow` (no hardcoded mock product).
   - Shop Product interactive states: `idle → loading(OPENING...) → opened(OPENED) → error(TRY AGAIN)`; calls `/api/affiliate?productId=...`, then `window.open`s the derived URL. Never constructs the Amazon URL in the component.
   - Keyboard gallery controls: ArrowLeft / ArrowRight / Home / End (skips inputs).
   - Broken-image fallback `IMAGE UNAVAILABLE` on dark surface; gallery/thumbnail images guard against empty image sets.
   - Imports `rollout1-pixel-match.css` (black/lemon/white, `#d1fd40`, `.pixel-*`, hard 1440px cap, no nav, no footer).
4. **`/api/affiliate/route.ts`** — `GET ?productId=` → `getAffiliateUrl(productId)` → `{ url }` (400/404 handling).
5. **`/api/analytics/route.ts`** — `POST {productId, eventType}` → `recordView`/`recordClick` (400/500 handling).
6. **`not-found.tsx`** — "PRODUCT NOT FOUND" with ATHLETICA header, styled in the pixel system.
7. **Typechecked** — `npx tsc --noEmit` passes.
8. **Committed** as `feat(rollout): add customer product details page with pixel-match UI` (`8097205`). **Not pushed.**

## ⚠️ Architecture notes / decisions to record

1. **Sources were external files.** The task references "File 4" (`athletica_rollout1_pixel_match_patch.md`) and "File 3" (`athletica_rollout1_final_interactive_layer_patch.md`) which are **not in the repo** — they were found in `/home/lordwhitefire/Downloads/`. If these patches are meant to be the long-lived UI spec, they should be moved into the repo (e.g. `openspec/` or `rollout/docs/`) so future tasks (ROLL-06/07/08) use the same source of truth.

2. **Real-data binding gaps (DB has no fields the pixel-match mock hardcodes).** Handled gracefully, but worth noting the mappings:
   - Brand (mock showed "ADIDAS") — **not in `rollout.products` schema**; omitted from the header (no brand line rendered). If a brand is required for the customer page, a `brand` column/field must be added to the schema (future task).
   - "What's inside the box" content — mock had structured copy; DB has **no such field**. Renders the product name as placeholder. No box-contents field exists in the schema.
   - Currency — DB `price` is a bare `DECIMAL` with no currency. Rendered as `$` (task didn't specify; the pixel-match reference used `€`). **Currency is not in the schema** — needs a decision/field.
   - Benefit icon — DB stores `icon: string`; the mock's `BenefitIcon` needed a `'boot'|'bolt'|'target'|'speed'` union. Normalized via `normalizeIcon()` with a `boot` fallback. String→icon mapping is heuristic; consider standardizing the icon values at data-entry time.
   - `main_image` used as single-image fallback only; `images` is the primary gallery source.

3. **`recordView` called from the server component** but `recordView` uses the **anon key**. This works now (thanks to the ROLL-04 `anon_can_insert_analytics` policy + live verification) and the product row exists (just fetched), so the FK is satisfied. ⚠️ But note the double-path: a view is also recordable client-side via `/api/analytics` (`recordView`), and the page fire-and-forgets one on load. **Risk of double-counting views** (server fire-and-forget `recordView` + any client re-record). Only the server-side call is currently wired; keep this in mind when the client adds click recording so views aren't counted twice.

4. **Affiliate URL is generated server-side** (good security model — the anon client never sees the ASIN/constructs the Amazon URL). The `getAffiliateUrl` runs with the **service_role** key inside `/api/affiliate`; the ASIN is resolved server-side. This protects the affiliate tag/linkCode from client-side tampering.

5. **Shop Product error state** surfaces `TRY AGAIN` on any failure and re-enables the button — no silent failure (per interactive-layer rule 29).

## Not done (per task scope)
- No admin pages (ROLL-06, ROLL-07, ROLL-08).
- No analytics page UI.
- No product editor.
- No toast system / confirmation dialogs (admin tasks).
- No tests.
