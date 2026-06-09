import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { data: null, error: { type: "validation_error", code: "credentials_required", message: "Email and password are required." } },
                { status: 400 }
            );
        }

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

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            if (error.message.includes("Invalid login credentials")) {
                return NextResponse.json(
                    { data: null, error: { type: "auth_error", code: "invalid_credentials", message: "The email or password you entered is incorrect." } },
                    { status: 401 }
                );
            }
            return NextResponse.json(
                { data: null, error: { type: "auth_error", code: "login_failed", message: "Login failed. Please try again." } },
                { status: 401 }
            );
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json(
                { data: null, error: { type: "auth_error", code: "not_admin", message: "You do not have admin access." } },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { data: { message: "Logged in", userId: data.user.id, role: "admin" }, error: null },
            { status: 200 }
        );
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { data: null, error: { type: "api_error", code: "login_failed", message: "Login failed. Please try again." } },
            { status: 500 }
        );
    }
}
