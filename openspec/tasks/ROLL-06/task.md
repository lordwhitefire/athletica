# ROLL-06: Admin Product Database (`/admin/products`)

## What and why

Build the admin Product Database list page per the interactive layer specs (File 3). This is the operational center of the catalog: what products exist, what's published, add/edit/delete, publish/unpublish. It uses real data from the ROLL-02 `product-service`. This task ALSO ships the resolved schema decisions (D1–D5) — see "Decisions — RESOLVED".

## What exists

**Services (real data):**
- `getProductsAdmin({ status, search, sort, page, pageSize })` → `{ items, total }` — supports status filter, search (name, slug, color, asin), sort, pagination (ROLL-02)
- `publishProductAdmin(id)` / `unpublishProductAdmin(id)` (ROLL-02)
- `deleteProductAdmin(id)` (ROLL-02)

**Schema (already in `rollout.products`):** `id, slug, name, status, gender, color, asin, sku, collection, tagline, subtitle, intro, key_benefits, technical_details, adjustment, range, sole_type, upper_material, traction, price, main_image, images[], meta, tags[], created_at, updated_at`
- `tags: string[]` **already exists** — NO new categorization work. Admin fills tags; categorized later, not now.

**UI specs (from files):**
- File 3 (`athletica_rollout1_final_interactive_layer_patch.md`) — interactive layer: search, filter, sort, pagination, row actions, publish/unpublish, delete confirmation, loading/error/empty states, toasts, no-dead-click / no-silent-failure / no-fake-data rules
- File 4 (`athletica_rollout1_pixel_match_patch.md`) — global visual contract (black `#000000`, lemon `#d1fd40`, white text only, 1440px max). Admin pages are NOT restyled by it; admin styling follows the same tokens with its own CSS.

## Decisions — RESOLVED (owner, 2026-09-05)

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Currency | **`$` (dollars)**. No currency column. ROLL-05 already renders `$` — no customer-page change |
| D2 | Brand / categorization | **No brand column. No category pages, no category filters anywhere.** Products are few. `tags: string[]` already exists — the admin adds tags to a product; products with similar tags get categorized LATER, not now. ROLL-06 shows tags read-only only (optional chips) |
| D3 | "What's inside the box" | **Add the field now.** `box_contents` column added via SQL file, types updated, customer page wired. Until the admin editor exists, customer page shows **mock content + Unsplash image fallback**; replaced when the admin (ROLL-07) enters real data |
| D4 | Benefit icons | **Standardized (owner confirmed 2026-09-05).** Allowed values are exactly `boot | bolt | target | speed`. Does NOT change any icon visually — same 4 SVGs keep rendering. Implemented as a `BenefitIcon` TS union in `database.types.ts` now (compile-time), plus ROLL-07 editor validation later. **No JSONB CHECK constraint — skip it, it's awkward and enforced elsewhere** |
| D5 | UI spec files in repo | Move File 3/4 into `rollout/docs/` (Step 1) |

## What this task does

1. Move File 3 + File 4 into the repo (`rollout/docs/`)
2. Create `rollout/supabase-rollout-schema-updates.sql` — adds `box_contents` (see Step 3); run by owner, never applied ad-hoc
3. Add `box_contents` + `BenefitIcon` to the hand-written types; wire the customer page box-contents section to real data with mock/Unsplash fallback
4. Build shared interaction primitives: action-state, ToastViewport, ConfirmDialog (focus trap, Escape-when-idle, focus restore)
5. Build the admin list page at `/admin/products` with real data
6. Record D1–D5 resolutions in the report

## Hard rules

1. **No fake data in the admin list** — every row, count, and status comes from `getProductsAdmin` (no-fake-data rule)
2. **Mock/Unsplash only where explicitly allowed**: box-contents section on the customer page (until admin editor exists) and product thumbnail fallback when `main_image` is null. Every fallback is a clearly-named constant (e.g. `FALLBACK_BOX_IMAGE`, `MOCK_BOX_CONTENTS`) with a comment: "temporary until ROLL-07 admin editor enters real content"
3. **No silent failures** — every mutation shows loading → success (toast) or error (toast + row unchanged)
4. **No dead clicks** — every visible control changes state, navigates, or shows feedback
5. **Publish/unpublish needs no confirmation** — it is not destructive
6. **Delete requires confirmation** — never delete on first click (ConfirmDialog)
7. **Visual system** — black background, lemon accent, white text only, 1440px max
8. **No white UI surfaces, no new accent colors, no gradients**
9. **No brand column, no category pages, no category filter** — tags exist but categorization is out of scope
10. **Schema changes only via SQL file** — owner runs it

