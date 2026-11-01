import { notFound } from 'next/navigation';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { hashToken } from '@/lib/auth/door-key';

type InviteRow = {
  id: string;
  user_id: string | null;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sign up',
  description: 'Admin sign-up',
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  if (!code) {
    notFound();
  }

  const tokenHash = hashToken(code);
  const cookieStore = await cookies();

  // admin_access_keys isn't in the generated DB types yet — cast through any.
  const supabase = createAdminClient() as unknown as {
    from: (table: string) => AnyChain;
  };

  type AnyChain = {
    select: (cols: string) => AnyChain;
    eq: (col: string, val: string | number | null) => AnyChain;
    is: (col: string, val: null) => AnyChain;
    gt: (col: string, val: string) => AnyChain;
    maybeSingle: () => Promise<{ data: InviteRow | null; error: unknown }>;
    update: (vals: Record<string, unknown>) => AnyUpdateChain;
  };

  type AnyUpdateChain = {
    eq: (col: string, val: string | number) => Promise<{ error: unknown }>;
  };

  const { data: invite, error: findError } = await supabase
    .from('admin_access_keys')
    .select('id, user_id, expires_at, used_at, revoked_at')
    .eq('token_hash', tokenHash)
    .eq('kind', 'invite')
    .is('used_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (findError || !invite) {
    notFound();
  }

  return (
    <main className="signup-page">
      <form className="signup-form" action="/api/admin/auth/signup" method="POST">
        <input type="hidden" name="code" value={code} />
        <h1>Create admin account</h1>
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />

        <button type="submit" className="signup-btn">
          Create account
        </button>
      </form>
      <p className="signup-hint">
        This code works once. If it doesn't work, ask the admin for a new one.
      </p>
    </main>
  );
}
