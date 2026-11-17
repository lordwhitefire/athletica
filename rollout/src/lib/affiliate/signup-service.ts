// FM-15: Affiliate signup + onboarding service.
// Multi-step (profile → payout details → terms). Email verify. Admin approval. Tracker issuance.
// Ownership RLS (FM-02 SQL) isolates each affiliate's data.

import { createServiceClient } from '@/lib/supabase/server';

export interface SignupInput {
  email: string;
  password: string;       // Supabase Auth handles hashing
  full_name: string;
  address: string;
  country: string;
  payout_method: string;
  payout_instructions: string;
  notify_balance: boolean;
}

export async function signupAffiliate(input: SignupInput): Promise<{ accountId: string; pending: true }> {
  const sb = createServiceClient();
  // Create the auth user (email + password). email_confirm=false → verification email sent.
  const { data: authData, error: authError } = await sb.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: false,
  });
  if (authError || !authData.user) throw new Error(`Signup failed: ${authError?.message ?? 'unknown'}`);

  // Mirror into affiliate.accounts (status=pending until admin approves).
  const { data: account, error: acctError } = await sb.from('accounts').insert({
    auth_user_id: authData.user.id,
    email: input.email,
    full_name: input.full_name,
    address: input.address,
    country: input.country,
    payout_method: input.payout_method,
    payout_instructions: input.payout_instructions,
    notify_balance: input.notify_balance,
    status: 'pending',
  }).select('id').single();
  if (acctError || !account) throw new Error(`Account mirror failed: ${acctError?.message}`);

  return { accountId: (account as { id: string }).id, pending: true };
}

/** Admin approves a pending affiliate → status=active + issue a tracker. */
export async function approveAffiliate(accountId: string): Promise<{ trackerId: string }> {
  const sb = createServiceClient();
  const { error } = await sb.from('accounts').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', accountId);
  if (error) throw new Error(`Approve failed: ${error.message}`);

  // Issue a tracker (public tracking code).
  const trackerId = generateTrackerCode();
  const { error: tErr } = await sb.from('trackers').insert({ id: trackerId, account_id: accountId, label: 'default' });
  if (tErr) throw new Error(`Tracker issuance failed: ${tErr.message}`);
  return { trackerId };
}

function generateTrackerCode(): string {
  // 12-char alphanumeric, URL-safe, hard to guess.
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `aff_${s}`;
}
