# Builder Task: ARCH-003 — Product Service (Data Layer with Model Hierarchy)

## What we're building

The **Product Service** — a single TypeScript module that is the **only way** the frontend (customer site + admin) reads product data from Supabase. It encapsulates all database queries, filtering, sorting, pagination, model hierarchy traversal, and caching. No page or component constructs Supabase queries directly.

## Why it matters

This is the **single data access layer** for the entire application. The customer site (homepage, category pages, product detail, search), the admin (product list, editor, dashboard), and the cart/checkout all depend on this one module. If it's slow, wrong, or missing queries, everything downstream breaks.

## What success looks like

After this, every page that needs products (homepage sections, category listings, product detail, search, admin product list, import center) calls the Product Service and gets correct, fast results. Filtering by category, brand, root model, sub-model, leaf model, color variants, and model ancestry all work with database-side queries. The service is the only thing touching Supabase for product reads.

## Context you need

### Supabase schema (from ARCH-001 + REC-001)

Key tables:
- `products` — `id`, `slug`, `name`, `model` (text, legacy), `description` (jsonb), `price` (numeric), `gender`, `color`, `sizes` (text[]), `attributes` (jsonb), `status`, `asin`, `category_id`, `brand_id`, `leaf_model_id` (FK → models.id), `image_links` (text[]), timestamps
- `models` — `id`, `slug`, `name`, `brand_id` (FK → brands), `parent_id` (self-ref FK), `level` (0=root, 1=sub, 2=leaf), `description`, `brand_id` (FK → brands)
- `categories` — `id`, `slug`, `name`, `parent_id`
- `brands` — `id`, `slug`, `name`, `logo_link`
- `homepage_sections` — `type`, `order`, `title`, `copy`, `category_id`, `limit`, `image_links`, `attributes` (jsonb)

### Generated types

`frontend/src/lib/supabase/types.ts` — has `ProductsRow`, `ModelsRow`, `BrandsRow`, `CategoriesRow`, etc. Use these for type safety.

### Supabase client

Use `@supabase/supabase-js` with the existing client pattern in `frontend/src/lib/supabase/`. The service runs server-side (Next.js Server Components / Route Handlers / Server Actions) — use the server client (`createClient()` from `@/lib/supabase/server`).

### Model hierarchy recap (from ARCH-REC-001)

- **Root models** (level 0): "Predator", "X", "Mercurial Vapour 17", etc. — `parent_id` = NULL
- **Leaf models** (level 1 in current data): "Elite-FG", "League-FT-(FG/MG)", "Superfly", etc. — `parent_id` → root model
- **Products** link to leaf models via `leaf_model_id`
- **Color variants** = products with same `leaf_model_id`, different `color`

Note: Current data is 2-level (root → leaf). Schema supports 3 levels (root → sub → leaf) via `level` column and recursive `parent_id`.

## What to build

Create `frontend/src/lib/products/product-service.ts` (or similar) exporting:

### Core lookup functions

```typescript
// Single product
getProduct(id: string): Promise<ProductWithRelations | null>
getProductBySlug(slug: string): Promise<ProductWithRelations | null>

// List with full filtering
getProducts(filters: ProductFilters): Promise<PaginatedResult<ProductSummary>>

// Convenience filters
getProductsByCategory(categorySlug: string, filters?: Omit<ProductFilters, 'category'>): Promise<PaginatedResult<ProductSummary>>
getProductsByBrand(brandSlug: string, filters?: Omit<ProductFilters, 'brand'>): Promise<PaginatedResult<ProductSummary>>
getProductsByLeafModel(leafModelId: string, filters?: Omit<ProductFilters, 'leafModel'>): Promise<PaginatedResult<ProductSummary>>
getProductsByRootModel(rootModelId: string, filters?: Omit<ProductFilters, 'rootModel'>): Promise<PaginatedResult<ProductSummary>>

// Model hierarchy queries
getLeafModelsByRoot(rootModelId: string): Promise<ModelsRow[]>           // all leaf models under a root
getSubModels(parentModelId: string): Promise<ModelsRow[]>               // direct children of a model
getModelAncestry(leafModelId: string): Promise<ModelsRow[]>             // breadcrumbs: root → sub → leaf
getColorVariants(leafModelId: string): Promise<ProductSummary[]>        // products sharing leaf_model_id
getRootModels(brandSlug?: string): Promise<ModelsRow[]>                 // root models (level 0), optionally filtered by brand

// Related & featured
getColorVariants(leafModelId: string): Promise<ProductSummary[]>        // same leaf_model_id, different colors
getRelatedProducts(productId: string, limit?: number): Promise<ProductSummary[]> // same brand, category, root model, sub-model, leaf model, shared attributes
getFeaturedProducts(filters: { categoryId?: string; rootModelId?: string; limit: number }): Promise<ProductSummary[]>

// Search
searchProducts(query: string, filters?: Partial<ProductFilters>): Promise<PaginatedResult<ProductSummary>>

// Types
type ProductFilters = {
  category?: string;        // category slug
  brand?: string;           // brand slug
  leafModel?: string;       // leaf model ID
  rootModel?: string;       // root model ID (recursive filter)
  subModel?: string;        // sub-model ID (direct children of this model)
  gender?: string;
  color?: string;
  sizes?: string[];         // EU sizes
  priceMin?: number;
  priceMax?: number;
  status?: 'published' | 'unpublished';
  missingData?: 'asin' | 'image' | 'category' | 'model' | 'none';
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | 'popular';
  page?: number;
  pageSize?: number;
}

type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### Type definitions

```typescript
type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  model: string | null;
  brand: { id: string; slug: string; name: string; logo_link: string | null };
  category: { id: string; slug: string; name: string } | null;
  leaf_model: { id: string; slug: string; name: string; parent: { id: string; slug: string; name: string } | null } | null;
  price: number | null;
  color: string | null;
  gender: string | null;
  image_links: string[] | null;
  status: 'published' | 'unpublished';
  asin: string | null;
}

