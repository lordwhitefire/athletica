import { adminClient } from "@/lib/admin-sanity";
import Link from "next/link";

export default async function AdminDashboard() {
    const [productCount, navCount, linkCount] = await Promise.all([
        adminClient.fetch(`count(*[_type == "product"])`),
        adminClient.fetch(`count(*[_type == "navigation"])`),
        adminClient.fetch(`count(*[_type == "amazonLinks"])`),
    ]);

    const statCards = [
        { label: "Products", value: productCount, href: "/admin/products", icon: "inventory_2" },
        { label: "Navigation Menus", value: navCount, href: "/admin/navigation", icon: "menu" },
        { label: "Amazon Links", value: linkCount, href: "/admin/amazon-links", icon: "link" },
    ];

    return (
        <div>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-8">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {statCards.map((card) => (
                    <Link key={card.href} href={card.href} className="bg-neutral-900 border border-neutral-800 rounded p-6 hover:border-red-600/50 transition-colors group">
                        <div className="flex items-center justify-between mb-3">
                            <span className="material-symbols-outlined text-zinc-500 group-hover:text-red-500 transition-colors">{card.icon}</span>
                            <span className="text-3xl font-black text-white">{card.value}</span>
                        </div>
                        <p className="text-zinc-400 text-sm font-medium">{card.label}</p>
                    </Link>
                ))}
            </div>

            <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-400 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <QuickAction href="/admin/products/new" label="Add Product" icon="add" />
                <QuickAction href="/admin/homepage" label="Edit Homepage" icon="edit" />
                <QuickAction href="/admin/navigation" label="Edit Navigation" icon="edit" />
                <QuickAction href="/admin/amazon-links" label="Manage Links" icon="edit" />
                <QuickAction href="/admin/media" label="Upload Media" icon="upload" />
            </div>
        </div>
    );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: string }) {
    return (
        <Link href={href} className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded px-4 py-3 hover:border-red-600/50 transition-colors group">
            <span className="material-symbols-outlined text-zinc-500 group-hover:text-red-500 transition-colors">{icon}</span>
            <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{label}</span>
        </Link>
    );
}
