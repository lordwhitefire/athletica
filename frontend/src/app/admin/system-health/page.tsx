"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SystemHealthPage from "@/components/admin/system-health/SystemHealthPage";

export default function SystemHealthRoute() {
    const router = useRouter();
    const { auth, logout } = useAuth();
    const user = auth.user;
    const role =
        user?.role === "admin"
            ? "Administrator"
            : user?.role
              ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
              : "Administrator";

    const handleSignOut = async () => {
        await logout();
        router.push("/admin/login");
    };

    return (
        <SystemHealthPage
            profile={{
                name: user?.name || "Admin",
                email: user?.email || "admin@athletica.com",
                role,
            }}
            onNavigate={(path) => router.push(path)}
            onSignOut={handleSignOut}
        />
    );
}