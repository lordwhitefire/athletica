# ROLL-07: Testing Task — Product Editor (Add/Edit)

This document is for the tester. Run these checks AFTER the implementation task is claimed done. The tester did NOT do the building; verify from scratch. All checks are read-only — nothing here modifies or commits anything. Live DB mutations and real Sanity uploads are OUT OF SCOPE unless the owner explicitly runs them; rely on code inspection + `tsc`.

## Pre-checks

1. Confirm working directory is the repository root: `/home/lordwhitefire/current-project/athletica/athletica`
2. Confirm `rollout/src/app/admin/products/product-editor.tsx` exists
3. Confirm `rollout/src/app/admin/products/[id]/edit/page.tsx` exists
4. Confirm `rollout/src/app/api/admin/products/[id]/route.ts` exists
5. Confirm `rollout/src/app/api/admin/media/upload/route.ts` exists
6. Confirm `rollout/src/app/api/admin/media/assets/route.ts` exists
7. Confirm `rollout/src/lib/admin-sanity.ts` exists
8. Confirm `rollout/src/lib/autofill.ts` exists
9. Confirm `rollout/supabase-rollout-schema-updates.sql` includes the sizes statements

## Checks and expected results

### C1 — Editor component exists
- Run: `ls rollout/src/app/admin/products/product-editor.tsx`
- Expected: file exists

### C2 — Edit route exists
- Run: `ls "rollout/src/app/admin/products/[id]/edit/page.tsx"`
- Expected: file exists

### C3 — API has create (POST) + get-by-id + update (PUT)
- Run: `grep -n "POST\|createProductAdmin" rollout/src/app/api/admin/products/route.ts; grep -n "GET\|PUT\|getProductByIdAdmin\|updateProductAdmin" "rollout/src/app/api/admin/products/[id]/route.ts"`
- Expected: `POST` → `createProductAdmin`; `[id]/route.ts` has `GET` → `getProductByIdAdmin` and `PUT` → `updateProductAdmin`

### C4 — Sanity admin client mirrors Mature pattern
- Run: `cat rollout/src/lib/admin-sanity.ts`
- Expected: `createClient` with `projectId: "cuiis46d"`, `dataset: "production"`, `token: process.env.SANITY_WRITE_TOKEN`, `apiVersion`, `useCdn: false`

### C5 — Media upload route validates + uploads to Sanity
- Run: `grep -n "assets.upload\|jpeg\|png\|webp\|avif\|5MB\|5 \* 1024 \* 1024\|SANITY" rollout/src/app/api/admin/media/upload/route.ts`
- Expected: mime allowlist (jpeg/png/webp/avif), max 5MB, `adminClient.assets.upload(...)`, returns url

### C6 — Media assets route lists Sanity assets
- Run: `grep -n "imageAsset\|_createdAt desc\|originalFilename" rollout/src/app/api/admin/media/assets/route.ts`
- Expected: GROQ query on `sanity.imageAsset`, ordered desc, returns `{ _id, url, originalFilename }`

### C7 — No more "coming in ROLL-07" toast
- Run: `grep -n "Editor coming in ROLL-07\|coming in ROLL-07" rollout/src/app/admin/products/page.tsx || true`
- Expected: NO matches

### C8 — Add Product opens the editor modal
- Run: `grep -n "ProductEditor\|onAdd\|create" rollout/src/app/admin/products/page.tsx | head -10`
- Expected: Add button opens `ProductEditor` (create mode)

### C9 — CSV/Excel autofill helper exists (repo precedent: papaparse + exceljs)
- Run: `grep -n "parseAutofillFile\|mapAutofillRow\|papaparse\|Papa\|exceljs\|ExcelJS\|Workbook" rollout/src/lib/autofill.ts rollout/package.json | head -12`
- Expected: CSV via papaparse; XLSX via exceljs (NOT `xlsx`); returns first-row map; both packages present in `rollout/package.json`

### C10 — Autofill wired into the Add modal
- Run: `grep -n "autofill\|Autofill\|parseAutofillFile\|Unable to read file" rollout/src/app/admin/products/product-editor.tsx rollout/src/app/admin/products/page.tsx | head -10`
- Expected: autofill control present in create mode; fills form; parse error → visible toast, form untouched

### C11 — 3 image routes present (direct / upload / media)
- Run: `grep -n "api/admin/media/upload\|api/admin/media/assets\|Add image link\|Upload image\|Select from media" rollout/src/app/admin/products/product-editor.tsx | head -12`
- Expected: direct link input; upload button → `/api/admin/media/upload`; media browser → `/api/admin/media/assets`

### C12 — Upload returns link that auto-fills the image list
- Run: `grep -n "upload\|url.*image\|setImages\|onUpload" rollout/src/app/admin/products/product-editor.tsx | head -12`
- Expected: after upload success, the returned `url` is appended to the image list automatically

### C13 — Media browser click fills the image list
- Run: `grep -n "media\|assets\|Select\|grid" rollout/src/app/admin/products/product-editor.tsx | head -12`
- Expected: media browser grid; clicking an asset appends its `url` to the image list

