# FM-10 — Testing (product CRUD + variants + categories)

**Task:** FM-10 | **Verify behavior, not UI.**

## What behavior to verify

1. Can the owner create a multi-variant product + file it into categories/collections + save as draft (invisible publicly)?
2. Does `active` + `available_on <= now` make it public? Does future `available_on` hide it?
3. Does soft-delete hide it publicly but keep it in admin?
4. Does `discontinue()` archive even when a stale validation would block?
5. Is `price` optional + never on the public page?
6. Are `proposed`/`rejected` not assignable via the standard edit form?
7. Is every admin write role-checked (no service-role key to browser)?

## How to verify (behavioral)

- **Create multi-variant:** in the admin editor, create a product with 3 variants (each SKU + attributes), file into 2 categories + 1 collection, save as `draft`. The product does NOT appear on `/shop` or `/`. It appears in the admin list.
- **Publish:** set the product to `active`, `available_on = now`. It appears on `/shop` + `/`.
- **Future-publish:** set `available_on` to tomorrow. It does NOT appear publicly today; it appears tomorrow.
- **Soft-delete:** soft-delete the product. It disappears publicly; it remains in the admin list (with a deleted indicator).
- **Discontinue:** take a product that is missing a required field (e.g. category removed after creation). Call `discontinue()`. It archives (`status='archived'`, `discontinue_on=now`) despite the stale validation.
- **Price optional:** save a product with no price → succeeds. Open the public page → no price anywhere.
- **proposed/rejected not assignable:** in the standard edit form, there is no way to set status to `proposed` or `rejected` (the dropdown offers draft/active/archived only).
- **Role check:** with no admin session, POST to `/api/admin/products` → 404. Inspect the client bundle → no service-role key string.

## What "working" means

- The catalog is real (multi-variant, categorized, status-controlled).
- Public visibility follows the 3-condition gate exactly.
- Soft-delete + discontinue work as designed.
- Price is internal-only.
- The admin is secured.

## What to report

- Whether the multi-variant product appeared publicly as draft (it should not) and as active (it should).
- The future-publish behavior.
- Whether soft-delete hid it publicly + kept it in admin.
- Whether `discontinue()` archived despite the stale validation.
- Whether a no-price save succeeded + the public page had no price.
- Whether proposed/rejected were absent from the edit form.
- The HTTP status for an unauthenticated admin POST.
