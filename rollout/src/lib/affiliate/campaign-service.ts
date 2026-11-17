// FM-16: Trackers + campaigns service.
// Campaign config: commission_type (percentage/fixed) decoupled from reward_type (cash/discount);
// recurring + nullable recurring_limit (NULL=lifetime); per-campaign minimum_payout + payout_term.
import { createServiceClient } from '@/lib/supabase/server';

export async function createTracker(accountId: string, label: string): Promise<{ id: string }> {
  const sb = createServiceClient();
  const id = generateTrackerCode();
  const { error } = await sb.from('trackers').insert({ id, account_id: accountId, label });
  if (error) throw new Error(`createTracker failed: ${error.message}`);
  return { id };
}

export async function listMyTrackers(accountId: string): Promise<{ id: string; label: string | null; created_at: string }[]> {
  const sb = createServiceClient();
  const { data, error } = await sb.from('trackers').select('id,label,created_at').eq('account_id', accountId);
  if (error) throw new Error(`listTrackers failed: ${error.message}`);
  return (data ?? []) as { id: string; label: string | null; created_at: string }[];
}

export interface CampaignInput {
  reward_type: 'cash_reward' | 'discount_coupon';
  commission_type?: 'percentage' | 'fixed' | null;
  reward: number;
  recurring: boolean;
  recurring_limit: number | null;  // null = lifetime
  minimum_payout: number;
  payout_term: string | null;      // 'net-30' etc.
}

export async function createCampaign(input: CampaignInput): Promise<{ id: string }> {
  const sb = createServiceClient();
  const { data, error } = await sb.from('campaigns').insert({
    reward_type: input.reward_type,
    commission_type: input.commission_type ?? null,
    reward: input.reward,
    recurring: input.recurring,
    recurring_limit: input.recurring_limit,
    minimum_payout: input.minimum_payout,
    payout_term: input.payout_term,
    status: 'active',
  }).select('id').single();
  if (error) throw new Error(`createCampaign failed: ${error.message}`);
  return { id: (data as { id: string }).id };
}

export async function assignTrackerToCampaign(trackerId: string, campaignId: string): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from('campaign_trackers').insert({ tracker_id: trackerId, campaign_id: campaignId });
  if (error && !error.message.includes('duplicate')) throw new Error(`assign failed: ${error.message}`);
}

function generateTrackerCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `aff_${s}`;
}
