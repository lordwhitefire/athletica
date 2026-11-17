// FM-11: Shared bulk-operations module.
// require_ids! guard (rejects empty array). bulk_status_update skips proposed/rejected + counts.
// Reusable for any entity (products, and future: affiliates).

import { createServiceClient } from '@/lib/supabase/server';

export class EmptyIdsError extends Error {
  constructor() {
    super('require_ids!: ids array is empty');
  }
}

function requireIds(ids: string[]): void {
  if (!Array.isArray(ids) || ids.length === 0) throw new EmptyIdsError();
}

const REVIEW_ONLY_STATUSES = new Set(['proposed', 'rejected']);

interface BulkStatusResult {
  updated: number;
  skipped_in_review_count: number;
}

export async function bulkStatusUpdate(ids: string[], status: string): Promise<BulkStatusResult> {
  requireIds(ids);
  if (REVIEW_ONLY_STATUSES.has(status)) {
    // Cannot bulk-assign proposed/rejected — they are review-only.
    return { updated: 0, skipped_in_review_count: ids.length };
  }
  const sb = createServiceClient();
  // Skip products currently in proposed/rejected.
  const { data: skippable } = await sb
    .from('products')
    .select('id')
    .in('id', ids)
    .in('status', ['proposed', 'rejected']);
  const skipSet = new Set((skippable ?? []).map((r: { id: string }) => r.id));
  const targetIds = ids.filter(id => !skipSet.has(id));

  if (targetIds.length > 0) {
    const { error } = await sb.from('products').update({ status, updated_at: new Date().toISOString() }).in('id', targetIds);
    if (error) throw new Error(`bulkStatusUpdate failed: ${error.message}`);
  }
  return { updated: targetIds.length, skipped_in_review_count: skipSet.size };
}

export async function bulkArchive(ids: string[]): Promise<{ archived: number }> {
  requireIds(ids);
  const sb = createServiceClient();
  const { error, count } = await sb.from('products').update({
    status: 'archived', updated_at: new Date().toISOString(),
  }).in('id', ids).eq('status', 'active'); // only active → archived (skip proposed/rejected naturally)
  if (error) throw new Error(`bulkArchive failed: ${error.message}`);
  return { archived: count ?? 0 };
}

export async function bulkAddToCollection(ids: string[], collectionId: string): Promise<void> {
  requireIds(ids);
  const sb = createServiceClient();
  const rows = ids.map(product_id => ({ product_id, collection_id: collectionId }));
  const { error } = await sb.from('product_collections').upsert(rows, { onConflict: 'product_id,collection_id', ignoreDuplicates: true });
  if (error) throw new Error(`bulkAddToCollection failed: ${error.message}`);
}

export async function bulkRemoveFromCollection(ids: string[], collectionId: string): Promise<void> {
  requireIds(ids);
  const sb = createServiceClient();
  const { error } = await sb.from('product_collections').delete().in('product_id', ids).eq('collection_id', collectionId);
  if (error) throw new Error(`bulkRemoveFromCollection failed: ${error.message}`);
}
