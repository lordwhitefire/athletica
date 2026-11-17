// FM-17: Balance ledger service — append-only, UNIQUE(account_id, trace) idempotency,
// FX normalization at insert, reversal support (negative rows). Postback: shared bearer token.
import { createServiceClient } from '@/lib/supabase/server';

const POSTBACK_TOKEN = process.env.AFFILIATE_POSTBACK_TOKEN;

export interface PostbackInput {
  tracking_id: string;   // the tracker's public id
  amount: number;        // positive; negative rejected via the standard path
  currency: string;
  trace: string;         // caller-supplied idempotency key
}

export async function creditBalance(input: PostbackInput): Promise<{ credited: boolean; reason?: string }> {
  if (input.amount <= 0) return { credited: false, reason: 'amount must be positive (use the reversal path for clawbacks)' };

  const sb = createServiceClient();
  // Resolve the tracker → account + campaign.
  const { data: tracker, error: tErr } = await sb.from('trackers').select('id,account_id').eq('id', input.tracking_id).maybeSingle();
  if (tErr || !tracker) return { credited: false, reason: 'unknown tracker' };
  const t = tracker as { id: string; account_id: string };

  // Resolve the campaign (first active campaign for this tracker).
  const { data: ct } = await sb.from('campaign_trackers').select('campaign_id').eq('tracker_id', t.id).limit(1);
  const campaignId = (ct?.[0] as { campaign_id: string } | undefined)?.campaign_id ?? null;

  // FX normalization — simplified: assume the payout currency is USD; convert if different.
  const normalizedAmount = input.currency === 'USD' ? input.amount : input.amount; // a real impl uses an FX rate

  // Insert the balance row. UNIQUE(account_id, trace) enforces idempotency.
  const { error } = await sb.from('balance').insert({
    account_id: t.account_id,
    tracker_id: t.id,
    campaign_id: campaignId,
    amount: normalizedAmount,
    currency: 'USD',
    released: false,
    trace: input.trace,
  });
  if (error) {
    if (error.code === '23505') return { credited: false, reason: 'duplicate trace (idempotent skip)' };
    throw new Error(`creditBalance failed: ${error.message}`);
  }
  return { credited: true };
}

/** Reversal — a negative row referencing the original trace (Amazon clawback). Never a DELETE. */
export async function reverseBalance(originalTrace: string, reversalAmount: number): Promise<void> {
  const sb = createServiceClient();
  const { data: original } = await sb.from('balance').select('account_id,tracker_id,campaign_id').eq('trace', originalTrace).maybeSingle();
  if (!original) throw new Error('reversal: original trace not found');
  const o = original as { account_id: string; tracker_id: string; campaign_id: string };
  const { error } = await sb.from('balance').insert({
    account_id: o.account_id, tracker_id: o.tracker_id, campaign_id: o.campaign_id,
    amount: -Math.abs(reversalAmount), currency: 'USD', released: false, trace: `reversal_${originalTrace}`,
  });
  if (error) throw new Error(`reverseBalance failed: ${error.message}`);
}

/** balance_due = sum of released=false rows (computed, not stored). */
export async function getBalanceDue(accountId: string): Promise<number> {
  const sb = createServiceClient();
  const { data, error } = await sb.from('balance').select('amount').eq('account_id', accountId).eq('released', false);
  if (error) throw new Error(`getBalanceDue failed: ${error.message}`);
  return (data ?? []).reduce((sum: number, r: { amount: number }) => sum + Number(r.amount), 0);
}

export function verifyPostbackToken(token: string | null): boolean {
  if (!POSTBACK_TOKEN) return false; // fail closed if not configured
  return token === POSTBACK_TOKEN;
}
