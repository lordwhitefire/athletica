// FM-21: Dead-link detection — three signals.
//
// FIX (audit 4.8):
// - HEAD probe now orders by last_probed_at NULLS FIRST (fair, resumable batches).
// - recordRedirect4xx is now real: increments a counter + marks dead above a threshold.
// - Null API availability is NOT treated as dead (unknown ≠ dead).
// - Non-200 responses are NOT marked alive (only a clear 200 → alive).
// - Transient network errors don't change state.

import { createServiceClient } from '@/lib/supabase/server';
import { fetchProductFromCreators } from './creators-api-client';

/** Scheduled HEAD probe — fair batches via last_probed_at. Run daily via Vercel cron. */
export async function runDeadLinkProbe(batchSize = 20): Promise<{ probed: number; markedDead: number; markedAlive: number }> {
  const sb = createServiceClient();
  // Order by last_probed_at NULLS FIRST so never-probed products go first, then oldest.
  const { data: products } = await sb
    .from('products')
    .select('id,asin,default_marketplace,last_probed_at')
    .not('asin', 'is', null)
    .eq('status', 'active')
    .order('last_probed_at', { ascending: true, nullsFirst: true })
    .limit(batchSize);

  let probed = 0, markedDead = 0, markedAlive = 0;
  for (const p of (products ?? []) as { id: string; asin: string; default_marketplace: string | null }[]) {
    probed++;
    const slug = p.default_marketplace ?? 'US';
    const { data: mp } = await sb.from('marketplaces').select('domain').eq('slug', slug).maybeSingle();
    const domain = (mp as { domain: string } | null)?.domain ?? 'www.amazon.com';
    try {
      const res = await fetch(`https://${domain}/dp/${p.asin}`, { method: 'HEAD', redirect: 'manual' });
      if (res.status === 404 || res.status === 410) {
        await markDead(p.id, 'head_probe_404');
        markedDead++;
      } else if (res.status === 200) {
        // Only a clear 200 → alive. Redirects, 5xx, etc. → unknown (no state change).
        await markAlive(p.id);
        markedAlive++;
      }
      // else: unknown response — don't change dead/alive state.
    } catch {
      // Network error — don't change state (could be transient).
    }
    // Update last_probed_at regardless of outcome (so the batch rotates).
    await sb.from('products').update({ last_probed_at: new Date().toISOString() }).eq('id', p.id);
    await new Promise(r => setTimeout(r, 500)); // throttle
  }
  return { probed, markedDead, markedAlive };
}

/** Reactive: record a 4xx from an outbound Amazon click + mark dead above threshold. */
export async function recordRedirect4xx(productId: string): Promise<void> {
  const sb = createServiceClient();
  // Read current count + last_4xx_at.
  const { data: row } = await sb.from('products').select('redirect_4xx_count, last_4xx_at').eq('id', productId).maybeSingle();
  const r = row as { redirect_4xx_count: number | null; last_4xx_at: string | null } | null;
  const now = new Date();
  const prevCount = r?.redirect_4xx_count ?? 0;
  const prevAt = r?.last_4xx_at ? new Date(r.last_4xx_at) : null;
  // Reset the window if the previous 4xx was > 24h ago.
  const windowedCount = prevAt && (now.getTime() - prevAt.getTime()) > 24 * 60 * 60 * 1000 ? 1 : prevCount + 1;
  await sb.from('products').update({
    redirect_4xx_count: windowedCount,
    last_4xx_at: now.toISOString(),
    updated_at: now.toISOString(),
  }).eq('id', productId);
  // Threshold: 3+ 4xx in 24h → mark dead.
  if (windowedCount >= 3) {
    await markDead(productId, 'redirect_4xx_threshold');
  }
}

/** Creators API availability signal (when enabled). Null availability = unknown, NOT dead. */
export async function checkApiAvailability(productId: string, asin: string, locale: string): Promise<void> {
  const row = await fetchProductFromCreators(asin, locale);
  if (!row) return; // API off / ineligible / errored → no signal (unknown).
  if (row.availability === 'OutOfStock') {
    // Explicit out-of-stock → soft-dead.
    await markDead(productId, 'api_out_of_stock');
  } else if (row.availability && row.availability !== 'Unknown') {
    // A known availability that isn't OutOfStock → alive.
    await markAlive(productId);
  }
  // else: null / Unknown availability → no state change (we don't know).
}

async function markDead(productId: string, reason: string): Promise<void> {
  const sb = createServiceClient();
  await sb.rpc('mark_product_dead', { p_product_id: productId, p_reason: reason });
}

async function markAlive(productId: string): Promise<void> {
  const sb = createServiceClient();
  await sb.rpc('mark_product_alive', { p_product_id: productId });
}
