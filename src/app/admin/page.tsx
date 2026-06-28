import Link from "next/link";
import DashboardStats from "./dashboard-stats";

export default function AdminDashboard() {
    return (
        <div>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-8">Dashboard</h1>

            <DashboardStats />

            <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-400 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <QuickAction href="/admin/products/new" label="Add Product" icon="add" />
                <QuickAction href="/admin/homepage" label="Edit Homepage" icon="edit" />
                <QuickAction href="/admin/navigation" label="Edit Navigation" icon="edit" />
                <QuickAction href="/admin/amazon-links" label="Manage Links" icon="edit" />
                <QuickAction href="/admin/media" label="Upload Media" icon="upload" />
                <QuickAction href="/admin/brands" label="Manage Brands" icon="local_offer" />
            </div>
        </div>
    );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: string }) {
    return (
        <Link href={href} className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded px-4 py-3 hover:border-primary/50 transition-colors group">
            <span className="material-symbols-outlined text-zinc-500 group-hover:text-primary transition-colors">{icon}</span>
            <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{label}</span>
        </Link>
    );
}
