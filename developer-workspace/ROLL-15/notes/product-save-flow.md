# Note — How a product is saved (and the address-vs-picture rule)

**Date:** Sun Nov 01 2026
**Context:** ROLL-15 planning. Owner said: *"the form saves to the db so the image has to save to
sanity a link returned and then … pls check how save is done in public and explain to me like am 10."*
**Basis:** read-only trace of the code on disk, 2026-11-01. Nothing was edited to produce this.
**Purpose:** record the real save flow so the pending-upload decision is built on evidence, not memory.

---

## 0. Path correction (read this first)

The app does **not** live at `athletica/rollout/`. It lives **one level deeper**:

| Referred to as | Actual path |
|---|---|
| `rollout/` | `/home/lordwhitefire/current-project/athletica/athletica/rollout/` |
| `frontend/` | `/home/lordwhitefire/current-project/athletica/athletica/frontend/` |
| product editor | `athletica/rollout/src/app/admin/products/product-editor.tsx` |

There is **no** `rollout/src/components/admin/` directory. All paths below are real.

---

## 1. The rule that governs everything

> **The database never stores images. It stores the addresses of images.**

- The picture itself is large and lives in **Sanity** (a separate service — a photo warehouse).
- The database row has room only for a **string**: the picture's address.
- So the order is always: **upload picture to Sanity → Sanity returns a URL → write that URL into
  the database row.**

This is true in **both** apps (`rollout` and `frontend`). They differ only in column names and shape.

---

## 2. How `rollout` saves a product today

### 2.1 The form holds everything locally until Save

`athletica/rollout/src/app/admin/products/product-editor.tsx`

- Submit button is `type="submit"` (`:1044`)
- Form handler (`:581-586`):

```tsx
581:      <form
582:        className="editor-form"
583:        onSubmit={(e) => {
584:          e.preventDefault();
585:          handleSubmit();
586:        }}
```

- `handleSubmit` (`:294-358`) does: validate → slug-uniqueness check (a read) → `buildPayload()` →
  `PUT` (edit) or `POST` (create):

```tsx
326:    const payload = buildPayload();
327:    const editId = isEdit && product ? product.id : null;
333:      if (editId) {
334:        res = await fetch(`/api/admin/products/${editId}`, { method: 'PUT', ... });
343:      } else {
344:        res = await fetch('/api/admin/products', { method: 'POST', ... });
```

**So typing, ticking, editing benefits, reordering — none of it touches the server.** Confirmed.

### 2.2 The payload carries image *addresses*, not files

`buildPayload` (`:253-292`):

```tsx
278:         main_image: form.mainImage.trim() || null,
279:         images: form.gallery,
```

`main_image` is one URL string; `images` is an array of URL strings. **No file is ever sent on Save.**

### 2.3 The API routes write the row

| Route | File | Line | Call |
|---|---|---|---|
| `POST /api/admin/products` | `src/app/api/admin/products/route.ts` | `:51` | `createProductAdmin(payload)` |
| `PUT /api/admin/products/[id]` | `src/app/api/admin/products/[id]/route.ts` | `:30` | `updateProductAdmin(id, body)` |

The actual DB write — `src/lib/products/product-service.ts`:

```ts
70: export async function createProductAdmin(product: ProductInsert): Promise<ProductRow> {
71:   const supabase = createAdminClient();
72:   const { data, error } = await supabase
73:     .from('products')
74:     .insert(product)
75:     .select()
76:     .single();
```

```ts
82: export async function updateProductAdmin(id: string, updates: ProductUpdate): Promise<ProductRow> {
83:   const supabase = createAdminClient();
84:   const { data, error } = await supabase
85:     .from('products')
86:     .update(updates)
87:     .eq('id', id)
88:     .select()
89:     .single();
```

**Client, key, schema** — `src/lib/supabase/server.ts:9-13`:

```ts
9: export function createAdminClient() {
10:   return createClient<Database, 'rollout'>(supabaseUrl, supabaseServiceKey, {
11:     db: { schema: 'rollout' },
12:   });
13: }
```

