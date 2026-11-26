import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client (bypasses RLS) — for admin operations
export function createAdminClient() {
  return createClient<Database, 'rollout'>(supabaseUrl, supabaseServiceKey, {
    db: { schema: 'rollout' },
  });
}

// Public client (respects RLS) — for customer reads
export function createPublicClient() {
  return createClient<Database, 'rollout'>(supabaseUrl, supabaseAnonKey, {
    db: { schema: 'rollout' },
  });
}

// Service-role client (bypasses RLS) — the name the service layer imports.
// Same client as createAdminClient; kept as a separate name so service code
// does not have to know which constructor the app uses.
export function createServiceClient() {
  return createAdminClient();
}