## Steps (in order)

Run from the repository root (`/home/lordwhitefire/current-project/athletica/athletica`).

### 1. Move UI spec files into the repo

```bash
mkdir -p rollout/docs
cp /home/lordwhitefire/Downloads/athletica_rollout1_pixel_match_patch.md rollout/docs/
cp /home/lordwhitefire/Downloads/athletica_rollout1_final_interactive_layer_patch.md rollout/docs/
git add rollout/docs/
git commit -m "docs(rollout): add UI spec files (pixel-match + interactive layer)"
```

Future tasks reference `rollout/docs/`, not `~/Downloads/`.

### 2. Schema SQL — `box_contents`

Create `rollout/supabase-rollout-schema-updates.sql`:

```sql
-- Run by owner in Supabase dashboard (SQL editor). Rollout schema.
-- ROLL-06 D3: what's inside the box.
ALTER TABLE rollout.products
  ADD COLUMN IF NOT EXISTS box_contents JSONB NOT NULL DEFAULT '[]'::jsonb;
```

That's it. **No CHECK constraint for icons (D4)** — constraining JSONB sub-fields is awkward; D4 is enforced by the `BenefitIcon` TS union + ROLL-07 editor validation.

**Owner action**: paste this SQL file in the Supabase dashboard and run it.

### 3. Types + customer page box contents

- Update `rollout/src/lib/database.types.ts`:
  - Add `export type BenefitIcon = 'boot' | 'bolt' | 'target' | 'speed';`
  - `ProductBenefit.icon: string` → `icon: BenefitIcon`  (D4 — compile-time standardization; SVG rendering untouched)
  - `products.Row`: add `box_contents: string[];` (JSONB array)
  - Bump the header comment date
- Update the customer page `/product/[slug]` box-contents section (`WHAT'S INSIDE THE BOX`):
  - When `product.box_contents.length > 0` → render the real items from the DB
  - When empty (normal until admin editor exists) → render `MOCK_BOX_CONTENTS` (e.g. a short believable list: `"1 × ${product.name}"`, `"Pair of spare laces"`, `"Dust bag"`) above a `<img>` using `FALLBACK_BOX_IMAGE` (a stable Unsplash photo URL)
  - Constants live in the customer page file or a small `rollout/src/lib/placeholder.ts` with the "temporary until ROLL-07" comment
  - This is the ONLY place mock content is allowed
- Also: product thumbnail fallback — any place showing `main_image` that is null uses one `FALLBACK_PRODUCT_IMAGE` (Unsplash), clearly commented

### 4. Create the admin route

```bash
mkdir -p rollout/src/app/admin/products
```

### 5. Shared interaction primitives

Inside `rollout/src/lib/ui/`:

- **`action-state.ts`** — `type ActionState = 'idle' | 'loading' | 'success' | 'error'` + `AsyncState<T>` helper. Never allow double-submit.
- **`toast.tsx`** — `ToastViewport`: `{ kind: 'success' | 'error' | 'info'; title; message? }[]`, `aria-live="polite"`, dismiss button. Messages: "Product published", "Product unpublished", "Product deleted", "Unable to ...".
- **`confirm-dialog.tsx`** — `ConfirmDialog`: focus trap, Escape closes when idle, Escape ignored while submitting, focus restore, background not interactable. Used for delete.

These are shared primitives ROLL-10 would otherwise deliver — build here; ROLL-07/08 reuse.

### 6. Build the admin page

Create `rollout/src/app/admin/products/page.tsx` (client component) per File 3 behavior, bound to real services (File 1 prototype graphics = base, but ONLY as layout guidance — data is real):