- Key: `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- Schema: `rollout`, table: `products`
- **No auth check in these routes** — no `getUser`, no `cookies()`, no `middleware.ts`. This is the hole ROLL-15 exists to close.

### 2.4 The image actually goes to Sanity the moment you pick it

`src/app/api/admin/media/upload/route.ts:24-30`:

```ts
24:    const buffer = Buffer.from(await file.arrayBuffer());
25:    const asset = await adminClient.assets.upload('image', buffer, {
26:      filename: file.name,
27:      contentType: file.type,
28:    });
30:    return NextResponse.json({ item: { _id: asset._id, url: asset.url, originalFilename: asset.originalFilename } });
```

Sanity client — `src/lib/admin-sanity.ts:3-9`: project `cuiis46d`, dataset `production`, token
`SANITY_WRITE_TOKEN`.

**Sanity returns both `_id` and `url`. Only `url` is kept.** `_id` is discarded at
`product-editor.tsx:446` and used only as a React key in the media browser.

Client side — `product-editor.tsx:436-452`:

```tsx
436:  const handleUpload = async (file: File | null) => {
437:    if (!file) return;
438:    setUploadState('uploading');
439:    setUploadFile(file);
441:      const formData = new FormData();
442:      formData.append('file', file);
443:      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: formData });
444:      const data = await res.json();
446:      addImageUrl(data.item.url);
```

`addImageUrl` (`:429-434`) puts the URL into `mainImage` if empty, else appends to `gallery`.

**Trigger: fires on file selection, not on Save** (`:865-874`):

```tsx
865:              <input
866:                ref={uploadInputRef}
867:                type="file"
868:                accept="image/jpeg,image/png,image/webp,image/avif"
870:                onChange={(e) => {
871:                  handleUpload(e.target.files?.[0] ?? null);
872:                  e.target.value = '';
874:              />
```

### 2.5 What a `rollout.products` row actually stores

Type — `src/lib/database.types.ts:31-32`:

```ts
31:           main_image: string | null;
32:           images: string[];
```

DDL — `supabase-rollout-schema.sql:33-35`:

```sql
33:   -- Images
34:   main_image TEXT,
35:   images TEXT[] DEFAULT '{}',
```

**Plain Sanity CDN URL strings.** No `_type: 'image'`, no `asset._ref`, no JSON objects.

---

## 3. How `public` saves a product (the `frontend` app)

`public` here means the **Postgres `public` schema**, not `rollout/public/` (that folder contains only
five stock SVGs and no code — uploads never go there).

### 3.1 Server Actions, not API routes

`athletica/frontend/src/lib/actions/products.ts` — `"use server"` at `:1`.

```ts
471:        const { error } = await adminSupabase.from("products").upsert(row as never);
```

```ts
497:        const { error } = await adminSupabase
498:            .from("products")
499:            .update(row as never)
500:            .eq("id", id);
```

Called from `frontend/src/components/admin/dashboard-v2/ProductFullEditor.tsx:490-493`:

```tsx
490:            const { createProduct, updateProduct } = await import("@/lib/actions/products");
491:            const result = isNew
492:                ? await createProduct(formData)
493:                : await updateProduct(productId!, formData);
```

Client — `frontend/src/lib/supabase/admin.ts:6-15` sets **no `db.schema`**, so supabase-js defaults to
`public`.

### 3.2 Same principle, different column

- Table DDL: `athletica/supabase/migrations/20260819000000_initial_schema.sql:45` creates unqualified
  `products` → `public.products`
- Image column is **`image_links text[]`** (`:63`), not `main_image`/`images`
- `products.ts:457`: `image_links: images.length > 0 ? images : null`
- `assetToUrl` (`:410-414`, helper `:62-69`) converts a Sanity reference like `image-<hash>` into
  `https://cdn.sanity.io/images/cuiis46d/production/...` at save time

**So `public` also stores addresses, not pictures.** Different column name, different shape — same rule.

### 3.3 Other things that write `public.products` (not UI save paths)

- `athletica/scripts/import-data-to-supabase.ts:378-381` — `.from('products').upsert(...)`
- `athletica/frontend/import-data-to-supabase.ts` — same
- `athletica/frontend/src/lib/actions/batch-upload.ts:183` — `.insert(rowData)`
- `athletica/frontend/upsert-model-hierarchy.ts:217-218,267,290` — updates
- `athletica/scripts/upsert-model-hierarchy.ts:211,261,284` — updates
- `athletica/frontend/scripts/restore-db-from-snapshot.mjs:31,50` — whole-schema restore

---

## 4. Side by side

| | `rollout` | `frontend` (`public`) |
|---|---|---|
| How writes happen | `fetch` → API route handlers | **Server Actions** (`"use server"`) |
| Write call | `createProductAdmin` / `updateProductAdmin` | `createProduct` / `updateProduct` |
| DB call | `.insert()` / `.update().eq('id')` | `.upsert()` / `.update().eq("id")` |
| Image column(s) | `main_image TEXT`, `images TEXT[]` | `image_links text[]` |
| Image value type | Sanity CDN URL string | Sanity CDN URL string |
| Sanity ref kept? | No — `_id` discarded, only `url` kept | `image-<hash>` refs converted to URLs at save |
| Upload timing | **immediately on file pick** | inside the save action |

---

## 5. The flaw, stated plainly

Today in `rollout`:

> picture → **warehouse immediately** (on file pick) → address → **index card on Save**

If the user picks a photo and then closes or cancels the form, **the picture is already in the
warehouse with nothing pointing at it** — an orphaned asset.

---

## 6. The owner's decision (recorded)

> **Product filling and tinkering stay in the browser. Nothing reaches the server until Save is
> pressed.** Uploads included.

Concretely:

1. On file pick, keep the `File` object in browser state — **do not upload**
2. Preview it locally with `URL.createObjectURL(file)` — a browser URL, no server involved
3. Mark it "pending upload" in the UI so it is visibly unsaved
4. **On Save:** upload the pending files, get the URLs back, then save the product with those URLs
5. On cancel/close: drop the pending files — they never left the browser

Result: pressing Save is the **only** thing that ever contacts the server with data.

### What it means in code terms

- `handleUpload` (`product-editor.tsx:436`) loses its `fetch`; it only stages the file + preview
- `handleSubmit` (`:294`) gains an upload pass before `buildPayload()`
- Uploads and the product write become one ordered operation: uploads first, then the row

### Smaller open question (reads, not writes)

Two **reads** still happen before Save:

| Read | Trigger | Problem? |
|---|---|---|
| Media browser asset list | opening the picker | No — read-only |
| Slug uniqueness check | editing the slug | No — read-only |

If absolute purity is wanted, the slug check can move to Save-time validation. Owner's call.

---

## 7. Real catch found during the trace (unverified as a bug)

`buildPayload` **never sets `id`** (`:253-292`), and `rollout.products.id` is `TEXT PRIMARY KEY` with
**no default** (`supabase-rollout-schema.sql:6`). No `randomUUID`/`nanoid`/id generation exists in the
admin routes or the product service.

**Implication:** `POST` create would fail on a missing/duplicate primary key unless something outside
this path supplies an id. **Not confirmed as a runtime failure** — no create was executed during this
read-only trace. Must be verified before building on top of this save path.

---

## 8. NOT FOUND / not verified

- Any deferred or batched image upload tied to the Save handler — **does not exist today**
- Any `src/components/admin/` product editor in `rollout` — **does not exist**
- Any `rollout` code writing to `public.products` — **does not exist**
- Whether `POST /api/admin/products` actually succeeds at runtime — **not executed, not verified**
- Whether `rollout/public/` participates in uploads — **no**, it holds only `file.svg`, `globe.svg`,
  `next.svg`, `vercel.svg`, `window.svg`

---

## 9. Related

- `developer-workspace/ROLL-15/plan.md` — the ROLL-15 plan this qualifies
- `developer-workspace/ROLL-15/todo.md` — the task list
- `developer-workspace/ROLL-15/notes/server-side-vs-client-side.md` — authority vs interaction, and why
  the pending-upload rule is safe (the browser holds no authority)
