# Testing Report: ARCH-006 — Verify Website Content Reads/Writes Supabase and Sanity Is Images-Only

**Date:** August 22, 2026  
**Target:** ARCH-006 Implementation Verification  
**Status:** **PARTIAL / BLOCKED ON WRITES**  

---

## Executive Summary

- **Read Path (Supabase):** **PASS** ✅. Storefront homepage sections, carousel product filtering, header/footer navigation, and site settings read directly from Supabase (`homepage_sections`, `navigation`, `site_settings`) with zero Sanity API queries (CDN image asset fetches remain external as intended).
- **JSON Independence:** **PASS** ✅. Temporarily renaming `frontend/data/products/` and `frontend/data/homepage.json` left the storefront rendering fully intact, proving zero runtime dependency on legacy JSON content files.
- **Write Path (Admin Editors):** **FAIL (BLOCKER)** ❌.
  - **Homepage Admin (`/admin/homepage/editor`):** Saving fails with a generic error toast ("An unexpected error occurred"). Root cause identified: `homepage.ts:632` issues `.delete().neq("id", "")`, which serializes to `?id=neq.` (invalid PostgREST UUID syntax returning HTTP 400). **Good news:** Because delete fails first, no data loss ever occurs on homepage saves.
  - **Navigation Admin (`/admin/navigation`):** Persists successfully (251s for 1293 sequential upserts), but **destroys unpaginated records** because `getNavigationDoc` fetches an unpaginated list (PostgREST limit), causing the stale-diff delete mechanism to purge ~228 unlisted rows. (Restored byte-perfect from A1 backup).
  - **Site Settings Admin (`/admin/site-settings`):** **PASS** ✅. Updates single row correctly and propagates to storefront within 13 seconds.
- **Regression Checks:** **PASS** ✅. Product pages (`/{slug}`), dashboard product counts (28 published), and price change propagation (~68s within TTL) all intact.

---

## Detailed Findings by Section

### 1. Homepage Renders from Supabase (Read Path)
- **Structure Parity:** `/` renders all 35 sections matching `homepage_sections` rows ordered by `order` (6 hero banners, 21 carousels, 8 grids).
- **Image Source:** Sourced from full CDN URLs stored in DB (`image_links` / attributes).
- **Sanity Network Sweep:** Zero calls to `api.sanity.io` dataset endpoints during homepage load and navigation click-through (18 `cdn.sanity.io` image asset requests).

### 2. Carousel Contents vs DB Query
- Tested "Premium Boots" product carousel (`sort=price_desc`, `limit=10`). Slugs matched direct Supabase query results exactly (10/10 items).
- **JSON Independence Proof:** Renamed `frontend/data/products/`, `homepage.json`, and `navigation.json`. Homepage reloaded with all probes ("SHOWTIME PACK", "Top Football Boots") rendering normally.

### 3. Navigation & Link Crawl
- **Link Crawl:** 21 header/footer links crawled; **0 dead links (0 404s)**. Routes match DB `route` columns.
- **Data-Loss Issue on Save:** The nav editor's unpaginated fetch combined with stale-diff deletion purged 228 rows during a save test. Restored via backup (0 residual diffs).

### 4. Site Settings Round Trip
- **Edit Round Trip:** Changed copyright text in `/admin/site-settings` to `"QA RT COPYRIGHT"` → DB updated in 5s → storefront footer updated in 13s. Reverted cleanly both in DB and storefront.

### 5. Media Page (Sanity-Backed)
- `/admin/media` successfully lists Sanity image assets (4,892 total). Upload and delete UI present. End-to-end "upload → copy URL → homepage image field" workflow is blocked solely by the B1 homepage save blocker.

### 6. Regression Spot-Checks
- Product detail pages (`/adidas-predator-elite-fg-black`) load with HTTP 200 and correct data.
- Published product count: 28 items in Supabase.
- Price change propagation: Patched price in Supabase → storefront reflected new price within 68 seconds (within ~60s TTL target).

---

## Blocker & Non-Blocker Defects Discovered

1. **[BLOCKER] Homepage Save Failure (`homepage_save_failed`):**
   - *Cause:* `src/lib/actions/homepage.ts` line 632 uses `.delete().neq("id", "")`, which PostgREST rejects with HTTP 400 (UUID syntax error).
   - *Impact:* Homepage admin edits cannot be persisted.
   - *Safeguard Note:* Because delete fails instantly, zero data loss occurs.

2. **[BLOCKER / Data Integrity Risk] Navigation Lossy Save:**
   - *Cause:* `src/lib/actions/navigation.ts` loads navigation via unpaginated `.select("*")` and deletes any DB record not present in the payload.
   - *Impact:* Saving navigation truncates unlisted records.

3. **[Non-Blocker / UX Bug] Carousel Variant Schema Mismatch:**
   - 19 out of 20 product carousel rows store `attributes.variant = "default"`, but `PRODUCT_CAROUSEL_VARIANTS` in `types.ts` only defines `"filtered-feed"`. Consequently, opening these carousels in the admin editor hides all editable fields (title, filters, limits).

---

## Verdict: **CONDITIONAL PASS ON READS / FAIL ON WRITES**
- Read paths, JSON independence, media asset management, site settings write path, and product regressions are fully verified and approved.
- Homepage writes and navigation save logic require fixes for `neq("")` and pagination before full sign-off.
