import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";

const env = getEnv();

export const adminSupabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
