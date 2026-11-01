import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createHash } from 'node:crypto';
import { setDoorKeyCookie, DOOR_KEY_COOKIE_NAME } from '@/lib/auth/door-key';

type InviteRow = {
  id: string;
  user_id: string | null;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email: string | undefined = body?.email;
  const password: string | undefined = body?.password;
  const code: string | undefined = body?.code;

  if (!email || !password || !code) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Service-role client for admin operations (create user, set role, write keys).
  const supabase = createAdminClient();
  const from = (table: string) => supabase.from(table) as unknown as any;

  type AnyChain = {
    select: (cols: string) => AnyChain;
    eq: (col: string, val: string | number | null) => AnyChain;
    is: (col: string, val: null) => AnyChain;
    gt: (col: string, val: string) => AnyChain;
    maybeSingle: () => Promise<{ data: InviteRow | null; error: unknown }>;
    update: (vals: Record<string, unknown>) => AnyUpdateChain;
    insert: (vals: Record<string, unknown>) => AnyUpdateChain;
  };

  type AnyUpdateChain = {
    eq: (col: string, val: string | number) => Promise<{ error: unknown }>;
  };

  // Re-validate the invite code at submit time — prevents race conditions.
  const tokenHash = createHash('sha256').update(code).digest('hex');
  const { data: invite, error: findError } = await from('admin_access_keys')
    .select('id, used_at, revoked_at, expires_at')
    .eq('token_hash', tokenHash)
    .eq('kind', 'invite')
    .is('used_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (findError || !invite) {
    return NextResponse.json(
      { error: 'Invalid or expired invitation code' },
      { status: 400 }
    );
  }

  // Create the user via the Auth Admin API (service role).
  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !createdUser.user) {
    return NextResponse.json(
      { error: 'Unable to create account' },
      { status: 400 }
    );
  }

  // Set app_metadata.role = 'admin' — only the service role can do this.
  const { error: metaError } = await supabase.auth.admin.updateUserById(
    createdUser.user.id,
    { app_metadata: { role: 'admin' } }
  );

  if (metaError) {
    return NextResponse.json(
      { error: 'Unable to set admin role' },
      { status: 400 }
    );
  }

  // Mark the invite code as used.
  await from('admin_access_keys')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invite.id);

  // Issue a door key for the new admin so they can reach the sign-in page.
  const doorToken = createHash('sha256').update(crypto.randomUUID() + Date.now().toString()).digest('hex');
  const doorTokenHash = createHash('sha256').update(doorToken).digest('hex');
  const doorExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await from('admin_access_keys').insert({
    kind: 'door',
    user_id: createdUser.user.id,
    token_hash: doorTokenHash,
    browser_label: email,
    expires_at: doorExpiresAt,
  });

  // Deposit the door-key cookie and redirect to sign-in.
  const secure = request.url.startsWith('https://');
  const response = NextResponse.redirect(new URL('/admin/login', request.url));
  setDoorKeyCookie(response.headers, doorToken, secure);
  return response;
}
