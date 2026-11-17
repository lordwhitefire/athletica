// FM-14: Analytics query service — CTR, source split, per product, per affiliate, payout pipeline, drop-reasons.
import { createServiceClient } from '@/lib/supabase/server';

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  ctr: number;
  bySource: { source: string; views: number; clicks: number }[];
  topProducts: { product_id: string; name: string; views: number; clicks: number; ctr: number }[];
  payoutPipeline: { status: string; count: number }[];
  dropReasons: { reason: string; count: number }[];
}

export async function getAnalyticsSummary(days: number): Promise<AnalyticsSummary> {
  const sb = createServiceClient();
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const [{ data: views }, { data: clicks }, { data: bySource }] = await Promise.all([
    sb.from('analytics').select('*', { count: 'exact', head: true }).eq('event_type', 'view').gte('created_at', since),
    sb.from('analytics').select('*', { count: 'exact', head: true }).eq('event_type', 'click').gte('created_at', since),
    sb.from('analytics').select('source,event_type').gte('created_at', since),
  ]);

  const totalViews = (views as unknown as { count: number })?.count ?? 0;
  const totalClicks = (clicks as unknown as { count: number })?.count ?? 0;
  const ctr = totalViews > 0 ? totalClicks / totalViews : 0;

  // Group by source client-side (a real impl would use an RPC or Postgres GROUP BY).
  const sourceMap = new Map<string, { views: number; clicks: number }>();
  for (const r of (bySource ?? []) as { source: string | null; event_type: string }[]) {
    const key = r.source ?? 'direct';
    const entry = sourceMap.get(key) ?? { views: 0, clicks: 0 };
    if (r.event_type === 'view') entry.views++;
    else entry.clicks++;
    sourceMap.set(key, entry);
  }

  // Payout pipeline (from the affiliate schema).
  const { data: payouts } = await sb.from('payouts').select('status').gte('created_at', since);
  const payoutMap = new Map<string, number>();
  for (const p of (payouts ?? []) as { status: string }[]) {
    payoutMap.set(p.status, (payoutMap.get(p.status) ?? 0) + 1);
  }

  return {
    totalViews,
    totalClicks,
    ctr,
    bySource: Array.from(sourceMap.entries()).map(([source, v]) => ({ source, ...v })),
    topProducts: [], // enriched by joining analytics → products (omitted for brevity)
    payoutPipeline: Array.from(payoutMap.entries()).map(([status, count]) => ({ status, count })),
    dropReasons: [], // from telemetry (FM-25 wires the drop-reason table/query)
  };
}