### C14 — TypeScript types have sizes
- Run: `grep -n "sizes\|sizes_detail" rollout/src/lib/database.types.ts`
- Expected: `sizes: string[];` and `sizes_detail: string | null;` present

### C15 — SQL has sizes columns
- Run: `grep -n "sizes" rollout/supabase-rollout-schema-updates.sql`
- Expected: `ADD COLUMN IF NOT EXISTS sizes TEXT[] NOT NULL DEFAULT '{}'` and `ADD COLUMN IF NOT EXISTS sizes_detail TEXT`

### C16 — Slug auto-generation + uniqueness
- Run: `grep -n "slugify\|getProductBySlug\|already in use" rollout/src/app/admin/products/product-editor.tsx | head -8`
- Expected: auto-slugify on name change until manual edit; uniqueness check before save

### C17 — SKU optional + auto-generate
- Run: `grep -n "sku" rollout/src/app/admin/products/product-editor.tsx | head -8`
- Expected: optional, auto-generated when empty

### C18 — ASIN preserved on unrelated saves
- Run: `grep -n "asin" rollout/src/app/admin/products/product-editor.tsx | head -8`
- Expected: existing asin loaded in edit mode; unchanged values submitted as-is (preservation logic per File 3 §12)

### C19 — Validation: name/price/slug required
- Run: `grep -n "Name is required\|Price must be greater than 0\|Slug is required\|focus" rollout/src/app/admin/products/product-editor.tsx | head -10`
- Expected: the three validation messages; no close on failure; first invalid focused

### C20 — Benefits editor with the 4 standardized icons
- Run: `grep -n "boot\|bolt\|target\|speed\|Move Up\|Move Down\|Add Benefit\|Remove" rollout/src/app/admin/products/product-editor.tsx | head -20`
- Expected: icon picker offers exactly boot/bolt/target/speed; add/remove/move controls; max 8

### C21 — Sizes editor
- Run: `grep -n "sizes" rollout/src/app/admin/products/product-editor.tsx | head -8`
- Expected: size chips add/remove; sizes_detail input; sizes preserved when editing other fields

### C22 — SEO into meta
- Run: `grep -n "seo_title\|seo_description\|keywords\|meta" rollout/src/app/admin/products/product-editor.tsx | head -8`
- Expected: SEO fields stored into `meta`

### C23 — Tags + box contents editors
- Run: `grep -n "tags\|box_contents" rollout/src/app/admin/products/product-editor.tsx | head -8`
- Expected: tags chip input; box contents list editor

### C24 — Dirty-state protection
- Run: `grep -n "isDirty\|hasChanges\|UNSAVED CHANGES\|Keep Editing\|Discard Changes" rollout/src/app/admin/products/product-editor.tsx | head -10`
- Expected: dirty tracking; UNSAVED CHANGES dialog on dirty close; discard restores original

### C25 — Save states + no double-submit
- Run: `grep -n "Creating...\|Saving...\|Product created\|Changes saved\|Unable to create\|Unable to save\|disabled" rollout/src/app/admin/products/product-editor.tsx | head -15`
- Expected: busy labels, success toasts, error messages, button returns to idle, disabled during save

### C26 — Edit page loads server record (not mock)
- Run: `grep -n "api/admin/products\|fetch\|mock" "rollout/src/app/admin/products/[id]/edit/page.tsx" | head -8`
- Expected: fetches `/api/admin/products/[id]` on mount; no hardcoded mock record

### C27 — Env example placeholder added
- Run: `grep -n "SANITY_WRITE_TOKEN" rollout/.env.example`
- Expected: `SANITY_WRITE_TOKEN=` present (placeholder only)

### C28 — No real token in committed files
- Run: `grep -rn "skt[0-9a-zA-Z]\{20,\}\|cuiis46d" rollout/src rollout/.env.example rollout/package.json 2>/dev/null | head -5`
- Expected: NO real Sanity token value appears; project id may appear only in `admin-sanity.ts` config (that matches the Mature app — acceptable)

### C29 — TypeScript compiles
- Run: `cd rollout && npx tsc --noEmit`
- Expected: no errors

### C30 — No push performed
- Run: `git status`
- Expected: local branch ahead of origin, remote unchanged

## Verdict

- **PASS** only if ALL checks C1–C30 produce expected results
- **FAIL** if any check fails, especially:
  - C3: no POST/PUT/GET-by-id endpoints
  - C4: Sanity client uses wrong project/dataset or no token env var
  - C7: "coming in ROLL-07" toast still present
  - C9/C10: no autofill helper or autofill not wired
  - C11–C13: image routes missing
  - C16–C18: slug/ASIN/SKU handling broken
  - C24: no dirty-state protection
  - C26: edit page uses mocked data
  - C28: a real Sanity token committed
  - C29: TypeScript errors

## Security Notes

- **Never** read `.env.local` files directly
- **Never** expose API keys or secrets in test output
- If you need to verify env vars exist, check `.env.example` (committed) not `.env.local` (secret)
- The real `SANITY_WRITE_TOKEN` must never appear in any committed file or test output
- Schema changes are done via SQL files the owner runs — never direct DB modification