- **Header**: `ROLLOUT 1` eyebrow, `Products` title, "+ Add Product" (shows toast "Editor coming in ROLL-07" — no dead click)
- **Toolbar**: search input (name/id/slug/color), "N products"
- **Table**: Product (name + color, thumbnail w/ Unsplash fallback), ID, Status, Price (`$`), tags shown read-only as small chips (optional), actions (Edit → `/admin/products/:id/edit` placeholder, Publish/Unpublish, Delete)
- **Status filter**: All / Published / Unpublished. **No category filter.**
- **Sort**: Newest / Oldest / Name A–Z / Name Z–A / Price Low–High / Price High–Low. Changing search/filter/sort resets to page 1
- **Pagination**: `pageSize = 8`, "Showing 1 to 8 of N products", prev/next disabled at bounds; deletion emptying a page moves back one
- **Search empty**: "NO PRODUCTS FOUND / Try another search term or clear the filter. [CLEAR SEARCH]"
- **Catalog empty**: "No products yet. [+ ADD PRODUCT]"
- **Loading**: row skeletons
- **Error**: "PRODUCTS COULDN'T BE LOADED ... [TRY AGAIN]"
- **Publish/Unpublish**: click → "Publishing..." → server confirms → row updates → success toast; failure → row unchanged + error toast
- **Delete**: ConfirmDialog → "Deleting..." → server confirms → row removed → success toast; failure → row remains + error toast

### 7. Admin CSS

Create `rollout/src/app/admin/products/admin.css` with the pixel tokens:

- `--admin-black: #000000`, `--admin-lemon: #d1fd40`, `--admin-ink: #ffffff`, `--admin-muted: #a7a7a7`, `--admin-line: #262626`
- Max width 1440px centered, no expansion at 1680/1920/2560px
- Phone: search/filter/sort stack; rows become cards; Add Product becomes full-height sheet with sticky bottom actions
- No white surfaces; white is text only

### 8. Verify + commit

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Expected: no errors.

```bash
cd /home/lordwhitefire/current-project/athletica/athletica
git add rollout/src/app/admin/ rollout/src/lib/ui/ rollout/src/lib/database.types.ts rollout/src/app/product/ rollout/supabase-rollout-schema-updates.sql rollout/docs/
git commit -m "feat(rollout): add admin product database + box contents schema"
```

**Do NOT push. Do NOT run the SQL yourself — owner runs it.**

## Benchmarks (what must be true after this change)

- `/admin/products` exists and loads from `getProductsAdmin` (no mock rows in the list)
- Search filters rows; empty state shows "NO PRODUCTS FOUND" + CLEAR SEARCH
- Status filter works, resets to page 1. **No category filter anywhere**
- Sort (6 options) works, resets to page 1
- Pagination: 8/page, "Showing 1 to 8 of N", bounds disabled
- Publish/Unpublish mutates server-side + success toast; failure keeps row + error toast
- Delete requires ConfirmDialog; success removes row + toast; failure keeps row + toast
- Loading skeletons; error "PRODUCTS COULDN'T BE LOADED" + TRY AGAIN; empty catalog "No products yet. [+ ADD PRODUCT]"
- Toast/ConfirmDialog/action-state exist in `rollout/src/lib/ui/` and are used
- Admin CSS uses black/lemon/1440px tokens; phone layout stacks
- `supabase-rollout-schema-updates.sql` exists with `box_contents`; types include `box_contents: string[]`
- `BenefitIcon` union (`'boot' | 'bolt' | 'target' | 'speed'`) exists in types and `ProductBenefit.icon` uses it — SVG rendering untouched
- Customer page renders real `box_contents` when present; mock + Unsplash fallback when empty (constants clearly commented "temporary until ROLL-07"); thumbnail fallback when `main_image` null
- Prices render `$`
- File 3/4 in `rollout/docs/`
- D1–D5 resolutions recorded in report
- `npx tsc --noEmit` passes
- One feature commit `feat(rollout): add admin product database + box contents schema`
- No push, SQL not run by builder

## What is explicitly NOT done in this task

- No product editor (ROLL-07 — Add/Edit form, tags entry, box contents entry, icon validation)
- No analytics page (ROLL-08)
- No category pages or tag filtering — tags are data only
- No tests (added later)