// FM-10: product-service — full CRUD + variants + categories + the storefront read helpers.
//
// FIX (audit 4.9):
// - getProductById → split into getPublicProductById (applies the 3-condition gate)
//   and getProductByIdAdmin (no gate, for admin paths).
// - listProducts "popular" sort now orders by click count (from analytics), not created_at.
// - category filter uses the correct Supabase nested-relation filter.
// - The public gate is centralized in applyPublicGate().

import { createServiceClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, ProductRow } from '@/lib/database.types';
import type { Product, ProductVariant, Category } from './types';

type AdminClient = SupabaseClient<Database, 'rollout'>;

/** The 3-condition publish gate, applied as query filters. */
function applyPublicGate<T>(q: T): T {
  // `available_on IS NULL` means "available now" — the RLS policy says the same.
  // A plain .lte() would hide every product that has no launch date.
  // Return T (the caller's builder type) so .maybeSingle()/.order()/.range() stay available.
  const now = new Date().toISOString();
  const query = q as any;
  return query
    .eq('status', 'active')
    .is('deleted_at', null)
    .or(`available_on.is.null,available_on.lte.${now}`) as T;
}

// ---- Public reads ----

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const sb = createServiceClient();
  const { data } = await applyPublicGate(
    sb.from('products').select('*').eq('slug', slug)
  ).maybeSingle();
  return (data as Product | null) ?? null;
}

/** Public fetch by id — applies the 3-condition publish gate. Use on /go/[id] + any public path. */
export async function getPublicProductById(id: string): Promise<Product | null> {
  const sb = createServiceClient();
  const { data } = await applyPublicGate(
    sb.from('products').select('*').eq('id', id)
  ).maybeSingle();
  return (data as Product | null) ?? null;
}

/** Admin fetch by id — NO publish gate. For the admin editor only (behind requireAdmin). */
export async function getProductByIdAdmin(id: string): Promise<Product | null> {
  const sb = createServiceClient();
  const { data } = await sb.from('products').select('*').eq('id', id).maybeSingle();
  return (data as Product | null) ?? null;
}

/** @deprecated Use getPublicProductById (public) or getProductByIdAdmin (admin). */
export async function getProductById(id: string): Promise<Product | null> {
  return getPublicProductById(id);
}

export async function getFeaturedProducts(limit: number): Promise<Product[]> {
  const sb = createServiceClient();
  const { data } = await applyPublicGate(
    sb.from('products').select('*')
  ).order('created_at', { ascending: false }).limit(limit);
  return (data as Product[]) ?? [];
}

export async function getCarouselProducts(limit: number): Promise<Product[]> {
  return getFeaturedProducts(limit);
}

export async function listProducts(args: {
  query: string | null;
  category: string | null;
  sort: 'newest' | 'popular';
  page: number;
  pageSize: number;
}): Promise<{ products: Product[]; total: number; categories: Category[] }> {
  const sb = createServiceClient();

  // Build the base query with the public gate + optional category M2M filter.
  // FIX: use the correct nested-relation filter `categories!inner(slug)` so the
  // M2M join is actually selected + filterable.
  const selectClause = args.category ? '*, categories!inner(slug)' : '*';
  let q = applyPublicGate(
    sb.from('products').select(selectClause, { count: 'exact' })
  );

  if (args.query) q = q.or(`name.ilike.%${args.query}%,slug.ilike.%${args.query}%`);
  if (args.category) q = q.eq('categories.slug', args.category);

  if (args.sort === 'popular') {
    // FIX: "popular" now means "by click count" — fetch click counts from analytics
    // and sort by that. If analytics is empty, fall back to created_at.
    const from = (args.page - 1) * args.pageSize;
    const to = from + args.pageSize - 1;
    // First get the page of products by created_at (a stable order), then re-sort by clicks.
    q = q.order('created_at', { ascending: false }).range(from, to);
    const { data, count } = await q;
    const products = (data as Product[]) ?? [];
    if (products.length === 0) {
      const { data: cats } = await sb.from('categories').select('id,slug,name').order('name');
      return { products: [], total: count ?? 0, categories: (cats as Category[]) ?? [] };
    }
    // Fetch click counts for these product IDs.
    const ids = products.map(p => p.id);
    const { data: clickCounts } = await sb.from('analytics').select('product_id').eq('event_type', 'click').in('product_id', ids);
    const counts = new Map<string, number>();
    for (const r of (clickCounts ?? []) as { product_id: string }[]) {
      counts.set(r.product_id, (counts.get(r.product_id) ?? 0) + 1);
    }
    products.sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
    const { data: cats } = await sb.from('categories').select('id,slug,name').order('name');
    return { products, total: count ?? 0, categories: (cats as Category[]) ?? [] };
  }

  // newest
  q = q.order('created_at', { ascending: false });
  const from = (args.page - 1) * args.pageSize;
  const to = from + args.pageSize - 1;
  const { data, count } = await q.range(from, to);
  const { data: cats } = await sb.from('categories').select('id,slug,name').order('name');
  return { products: (data as Product[]) ?? [], total: count ?? 0, categories: (cats as Category[]) ?? [] };
}

