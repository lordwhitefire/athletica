# Tester Task: ARCH-003 — Product Service Verification

## What behavior to verify

The Product Service is the **single data access layer** for all product reads. It must:
- Execute all filtering/sorting/pagination in the database (no client-side filtering)
- Support model hierarchy queries (root model, sub-model, leaf model, ancestry, color variants)
- Return correctly typed data with relations (brand, category, leaf_model with ancestry, color_variants)
- Cache appropriately for performance
- Be the **only** thing the frontend calls for product data

## How to verify — using Lighthouse + Chrome

Use Lighthouse at `~/Lighthouse` in Chrome. You'll verify by:
1. **Direct function calls** from a test page or browser console (via Next.js API route / Server Action)
2. **Observing network requests** to Supabase (REST API calls) — confirm single query per operation
3. **Inspecting returned data** for correctness and shape
4. **Checking cache behavior** — repeated calls should be faster

### Step 1: Verify the service file exists and exports

In your editor, open `frontend/src/lib/products/product-service.ts`:
- Exports all required functions (see task.md list)
- Uses `createClient()` from `@/lib/supabase/server` (server-side only)
- Imports types from `@/lib/supabase/types`
- No `any` in return types (properly typed)

### Step 2: Test each function via a test route

Create a temporary test route in `frontend/src/app/api/test-product-service/route.ts` that calls each function and returns JSON. Then call it from Chrome.

**Example test route structure:**
```typescript
// frontend/src/app/api/test-product-service/route.ts
import { NextResponse } from 'next/server';
import { productService } from '@/lib/products/product-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const test = searchParams.get('test');
  
  try {
    let result;
    switch (test) {
      case 'getProductBySlug':
        result = await productService.getProductBySlug(searchParams.get('slug') || 'adidas-predator-elite-fg-black');
        break;
      case 'getProductsByCategory':
        result = await productService.getProducts({ category: 'boots', pageSize: 5 });
        break;
      case 'getProductsByRootModel':
        // First get a root model ID
        const models = await productService.getRootModels();
        const predator = models.find(m => m.slug === 'predator');
        result = predator ? await productService.getProducts({ rootModel: predator.id, pageSize: 5 }) : { items: [], total: 0 };
        break;
      case 'getProductsByLeafModel':
        // Get a leaf model first
        const adidasModels = await productService.getLeafModelsByRoot('predator-root-id');
        result = adidasModels.length ? await productService.getProducts({ leafModel: adidasModels[0].id, pageSize: 5 }) : { items: [], total: 0 };
        break;
      case 'getColorVariants':
        // Get a leaf model with variants
        const leagueModels = await productService.getLeafModelsByRoot('predator-root-id');
        const league = adidasModels.find(m => m.slug.includes('league-ft'));
        result = league ? await productService.getColorVariants(league.id) : [];
        break;
      case 'getModelAncestry':
        // Get a leaf model ID first
        const leafModels = await productService.getLeafModelsByRoot('predator-root-id');
        result = leafModels.length ? await productService.getModelAncestry(leafModels[0].id) : [];
        break;
      case 'searchProducts':
        result = await productService.searchProducts('predator', { pageSize: 5 });
        break;
      case 'getFeaturedProducts':
        result = await productService.getFeaturedProducts({ rootModelId: 'predator-root-id', limit: 4 });
        break;
      case 'getProductsByCategory':
        result = await productService.getProductsByCategory('boots', { pageSize: 5 });
        break;
      case 'getProductsByBrand':
        result = await productService.getProductsByBrand('adidas', { pageSize: 5 });
        break;
      default:
        return NextResponse.json({ error: 'Unknown test' }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

Then test in Chrome: `http://localhost:3000/api/test-product-service?test=getProductBySlug&slug=adidas-predator-elite-fg-black`

### Step 3: Verify each function's behavior

For **each test**, check in Chrome DevTools (Network tab + Console):

#### `getProductBySlug(slug)`
- Returns `ProductWithRelations` with:
  - `id`, `slug`, `name`, `model`, `brand` (object with id/slug/name/logo_link), `category` (object)
  - `leaf_model` (object with `id`, `slug`, `name`, `parent` object)
  - `model_ancestry` array: `[root, sub, leaf]` for breadcrumbs
  - `color_variants` array: products with same `leaf_model_id`, different `color`
  - `description` (jsonb), `attributes` (jsonb), `sizes` (string[]), `asin`
- Single Supabase request in Network tab

#### `getProducts(filters)`
- Returns `PaginatedResult<ProductSummary>` with `items`, `total`, `page`, `pageSize`, `totalPages`
- **Test combinations**:
  - `{ category: 'boots' }` → filters by category
  - `{ brand: 'adidas' }` → filters by brand
  - `{ rootModel: 'predator-root-id' }` → recursive filter, returns products under Predator
  - `{ leafModel: 'league-ft-fg-mg-id' }` → exact leaf model match
  - `{ gender: 'Men', color: 'Black', sort: 'price_asc', page: 1, pageSize: 12 }` → combined filters
  - `{ missingData: 'asin' }` → products with NULL asin
