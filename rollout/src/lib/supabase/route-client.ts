import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cookie-aware Supabase client for Route Handlers (Next.js App Router).
// Built fresh per request — never shared across requests.
// Use this for /api/admin/* handlers so the session cookie is read server-side.
export function createRouteClient() {
  const cookieStore = cookies();

  return createServerClient<Database, 'rollout'>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.then((cs) =>
          cs.getAll().map((c) => ({ name: c.name, value: c.value }))
        );
      },
      setAll(cookiesToSet) {
        cookieStore.then((cs) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cs.set(name, value, options);
          });
        });
      },
    },
  });
}
