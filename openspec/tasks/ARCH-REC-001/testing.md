# Tester Task: ARCH-REC-001 — Reconciliation Verification: Model Hierarchy Added & Import Reconciled

## What behavior to verify

The reconciliation successfully:
1. Created the `models` table with self-referential hierarchy
2. Added `leaf_model_id` to `products` with FK
2. Parsed model hierarchy from source `model` strings and upserted models
3. Linked all products to their leaf models
4. Model hierarchy is queryable and correct

## How to verify — using Lighthouse + Chrome

Use Lighthouse at `~/Lighthouse` in Chrome. Verify through Supabase Dashboard (Table Editor) and REST API calls from browser console.

### Step 1: `models` table exists and is correct

In Supabase Dashboard → **Table Editor** → `models`:
- Table exists with columns: `id`, `slug`, `name`, `brand_id`, `parent_id`, `level`, `description`, `created_at`, `updated_at`
- **Indexes**: `brand_id`, `parent_id`, `level`, unique on `(brand_id, slug)`
- **FKs**: `brand_id → brands.id`, `parent_id → models.id` (ON DELETE SET NULL)
- **RLS**: Enabled, public SELECT policy, no public write

Count rows — should have:
- ~8-10 root models (Predator, X, Mercurial, Phantom, Tiempo, Future, Ultra, Copa, 442, King, etc.)
- ~10-15 sub-models (League, Elite, Superfly, Vapor, GX, GT, Legend, World Cup, etc.)
- ~15-20 leaf models (League FT FG/MG, Elite FG, Superfly FG, etc.)
- Total: ~30-45 models

### Step 2: `products.leaf_model_id` exists and is populated

In `products` table:
- Column `leaf_model_id` exists (uuid, nullable)
- **FK**: `leaf_model_id → models.id` (ON DELETE SET NULL)
- **Index** on `leaf_model_id`
- **All 28 source products** have non-NULL `leaf_model_id`
- The 1 test product from ARCH-001 may have NULL (acceptable)

Check via Dashboard: filter `products` where `leaf_model_id IS NULL` → should show only the test product (if any)

### Step 3: Model hierarchy structure is correct

In `models` table, verify hierarchy for key brands:

**adidas:**
- Root: "Predator" (level=0, parent_id=NULL) → children: "League", "Elite", "Accuracy", "Copa", "F50", "Mundial"
  - "League" (level=1, parent=Predator) → children: "League FT FG/MG", "League FG", "League LL FG"
  - "Elite" (level=1, parent=Predator) → children: "Elite FT FG", "Elite FG", "Elite LL AG"
  - "Accuracy" (level=1, parent=Predator) → children: "Accuracy.1 FG"
- Root: "X" (level=0) → children: "Crazyfast", "Speedportal"
- Root: "Copa" (level=0) → children: "Pure", "Mundial"
- Root: "F50" (level=0) → children: "F50"
- Root: "Mundial" (level=0) → children: "Team"

**Nike:**
- Root: "Mercurial" → children: "Superfly", "Vapor"
- Root: "Phantom" → children: "GX", "GT", "Luna"
- Root: "Tiempo" → children: "Legend", "Premier"
- Root: "Premier" → children: "Premier III"

**Puma:**
- Root: "Future" → children: "Ultimate"
- Root: "Ultra" → children: "Ultimate"
- Root: "King" → children: "King"

**New Balance:**
- Root: "442" (level=0, also leaf — no children)
- Root: "Furon" → children: "Furon"
- Root: "Tekela" → children: "Tekela"

### Step 4: Products linked to correct leaf models

Spot-check 5 products in `products` table:

| Product `id` | Source `model` | Expected leaf model | `leaf_model_id` → correct? |
|---|---|---|---|
| JI1114 | "Predator/League-FT-(FG/MG)" | "League FT FG/MG" (child of "League" under "Predator") | ✅ |
| JI1085 | "Predator/Elite-FG" | "Elite FG" (child of "Elite" under "Predator") | ✅ |
| JI1094 | "Predator/Elite-FT-FG" | "Elite FT FG" | ✅ |
| (Nike product) | "Mercurial/Superfly" | "Superfly" (child of "Mercurial") | ✅ |
| (Puma product) | "Future/Ultimate" | "Ultimate" (child of "Future") | ✅ |