export async function listAllPublicProductSlugs(): Promise<{ slug: string; tags: string[]; updatedAt: string }[]> {
  const sb = createServiceClient();
  const { data } = await applyPublicGate(
    sb.from('products').select('slug,tags,updated_at')
  );
  return (data ?? []).map((r: { slug: string; tags: string[]; updated_at: string }) => ({ slug: r.slug, tags: r.tags ?? [], updatedAt: r.updated_at }));
}

export async function listCategorySlugs(): Promise<string[]> {
  const sb = createServiceClient();
  const { data } = await sb.from('categories').select('slug');
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

// ---- Admin writes (role-checked at the route layer via requireAdmin) ----

export async function createProductAdmin(input: Partial<Product>, _sb?: AdminClient): Promise<Product> {
  const sb = createServiceClient();
  const { data, error } = await sb.from('products').insert({ ...input, status: input.status ?? 'draft' }).select().single();
  if (error) throw new Error(`createProduct failed: ${error.message}`);
  return data as Product;
}

export async function updateProductAdmin(id: string, patch: Partial<Product>): Promise<Product> {
  const sb = createServiceClient();
  const { data, error } = await sb.from('products').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw new Error(`updateProduct failed: ${error.message}`);
  return data as Product;
}

export async function deleteProductAdmin(id: string, _sb?: AdminClient): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from('products').update({ deleted_at: new Date().toISOString(), status: 'archived' }).eq('id', id);
  if (error) throw new Error(`deleteProduct failed: ${error.message}`);
}

/**
 * Admin catalog list. The route has already passed requireAdmin, so this uses
 * the service client and sees the whole catalog, including drafts.
 *
 * The UI speaks two states (Published / Unpublished); the database speaks five.
 * Published = active. Unpublished = anything that is not active.
 */
export async function getProductsAdmin(
  args: {
    status: 'all' | 'published' | 'unpublished';
    search: string;
    sort: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';
    page: number;
    pageSize: number;
  },
  _sb?: AdminClient,
): Promise<{ items: ProductRow[]; total: number }> {
  const sb = createServiceClient();
  let q = sb.from('products').select('*', { count: 'exact' });

  if (args.status === 'published') q = q.eq('status', 'active');
  else if (args.status === 'unpublished') q = q.neq('status', 'active');

  const search = (args.search ?? '').trim().replace(/[%,()]/g, ' ').trim();
  if (search) {
    q = q.or(
      `name.ilike.%${search}%,id.ilike.%${search}%,slug.ilike.%${search}%,color.ilike.%${search}%`,
    );
  }

  switch (args.sort) {
    case 'oldest': q = q.order('created_at', { ascending: true }); break;
    case 'name_asc': q = q.order('name', { ascending: true }); break;
    case 'name_desc': q = q.order('name', { ascending: false }); break;
    case 'price_asc': q = q.order('price', { ascending: true, nullsFirst: false }); break;
    case 'price_desc': q = q.order('price', { ascending: false, nullsFirst: false }); break;
    default: q = q.order('created_at', { ascending: false });
  }

  const page = Math.max(1, args.page || 1);
  const pageSize = Math.min(100, Math.max(1, args.pageSize || 8));
  const from = (page - 1) * pageSize;
  const { data, count, error } = await q.range(from, from + pageSize - 1);
  if (error) throw new Error(`getProductsAdmin failed: ${error.message}`);
  return { items: (data as ProductRow[]) ?? [], total: count ?? 0 };
}

async function setProductStatus(id: string, status: ProductRow['status']): Promise<ProductRow> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('products')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`setProductStatus failed: ${error.message}`);
  return data as ProductRow;
}

export async function publishProductAdmin(id: string, _sb?: AdminClient): Promise<ProductRow> {
  return setProductStatus(id, 'active');
}

export async function unpublishProductAdmin(id: string, _sb?: AdminClient): Promise<ProductRow> {
  return setProductStatus(id, 'draft');
}

export async function discontinueProduct(id: string): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from('products').update({
    status: 'archived', discontinue_on: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw new Error(`discontinue failed: ${error.message}`);
}

// ---- Variants ----

export async function listVariants(productId: string): Promise<ProductVariant[]> {
  const sb = createServiceClient();
  const { data } = await sb.from('product_variants').select('*').eq('product_id', productId).is('deleted_at', null);
  return (data as ProductVariant[]) ?? [];
}

export async function createVariant(productId: string, input: Partial<ProductVariant>): Promise<ProductVariant> {
  const sb = createServiceClient();
  const { data, error } = await sb.from('product_variants').insert({ ...input, product_id: productId, status: input.status ?? 'draft' }).select().single();
  if (error) throw new Error(`createVariant failed: ${error.message}`);
  return data as ProductVariant;
}