type ProductWithRelations = ProductSummary & {
  description: any; // jsonb
  attributes: any;  // jsonb
  sizes: string[] | null;
  asin: string | null;
  model_ancestry: ModelsRow[]; // root → sub → leaf for breadcrumbs
  color_variants: ProductSummary[]; // same leaf_model_id, different colors
}
```

### Filtering implementation details

**Database-side only** — never fetch all and filter in JS.

| Filter | Implementation |
|---|---|
| `category` | `.eq('category_id', categoryId)` (resolve slug → id first) |
| `brand` | `.eq('brand_id', brandId)` |
| `leafModel` | `.eq('leaf_model_id', leafModelId)` |
| `rootModel` | **Recursive CTE** on `models.parent_id`: get all leaf model IDs under root, then `.in('leaf_model_id', leafIds)` |
| `subModel` | Get direct children of model: `.eq('parent_id', subModelId)` to get leaf model IDs, then `.in('leaf_model_id', leafIds)` |
| `gender`, `color`, `status` | `.eq()` on columns |
| `sizes` | `.overlaps('sizes', sizesArray)` (PostgreSQL array overlap) |
| `priceMin`/`priceMax` | `.gte('price', min)` / `.lte('price', max)` |
| `missingData` | Check `asin IS NULL`, `image_links IS NULL`, `category_id IS NULL`, `leaf_model_id IS NULL` |
| `sort` | `.order()` with appropriate column/direction |
| `page`/`pageSize` | `.range((page-1)*pageSize, page*pageSize - 1)` + `.select('*', { count: 'exact' })` for total |

**Root model filter (recursive CTE)** — example SQL logic:
```sql
WITH RECURSIVE model_tree AS (
  SELECT id FROM models WHERE id = $rootModelId
  UNION ALL
  SELECT m.id FROM models m
  JOIN model_tree mt ON m.parent_id = mt.id
)
SELECT id FROM model_tree WHERE level = (SELECT MAX(level) FROM model_tree)
```
Then use resulting leaf model IDs in `.in('leaf_model_id', leafIds)`.

### Caching

- Use Next.js `unstable_cache` (or `cache()` in Server Components) for read-heavy queries
- Cache keys include all filter parameters
- Revalidate on admin writes (invalidate via tags or time-based)
- Cache TTL: 60s for listings, 300s for lookups, 600s for model hierarchy (rarely changes)

### Error handling

- Never throw on "not found" — return `null` or empty array
- Throw on actual errors (network, constraint violations) — let caller handle
- Log errors with context (function name, filters) for debugging

## Boundaries — what NOT to do

- **Don't create Supabase clients in the service** — import the shared client from `@/lib/supabase/server`
- **Don't expose Supabase query builders** — return typed data, not query builders
- **Don't do client-side filtering** — all filtering in the database
- **Don't duplicate query logic** — extract common filter building to private helpers
- **Don't implement admin write operations** — those are separate server actions (ARCH-005)
- **Don't implement cart/checkout logic** — that's the Amazon Affiliate Service (ARCH-007)

## Acceptance benchmarks

| Benchmark | Test |
|---|---|
| `getProductBySlug('adidas-predator-elite-fg-black')` | Returns product with full relations (brand, category, leaf_model with ancestry, color_variants) |
| `getProducts({ category: 'boots', rootModel: 'predator-root-id' })` | Returns products under Predator root (recursive CTE), paginated |
| `getProducts({ brand: 'adidas', leafModel: 'league-ft-fg-mg-id' })` | Returns color variants of that leaf model |
| `getModelAncestry(leafModelId)` | Returns [Predator, League, League-FT-(FG/MG)] for breadcrumbs |
| `getColorVariants(leafModelId)` | Returns products with same leaf_model_id, different colors |
| `getProducts({ category: 'boots', gender: 'Men', sort: 'price_asc', page: 1, pageSize: 12 })` | Returns correct page, total count, sorted by price |
| `searchProducts('predator')` | Returns products matching name/model/brand |
| `getFeaturedProducts({ rootModelId: 'predator-root-id', limit: 8 })` | Returns up to 8 products under Predator root |
| All queries execute in < 100ms (cached) / < 500ms (uncached) | Performance check |
| TypeScript compiles with no `any` in return types | Type safety |

## Files you'll create/modify

- `frontend/src/lib/products/product-service.ts` — main service
- `frontend/src/lib/products/queries.ts` — private query builders (optional, for organization)
- `frontend/src/lib/products/types.ts` — shared types (or reuse from supabase types)
- Tests in `frontend/src/lib/products/__tests__/product-service.test.ts` (unit/integration)

## Files you'll use (read-only)

- `frontend/src/lib/supabase/server.ts` — server client
- `frontend/src/lib/supabase/types.ts` — generated types
- `supabase/migrations/...` — schema reference

**Reminder**: In your implementation report, explain your CTE approach for model hierarchy filtering, how you structured the cache keys, and any performance optimizations. If you hit query planner issues, document them.

---

**Note**: This service replaces all existing product data fetching in `@/lib/actions/products.ts`, `@/lib/getProducts.ts`, `@/lib/getProductsSanity.ts`, etc. Those files become legacy once this service is wired.