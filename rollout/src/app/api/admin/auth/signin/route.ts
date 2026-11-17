import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';
import { checkSigninRateLimit } from '@/lib/auth/signin-rate-limit';
import { resolveIp } from '@/lib/analytics/ip-chain';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database, 'rollout'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const body = await request.json().catch(() => null);
  const email: string | undefined = body?.email;
  const password: string | undefined = body?.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }

  // FIX (audit 4.2): wire the signin rate limit BEFORE password auth.
  // 5 per minute per email+IP. Fail-open if Upstash is unreachable.
  const ip = resolveIp(request.headers);
  const { ok, retryAfter } = await checkSigninRateLimit(email, ip);
  if (!ok) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter ?? 60) } }
    );
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Neutral error — never reveals whether the account exists.
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  return NextResponse.json({ redirect: '/admin/products' });
}
