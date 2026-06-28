"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDashboardCounts } from "@/lib/actions/get-dashboard-counts";
import type { DashboardCounts } from "@/lib/getDashboardCounts";

function StatCards({ values }: { values: DashboardCounts }) {
    const cards = [
        { label: "Products", value: values.productCount, href: "/admin/products", icon: "inventory_2" },
        { label: "Brands", value: values.brandCount, href: "/admin/brands", icon: "local_offer" },
        { label: "Navigation Menus", value: values.navCount, href: "/admin/navigation", icon: "menu" },
        { label: "Amazon Links", value: values.linkCount, href: "/admin/amazon-links", icon: "link" },
    ];
    return (
        <>
            {cards.map((card) => (
                <Link key={card.href} href={card.href} className="bg-neutral-900 border border-neutral-800 rounded p-6 hover:border-primary/50 transition-colors group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="material-symbols-outlined text-zinc-500 group-hover:text-primary transition-colors">{card.icon}</span>
                        <span className="text-3xl font-black text-white">{card.value}</span>
                    </div>
                    <p className="text-zinc-400 text-sm font-medium">{card.label}</p>
                </Link>
            ))}
        </>
    );
}

function SkeletonCards() {
    return (
        <>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-neutral-900 border border-neutral-800 rounded p-6 animate-pulse">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-6 h-6 rounded bg-zinc-800" />
                        <div className="w-12 h-8 rounded bg-zinc-800" />
                    </div>
                    <div className="w-20 h-4 rounded bg-zinc-800" />
                </div>
            ))}
        </>
    );
}

export default function DashboardStats() {
    const [counts, setCounts] = useState<DashboardCounts | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getDashboardCounts()
            .then((result) => {
                if (result.error) {
                    setError(result.error.message);
                } else {
                    setCounts(result.data!);
                }
            });
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            {error ? (
                <>
                    <p className="text-red-500 text-sm mb-6 col-span-full">{error}</p>
                    <StatCards values={{ productCount: 0, brandCount: 0, navCount: 0, linkCount: 0 }} />
                </>
            ) : counts ? (
                <StatCards values={counts} />
            ) : (
                <SkeletonCards />
            )}
        </div>
    );
}
