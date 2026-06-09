import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    },
                },
            }
        );

        await supabase.auth.signOut();

        return NextResponse.json(
            { data: { message: "Logged out" }, error: null },
            { status: 200 }
        );
    } catch (error) {
        console.error("Admin logout error:", error);
        return NextResponse.json(
            { data: null, error: { type: "api_error", code: "logout_failed", message: "Logout failed. Please try again." } },
            { status: 500 }
        );
    }
}
