import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getEnv } from "@/lib/env";

export async function proxy(request: NextRequest) {
    const env = getEnv();
    const { pathname } = request.nextUrl;

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // ── Admin auth ──────────────────────────────────────────
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
        if (pathname === "/admin/login" || pathname === "/api/admin/login") {
            return NextResponse.next();
        }

        if (!user) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (profile?.role !== "admin") {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        return NextResponse.next();
    }

    // ── Customer session refresh ────────────────────────────
    return supabaseResponse;
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