**Color variant check**: Find products with same `leaf_model_id` → should have different `color` values.

Example: Products under "League FT FG/MG" leaf should include White, Black, Orange, Pink variants.

### Step 5: Model hierarchy queries work via REST API

In Chrome DevTools Console (with anon key):

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const ANON_KEY = 'YOUR_ANON_KEY';

async function testModelQueries() {
  // 1. Get root models for adidas
  const adidasBrand = await fetch(`${SUPABASE_URL}/rest/v1/brands?name=eq.adidas&select=id`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }).then(r => r.json());
  const brandId = adidasBrand[0]?.id;
  
  const rootModels = await fetch(`${SUPABASE_URL}/rest/v1/models?brand_id=eq.${brandId}&level=eq.0&select=id,slug,name`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }).then(r => r.json());
  console.log('adidas root models:', rootModels);

  // 2. Get leaf models under "Predator" root
  const predator = rootModels.find(m => m.slug === 'predator');
  if (predator) {
    const leafModels = await fetch(`${SUPABASE_URL}/rest/v1/models?parent_id=in.(SELECT id FROM models WHERE parent_id=eq.${predator.id})&level=eq.2&select=id,slug,name`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }).then(r => r.json());
    console.log('Predator leaf models:', leafModels);
  }

  // 3. Get products under a leaf model (color variants)
  const leagueLeaf = rootModels.find(m => m.slug === 'league-ft-fg-mg'); // adjust slug format
  if (leagueLeaf) {
    const products = await fetch(`${SUPABASE_URL}/rest/v1/products?leaf_model_id=eq.${leagueLeaf.id}&select=id,color,image_links`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }).then(r => r.json());
    console.log('League FT FG/MG color variants:', products.map(p => p.color));
  }
  
  // 4. Model ancestry for breadcrumbs (recursive - do in SQL Editor instead)
}

testModelQueries().catch(console.error);
```

**What to observe**: All queries return 200, data matches expected hierarchy.

### Step 6: Color variants query works

Pick a leaf model with multiple products (e.g., "League FT FG/MG"):

```javascript
const products = await fetch(`${SUPABASE_URL}/rest/v1/products?leaf_model_id=eq.<LEAF_MODEL_ID>&select=id,color,image_links`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }).then(r => r.json());
console.log('Colors:', products.map(p => ({ id: p.id, color: p.color })));
// Should show: White, Black, Orange, Pink, White and Green (multiple variants)
```

### Step 7: TypeScript types regenerated

Open `frontend/src/lib/supabase/types.ts`:
- `models` table type exists with all columns
- `products` table has `leaf_model_id: string | null`
- Relationships: `products.leaf_model_id → models.id`, `models.parent_id → models.id`, `models.brand_id → brands.id`

### Step 8: RLS on `models` table

In Dashboard → `models` → Policies:
- `SELECT` policy for `anon` role (public read)
- No `INSERT/UPDATE/DELETE` for `anon`
- Service role bypasses RLS

Test anon read:
```javascript
await fetch(`${SUPABASE_URL}/rest/v1/models?select=id,slug,name`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }).then(r => { console.log('Status:', r.status); return r.json(); }).then(console.log);
// Status: 200, returns array of models
```

## What to report

Write a plain-language report covering:

1. **Schema** — `models` table exists with correct columns, indexes, FKs, RLS?
2. **Products linked** — All 28 source products have non-NULL `leaf_model_id`?
3. **Hierarchy structure** — Root → sub → leaf depth correct for major brands?
4. **Leaf model linkage** — Products point to level=2 (leaf) models?
5. **Color variants** — Products sharing `leaf_model_id` have different colors?
6. **Queries** — REST API queries for root models, leaf models, color variants work?
7. **Types** — TypeScript types include `models` and `leaf_model_id`?
8. **RLS** — Public can read models, cannot write?
9. **Any surprises** — Orphaned models? Incorrect levels? Parsing edge cases?

**No screenshots. No UI checks.** Just: *Does the model hierarchy exist, is it correct, and are products linked to it?*