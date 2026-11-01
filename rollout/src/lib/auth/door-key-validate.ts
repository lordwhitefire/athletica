import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

import { DOOR_KEY_COOKIE_NAME } from '@/lib/auth/door-key';

/**
 * Validate the door-key cookie on the current request.
 *
 * Returns { ok: true } when a live, unused, unrevoked door key matches the
 * cookie, and slides its expiry forward by 30 days (sliding renewal).
 *
 * Returns { ok: false } when the cookie is missing, wrong, used, revoked, or
 * expired — the caller must return 404.
 */
export async function validateDoorKey(): Promise<{ ok: boolean }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(DOOR_KEY_COOKIE_NAME)?.value;

  if (!token) {
    return { ok: false };
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');

  // admin_access_keys isn't in the generated DB types yet — cast through any.
  const supabase = createAdminClient() as unknown as {
    from: (table: string) => AnyChain;
  };

  type AnyChain = {
    select: (cols: string) => AnyChain;
    eq: (col: string, val: string | number | null) => AnyChain;
    is: (col: string, val: null) => AnyChain;
    gt: (col: string, val: string) => AnyChain;
    maybeSingle: () => Promise<{ data: any[] | null; error: unknown }>;
    update: (vals: Record<string, unknown>) => AnyUpdateChain;
  };

  type AnyUpdateChain = {
    eq: (col: string, val: string | number) => Promise<{ error: unknown }>;
  };

  const { data: rows, error: findError } = await supabase
    .from('admin_access_keys')
    .select('id, user_id, expires_at, used_at, revoked_at, kind')
    .eq('token_hash', tokenHash)
    .eq('kind', 'door')
    .is('used_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (findError || !rows?.[0]) {
    return { ok: false };
  }

  const key = rows[0];

  // Sliding renewal: push expiry to now() + 30 days on each valid visit.
  const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error: updateError } = await supabase
    .from('admin_access_keys')
    .update({ expires_at: newExpiry })
    .eq('id', key.id);

  if (updateError) {
    return { ok: false };
  }

  return { ok: true };
}
