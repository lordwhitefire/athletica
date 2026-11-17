# FM-10 — Implementation + Testing (brief)

**Task:** FM-10 (product CRUD + variants + categories) | **Date:** 2026-11-16

## Built
- `rollout/src/lib/products/types.ts` — Product + ProductVariant + Category + Collection types (single source of truth).
- `rollout/src/lib/products/product-service.ts` — full CRUD: `createProductAdmin`, `updateProductAdmin`, `deleteProductAdmin` (soft-delete via `deleted_at` + status=archived), `discontinueProduct` (bypasses validation, force-archive). Storefront reads: `getProductBySlug` (3-condition gate), `getProductById`, `getFeaturedProducts`, `getCarouselProducts`, `listProducts` (search/filter/sort/pagination), `listAllPublicProductSlugs`, `listCategorySlugs`. Variants: `listVariants`, `createVariant`.

## Benchmarks met
- Multi-variant product + categories/collections ✓; 3-condition publish gate ✓; soft-delete ✓; discontinue (bypass validation) ✓; price optional ✓; proposed/rejected not in the standard edit form (they're not in the create/update inputs — only set via the review workflow) ✓.

## Tester verdict
Static. PASS. Admin routes (`/api/admin/products/*`) call `requireAdmin` (FM-01) — the route layer enforces the role; the service assumes the caller is authorized. Recommend ✅.
