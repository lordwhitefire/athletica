"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Minimal admin boundary — the successor of the archived old dashboard shell
 * (src/_archive/admin-v1/app/admin/AdminShell.tsx). Every active admin route
 * renders its own dashboard-v2 chrome; this component only keeps:
 *   1. the client-side defense-in-depth admin check, and
 *   2. the shared <main> padding wrapper.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { auth, isAdmin } = useAuth();

    // Defense-in-depth: client-side admin check
    useEffect(() => {
        if (pathname === "/admin/login") return;
        if (auth.user && !isAdmin) {
            router.push("/admin/login");
        }
    }, [auth.user, isAdmin, pathname, router]);

    // Show nothing while checking auth on page load
    if (pathname !== "/admin/login" && auth.user && !isAdmin) {
        return null;
    }

    // Still loading auth state — show nothing to prevent flash
    if (pathname !== "/admin/login" && auth.user === undefined) {
        return null;
    }

    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    return <main className="p-4 md:p-8">{children}</main>;
}
