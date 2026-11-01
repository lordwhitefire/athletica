import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

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

  const { error } = await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL('/admin/login', request.url));

  // Clear the door-key cookie too, so the sign-in page won't load without a new link.
  response.headers.set(
    'Set-Cookie',
    'admin_door_key=; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=0'
  );

  if (error) {
    // Sign-out errors shouldn't block the redirect — the cookie is cleared regardless.
    return response;
  }

  return response;
}
