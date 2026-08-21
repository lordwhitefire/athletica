"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDashboardInteraction } from "./interaction-store";

type NavItem = { label: string; icon: string; route: string };

const navGroups: { label: string | null; items: NavItem[] }[] = [
    {
        label: null,
        items: [{ label: "Dashboard", icon: "home", route: "dashboard" }],
    },
    {
        label: "CATALOG",
        items: [
            { label: "Products", icon: "inventory_2", route: "products" },
            { label: "Import Center", icon: "upload_file", route: "import" },
            { label: "Categories", icon: "folder", route: "categories" },
            { label: "Brands", icon: "local_offer", route: "brands" },
            { label: "Models", icon: "account_tree", route: "models" },
        ],
    },
    {
        label: "CONTENT",
        items: [
            { label: "Homepage", icon: "home", route: "homepage" },
            { label: "Navigation", icon: "menu", route: "navigation" },
            { label: "Media Library", icon: "image", route: "media" },
        ],
    },
    {
        label: "ANALYTICS",
        items: [
            { label: "Overview", icon: "bar_chart", route: "analytics" },
            { label: "Products", icon: "inventory_2", route: "analyticsProducts" },
            { label: "Traffic", icon: "route", route: "traffic" },
        ],
    },
    {
        label: "AFFILIATE",
        items: [
            { label: "Affiliate Settings", icon: "link", route: "affiliateSettings" },
        ],
    },
    {
        label: "SYSTEM",
        items: [
            { label: "Data Quality", icon: "rule", route: "quality" },
            { label: "Settings", icon: "settings", route: "settings" },
        ],
    },
];

export default function SpecSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { state, openMobileSidebar, closeMobileSidebar, openDrawer, navigate } =
        useDashboardInteraction();
    const mobileOpen = state.sidebar.mobileOpen;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeMobileSidebar();
        };
        if (mobileOpen) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [mobileOpen, closeMobileSidebar]);

    function handleNav(item: NavItem) {
        closeMobileSidebar();
        navigate(item.route);
        if (item.route === "dashboard") {
            router.push("/admin/overview");
            return;
        }
        if (item.route === "products") {
            router.push("/admin/products");
            return;
        }
        if (item.route === "import") {
            router.push("/admin/import-center");
            return;
        }
        if (item.route === "categories") {
            router.push("/admin/categories");
            return;
        }
        if (item.route === "brands") {
            router.push("/admin/brands");
            return;
        }
        if (item.route === "models") {
            router.push("/admin/models");
            return;
        }
        if (item.route === "homepage") {
            router.push("/admin/homepage");
            return;
        }
        if (item.route === "media") {
            router.push("/admin/media");
            return;
        }
        if (item.route === "analytics") {
            router.push("/admin/analytics/overview");
            return;
        }
        if (item.route === "analyticsProducts") {
            router.push("/admin/analytics/products");
            return;
        }
        if (item.route === "traffic") {
            router.push("/admin/analytics/traffic");
            return;
        }
        if (item.route === "affiliateSettings") {
            router.push("/admin/affiliate-settings");
            return;
        }
        if (item.route === "settings") {
            router.push("/admin/settings");
            return;
        }
        if (item.route === "quality") {
            router.push("/admin/system-health");
            return;
        }
        openDrawer({ type: "route", route: item.route });
    }

    const isActive = (item: NavItem) =>
        (item.route === "dashboard" && pathname === "/admin/overview") ||
        (item.route === "products" && pathname === "/admin/products") ||
        (item.route === "import" && pathname === "/admin/import-center") ||
        (item.route === "categories" && pathname === "/admin/categories") ||
        (item.route === "brands" && pathname === "/admin/brands") ||
        (item.route === "models" && pathname === "/admin/models") ||
        (item.route === "homepage" && pathname === "/admin/homepage") ||
        (item.route === "media" && pathname === "/admin/media") ||
        (item.route === "analytics" && pathname === "/admin/analytics/overview") ||
        (item.route === "analyticsProducts" && pathname === "/admin/analytics/products") ||
        (item.route === "traffic" && pathname === "/admin/analytics/traffic") ||
        (item.route === "affiliateSettings" && pathname === "/admin/affiliate-settings") ||
        (item.route === "settings" && pathname === "/admin/settings") ||
        (item.route === "quality" && pathname === "/admin/system-health");

    return (
        <>
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[55] max-[760px]:block hidden"
                    onClick={closeMobileSidebar}
                    aria-hidden="true"
                />
            )}

            <aside
                aria-label="Admin navigation"
                className={`fixed top-0 bottom-0 left-0 z-[60] flex flex-col bg-neutral-900 border-r border-neutral-800 transition-transform duration-200
                    min-[1101px]:w-64 min-[1101px]:translate-x-0
                    max-[1100px]:min-[761px]:w-16 max-[1100px]:min-[761px]:translate-x-0
                    max-[760px]:w-64 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex items-center justify-between p-4 border-b border-neutral-800 min-[761px]:max-[1100px]:justify-center">
                    <div className="bg-zinc-800 text-white w-fit px-2 py-1">
                        <span className="text-sm font-black italic tracking-tighter">AT</span>
                    </div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider min-[761px]:max-[1100px]:hidden">
                        Admin
                    </span>
                    <button
                        type="button"
                        onClick={closeMobileSidebar}
                        aria-label="Close navigation"
                        className="text-zinc-500 hover:text-white max-[760px]:block hidden"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                <nav className="p-3 space-y-3 flex-1 overflow-y-auto no-scrollbar">
                    {navGroups.map((group, gi) => (
                        <div key={gi}>
                            {group.label && (
                                <p className="px-3 pb-1 text-[9px] uppercase tracking-wider text-zinc-600 min-[761px]:max-[1100px]:sr-only">
                                    {group.label}
                                </p>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => handleNav(item)}
                                        aria-current={isActive(item) ? "page" : undefined}
                                        title={item.label}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors min-[761px]:max-[1100px]:justify-center ${
                                            isActive(item)
                                                ? "bg-[#b7f52a] text-black font-bold"
                                                : "text-zinc-400 hover:text-white hover:bg-neutral-800"
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px] flex-none">
                                            {item.icon}
                                        </span>
                                        <span className="min-[761px]:max-[1100px]:hidden">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-neutral-800 min-[761px]:max-[1100px]:flex min-[761px]:max-[1100px]:justify-center">
                    <button
                        type="button"
                        id="admin-profile-button"
                        className="profile flex items-center gap-3 w-full text-left min-[761px]:max-[1100px]:w-auto"
                    >
                        <span className="w-8 h-8 rounded-full bg-[#b7f52a] text-black flex items-center justify-center text-sm font-black flex-none">
                            A
                        </span>
                        <span className="min-w-0 flex-1 min-[761px]:max-[1100px]:hidden">
                            <span className="block text-xs font-bold text-white">Admin</span>
                            <span className="block text-[9px] text-zinc-500 truncate">athletica.com</span>
                        </span>
                        <span className="material-symbols-outlined text-[14px] text-zinc-500 min-[761px]:max-[1100px]:hidden">
                            expand_more
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}