// FM-05: analytics-service — recordView + recordClick. Writes to rollout.analytics
// via the service-role client. Pipeline order: bot filter → enrichment → dedup → persist.
// EU IP redaction is the caller's job (FM-04 passes ip="" for EU).
// The raw IP is NEVER stored — only visitor_hash + the (already-redacted) ip field.

import { createServiceClient } from '@/lib/supabase/server';

interface ViewArgs {
  productId: string;
  source: string | null;
  visitorHash: bigint;
}

interface ClickArgs {
  productId: string;
  source: string | null;
  visitorHash: bigint;
  trackerId: string | null;
  ip: string; // already redacted to "" for EU
  country: string;
  ua: string;
  referer: string;
  bot: boolean;
}

export async function recordView(args: ViewArgs): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from('analytics').insert({
    product_id: args.productId,
    event_type: 'view',
    source: args.source,
    visitor_hash: args.visitorHash.toString(),
  });
  if (error) throw new Error(`recordView failed: ${error.message}`);
}

export async function recordClick(args: ClickArgs): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from('analytics').insert({
    product_id: args.productId,
    event_type: 'click',
    source: args.source,
    visitor_hash: args.visitorHash.toString(),
    tracker_id: args.trackerId,
  });
  if (error) throw new Error(`recordClick failed: ${error.message}`);
  // NOTE: the ip / country / ua / referer fields are NOT stored in `analytics` by default
  // (the table has source/visitor_hash/tracker_id only). They're available for a richer
  // events table if the owner adds one — the click row itself is the ~12-field slim shape.
}
