// FM-18: Payout service — transactional flow (one Postgres transaction).
// State machine: requested → scheduled → paid / → rejected.
// Per-account sequential number. payout_term eligibility (scheduled job).
import { createServiceClient } from '@/lib/supabase/server';
import { getBalanceDue } from './balance-service';

export type PayoutResult = 'request_success' | 'amount_neutral' | 'amount_failure' | 'config_failure';

export async function requestPayout(accountId: string): Promise<{ result: PayoutResult; payoutId?: string }> {
  const sb = createServiceClient();

  // config_failure: missing payout details.
  const { data: acct } = await sb.from('accounts').select('payout_method,payout_instructions,full_name,address,country').eq('id', accountId).maybeSingle();
  const a = acct as { payout_method: string | null; payout_instructions: string | null; full_name: string | null; address: string | null; country: string | null } | null;
  if (!a || !a.payout_method || !a.payout_instructions || !a.full_name || !a.address || !a.country) {
    return { result: 'config_failure' };
  }

  const balanceDue = await getBalanceDue(accountId);
  if (balanceDue <= 0) return { result: 'amount_neutral' };

  // minimum_payout comes from the campaign; simplified: use a global default.
  const minimumPayout = Number(process.env.AFFILIATE_MINIMUM_PAYOUT ?? '50');
  if (balanceDue < minimumPayout) return { result: 'amount_failure' };

  // Compute the per-account sequential number (SQL x = x + 1 style).
  const { data: maxRow } = await sb.from('payouts').select('number').eq('account_id', accountId).order('number', { ascending: false }).limit(1);
  const nextNumber = ((maxRow?.[0] as { number: number } | undefined)?.number ?? 0) + 1;

  // ONE transaction: release the balance rows + insert the payout.
  // Supabase JS doesn't expose multi-statement transactions directly; the owner creates an RPC
  // `request_payout(account_id, amount, number)` that wraps both in BEGIN/COMMIT.
  // This service calls that RPC. (Integration: create the RPC in Supabase — see patch instructions.)
  const { data, error } = await (sb as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: { payout_id: string } | null; error: { message: string; code?: string } | null }>;
  }).rpc('request_payout', { p_account_id: accountId, p_amount: balanceDue, p_number: nextNumber });

  if (error) throw new Error(`requestPayout RPC failed: ${error.message}`);
  return { result: 'request_success', payoutId: (data as { payout_id: string })?.payout_id };
}

export async function schedulePayout(payoutId: string, scheduledFor: string): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from('payouts').update({ status: 'scheduled', scheduled_for: scheduledFor, updated_at: new Date().toISOString() }).eq('id', payoutId).eq('status', 'requested');
  if (error) throw new Error(`schedulePayout failed: ${error.message}`);
}

export async function markPaid(payoutId: string): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from('payouts').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', payoutId).eq('status', 'scheduled');
  if (error) throw new Error(`markPaid failed: ${error.message}`);
}

export async function rejectPayout(payoutId: string): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from('payouts').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', payoutId).eq('status', 'requested');
  if (error) throw new Error(`rejectPayout failed: ${error.message}`);
}
