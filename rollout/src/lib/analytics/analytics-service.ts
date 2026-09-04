import { createAdminClient, createPublicClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

type AnalyticsRow = Database['rollout']['Tables']['analytics']['Row'];
type AnalyticsInsert = Database['rollout']['Tables']['analytics']['Insert'];

// --- Public operations (anon key, respects RLS) ---

export async function recordView(productId: string): Promise<void> {
  const supabase = createPublicClient();
  const { error } = await supabase
    .from('analytics')
    .insert({ product_id: productId, event_type: 'view' });

  if (error) throw error;
}

export async function recordClick(productId: string): Promise<void> {
  const supabase = createPublicClient();
  const { error } = await supabase
    .from('analytics')
    .insert({ product_id: productId, event_type: 'click' });

  if (error) throw error;
}

// --- Admin operations (service_role, bypasses RLS) ---

export type DateRange = '7d' | '30d' | '90d';

function getDateRangeStart(range: DateRange): string {
  const now = new Date();
  switch (range) {
    case '7d':
      now.setDate(now.getDate() - 7);
      break;
    case '30d':
      now.setDate(now.getDate() - 30);
      break;
    case '90d':
      now.setDate(now.getDate() - 90);
      break;
  }
  return now.toISOString();
}

export interface AnalyticsKPIs {
  totalViews: number;
  totalClicks: number;
  ctr: number; // clicks / views * 100
}

export async function getKPIs(range: DateRange): Promise<AnalyticsKPIs> {
  const supabase = createAdminClient();
  const from = getDateRangeStart(range);

  const [viewsResult, clicksResult] = await Promise.all([
    supabase
      .from('analytics')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'view')
      .gte('created_at', from),
    supabase
      .from('analytics')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'click')
      .gte('created_at', from),
  ]);

  const totalViews = viewsResult.count ?? 0;
  const totalClicks = clicksResult.count ?? 0;
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  return { totalViews, totalClicks, ctr };
}

export interface ProductMetric {
  product_id: string;
  product_name: string;
  product_slug: string;
  views: number;
  clicks: number;
  ctr: number;
}

export async function getTopProducts(range: DateRange, limit = 10): Promise<ProductMetric[]> {
  const supabase = createAdminClient();
  const from = getDateRangeStart(range);

  // Get all analytics in range
  const { data: analytics, error: analyticsError } = await supabase
    .from('analytics')
    .select('product_id, event_type')
    .gte('created_at', from);

  if (analyticsError) throw analyticsError;
  if (!analytics || analytics.length === 0) return [];

  // Aggregate by product
  const productMap = new Map<string, { views: number; clicks: number }>();
  for (const row of analytics) {
    const existing = productMap.get(row.product_id) ?? { views: 0, clicks: 0 };
    if (row.event_type === 'view') existing.views++;
    if (row.event_type === 'click') existing.clicks++;
    productMap.set(row.product_id, existing);
  }

  // Get product details
  const productIds = [...productMap.keys()];
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, slug')
    .in('id', productIds);

  if (productsError) throw productsError;

  const productDetails = new Map((products ?? []).map(p => [p.id, p]));

  // Build result and sort by views descending
  const result: ProductMetric[] = [];
  for (const [productId, metrics] of productMap) {
    const product = productDetails.get(productId);
    if (!product) continue;

    result.push({
      product_id: productId,
      product_name: product.name,
      product_slug: product.slug,
      views: metrics.views,
      clicks: metrics.clicks,
      ctr: metrics.views > 0 ? (metrics.clicks / metrics.views) * 100 : 0,
    });
  }

  result.sort((a, b) => b.views - a.views);
  return result.slice(0, limit);
}

export interface ChartDataPoint {
  date: string;
  views: number;
  clicks: number;
  ctr: number;
}

export async function getChartData(range: DateRange): Promise<ChartDataPoint[]> {
  const supabase = createAdminClient();
  const from = getDateRangeStart(range);

  const { data: analytics, error } = await supabase
    .from('analytics')
    .select('event_type, created_at')
    .gte('created_at', from)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!analytics || analytics.length === 0) return [];

  // Group by date
  const dailyMap = new Map<string, { views: number; clicks: number }>();
  for (const row of analytics) {
    const date = row.created_at.split('T')[0]; // YYYY-MM-DD
    const existing = dailyMap.get(date) ?? { views: 0, clicks: 0 };
    if (row.event_type === 'view') existing.views++;
    if (row.event_type === 'click') existing.clicks++;
    dailyMap.set(date, existing);
  }

  // Convert to array with CTR
  const result: ChartDataPoint[] = [];
  for (const [date, metrics] of dailyMap) {
    result.push({
      date,
      views: metrics.views,
      clicks: metrics.clicks,
      ctr: metrics.views > 0 ? (metrics.clicks / metrics.views) * 100 : 0,
    });
  }

  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}
