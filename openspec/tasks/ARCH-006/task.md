# Builder Task: ARCH-06 — Move Website Content to Supabase (Homepage, Navigation, Settings) + Wire Media

## What we're building

The product catalog lives in Supabase (ARCH-01..05, verified). The **website content does not yet**: the storefront homepage still reads `data/homepage.json` from disk, pulls carousel products from legacy `data/products/*.json`, and the header/footer navigation reads `data/navigation.json`. Meanwhile the Supabase tables `homepage_sections`, `navigation`, and `site_settings` already exist and were populated during ARCH-02 — nobody reads them. On the admin side, `/admin/homepage`, `/admin/navigation`, and `/admin/site-settings` still write Sanity documents through `src/lib/actions/homepage.ts`, `navigation.ts`, `siteSettings.ts`.

This task flips content reads and writes to Supabase, per the core architecture decision: **all text lives in Supabase; Sanity stores image assets only** (links to those assets are stored in Supabase).

## Why it matters

Right now the admin edits Sanity docs that the storefront doesn't even read (the storefront reads JSON files from disk) — content editing is theater, the same way the import center was before ARCH-REC-005. After this task, editing the homepage or navigation in the admin changes what customers see, within cache TTL, exactly like products already do. It also retires the last place the storefront depends on files in the repo, and settles the nav-routing question (`/boots` vs `/en/adultos/boots`) by making the DB the single source of truth for labels and routes.

## The current state (verified facts you need)

### Storefront readers (what must flip)
- `src/app/page.tsx` imports `getHomepageConfig`/`getHomepageSections` from `@/lib/getHomepageJson` — reads `data/homepage.json` via `fs.readFile`. Shape: `hero_carousel.banners[]` (title, subtitle, button_text, link, gradient, accent_color, image) + `sections[]` (types `category_carousel` | `product_carousel` | `category_grid`; each with variant, title, subtitle, bg, items[]/cards[], filter, link, sort, limit).
- Carousel products: `getProductsForCarousel(section)` derives filters from `section.link` (`deriveFilterFromLink`) and filters **legacy JSON products** from `data/products/*.json`.
- `src/lib/getNavigation.ts` reads `data/navigation.json` (`fetchNavigationData`, line 29) → `NavItem[]` tree (label, href, level, children, customLinks, sizeLinks, bottomLinks…). Consumed by `Footer.tsx` (`getMainCategoryHref`) and passed into the header/nav components; `ProductForm.tsx`/`ModelInput.tsx` import only the `ModelNavNode` **type** (fine either way).
- Site settings: no storefront consumer was found reading `data/site-settings.json` directly — check where tagline/contact/social render (footer/legal pages) and wire them to the DB read.

### Admin writers (what must flip)
- `src/lib/actions/homepage.ts` (~430 lines): fetches/patches the Sanity `homepage` doc (sections, hero_carousel.banners), queries Sanity product traction, uploads images to Sanity assets (:381).
- `src/lib/actions/navigation.ts`: fetches/patches the Sanity `navigation` doc (`items` array). `NavigationEditor.tsx` calls `saveNavigation`.
- `src/lib/actions/siteSettings.ts`: fetches/patches/creates the Sanity `siteSettings` doc.
- `src/app/api/webhooks/sanity-navigation/route.ts`: webhook that rebuilds the Sanity nav doc. Becomes dead after the flip — leave the file untouched (ARCH-09 removes legacy), just note it in your report.

### Media (stays Sanity BY DESIGN)
- `/admin/media` (+ `/api/admin/media/assets`, `/api/admin/media/upload`, `actions/media.ts`, `lib/sanity-image-utils.ts`): listing/uploading/deleting **image assets** in Sanity is the target architecture, not legacy. Images stay in Sanity; their CDN URLs get stored in Supabase columns (`image_links`). Keep these working — fix errors and mocks only. The batch-upload parse route also uploads product images to Sanity and stores URLs — correct, leave it.

### Database (exists, populated by ARCH-02)
- `homepage_sections`: id, type ('hero'|'carousel'|'grid'|'banner'), order int, title, copy, category_id FK, limit int, image_links text[], timestamps. **Plus `attributes jsonb` in the LIVE database — present in generated types but missing from every migration file (schema drift, see item 6).**
- Import mapping (from `frontend/import-data-to-supabase.ts:478-571`) — your read mapping is the exact reverse:
  - Hero banners → `type:'hero'`, title=heading, copy=subtitle, `image_links:[image]`, attributes: {button_text, link, accent_color, gradient, original_id}.
  - Carousels → `type:'carousel'`, limit column, attributes: {original_type ('product_carousel'|'category_carousel'), variant, filter, link, link_label, sort, cards[], autoSwitchMs}.
  - Grids → `type:'grid'`, attributes: {original_type:'category_grid', variant, bg, items[]}.
