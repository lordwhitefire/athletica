import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cookie-aware Supabase client for Route Handlers (Next.js App Router).
// Caller must `await cookies()` and pass the store — cookies() is async.
// Built fresh per request — never shared across requests.
export function createRouteClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient<Database, 'rollout'>(supabaseUrl, supabaseAnonKey, {
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
  });
}

export async function getCookieStore() {
  return cookies();
}
