"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDashboardPreview, type DashboardPreview } from "@/lib/actions/get-dashboard-preview";

function SkeletonBlock() {
    return <div className="h-6 bg-neutral-800 rounded animate-pulse" />;
}

function PreviewCard({
    title,
    icon,
    href,
    children,
    loading,
}: {
    title: string;
    icon: string;
    href: string;
    children: React.ReactNode;
    loading?: boolean;
}) {
    return (
        <Link href={href} className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 hover:border-primary/50 transition-colors group block">
            <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-zinc-500 group-hover:text-primary transition-colors text-lg">{icon}</span>
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">{title}</h3>
            </div>
            {loading ? <SkeletonBlock /> : children}
        </Link>
    );
}

function LogoGrid({ items }: { items: { name: string; logo: string | null }[] }) {
    const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((b, i) => (
                <div key={i} className="flex items-center gap-2 bg-neutral-800 rounded px-2 py-1">
                    {b.logo && !imgErrors.has(i) ? (
                        <img
                            src={`https://cdn.sanity.io/images/cuiis46d/production/${b.logo.replace("image-", "").replace(/-([^-]+)$/, ".$1")}`}
                            alt={b.name}
                            className="w-6 h-6 object-contain"
                            onError={() => setImgErrors((s) => new Set([...s, i]))}
                        />
                    ) : (
                        <div className="w-6 h-6 bg-neutral-700 rounded flex items-center justify-center text-[8px] text-zinc-500 font-bold uppercase">
                            {b.name[0]}
                        </div>
                    )}
                    <span className="text-xs text-zinc-300">{b.name}</span>
                </div>
            ))}
            {items.length === 0 && <span className="text-xs text-zinc-500">No brands</span>}
        </div>
    );
}

export default function DashboardPreviewHub() {
    const [data, setData] = useState<DashboardPreview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getDashboardPreview()
            .then((r) => {
                if (r.error) setError(r.error.message);
                else setData(r.data!);
            })
            .catch(() => setError("Failed to load"))
            .finally(() => setLoading(false));
    }, []);

    if (error) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="col-span-full text-sm text-red-400">Failed to load preview: {error}</div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PreviewCard title="Products" icon="inventory_2" href="/admin/products" loading={loading}>
                <p className="text-2xl font-black text-white mb-1">{data?.products.count ?? 0}</p>
                {data && data.products.recent.length > 0 && (
                    <div className="space-y-0.5">
                        {data.products.recent.map((p) => (
                            <p key={p._id} className="text-xs text-zinc-400 truncate">{p.name}</p>
                        ))}
                    </div>
                )}
            </PreviewCard>

            <PreviewCard title="Brands" icon="local_offer" href="/admin/brands" loading={loading}>
                <p className="text-2xl font-black text-white mb-2">{data?.brands.count ?? 0}</p>
                {data && <LogoGrid items={data.brands.items} />}
            </PreviewCard>

            <PreviewCard title="Navigation" icon="menu" href="/admin/navigation" loading={loading}>
                <p className="text-2xl font-black text-white mb-1">{data?.navigation.count ?? 0}</p>
                {data && data.navigation.items.length > 0 && (
                    <div className="space-y-0.5">
                        {data.navigation.items.map((n, i) => (
                            <p key={i} className="text-xs text-zinc-400 truncate">{n.title}</p>
                        ))}
                    </div>
                )}
            </PreviewCard>

            <PreviewCard title="Amazon Links" icon="link" href="/admin/amazon-links" loading={loading}>
                <p className="text-2xl font-black text-white">{data?.amazonLinks.count ?? 0}</p>
            </PreviewCard>

            <PreviewCard title="Homepage" icon="slideshow" href="/admin/homepage" loading={loading}>
                {data && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Sections</span>
                            <span className="text-white font-bold">{data.homepage.sections}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Banners</span>
                            <span className="text-white font-bold">{data.homepage.banners}</span>
                        </div>
                    </div>
                )}
            </PreviewCard>

            <PreviewCard title="Media" icon="photo_library" href="/admin/media" loading={loading}>
                <p className="text-xs text-zinc-400">Upload and manage media assets</p>
            </PreviewCard>
        </div>
    );
}
