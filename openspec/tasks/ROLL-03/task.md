# ROLL-03: Rollout Analytics Service

## What and why

The Rollout system needs an analytics service to record and query product views and Amazon clicks. This service will be used by:
- The customer product details page (ROLL-05) — to record views and clicks
- The admin analytics page (ROLL-08) — to display metrics

The analytics are deliberately simple: just views and clicks per product, with basic metrics (total views, total clicks, CTR, per-product breakdown).

## Hard rules

1. **Use the existing Supabase client** — import from `rollout/src/lib/supabase/server.ts`
2. **Use the existing types** — import from `rollout/src/lib/database.types.ts`
3. **RLS is enabled** — public inserts (views/clicks) use `anon` key, admin reads use `service_role` key
4. **No complex attribution** — just views and clicks per product
5. **Date range filtering** — support Last 7/30/90 days

## Steps (in order)

Run from the repository root (`/home/lordwhitefire/current-project/athletica/athletica`).

### 1. Create the Analytics Service

Create `rollout/src/lib/analytics/analytics-service.ts`:

```typescript
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
```

### 2. Verify the service compiles

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Expected: no errors.

### 3. Commit the changes

```bash
cd /home/lordwhitefire/current-project/athletica/athletica
git add rollout/src/lib/analytics/
git commit -m "feat(rollout): add analytics service with view/click recording and admin queries"
```

**Do NOT push.** Owner reviews and pushes.

## Benchmarks (what must be true after this change)

- `rollout/src/lib/analytics/analytics-service.ts` exists and exports:
  - `recordView(productId)` — public: record a view event
  - `recordClick(productId)` — public: record a click event
  - `getKPIs(range)` — admin: get total views, clicks, CTR
  - `getTopProducts(range, limit)` — admin: get per-product metrics
  - `getChartData(range)` — admin: get daily chart data
- Public operations use `anon` key (respects RLS)
- Admin operations use `service_role` key (bypasses RLS)
- `npx tsc --noEmit` passes with no errors
- One commit with message `feat(rollout): add analytics service with view/click recording and admin queries`

## What is explicitly NOT done in this task

- No UI pages (that's ROLL-08)
- No product service changes (that's ROLL-02)
- No Amazon affiliate service (that's ROLL-04)
- No complex attribution or traffic sources
- No caching (add later if needed)
- No tests (add later with the UI)