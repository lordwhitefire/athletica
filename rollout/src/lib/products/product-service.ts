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
