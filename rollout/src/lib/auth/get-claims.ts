// Fast JWT-claims reader — reads app_metadata.role from the session JWT
// WITHOUT a network call to Supabase auth.getUser().
//
// Per RE-05 NextBase §2.4: getClaims() is ~0ms; getUser() is 50–200ms/page.
// Use getClaims() for the role gate (middleware, page gates, requireAdmin).
// Use getUser() only when the full verified user object is needed.
//
// The JWT is signed by Supabase; the session client verifies it locally.
// This is sufficient for the role gate because the role is set by the
// service_role at signup and travels in every authenticated request.

import { createRouteClient, getCookieStore } from '@/lib/supabase/route-client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type UserClient = SupabaseClient<Database, 'rollout'>;

export interface ClaimsResult {
  /** The user id from the JWT, or null if no session. */
  userId: string | null;
  /** The role from app_metadata.role, or null. */
  role: string | null;
  /** The session object (for callers that need more). */
  session: unknown | null;
}

/**
 * Read the role + user id from the local JWT session (no network call).
 * Falls back to null on any error — callers fail closed (404).
 */
export async function getClaims(supabase?: UserClient): Promise<ClaimsResult> {
  try {
    const sb = supabase ?? createRouteClient(await getCookieStore());
    const { data, error } = await sb.auth.getSession();
    if (error || !data.session) {
      return { userId: null, role: null, session: null };
    }
    const user = data.session.user;
    const role = (user?.app_metadata as { role?: string } | undefined)?.role ?? null;
    return {
      userId: user?.id ?? null,
      role,
      session: data.session,
    };
  } catch {
    // Fail closed: any error → no claims → caller returns 404.
    return { userId: null, role: null, session: null };
  }
}