- Upserts used `onConflict: 'type,order,title'` → the live DB likely has a UNIQUE constraint on (type, order, title) that is ALSO missing from migrations (verify, see item 6).
- `navigation`: id, parent_id self-FK, label, route, order. `site_settings`: single row (site_name, tagline, contact_email, social_links jsonb). RLS: anon can SELECT all content tables; writes are service-role via `adminSupabase` (`src/lib/supabase/admin.ts`).
- `editorial_content` table exists (key, title, body, image_links) but has ZERO consumers in the codebase today — see scope note below.

### Patterns to follow
- Read caching/writes mirror `src/lib/products/product-service.ts`: server-side `unstable_cache` with tags, two-arg `revalidateTag("content", "max")` on writes (Next 16.1.6 requires the max argument), plus `revalidatePath` for `/` and affected routes.
- Validation schemas under `src/lib/schemas/`.

## What to build

### 1. Content Service (new read layer)
New module (e.g. `src/lib/content/content-service.ts`):
- `getHomepageConfig()`: read `homepage_sections` ordered by `order`; map rows back to the existing `HomepageConfig` shape (reverse of the import mapping above) so `app/page.tsx` and its components need minimal changes. Hero rows → banners; carousel rows → sections with `original_type` deciding product vs category carousel; grid rows → items from attributes.
- Carousel products: resolve through the **Product Service** (DB), never `data/products/*.json`. Use the section's stored filter/link semantics (category_id, attributes.filter/link) with the service's existing filters (category/brand/traction/model-path/sort/limit).
- `getNavigation()`: build the NavItem tree from the `navigation` table (parent_id hierarchy, order). Map to the existing shape the header/footer consume (keep field names; route → href).
- `getSiteSettings()`: single row from `site_settings`.
- Wrap reads in `unstable_cache` with a new `content` tag (sensible TTLs, e.g. 60–300s).

### 2. Flip the storefront readers
- `app/page.tsx`: import from the content service instead of `@/lib/getHomepageJson`.
- Header/footer/nav components: read from the content service instead of `@/lib/getNavigation`'s JSON path. Keep `getNavigation.ts` file untouched (legacy, ARCH-09 removes) — just stop importing its runtime functions. Type-only imports elsewhere are unaffected.
- Wherever tagline/contact/social render, read from `getSiteSettings()`.
- Do NOT edit the JSON files or the legacy modules themselves.

### 3. Flip the admin writers
- `homepage.ts`: rewrite against `homepage_sections` — update section title/copy/limit/image_links/attributes, reorder (order column), edit hero banners (button_text/link/colors/image), add/remove sections within the type enum. Keep the response shapes the UI already consumes so component churn stays minimal. Image inputs keep producing Sanity CDN URLs via the existing upload endpoint — store URLs in `image_links`/attributes, never Sanity asset ids.
- `navigation.ts`: rewrite against the `navigation` table — save the tree from `NavigationEditor` (upsert/delete/reorder rows, maintain parent_id + order). Surface FK/constraint errors clearly (the parentId "" lesson from ARCH-REC-005 applies: normalize empty strings to null).
- `siteSettings.ts`: rewrite against `site_settings` (single row upsert).
- Every write: `revalidateTag("content", "max")` + `revalidatePath` for `/` and affected routes.

