import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client (bypasses RLS) — for admin operations
export function createAdminClient() {
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}

// Public client (respects RLS) — for customer reads
export function createPublicClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