- **Verify**: `total` matches count query, `items.length <= pageSize`

#### `getModelAncestry(leafModelId)`
- Returns array of `ModelsRow` from root → leaf
- Example for "League-FT-(FG/MG)": `[ {slug: 'predator', name: 'Predator', level: 0}, {slug: 'league-ft-fg-mg', name: 'League-FT-(FG/MG)', level: 1} ]`
- Order: root → leaf (for breadcrumbs)

#### `getColorVariants(leafModelId)`
- Returns `ProductSummary[]` with same `leaf_model_id`, different `color`
- For "League-FT-(FG/MG)": should return 5 products (White, Black, Red, Orange, White and Light Green)

#### `getLeafModelsByRoot(rootModelId)`
- Returns leaf models (level 1 or 2) under a root
- For "Predator" root: returns ~18 leaf models (Elite-FG, League-FT-(FG/MG), etc.)

#### `getRootModels(brandSlug?)`
- Returns root models (level 0)
- With `brandSlug='adidas'`: returns ["Predator", "X"]
- Without brand: all root models across brands

#### `searchProducts(query, filters?)`
- Returns products matching query in name/model/brand
- `searchProducts('predator')` → returns adidas Predator products
- `searchProducts('mercurial')` → returns Nike products
- Combined with filters: `searchProducts('predator', { category: 'boots' })`

#### `getFeaturedProducts({ rootModelId, limit })`
- Returns up to `limit` products under root model
- Uses same recursive logic as rootModel filter

### Step 4: Verify database-side filtering (Network tab)

Open Chrome DevTools → **Network** tab → filter "Fetch/XHR".

For each call, click the request → **Payload** / **Response**:

**Critical checks:**
1. **Single request per function call** — no multiple round-trips for one logical query
2. **No full-table scans** — Supabase query should include filters (`.eq()`, `.in()`, `.range()`)
3. **Pagination** — `.range()` with correct offset/limit
4. **Count** — `.select('*', { count: 'exact' })` for total
4. **No client-side filtering** — the returned `items` already match filters; you should NOT see the service fetching all then filtering in JS

**Red flags:**
- Multiple Supabase calls for one function
- `items` array includes products that don't match filters
- `total` doesn't match actual filtered count
- Response time > 500ms for simple queries (uncached)

### Step 5: Verify caching behavior

In Network tab, make the **same call twice** rapidly:

| Call | Expected |
|---|---|
| First call | ~200-500ms (uncached, hits Supabase) |
| Second call (immediate) | < 50ms (cached, Next.js `unstable_cache`) |

Check `Cache-Control` header or Next.js cache indicators.

### Step 6: Verify TypeScript types

In your editor, hover over function return types:
- No `any`
- `ProductSummary` has exact fields (no extra, no missing)
- `ProductWithRelations` includes `model_ancestry`, `color_variants`
- `PaginatedResult<T>` has `items: T[]`, `total: number`, `page: number`, `pageSize: number`, `totalPages: number`

### Step 6: Verify no legacy code paths

Search codebase for direct Supabase product queries that should now use the service:
```bash
# In frontend/src - should find NO results for product queries outside product-service.ts
grep -r "from.*products" --include="*.ts" --include="*.tsx" frontend/src \
  | grep -v "product-service" \
  | grep -v "__tests__" \
  | grep -v "node_modules"
```
Should return empty (or only the service file itself).

### Step 7: Performance spot-check

Run a few queries and note response times:
| Query | Target (uncached) | Target (cached) |
|---|---|---|
| `getProductBySlug` | < 500ms | < 50ms |
| `getProducts({ category: 'boots', pageSize: 20 })` | < 500ms | < 100ms |
| `getProducts({ rootModel: 'predator-id' })` | < 800ms (CTE) | < 100ms |
| `getModelAncestry` | < 200ms | < 50ms |

## What to report

Write a plain-language report covering:

1. **All functions exported** — Did the service file export every function from the task.md list?
2. **Each function works** — For each function, did it return the expected shape and data?
3. **Database-side filtering** — Network tab confirms single Supabase request with filters applied?
4. **Model hierarchy queries** — Root model filter (CTE), ancestry, color variants, leaf models by root all work?
4. **Pagination & sorting** — Correct page/total, sorting by price/name works?
5. **Caching** — Second call significantly faster?
5. **Type safety** — No `any` in return types?
6. **No legacy queries** — Codebase search confirms all product reads go through the service?
7. **Performance** — Response times within targets?
8. **Any surprises** — Missing functions? Type errors? Query planner issues? Cache invalidation problems?

**No screenshots. No UI checks.** Just: *Does the service return the right data, from the database, with the right filters, fast enough, and is it the only way product data is read?*