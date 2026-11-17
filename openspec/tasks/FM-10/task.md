# FM-10 — Product CRUD + variants + categories + collections

**Phase:** 3 | **Spec:** admin | **Depends on:** FM-01, FM-02 | **Supersedes:** ROLL-16 (price optional) | **Status:** ⬜ Pending

## What we're building

The full admin product editor: create/edit products with variants, file them into categories and collections, set the 5-status state machine, use the 3-condition publish gate, discontinue (bypass validation), soft-delete, and treat price as optional/internal (never on the public page).

## Why it matters

This is how the owner populates the marketplace. Without full CRUD + variants + categories, the catalog is a flat list. The 5-status machine + publish gate + discontinue action (from Spree, RE-04) make the catalog honest: draft work is invisible, active is visible, archived is gone-but-not-deleted, discontinue force-archives even when stale validations would block.

## What success looks like (benchmarks)

- After this, the owner can create a product with multiple variants (each with its own SKU + price + attributes), file it into categories + collections, and save it as `draft` (invisible publicly).
- After this, when the owner sets a product to `active` with `available_on` null/now, it appears on the public storefront + in `/shop`.
- After this, when the owner sets `available_on` to a future date, the product is NOT public until that date.
- After this, when the owner soft-deletes a product (`deleted_at` set), it disappears publicly but remains in the admin (default scope excludes deleted).
- After this, when the owner calls `discontinue()`, the product is archived (`status='archived'`, `discontinue_on=now`) even if a stale validation (e.g. missing category) would normally block the save.
- After this, `price` is optional in the editor; saving a product with no price succeeds; the public page never shows a price regardless.
- After this, `proposed`/`rejected` statuses exist but are NOT assignable via the standard edit form (they are review-only — bulk-assigning them is blocked in FM-11).
- After this, every admin write is role-checked at the server (`getClaims()`); no service-role key reaches the browser.

## Context the Builder needs

- Existing: `rollout/src/app/admin/products/page.tsx`, `product-editor.tsx`, `/api/admin/products` routes, `product-service.ts` (CRUD + `getProductBySlug`). ROLL-06/07 built the base.
- The Spree model (RE-04 §2.1–2.5): Product = grouping, Variant = purchasable; 5-status machine; 3-condition publish gate (`active && !deleted && available_on <= now`); `discontinue()` with `save(validate: false)`; soft-delete via `deleted_at`; tags per-schema.
- Status transitions belong in service workflows, not model methods — side-effects (events, cache invalidation) live in the workflow.
- Price optional (ROLL-16 decision — drop the `price > 0` validation).
- The `categories` + `collections` M2M tables from FM-02.

## Boundaries

- Do not show price on the public page (admin-only, optional, internal).
- Do not allow `proposed`/`rejected` via the standard edit form (review-only).
- Do not hard-delete products (soft-delete via `deleted_at`).
- Do not bypass the 3-condition publish gate for public visibility.
- Do not expose the service-role key to the browser.
- Do not skip the admin role check on any `/api/admin/*` route.
- `discontinue()` bypasses validation intentionally — do not "fix" it by re-adding validation.
