// FM-01: Updated admin gate — uses getClaims() (fast, no network) for the role check.
// getUser() is reserved for paths that need the full verified user object.
//
// Three locks (in order of enforcement):
//   Lock 1 — invite code: enforced at /admin/signup (consume an invite row).
//   Lock 2 — door-key cookie: enforced in src/middleware.ts (first-line filter).
//   Lock 3 — JWT role: enforced here via getClaims() (app_metadata.role === 'admin').
//
// Any failure → fail-silent 404 (conceals the admin surface; not 401/403).

import { createRouteClient, getCookieStore } from '@/lib/supabase/route-client';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { getClaims } from '@/lib/auth/get-claims';

type UserClient = SupabaseClient<Database, 'rollout'>;

export interface AdminResult {
  user: { id: string; email: string | null } | null;
  response: NextResponse | null;
}

const NOT_FOUND = () => NextResponse.json({ error: 'Not found' }, { status: 404 });

/**
 * The per-route admin gate (Lock 3).
 * Uses getClaims() — no network call, ~0ms.
 * Callers: `const admin = await requireAdmin(supabase); if (admin.response) return admin.response;`
 */
export async function requireAdmin(supabase?: UserClient): Promise<AdminResult> {
  const claims = await getClaims(supabase);
  if (!claims.userId || claims.role !== 'admin') {
    return { user: null, response: NOT_FOUND() };
  }
  return {
    user: { id: claims.userId, email: null },
    response: null,
  };
}

/**
 * When the full verified user object is needed (e.g. displaying email in the UI),
 * use getUser() — the network call. This is the exception, not the default.
 */
export async function getAdminUser(supabase?: UserClient): Promise<AdminResult> {
  const sb = supabase ?? createRouteClient(await getCookieStore());
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return { user: null, response: NOT_FOUND() };
  const role = (data.user.app_metadata as { role?: string } | undefined)?.role;
  if (role !== 'admin') return { user: null, response: NOT_FOUND() };
  return { user: { id: data.user.id, email: data.user.email ?? null }, response: null };
}
