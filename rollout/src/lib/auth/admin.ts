import { createRouteClient, getCookieStore } from '@/lib/supabase/route-client';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type UserClient = SupabaseClient<Database, 'rollout'>;

export interface AdminResult {
  user: { id: string; email: string | null } | null;
  response: NextResponse | null;
}

// Returns the current user only when they are signed in AND marked admin.
// Any error or missing role → not an admin (fail closed).
// If a client is passed in, reuses it; otherwise creates one from cookies.
export async function getAdminUser(supabase?: UserClient): Promise<AdminResult> {
  const sb = supabase ?? createRouteClient(await getCookieStore());
  const { data: { user }, error } = await sb.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Not found' }, { status: 404 }),
    };
  }

  const role = (user.app_metadata as { role?: string } | undefined)?.role;
  if (role !== 'admin') {
    return {
      user: null,
      response: NextResponse.json({ error: 'Not found' }, { status: 404 }),
    };
  }

  return { user: { id: user.id, email: user.email ?? null }, response: null };
}

// Route-handler form: returns { user, response: null } when authorised,
// or { user: null, response: <404> } when not.
// Caller: `const admin = await requireAdmin(supabase); if (admin.response) return admin.response;`
export async function requireAdmin(supabase?: UserClient): Promise<AdminResult> {
  return getAdminUser(supabase);
}
