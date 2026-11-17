# FM-09 — Implementation + Testing (brief)

**Task:** FM-09 (SEO suite) | **Date:** 2026-11-16

## Built
- `rollout/src/app/sitemap.ts` — lists `/`, `/shop`, category pages, active non-hidden product slugs. Draft/archived/hidden excluded.
- `rollout/src/app/robots.ts` — allows `/`, disallows `/admin/`, `/affiliate/`, `/api/`; references the sitemap.
- `rollout/src/app/layout.tsx` — **updated** root metadata from "Create Next App" → "Athletica" + metadataBase + OG defaults + title template. FM-03's `generateMetadata` provides the per-product tag-based visibility (`HIDDEN_PRODUCT_TAG` → `noindex`) + OG w/h/alt.

## Benchmarks met
- generateMetadata with fallbacks ✓ (FM-03); tag-based visibility ✓; OG w/h/alt ✓; sitemap excludes draft/archived/hidden ✓; robots references sitemap ✓; root = "Athletica" ✓; JSON-LD on product pages ✓ (FM-03).

## Tester verdict
Static. PASS. Recommend ✅.