### 4. Media page — make it fully functional (still Sanity-backed)
- `/admin/media` lists REAL assets (via `/api/admin/media/assets`), upload works (existing endpoint), delete confirms then deletes the asset. If the page currently shows mock/placeholder data anywhere, remove the mocks (constants may stay as dead code per the legacy boundary).
- Make the CDN URL of each asset easily copyable — that URL is what admins paste into homepage/editorial image fields.
- Fix the ~15 pre-existing tsc errors in the media-library components (you're touching them anyway).

### 5. Editorial content — read path only (scope decision)
No page or component consumes `editorial_content` today. Do NOT build admin UI or storefront features for it (speculative work). Add a keyed read (`getEditorialContent(key)`) to the content service with the same caching so a future consumer has the path, and note it in your report. If you disagree with this scoping, say so in the report rather than silently building UI.

### 6. Schema drift backfill (migration file ONLY)
The live DB has things the migration files don't: `homepage_sections.attributes jsonb` and (very likely) a UNIQUE `(type, order, title)` constraint. Write ONE migration file (e.g. `supabase/migrations/20260822000000_homepage_sections_drift_backfill.sql`) using idempotent guards (`add column if not exists`, DO block checking pg_constraint before adding the unique index). Match what the live DB actually has — verify against `frontend/src/lib/supabase/types.ts` and the import script's onConflict target. **Do not apply it** — output it, commit it, and tell the user to run it. Regenerate TS types afterward only if you changed anything structural (output the command; user runs it — if the migration adds nothing new to the live DB, types won't change).

### 7. TypeScript + commit
- Fix pre-existing tsc errors in files you touch (media-library ~15, homepage-management ~3). No NEW errors anywhere.
- Commit with a descriptive message, e.g. `feat(content): ARCH-06 — homepage/navigation/settings on Supabase, content service, media wiring, schema drift backfill`.

## Boundaries — what NOT to do

- **Don't delete legacy code** — `getHomepageJson.ts`, `getNavigation.ts` runtime paths, the sanity-navigation webhook, old Sanity action branches all stay in the repo (ARCH-09 removes them after verification). Stop importing them; don't rewrite them.
- **Don't touch `amazon-links.ts` or affiliate settings** — ARCH-07.
- **Don't touch analytics/system-health** — ARCH-08.
- **Don't migrate images out of Sanity** — the architecture keeps assets in Sanity; you store URLs in Supabase. Media page stays Sanity-backed.
- **Don't change the product/admin-catalog behavior** — it's verified and done.
- **Don't apply migrations** — file + SQL in the report; the user applies.
- **Don't build editorial_content UI** (see item 5).

## Acceptance benchmarks

| # | Benchmark |
|---|---|
| 1 | The storefront homepage renders its sections/banners from Supabase: same visible structure as today (hero carousel, carousels, grid), sourced from `homepage_sections` rows — verified by changing a section title/copy in `/admin/homepage` and seeing it on `/` within cache TTL (~60s), with the DB row confirming the value |
| 2 | Homepage product carousels show products from the Product Service (DB): pick one carousel, reproduce its filter with a direct DB/service query, contents match; `data/products/*.json` no longer influences the homepage (rename the directory temporarily or prove via code path that it's unread) |
| 3 | Every hero banner image URL is a full CDN URL read from `homepage_sections.image_links`/attributes — no Sanity document fetch participates in rendering `/` (Network sweep: zero Sanity API/dataset calls on the homepage) |
| 4 | Header/footer navigation renders from the `navigation` table; editing a label and a route in `/admin/navigation` changes the storefront within TTL; EVERY rendered nav link returns HTTP 200 (no dead `/boots`-style links — fix stale routes in DATA via the editor, not with code special-cases) |
| 5 | Site settings edits persist to `site_settings` (row verified) and appear wherever tagline/contact/social render within TTL |
| 6 | `/admin/media` lists real assets; upload returns/stores a CDN URL that can be pasted into a homepage section image field and renders; delete confirms and removes the asset |
| 7 | Grep check: `homepage.ts`, `navigation.ts`, `siteSettings.ts` contain NO Sanity client usage anymore. Remaining `adminClient` consumers are exactly: `media.ts`, media API routes, `sanity-image-utils.ts`, `batch-upload/parse/route.ts`, `amazon-links.ts`, the webhook, `admin-sanity.ts` itself, test setup |
| 8 | Content writes invalidate correctly: any admin content edit reflects on the storefront within TTL (no manual restart/refetch); no stale-forever reads |
| 9 | Migration file for the drift exists (attributes column + unique constraint, idempotent), committed but NOT applied by you; report contains the SQL and the exact command for the user |
| 10 | tsc: 0 errors in touched files; pre-existing media-library/homepage-management error count drops accordingly; no new errors elsewhere |
| 11 | Work committed with a descriptive message |

## Files you'll likely touch

- New: `src/lib/content/content-service.ts` (+ types as needed)
- `src/app/page.tsx`, header/footer nav components (flip imports)
- `src/lib/actions/homepage.ts`, `src/lib/actions/navigation.ts`, `src/lib/actions/siteSettings.ts`
- `src/components/admin/*` for homepage/navigation/settings/media as the data contract requires (minimal churn — keep UI, swap data)
- `supabase/migrations/2026*_homepage_sections_drift_backfill.sql` (new file)
- `frontend/src/lib/supabase/types.ts` only if regeneration changes it (user runs gen)

In your implementation report: the mapping tables (DB row ↔ HomepageConfig/NavItem shapes), how carousel filters resolve to Product Service queries, the exact drift SQL you wrote and how you verified it matches the live DB, which Sanity references you removed (with grep proof), what still uses Sanity and why (expected list), the editorial_content scoping acknowledgment, and the commit hash.