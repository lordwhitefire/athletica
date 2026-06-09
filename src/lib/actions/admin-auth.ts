"use server";

import { createClient } from "@/lib/supabase/server";
import { authLimiter } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { validateOrFail } from "@/lib/validate";
import { loginSchema } from "@/lib/schemas/auth";

export async function adminLogin(email: string, password: string): Promise<{
    data: { user: { id: string; email: string } } | null;
    error: { type: string; code: string; message: string; fields?: { field: string; message: string }[] } | null;
}> {
    const parsed = validateOrFail(loginSchema, { email, password });
    if ("error" in parsed) {
        return { data: null, error: { type: "validation_error", code: "validation_failed", message: parsed.error.error.message, fields: parsed.error.error.fields } };
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? "unknown";
    const { success } = await authLimiter.limit(ip);
    if (!success) {
        return {
            data: null,
            error: { type: "rate_limit_error", code: "too_many_requests", message: "Too many login attempts. Please wait 60 seconds." },
        };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return {
            data: null,
            error: { type: "auth_error", code: "login_failed", message: "The email or password you entered is incorrect." },
        };
    }

    return {
        data: { user: { id: data.user.id, email: data.user.email ?? "" } },
        error: null,
    };
}
