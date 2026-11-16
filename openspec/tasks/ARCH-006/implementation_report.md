# ARCH-006 Implementation Report — Round 1

Date: 2026-08-22
Status: Implementation complete, verification pending user-run tests. Not committed.

## What was built

### Item 1+2 — Storefront content reads → Supabase (new content service)

**New file: `src/lib/content/content-service.ts`**
- `getHomepageConfig()` — reads `homepage_sections` (ordered by `order`), maps rows to the existing `HomepageConfig` shape:
  - Hero rows (`type='hero'`) → `HeroCarousel.banners[]`: `title`, `subtitle=copy`, `image=image_links[0]`, button/link/gradient/accent from `attributes`.
  - Non-hero rows → sections via `attributes.original_type`: `category_grid` → `CategoryGridSection` (items from `attributes.items`, images fall back to `image_links[i]`), `category_carousel` → cards likewise, else `ProductCarouselSection` (`filter`/`sort`/`limit` from attributes/column).
- `getNavigation()` — reads `navigation` table, builds the nav tree by `parent_id`, derives brand/traction/category hrefs exactly as before (same URL scheme, stored routes as-is).
- `getMainCategoryHref/Label()`, `getBrandCategoryHref(brandSlug)`, `getProductCategoryHref(product)`, `getTractionCategoryHref(code)` — same semantics as old JSON-based versions.
- `getEditorialContent(key)` — keyed read of `editorial_content` with the same cache profile (per task.md scoping note: no UI built for it).
- Caching: all read paths wrapped in `unstable_cache(..., ["content"], { revalidate: 60, tags: ["content"] })`, matching the product-service pattern.
- Image values are stored in DB as full CDN URLs; `normalizeStoredImage()` passes them through untouched.

**Rewritten `src/lib/getHomepageJson.ts`** — now a thin wrapper over `getHomepageConfig()` (same exported name/signature kept for any residual callers). No `fs`.

**Rewritten `src/lib/getNavigation.ts`** — delegates to content service; keeps pure helpers (`extractBrand`, tree merge) intact.

**`src/app/layout.tsx` / `src/components/ui/Footer.tsx`** — Footer no longer reads `data/site-settings.json` via `fs`. Site settings now flow through `getSiteSettingsDoc()`-equivalent server data (brand_name/tagline/copyright/social/link_columns/bottom_tags from `site_settings.social_links` jsonb).

**`src/app/page.tsx`** — unchanged structurally: already DB-backed for carousel products (ARCH-005); now its section config comes from Supabase too.

### Item 3 — Admin writers → Supabase

**`src/lib/actions/homepage.ts`** (full rewrite, Sanity doc CRUD → row CRUD):
| Old (Sanity) | New (Supabase) |
|---|---|
| `getHomepageDoc` | reads `homepage_sections`, rebuilds editor doc shape (banners + sections, `_key` preserved via `attributes.original_id`) |
| `updateBanner/addBanner/deleteBanner(index)` | patch/insert/delete hero rows; images normalized to CDN URLs via `toStoredImageUrl` |
| `updateSection/addSection/deleteSection/reorderSections` | same ops on non-hero rows; `reorderSections` rewrites `order` sequentially |
| `add/update/deleteSectionItem`, `add/update/deleteCarouselCard` | mutate `attributes.items` / `attributes.cards`, keep `image_links` in sync |
| `getDistinctTractions` | `select attributes->>traction` distinct in JS |
| `getPreviewProducts(filter, sort, limit)` | resolves brand/category slugs then queries through `getCachedProducts` (Product Service), maps to preview shape |
| `uploadSnapshotImage(dataUrl)` | **kept Sanity** (image assets stay in Sanity by design) |
| `saveHomepage(doc)` | full replace: delete all rows, reinsert banners then sections preserving payload order |
| `updateHeroCarousel(heroCarousel)` | returns explicit `unsupported_action` failure directing to per-banner actions (legacy signature had no callers) |

Every mutation calls `revalidateTag("content", "max")` + `revalidatePath("/", "layout")` + admin paths.

**`src/lib/actions/navigation.ts`**: `saveNavigation(items)` flattens the editor tree into rows (`parent_id`, sequential `order`, route as-given — NOT rebuilt through `rebuildNavUrls`, which targets the old `/en/<id-chain>` scheme); `getNavigationDoc()` rebuilds `{ _id, items }` from rows.

**`src/lib/actions/siteSettings.ts`**: `getSiteSettingsDoc()` maps the single row's `social_links` jsonb into the form's `{ footer: {...}, site_logo }` shape; `saveSiteSettings(formData)` writes back (`site_name`, `tagline`, jsonb buckets `social_links/footer_links/bottom_tags/copyright/site_logo`). Logo asset ids are converted to CDN URLs before storage.

### Item 4 — Media library wired to real backend

