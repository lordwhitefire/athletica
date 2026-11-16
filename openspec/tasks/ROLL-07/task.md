# ROLL-07: Rollout Product Editor (Add/Edit)

## What and why

Build the Add/Edit Product editor per File 3 (`rollout/docs/athletica_rollout1_final_interactive_layer_patch.md`, sections 11–18). This is how the catalog gets real content: create products, edit every field, manage benefits/sizes/images/tags/box-contents. It replaces the temporary mock/Unsplash placeholders from ROLL-06 with real admin-entered data.

**Images live in Sanity; Supabase stores only the links.** Three routes to fill an image link (owner-specified):
1. **Direct** — type/paste the link yourself (or it arrives autofilled from a CSV file that already contains image links)
2. **Upload** — click the Upload button, pick an image file from your computer → it uploads to Sanity → the returned Sanity link is automatically placed into the image link field
3. **Media browser** — click Select media → see a grid of every image in Sanity → click one → its link is automatically fetched from Sanity and filled

**Add Product has a file autofill:** upload a CSV/Excel file containing all product details (including image links if present) → the form autofills. This is an autofill of the form, NOT a batch upload.

## What exists

**Services (real data):**
- `createProductAdmin(product)` (ROLL-02), `updateProductAdmin(id, updates)` (ROLL-02), `getProductByIdAdmin(id)` (ROLL-02), `getProductsAdmin(...)` (ROLL-02), `getProductBySlug(slug)` (ROLL-02)

**API routes (ROLL-06):** `/api/admin/products` GET list / PATCH status / DELETE ?id=

**Admin page:** `/admin/products` (ROLL-06) — "+ Add Product" currently toasts "coming in ROLL-07" (becomes the real modal); name + Edit links point at `/admin/products/:id/edit` (currently 404, becomes the real page)

**Schema (`rollout.products`):** id, slug, name, status, gender, color, asin, sku, collection, tagline, subtitle, intro, key_benefits, technical_details, adjustment, range, sole_type, upper_material, traction, price, main_image, images[], meta, tags[], box_contents, created_at, updated_at

**Shared primitives:** `src/lib/ui/` — action-state, toast, confirm-dialog (ROLL-06)

**Sanity reference (Mature app — copy the pattern):**
- `frontend/src/lib/admin-sanity.ts` — `createClient({ projectId: "cuiis46d", dataset: "production", token: process.env.SANITY_WRITE_TOKEN, apiVersion: "2025-01-01", useCdn: false })`
- `frontend/src/app/api/admin/media/upload/route.ts` — POST, FormData `file`, allowed jpeg/png/webp/avif, max 5MB, `adminClient.assets.upload("image", buffer, { filename, contentType })` → returns `{ _id, url, originalFilename }`
- `frontend/src/app/api/admin/media/assets/route.ts` — GET, `adminClient.fetch('*[_type == "sanity.imageAsset"] | order(_createdAt desc) { _id, url, originalFilename }')`

**CSV/Excel parsing reference (Mature app — copy the pattern):**
- `frontend/src/app/api/admin/batch-upload/parse/route.ts` — the established parser: `.csv` via `Papa.parse` (header: true, skipEmptyLines: true), `.xlsx` via `ExcelJS.Workbook()` first worksheet (row 1 = headers) with a `cellToString` converter; `coerceNumber` strips non-numeric chars
- Expected columns follow the Mature field names: name, description_subtitle, description_tagline, description_intro, description_collection, description_key_benefits, technical_adjustment, technical_range, technical_sole_type, technical_upper_material, main_image, image_gallery, sizes, etc.
- NOTE the difference: Mature's batch upload maps CSV image values as FILENAMES into a ZIP. Rollout's autofill maps them as LINKS directly (owner spec — CSV can contain image links already, or images are added via the 3 image routes afterward)

**Spec files:** File 3 (§11–18 editor, §15 image interactions), File 4. Both in `rollout/docs/`.

## Decisions (ALL confirmed by owner 2026-09-05)

| # | Decision | Resolution | Why |
|---|----------|------------|-----|
| D6 | **Sizes** | Add `sizes TEXT[]` + `sizes_detail TEXT` columns via the schema-updates SQL file; editor implements File 3 §14 | File 3 acceptance checklist requires Sizes editor |
| D7 | **SEO** | Store seo_title/seo_description/keywords in existing `meta` JSONB | Zero schema change |
| D8 | **Images = Sanity-backed, 3 routes** | Editor images are links (main_image + images[]). Three fill routes: direct link entry, upload-to-Sanity (link auto-returned), Sanity media browser (link auto-returned). Mirror Mature app's admin-sanity + media routes | Owner decision — "we use sanity to store images and put links in supabase" |
| D9 | **Add = modal with CSV autofill, Edit = page** | "+ Add Product" opens modal with an Autofill-from-file control; name/Edit links open `/admin/products/[id]/edit` (same editor component, loads server record) | Owner decision — CSV/Excel autofills the form, not batch |

