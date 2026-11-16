# Tester Task: ARCH-006 — Verify Website Content Reads/Writes Supabase and Sanity Is Images-Only

## What behavior to verify

The storefront homepage, header/footer navigation, and site settings must render from **Supabase** (`homepage_sections`, `navigation`, `site_settings`), not from `data/*.json` files or Sanity documents. The admin editors for homepage/navigation/settings must write Supabase, with edits appearing on the storefront within cache TTL. The media page manages real Sanity image assets (by design — images stay in Sanity) and hands out CDN URLs that work in content fields. Product data paths (ARCH-05 verified) must not regress.

## Setup

- Dev server running (`http://localhost:3000`), Chrome + Playwright or manual browsing.
- Admin login for `/admin/*`.
- Supabase REST/SQL access to verify rows after every UI action.
- Note the current visual state of `/` BEFORE testing (sections order, banner titles) so you can compare after flips.

## How to verify

### 1. Homepage renders from Supabase
- Open `/`. It should look structurally the same as before this task (hero carousel + sections).
- **DB truth**: list `homepage_sections` ordered by `order`. The rendered sections must correspond to those rows: hero rows → banners, `carousel` rows (attributes.original_type product_carousel/category_carousel) → carousels, `grid` rows → grid items from attributes.
- **Edit round trip**: in `/admin/homepage`, change one section's title (or a hero banner's subtitle) → save → within ~60s the change appears on `/` (poll). Verify the DB row holds the new value. Revert afterward.
- **Image source**: every banner/grid image URL is a full CDN URL stored in the DB (`image_links`/attributes) — pick one URL from the DB response and confirm it's exactly what renders.

### 2. Carousels come from the DB, not JSON
- Pick one product carousel on `/`. Determine its filter (from the section row's attributes/link — e.g. category Boots, brand adidas).
- Query Supabase directly with the equivalent filter (status published) and compare: the carousel products match the query result (same set/order per sort/limit).
- **JSON independence**: temporarily rename `frontend/data/products/` (or prove by code path/grep that nothing in the homepage render reads it). Reload `/` — carousels still populate. Rename back.
- Also rename `frontend/data/homepage.json` and reload — homepage still renders (from DB).

### 3. Navigation from the table; no dead links
- Header/footer nav corresponds to `navigation` table rows (labels/hierarchy/order).
- **Edit round trip**: in `/admin/navigation`, rename one visible item and save → storefront shows the new label within TTL; row updated in DB. Revert.
- Crawl check: click/fetch EVERY link rendered in header + footer menus → all HTTP 200 (no 404 dead routes like a stale `/boots` if the real route is `/en/adultos/boots`). Report any dead link with its DB `route` value — fixes belong in data via the editor.

### 4. Site settings round trip
- In `/admin/site-settings`, change tagline/contact email (whatever fields exist) → save → row updated in `site_settings`; wherever it renders (footer etc.) reflects it within TTL. Revert.

### 5. Media page (Sanity-backed by design)
- `/admin/media` lists REAL uploaded assets (upload something via the page or reuse an existing asset).
- Upload a small image → asset appears with its CDN URL; copy that URL into a homepage section image field via `/admin/homepage` → saves to DB (`image_links`) and the image renders on `/` within TTL.
- Delete: confirmation required; after confirm the asset is gone (its URL should stop resolving as an asset — note CDN cache may serve briefly; report what you see).

### 6. Cache invalidation
- Each edit above appeared without restart/manual refresh, within TTL (~60s max). Any content edit that NEVER appears = failure; note actual propagation times.

### 7. No Sanity in content rendering
- Network sweep while loading `/` and clicking through nav: zero requests to Sanity API/dataset endpoints. `cdn.sanity.io` IMAGE loads are expected and fine.
```bash
rg -l "adminClient" frontend/src/lib/actions frontend/src/app frontend/src/components | sort
```
Expected remaining consumers: `media.ts`, media API routes (`api/admin/media/*`), `sanity-image-utils.ts`, `api/admin/batch-upload/parse/route.ts`, `amazon-links.ts` (ARCH-07 scope), `api/webhooks/sanity-navigation/route.ts` (dead but present), `lib/admin-sanity.ts`, test setup. **Forbidden now**: `homepage.ts`, `navigation.ts`, `siteSettings.ts`.
```bash
rg -l "data/homepage|data/navigation|data/products" frontend/src/app frontend/src/components frontend/src/lib --glob '!**/getHomepageJson.ts' --glob '!**/getNavigation.ts'
```
Expected: empty (legacy modules may still reference them internally; nothing else may import their runtime functions — type-only imports of `ModelNavNode` are fine).

### 8. Regression spot-checks
- Product pages still load (`/{slug}` for a known product); admin catalog/editor/quick-create still work (one CRUD touch max).
- One admin→storefront product price change still propagates within TTL (products cache path unaffected).
- Dashboard KPIs unchanged (29+ products baseline).

### 9. TypeScript + schema + commit
- `npx tsc --noEmit` in `frontend/`: 0 errors in Builder-touched files; media-library/homepage-management pre-existing errors reduced (~15/~3 → near 0); total error count ≤ previous baseline (24).
- Migration file exists (e.g. `supabase/migrations/*_homepage_sections_drift_backfill.sql`): contains idempotent `add column if not exists attributes jsonb` + unique-constraint guard. **NOT applied by the Builder** (they can't have run it — confirm they only committed the file; ask the user whether they applied it; if applied, types.ts regeneration may accompany it).
- `git log` shows a descriptive ARCH-06 commit.

## What to report

1. Homepage-from-DB proof: section↔row correspondence, edit round trip (DB value + storefront reflection + time), image URLs sourced from DB.
2. Carousel contents vs direct DB query; JSON-independence proof (renamed files, site still fine).
3. Nav table rendering, label-edit round trip, full link crawl results (every link 200 or the dead ones listed).
4. Settings round trip; media upload/copy/delete flow.
5. Propagation times observed per edit.
6. Grep outputs (Sanity consumers list matches expectation; no new JSON readers).
7. tsc counts (touched files / totals vs baseline); migration file status (committed, applied-by-user or pending); commit hash.
8. Surprises: anything rendered differently from before the flip (missing sections/banners count as failures), anything still reading JSON/Sanity, broken layouts.

**No screenshots. No UI matching beyond structure parity.** Just: *Does content live in Supabase end-to-end, do admin edits reach customers within TTL, do images still come from Sanity via stored URLs, and did products regress?*