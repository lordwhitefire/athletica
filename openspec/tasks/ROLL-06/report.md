# ROLL-06 — Task Completion Report

## Status
✅ **DONE** — Admin Product Database (`/admin/products`) built + box-contents schema shipped. Committed (not pushed).

## Commits
- `213ac08` — `docs(rollout): add UI spec files (pixel-match + interactive layer)` (Step 1, File 3/4 moved into `rollout/docs/`)
- `ea6ecf3` — `feat(rollout): add admin product database + box contents schema` (main feature)

## Decisions — RESOLVED (recorded per task requirement)

| # | Decision | Resolution (from `task.md`) | Where implemented |
|---|----------|-----------------------------|-------------------|
| D1 | Currency | `$`. No currency column; no customer-page change. ROLL-05 already renders `$`. | Admin table renders `$${price.toFixed(2)}` (`page.tsx`); customer page untouched |
| D2 | Brand/categorization | **No brand column, no category pages/filters.** `tags: string[]` already exists; admin fills tags; categorization later. | Admin table shows tags read-only as chips (max 3 + "+N") |
| D3 | "What's inside the box" | Field added now. `box_contents` column shipped via SQL file; types updated; customer page wired to real data with mock+Unsplash fallback until ROLL-07 editor. | `supabase-rollout-schema-updates.sql`, `database.types.ts` (`box_contents: string[]`), `placeholder.ts` (`mockBoxContents`, `FALLBACK_BOX_IMAGE`), customer page renders real list when present else mock list + unsplash image |
| D4 | Benefit icons | Standardized to `boot \| bolt \| target \| speed`. Compile-time `BenefitIcon` TS union now; ROLL-07 editor validation later. **No JSONB CHECK constraint.** SVG rendering untouched. | `database.types.ts` (`BenefitIcon`, `ProductBenefit.icon: BenefitIcon`); customer page `normalizeIcon` still normalizes legacy strings |
| D5 | UI spec files in repo | File 3/4 moved into `rollout/docs/`. | Committed in `213ac08` |

## What was done

**Shared interaction primitives (`rollout/src/lib/ui/`)** — built here so ROLL-07/08 reuse:
- `action-state.ts` — `ActionState` ('idle' | 'loading' | 'success' | 'error') + `AsyncState<T>/createAsyncState`
- `toast.tsx` — `useToasts()` hook + `ToastViewport` (`aria-live="polite"`, `role="status"`, dismiss button, max 4 visible). Messages per File 3: "Product published"/"Product unpublished"/"Product deleted"/"Unable to ..."
- `confirm-dialog.tsx` — `ConfirmDialog` with focus trap, Escape-closes-when-idle, Escape ignored while submitting (`busy` skip), focus restore to trigger, `onMouseDown` overlay-close blocked while busy, backdrop not interactive

**Admin API route (`/api/admin/products`)** — required because the admin page is a client component and `product-service` runs on the service-role key (server-only). Consistent with the ROLL-05 C4 architecture ruling.
- `GET ?status&search&sort&page&pageSize` → `{ items, total }` via `getProductsAdmin`
- `PATCH { id, status }` → publish/unpublish via `publishProductAdmin`/`unpublishProductAdmin`
- `DELETE ?id=` via `deleteProductAdmin`

**Admin page (`/admin/products`, client)** — File 3 behavior, real data only:
- Header: `ROLLOUT 1` eyebrow, `Products` title, `+ Add Product` (toast "Editor coming in ROLL-07" — no dead click)
- Toolbar: search (name/id/slug/color, 300ms debounce), status filter pills (All Statuses/Published/Unpublished — admin default all), sort (6 options), `N products` count
- Search/category: search + filter + sort each reset to page 1; **no category filter**
- Table: Product (name link → `/admin/products/:id/edit`, color, thumbnail w/ `FALLBACK_PRODUCT_IMAGE` when `main_image` null), ID (mono), Status pill, Price, tags chips (read-only), actions (Edit link, Publish/Unpublish, Delete)
- Publish/Unpublish: "Publishing.../Unpublishing..." → PATCH → row updates from server response → success toast; failure → row unchanged + error toast. No confirmation (not destructive)
- Delete: never on first click → ConfirmDialog ("Delete Product", "Deleting...") → DELETE → row removed + success toast; failure → row remains + error toast; if deletion empties the page, moves back one
- Pagination: `pageSize = 8`, "Showing 1 to 8 of N products", prev/next disabled at bounds
- Empty search: `NO PRODUCTS FOUND` + "Try another search term or clear the filter." + `[CLEAR SEARCH]`
- Catalog empty: "No products yet." + `[+ ADD PRODUCT]`
- Loading: shimmer row skeletons
- Error: `PRODUCTS COULDN'T BE LOADED` + "Something went wrong while loading the catalog." + `[TRY AGAIN]`

**Schema SQL (`supabase-rollout-schema-updates.sql`)**:
- `ALTER TABLE rollout.products ADD COLUMN IF NOT EXISTS box_contents JSONB NOT NULL DEFAULT '[]'::jsonb;`
- No CHECK constraint for icon values (D4 — enforced by TS union + ROLL-07 editor)
- **Owner action required:** run this SQL in the Supabase dashboard. I have NOT run it.

**Customer page (`/product/[slug]`)**:
- Box-contents section now renders real `product.box_contents` items when present; while empty (normal until ROLL-07) renders mock list (`1 × {name}`, spare laces, dust bag) above an Unsplash fallback image. All constants in `rollout/src/lib/placeholder.ts` with "temporary until ROLL-07" context.
- `rollout1-pixel-match.css` gained `.pixel-box-list`/`.pixel-box-image` styles (matches black/lemon tokens)

**Types (`database.types.ts`)**:
- `export type BenefitIcon = 'boot' | 'bolt' | 'target' | 'speed';`
- `ProductBenefit.icon: string → BenefitIcon` (D4, compile-time — SVG rendering unchanged; customer page still normalizes legacy DB strings defensively)
- `products.Row` + `box_contents: string[]`

## Notes worth knowing
- **TS type vs DB truth**: types declare `box_contents: string[]` (JSONB array of strings) matching the SQL default `'[]'`. Two sources of truth to keep in sync: the SQL file and `database.types.ts`. If the editor later stores richer content (objects), both must change together.
- **Edit links** (`/admin/products/:id/edit`) point at routes that don't exist yet (ROLL-07). They are real navigation (Next 404) — accepted as the placeholder per task.
- **`getProductsAdmin` search** is a single `or(...)` across name/slug/color/asin — matches task's search surface (name/id/slug/color; id prefixes will substring-match).
- **`+ Add Product` / `+ ADD PRODUCT`** empty-state button shows the ROLL-07 info toast — no dead click, no fake editor.
- **Pre-existing foreign dirty state** (deleted `frontend/src/components/navigation/MegaMenu.tsx`, untracked `frontend/` test files) is still present and was NOT included in commits.
- **SQL not run** — owner must paste `rollout/supabase-rollout-schema-updates.sql` into the dashboard before/with testing the admin page list against a real DB.

## Unfinished / next
- No product editor (ROLL-07), no analytics page (ROLL-08), no categorization — per task scope.
- No tests (added later).

## Verification
- `npx tsc --noEmit` in `rollout/` → **no errors**
- Commits local only (`git status: ahead of origin/main`), not pushed