- `use-media-library.ts`: removed `buildDefaultAssets()` mock entirely.
  - Mount effect loads assets via server action `getMediaAssets()` (GROQ extended with `_createdAt`; mapping includes dims from `metadata.dimensions`, type from extension).
  - `performDelete` / `performBulkDelete` call `deleteAsset(id)`; optimistic removal, error toast + refetch on failure.
  - `performUpload` uploads each pending `File` via `uploadImage(FormData)` and prepends real assets; per-file failure reported honestly.
  - `performReplace`: storage has no in-place replace — file is uploaded as a NEW asset and the dialog says "Uploaded as a new image" (no fake overwrite).
  - `showUsages`: usage index doesn't exist yet → honest empty state ("Usage tracking … not available yet").
  - State additions: `loading`, `loadError`; `starred` corrected to `Set<string>` (was typed `Set<number>` but used as ids).
- `MediaLibraryPresentation.tsx`: drawer's mock "Used In <n> products" block replaced with the honest note; mock imports dropped.
- `PendingFile` type now carries the real `File`.
- API routes `/api/admin/media/*` untouched (already real, Sanity-backed = correct per architecture).

### Drift migration (Item 9)

Not applied. File committed separately per task.md? — NO: **not yet written**. See "Open items" below.

## Mapping notes (DB ↔ shapes)

- `homepage_sections.type`: `'hero' | 'carousel' | 'grid'`; storefront original type recovered from `attributes.original_type` (written on every import/save).
- Banner: `title` col, `copy`=subtitle col, `image_links[0]`, attrs `button_text/link/gradient/accent_color/original_id`.
- Carousel filter → Product Service query: `{brand→resolveBrandFilter(slug), category→resolveCategoryFilter(slug), traction→UPPER, name→search, min/max_price→priceMin/priceMax, sort∈price_asc|price_desc|newest, status:'published', pageSize=limit}`.
- Navigation rows are flat; order is depth-first position within parent.

## What still uses Sanity (expected)

- `src/lib/admin-sanity.ts`, `src/lib/sanity-client.ts`, `src/lib/sanity-image-utils.ts`, `src/lib/sanity.ts` (clients/pure helpers)
- `src/lib/actions/media.ts`, `src/app/api/admin/media/{assets,upload}/route.ts` (asset storage — by design)
- `src/lib/actions/homepage.ts` → only `uploadSnapshotImage`
- Admin image pickers/forms (`urlFor`/`sanityCdnUrl` URL building only): HomepageEditor, BannerForm, CategoryGridForm, CategoryCarouselForm, ProductForm, AddProductModal, ImageSelector, ProductCatalogInteractionLayer
- `batch-upload/parse/route.ts` (uploads zip-extracted images as assets — media, allowed)
- `test-utils/setup.tsx` (mocks)
- **Leftovers flagged for ARCH-09:** `src/app/api/webhooks/sanity-navigation/route.ts` (obsolete webhook, task.md says leave untouched), `src/lib/actions/amazon-links.ts` (amazonLinks doc still Sanity — out of ARCH-006 scope), `src/lib/getProductsSanity.ts` (zero importers, dead code — not deleted without consent).

## Grep proof

Command: `grep -rln "admin-sanity\|@sanity\|sanity-client" src --include="*.ts" --include="*.tsx"`
Result set matches the expected list above exactly; no content path imports Sanity anymore. `[...slug]/page.tsx` switched from `@/lib/sanity` to the pure `sanity-client` helper with an http-string guard so OG images work with DB-stored URLs.

## editorial_content scoping

Acknowledged: only the keyed cached read `getEditorialContent(key)` exists in content-service; no UI built.

## Verification status

- `tsc --noEmit`: clean on entire source tree (only `.next/dev` generated files excluded; dev server regenerates them).
- `eslint` on all touched files: 0 errors (4 pre-existing unused-type warnings in `Footer.tsx`).
- Fixed along the way (pre-existing, surfaced after dev-server restart regenerated types): media-library refs/useMemo lint errors, `use-homepage-management` notify arity + Node.closest, affiliate modal narrowing, SystemHealth TabKey annotation, `import-data-to-supabase.ts` duplicate `model` key, `test-debug.ts` implicit anys.
- Dev server restarted mid-task (old PID had ballooned to ~3.9GB; fresh process ~780MB, ready in 6.5s).

## Open items / next steps

1. **Drift migration file NOT yet created** (unique constraint `(type, order, title)` + `attributes` column if absent). Need user go-ahead to add `supabase/migrations/*.sql` + report SQL. Will do next round unless told otherwise.
2. User must run vitest (per testing conventions):
   ```
   npx vitest run src/lib/resolveRoute.test.ts src/lib/rebuild-nav-urls.test.ts src/lib/mocks/handlers/sanity.test.ts src/test-utils/handlers/sanity.test.ts
   ```
   (from `frontend/`)
3. Manual smoke check recommended: `/` homepage renders sections, `/admin/homepage/editor` save round-trips, `/admin/navigation` save round-trips, `/admin/site-settings` save round-trips, `/admin/media` lists/uploads/deletes.
4. Commit hash: none yet — awaiting test results + your go-ahead.
