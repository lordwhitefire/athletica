# ROLL-02: Rollout Product Service

## What and why

The Rollout system needs a product service to interact with the `rollout.products` table. This service will be used by:
- The admin product database (ROLL-06)
- The admin product editor (ROLL-07)
- The customer product details page (ROLL-05)

The service must be much simpler than the Mature product service — no hierarchy (models/brands/categories), no complex filtering, just direct queries on the self-contained `rollout.products` table.

## Hard rules

1. **Use the existing Supabase client** — create a server client in `rollout/src/lib/supabase/server.ts` using the env vars from `.env.local`
2. **Use the existing types** — import from `rollout/src/lib/database.types.ts` (the `Database.rollout` types from ROLL-01)
3. **RLS is enabled** — the service must use the `service_role` key for admin operations (bypasses RLS), and the `anon` key for public reads (subject to RLS policies)
4. **No caching initially** — keep it simple; add caching later if needed
5. **No hierarchy** — Rollout products are self-contained; no foreign keys to models/brands/categories

## Steps (in order)

Run from the repository root (`/home/lordwhitefire/current-project/athletica/athletica`).

### 1. Create the Supabase server client

Create `rollout/src/lib/supabase/server.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client (bypasses RLS) — for admin operations
export function createAdminClient() {
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}

// Public client (respects RLS) — for customer reads
export function createPublicClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
```

### 2. Create the Product Service

Create `rollout/src/lib/products/product-service.ts`:

```typescript
import { createAdminClient, createPublicClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

type ProductRow = Database['rollout']['Tables']['products']['Row'];
type ProductInsert = Database['rollout']['Tables']['products']['Insert'];
type ProductUpdate = Database['rollout']['Tables']['products']['Update'];

// --- Admin operations (service_role, bypasses RLS) ---

export async function getProductsAdmin(options?: {
  status?: 'published' | 'unpublished' | 'all';
  search?: string;
  sort?: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}): Promise<{ items: ProductRow[]; total: number }> {
  const supabase = createAdminClient();
  const { status, search, sort = 'newest', page = 1, pageSize = 20 } = options ?? {};

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' });

  // Filter by status
  if (status === 'published' || status === 'unpublished') {
    query = query.eq('status', status);
  }

  // Search by name, slug, color, asin
  if (search) {
    const term = search.trim();
    query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%,color.ilike.%${term}%,asin.ilike.%${term}%`);
  }

  // Sort
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
    name_asc: { column: 'name', ascending: true },
    name_desc: { column: 'name', ascending: false },
    price_asc: { column: 'price', ascending: true },
    price_desc: { column: 'price', ascending: false },
  };
  const sortConfig = sortMap[sort] ?? sortMap.newest;
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending });

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  return { items: data ?? [], total: count ?? 0 };
}

export async function getProductByIdAdmin(id: string): Promise<ProductRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createProductAdmin(product: ProductInsert): Promise<ProductRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProductAdmin(id: string, updates: ProductUpdate): Promise<ProductRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProductAdmin(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function publishProductAdmin(id: string): Promise<ProductRow> {
  return updateProductAdmin(id, { status: 'published' });
}

export async function unpublishProductAdmin(id: string): Promise<ProductRow> {
  return updateProductAdmin(id, { status: 'unpublished' });
}

// --- Public operations (anon key, respects RLS) ---

export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) return null;
  return data;
}

export async function getPublishedProducts(options?: {
  page?: number;
  pageSize?: number;
}): Promise<{ items: ProductRow[]; total: number }> {
  const supabase = createPublicClient();
  const { page = 1, pageSize = 20 } = options ?? {};

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { items: data ?? [], total: count ?? 0 };
}
```

### 3. Verify the service compiles

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Expected: no errors.

### 4. Commit the changes

```bash
cd /home/lordwhitefire/current-project/athletica/athletica
git add rollout/src/lib/supabase/ rollout/src/lib/products/
git commit -m "feat(rollout): add product service with admin and public clients"
```

**Do NOT push.** Owner reviews and pushes.

## Benchmarks (what must be true after this change)

- `rollout/src/lib/supabase/server.ts` exists and exports `createAdminClient()` and `createPublicClient()`
- `rollout/src/lib/products/product-service.ts` exists and exports all functions:
  - `getProductsAdmin()` — list products with filtering, search, sort, pagination
  - `getProductByIdAdmin()` — get single product by ID
  - `createProductAdmin()` — create new product
  - `updateProductAdmin()` — update product
  - `deleteProductAdmin()` — delete product
  - `publishProductAdmin()` — set status to published
  - `unpublishProductAdmin()` — set status to unpublished
  - `getProductBySlug()` — public: get published product by slug
  - `getPublishedProducts()` — public: list published products
- Admin operations use `service_role` key (bypasses RLS)
- Public operations use `anon` key (respects RLS)
- `npx tsc --noEmit` passes with no errors
- One commit with message `feat(rollout): add product service with admin and public clients`

## What is explicitly NOT done in this task

- No UI pages (that's ROLL-05, ROLL-06, ROLL-07)
- No analytics service (that's ROLL-03)
- No Amazon affiliate service (that's ROLL-04)
- No caching (add later if needed)
- No validation schemas (add in ROLL-07 with the editor)
- No tests (add later with the UI)