"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
    { label: "Dashboard", href: "/admin", icon: "grid_view" },
    { label: "Products", href: "/admin/products", icon: "inventory_2" },
    { label: "Brands", href: "/admin/brands", icon: "local_offer" },
    { label: "Homepage", href: "/admin/homepage", icon: "home" },
    { label: "Navigation", href: "/admin/navigation", icon: "menu" },
    { label: "Amazon Links", href: "/admin/amazon-links", icon: "link" },
    { label: "Settings", href: "/admin/settings", icon: "settings" },
    { label: "Media", href: "/admin/media", icon: "photo_library" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    async function handleLogout() {
        setLoggingOut(true);
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
    }

    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900 border-r border-neutral-800 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                    <div className="bg-zinc-800 text-white w-fit px-2 py-1">
                        <span className="text-sm font-black italic tracking-tighter">AT</span>
                    </div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Admin</span>
                </div>

                <nav className="p-3 space-y-1">
                    {navItems.map((item) => {
                        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                        return (
                            <a
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                                    active ? "bg-red-600 text-white" : "text-zinc-400 hover:text-white hover:bg-neutral-800"
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                {item.label}
                            </a>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800">
                    <button onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-3 text-zinc-500 hover:text-red-500 disabled:text-zinc-700 text-sm transition-colors w-full">
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        {loggingOut ? "Logging out..." : "Logout"}
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main */}
            <div className="flex-1 min-w-0">
                <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur border-b border-neutral-800 px-4 py-3 flex items-center gap-3 lg:hidden">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-400 hover:text-white">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <span className="text-sm font-bold uppercase tracking-wider">Admin</span>
                </header>

                <main className="p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
