import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { hashToken, setDoorKeyCookie } from '@/lib/auth/door-key';

type DoorKeyRow = {
  id: string;
  user_id: string | null;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const tokenHash = hashToken(token);

  // admin_access_keys isn't in the generated DB types yet (types regen after
  // the migration runs). Cast through any for those queries only.
  const supabase = createAdminClient();
  const from = (table: string) => supabase.from(table) as unknown as any;

  // Find a live, unused, unrevoked door key matching this hash.
  const result = await from('admin_access_keys')
    .select('id, user_id, expires_at, used_at, revoked_at')
    .eq('token_hash', tokenHash)
    .eq('kind', 'door')
    .is('used_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString());

  const rows = result.data as DoorKeyRow[] | null;
  const findError = result.error;
  const key = rows?.[0] ?? null;

  if (findError || !key) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Mark the key as used — one-time link, consumed on first load.
  const useResult = await from('admin_access_keys')
    .update({ used_at: new Date().toISOString() })
    .eq('id', key.id);
  const useError = useResult.error;

  if (useError) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Deposit the cookie and send the admin to sign-in. The cookie alone grants
  // nothing; it only lets the sign-in page load. Email + password + role still
  // decide who gets in.
  const response = NextResponse.redirect(new URL('/admin/login', request.url));
  setDoorKeyCookie(response.headers, token);
  return response;
}
