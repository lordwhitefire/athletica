"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSettingsPage from "@/components/admin/admin-settings/AdminSettingsPage";

export default function SettingsClient({
    siteSettings,
}: {
    siteSettings: { doc: Record<string, unknown> | null; mainCategoryHref: string; mainCategoryLabel: string; loadError: string | null };
}) {
    const router = useRouter();
    const { auth } = useAuth();
    const user = auth.user;
    const role = user?.role === "admin"
        ? "Owner"
        : user?.role
            ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
            : "Owner";
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "May 13, 2025";

    // FR4-B: a failed settings read must never fall back to defaults — saving
    // from that state would overwrite the real configuration with placeholders.
    if (siteSettings.loadError) {
        return (
            <div className="p-6 text-center">
                <p className="text-sm text-red-400 mb-2">Failed to load site settings.</p>
                <p className="text-xs text-zinc-500 mb-3">{siteSettings.loadError}</p>
                <button
                    type="button"
                    data-testid="settings-retry"
                    onClick={() => router.refresh()}
                    className="text-xs font-semibold text-[#b8e51f] underline hover:brightness-110"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <AdminSettingsPage
            profile={{
                name: user?.name || "Admin",
                email: user?.email || "admin@athletica.com",
                role,
                memberSince,
            }}
            siteSettings={siteSettings}
        />
    );
}
