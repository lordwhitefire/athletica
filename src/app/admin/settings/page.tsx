"use client";

import { useAuth } from "@/context/AuthContext";
import AdminSettingsPage from "@/components/admin/admin-settings/AdminSettingsPage";

export default function AdminSettingsRoute() {
    const { auth } = useAuth();
    const user = auth.user;
    const role = user?.role === "admin" ? "Owner" : user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Owner";
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "May 13, 2025";

    return (
        <AdminSettingsPage
            profile={{
                name: user?.name || "Admin",
                email: user?.email || "admin@athletica.com",
                role,
                memberSince,
            }}
        />
    );
}