## Dependencies + env (APPROVED by owner 2026-09-05; one owner action remains)

**Dependencies to install in `rollout/`** (all mirror frontend's exact versions — no new/additional packages beyond repo precedent):
- `@sanity/client` `^7.22.0` — Sanity admin client (upload + assets)
- `papaparse` `^5.5.4` + `@types/papaparse` `^5.5.2` (dev) — CSV parsing
- `exceljs` `^4.4.0` — Excel (.xlsx) parsing (NOT `xlsx`; repo precedent uses exceljs)

Install command (owner runs or approves a builder-run):
```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npm install @sanity/client@^7.22.0 papaparse@^5.5.4 exceljs@^4.4.0
npm install -D @types/papaparse@^5.5.2
```

**Env (rollout app):**
- Add `SANITY_WRITE_TOKEN=` placeholder to `rollout/.env.example` (committed)
- **Owner action**: paste the real token into `rollout/.env.local` (never committed; same token as frontend — one Sanity project, `cuiis46d`/`production`)

## Hard rules (from File 3)

1. **No fake data** — editor loads/saves through the real service; never prefilled mock records in edit mode
2. **No silent failures** — every save exposes idle/loading/success/error; errors visible, button returns to idle
3. **No dead clicks** — every control (add benefit, remove size, set main image, upload, select media) mutates state visibly
4. **Busy buttons disabled** — never allow double submission
5. **Validation errors keep the modal open** — show field errors, focus the first invalid field
6. **ASIN is NOT required; do not erase an existing ASIN during unrelated saves**
7. **SKU optional; auto-generate when empty; never reject for missing SKU**
8. **Slug auto-slugifies from name until manually edited; uniqueness checked before save**
9. **Dirty-state protection** — closing dirty shows UNSAVED CHANGES [Keep Editing] [Discard Changes]; clean close immediate; discard restores original values
10. **Visual system** — black/lemon/white-text/1440px; phone modal = full-height sheet with sticky bottom actions
11. **No white surfaces; white is text only**
12. **Upload safety** — only jpeg/png/webp/avif, max 5MB per file; upload failure visible + retry
13. **CSV autofill is autofill only** — it fills ONE form; it never creates/updates rows directly (not batch)

## Steps (in order)

Run from the repository root (`/home/lordwhitefire/current-project/athletica/athletica`).

### 0. Dependencies + env (owner gates)

- Install the approved packages in `rollout/` (owner runs or approves the command above)
- Update `rollout/.env.example` with `SANITY_WRITE_TOKEN=`; tell owner to add the real value to `.env.local`

### 1. Schema SQL (D6)

Append to `rollout/supabase-rollout-schema-updates.sql`:

```sql
-- ROLL-07 D6: sizes editor support.
ALTER TABLE rollout.products
  ADD COLUMN IF NOT EXISTS sizes TEXT[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE rollout.products
  ADD COLUMN IF NOT EXISTS sizes_detail TEXT;
```

**Owner action**: re-run the SQL file in the dashboard after review.

### 2. Types

Update `rollout/src/lib/database.types.ts`:
- `products.Row`: add `sizes: string[];` and `sizes_detail: string | null;` (comment "ROLL-07 D6")
- Bump header comment date

### 3. Sanity admin client

Create `rollout/src/lib/admin-sanity.ts` — mirror `frontend/src/lib/admin-sanity.ts` exactly:
`createClient({ projectId: "cuiis46d", dataset: "production", token: process.env.SANITY_WRITE_TOKEN, apiVersion: "2025-01-01", useCdn: false })`

### 4. Media API routes

Create (simplified copies of the frontend routes — no CSRF/rate-limit infra exists in rollout yet, keep the file validation):

- **`rollout/src/app/api/admin/media/upload/route.ts`** — `POST`:
  - FormData `file`; missing → 400 `{ error: 'No file provided.' }`
  - Mime must be jpeg/png/webp/avif; else 400 `{ error: 'Only JPEG, PNG, WebP, and AVIF images are allowed.' }`
  - Size > 5MB → 400 `{ error: 'File must be under 5MB.' }`
  - `const buffer = Buffer.from(await file.arrayBuffer());`
  - `const asset = await adminClient.assets.upload('image', buffer, { filename: file.name, contentType: file.type });`
  - 200 `{ item: { _id: asset._id, url: asset.url, originalFilename: asset.originalFilename } }`
  - catch → 500 `{ error: 'Upload failed. Please try again.' }`
- **`rollout/src/app/api/admin/media/assets/route.ts`** — `GET`:
  - `const assets = await adminClient.fetch('*[_type == "sanity.imageAsset"] | order(_createdAt desc) { _id, url, originalFilename }');`
  - 200 `{ items: assets }`; catch → 500 `{ error: 'Failed to fetch media assets.' }`

### 5. API: create + update + get-by-id

Extend the admin API:
- **POST `/api/admin/products`** (in `route.ts`) — body = full product payload (excluding created_at/updated_at; id optional — let DB generate). Calls `createProductAdmin`. Errors → 500 `{ error: 'Unable to create product' }`; malformed → 400.
- **New route `/api/admin/products/[id]/route.ts`:** `GET` → `{ item }` or 404; `PUT` → `updateProductAdmin(id, payload)` → `{ item }`, errors → 500 `{ error: 'Unable to save changes' }`

Keep existing GET list / PATCH status / DELETE untouched.

### 6. CSV/Excel autofill helper

Create `rollout/src/lib/autofill.ts` — mirror the Mature parser pattern (NOT the ZIP part):
- `parseAutofillFile(file: File): Promise<Record<string, string>>` — `.csv` via `Papa.parse` (header: true, skipEmptyLines: true); `.xlsx` via `ExcelJS.Workbook` first worksheet, row 1 = headers, `cellToString` converter; returns the **first data row** as header→value map; throws a readable error on unreadable/empty files
- `mapAutofillRow(row): Partial<ProductRow>` — matches headers case+space-insensitively to fields; multi-value columns (`images`, `tags`, `box_contents`, `sizes`, `sizes_detail` keys) split on `|`
- Expected headers (Mature naming): name, slug (optional — auto-slugified), status, gender, color, asin, sku, collection, description_tagline, description_subtitle, description_intro, description_key_benefits, technical_adjustment, technical_range, technical_sole_type, technical_upper_material, price, main_image, image_gallery, tags, box_contents, sizes, sizes_detail, seo_title, seo_description, keywords
- `main_image` and `image_gallery` hold LINKS (URLs) — they fill the image link list directly; `coerceNumber` for price
- Unknown headers are ignored (not errors); missing fields just stay empty

**Autofill UX in the Add modal** (create mode only):
- A control in the modal header: "Autofill from file" + file input (accept `.csv,.xlsx`)
- On file select: parse → map → fill the form's fields → toast/summary "Autofilled N fields" (visible outcome, no silent partial fill)
- Parse error → visible toast "Unable to read file: <reason>" — form untouched
- After autofill the user reviews, then uses the 3 image routes to complete images when the CSV had no links

### 7. Editor component

Create `rollout/src/app/admin/products/product-editor.tsx` (client component) — one component, two modes (create/edit):

**Form sections (File 3 §11) + the image editor:**
- IDENTITY: id (read-only on edit; hidden/generated on create), name, slug, status (Published/Unpublished), gender, color, asin, sku
- DESCRIPTION: collection, tagline, subtitle, intro
- KEY BENEFITS: benefits editor (title, text, icon picker) — File 3 §13
- TECHNICAL DETAILS: list of {label, value}
- ATTRIBUTES: adjustment, range, sole_type, upper_material, traction, price (number, `$`, must be > 0)
- SIZES (D6): sizes[] chips, sizes_detail text
- IMAGES — the 3-route editor (owner spec):
  - The editor manages a list of image links: `main_image` (the one with the MAIN badge) + `images[]` (gallery)
  - **Route 1 — Direct:** a text input "Add image link" + Add button + preview
  - **Route 2 — Upload:** an "Upload image" button → hidden file input → POST `/api/admin/media/upload` → the returned `url` is automatically added to the image list (link filled by the system, owner spec) → per-file Uploading.../Uploaded/Upload failed/Retry states
  - **Route 3 — Media:** a "Select from media" button → opens a Sanity media browser panel (fetches `/api/admin/media/assets`) → grid of thumbnails (asset.url) with filename captions → click one → its url is automatically added to the image list
  - Controls on each listed image: Remove, Move Up/Down, Set as main (MAIN badge); broken preview → "Unable to preview image" (File 3 §15)
- SEO (D7): seo_title, seo_description, keywords → `meta`
- TAGS: tags[] chip input
- BOX CONTENTS: box_contents list editor

**Editor behaviors (unchanged from spec):**
- Slug (§12): auto-slugify on name change until manually edited; uniqueness via `getProductBySlug` (exclude self) → inline error "Slug already in use"
- SKU (§12): optional; empty → auto-generate from slug; never reject
- ASIN (§12): optional; load existing on edit; never null it on unrelated saves (submit unchanged value when untouched)
- Benefits editor (§13): icon picker `boot | bolt | target | speed`; Add/Remove/Move Up/Move Down; max 8
- Validation (§16): `Name is required`, `Price must be greater than 0`, `Slug is required`; stay open, inline errors, focus first invalid
- Save states (§17): Create → `Create Product` → `Creating...` → success → modal closes + table refreshes + toast "Product created". Edit → `Save Changes` → `Saving...` → `Saved` + toast "Changes saved". Failure → stays open, values remain, error visible, button idle. Prevent double-submit
- Dirty form (§18): `isDirty = hasChanges(initial, formState)`; close while dirty → UNSAVED CHANGES [Keep Editing] [Discard Changes]; discard restores original values; Add always fresh

### 8. Wire into the admin page

In `rollout/src/app/admin/products/page.tsx`:
- Replace the "+ Add Product" toast placeholder with: opens the editor modal (mode=create, fresh form + autofill control)
- Empty-catalog "+ ADD PRODUCT" does the same
- After successful create: close modal, refresh list, toast "Product created"
- Leave name/Edit links pointing at `/admin/products/[id]/edit` (real route now)

### 9. Edit page route

Create `rollout/src/app/admin/products/[id]/edit/page.tsx` (client):
- On mount: GET `/api/admin/products/[id]` → server record (File 3 §8)
- Renders `ProductEditor` in edit mode
- Loading skeleton; error "UNABLE TO LOAD PRODUCT" + [TRY AGAIN]; 404 message
- After successful update: toast "Changes saved"; stays on page (single behavior, no dead click)

### 10. Admin CSS additions

Extend `rollout/src/app/admin/products/admin.css` for editor + modal/sheet + media browser + autofill control:
- Modal/sheet: black surface, lemon focus, `aria-modal`, focus trap (ConfirmDialog pattern), Escape closes only when idle
- Form: section headers, dark inputs with lemon focus, benefit rows, size chips, image grid with MAIN badge, media browser grid
- Phone: full-height sheet, sticky bottom actions

### 11. Verify + commit

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Expected: no errors.

```bash
cd /home/lordwhitefire/current-project/athletica/athletica
git add rollout/src/app/admin/ rollout/src/app/api/admin/media/ rollout/src/lib/ rollout/package.json rollout/package-lock.json rollout/.env.example rollout/src/lib/database.types.ts rollout/supabase-rollout-schema-updates.sql
git commit -m "feat(rollout): add product editor with sanity media + csv autofill"
```

**Do NOT push. Do NOT run the SQL yourself — owner runs it. Do NOT add the real SANITY_WRITE_TOKEN to any committed file.**

## Benchmarks (what must be true after this change)

- "+ Add Product" opens the editor modal — no more "coming in ROLL-07" toast; modal has an Autofill-from-file control
- CSV autofill: upload a CSV with product details → form fields fill; with image links in the CSV → image list fills too; parse error → visible toast, form untouched
- Editor sections: IDENTITY / DESCRIPTION / KEY BENEFITS / TECHNICAL DETAILS / ATTRIBUTES / SIZES / IMAGES / SEO / TAGS / BOX CONTENTS
- **Three image routes all fill the image link list:** direct link input; Upload button → image uploads to Sanity → link auto-added; Select media → Sanity grid → click → link auto-added
- Create: fill → Create Product → success → modal closes → product in list → toast "Product created"
- Edit: `/admin/products/[id]/edit` loads server record → Save Changes → saved → toast; record updated
- Slug auto-slugify until manual edit; uniqueness conflict blocked inline
- SKU auto-generated when empty; ASIN never nulled on unrelated saves
- Validation: missing name / price ≤ 0 / missing slug block save, modal stays open, first invalid focused
- Benefits: icon picker exactly boot/bolt/target/speed; add/remove/move; max 8
- Sizes editor: chips + sizes_detail; editing name doesn't erase sizes
- SEO fields save into `meta`
- Tags chip input saves `tags[]`; box contents editor saves `box_contents` (mock placeholder gone once real data saved)
- Dirty close → UNSAVED CHANGES dialog; Keep Editing returns, Discard restores
- Create failure: modal stays open, values remain, error visible, button idle
- Upload safety: jpeg/png/webp/avif only, ≤5MB; failure visible + retry
- Types include `sizes: string[]` + `sizes_detail: string | null`; SQL has both ALTER statements
- `rollout/.env.example` has `SANITY_WRITE_TOKEN=` placeholder
- `npx tsc --noEmit` passes
- One feature commit `feat(rollout): add product editor with sanity media + csv autofill`
- No push; SQL not run by builder; real token never committed

## What is explicitly NOT done in this task

- No auth/middleware on admin routes (flagged: with no auth, the API routes are open once deployed — plan for ROLL-09)
- No image upload-to-Supabase (Sanity only)
- No batch import / multi-row CSV processing — autofill fills ONE form
- No size-stock management
- No categories (tags only, D2)
- No analytics page (ROLL-08)
- No tests (added later)