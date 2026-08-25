"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDashboardOverview, type DashboardOverview } from "@/lib/actions/get-dashboard-overview";
import { InteractionProvider, useDashboardInteraction } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import InteractionLayer from "@/components/admin/dashboard-v2/InteractionLayer";
import PopoverShell from "@/components/admin/dashboard-v2/surfaces/PopoverShell";
import DatePopover from "@/components/admin/dashboard-v2/surfaces/DatePopover";
import KpiCard from "@/components/admin/dashboard-v2/KpiCard";
import ClicksChart from "@/components/admin/dashboard-v2/ClicksChart";
import TopProducts from "@/components/admin/dashboard-v2/TopProducts";
import ActivityFeed from "@/components/admin/dashboard-v2/ActivityFeed";
import TasksPanel from "@/components/admin/dashboard-v2/TasksPanel";
import CategoryDistribution from "@/components/admin/dashboard-v2/CategoryDistribution";

function pctOf(n: number, total: number): string {
    if (total <= 0) return "0%";
    return `${Math.round((n / total) * 1000) / 10}%`;
}

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

function Topbar() {
    const { state, openPopover, closePopover, openMobileSidebar } = useDashboardInteraction();
    const router = useRouter();
    return (
        <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur border-b border-neutral-800 px-4 md:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    onClick={openMobileSidebar}
                    aria-label="Open navigation"
                    className="text-zinc-400 hover:text-white max-[760px]:block hidden"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="min-w-0">
                    <h1 className="text-lg font-black text-white">Dashboard</h1>
                    <p className="text-xs text-zinc-500 truncate">
                        Welcome back, Admin! Here&apos;s what&apos;s happening with your store.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-none">
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => (state.popover === "date" ? closePopover() : openPopover("date"))}
                        className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-zinc-300"
                        aria-haspopup="dialog"
                        aria-expanded={state.popover === "date"}
                    >
                        <span className="material-symbols-outlined text-[14px] text-zinc-400">calendar_today</span>
                        <span className="hidden sm:inline">
                            {fmt(state.dateRange.start)} – {fmt(state.dateRange.end)}, {state.dateRange.end.getFullYear()}
                        </span>
                        <span className="material-symbols-outlined text-[14px] text-zinc-500">expand_more</span>
                    </button>
                    {state.popover === "date" && (
                        <PopoverShell onClose={closePopover} wide>
                            <DatePopover />
                        </PopoverShell>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => router.push("/admin/products/new")}
                    className="flex items-center gap-1.5 bg-[#b7f52a] text-black rounded px-3 py-2 text-xs font-bold hover:brightness-110 transition-all"
                >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span className="hidden sm:inline">Add Product</span>
                </button>
            </div>
        </header>
    );
}

function OverviewBody({ data }: { data: DashboardOverview }) {
    const d = data;
    const totalVersions = d.counts.products + d.counts.drafts;
    const thisMonth =
        d.counts.createdThisMonth > 0 ? `↑ ${d.counts.createdThisMonth} this month` : "0 this month";

    return (
        <>
            <div className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
                    <KpiCard icon="inventory_2" title="Total Products" value={d.counts.products} note={thisMonth} tone="lime" href="/admin/products" />
                    <KpiCard icon="check_circle" title="Active Products" value={d.counts.active} note={`${pctOf(d.counts.active, totalVersions)} of total`} tone="green" href="/admin/products" />
                    <KpiCard icon="link_off" title="Missing Amazon ASIN" value={d.quality.missingAsin} note={`${pctOf(d.quality.missingAsin, d.counts.products)} of total`} tone="orange" href="/admin/products" />
                    <KpiCard icon="image_not_supported" title="Missing Images" value={d.quality.missingImages} note={`${pctOf(d.quality.missingImages, d.counts.products)} of total`} tone="orange" href="/admin/products" />
                    <KpiCard icon="folder_off" title="Missing Categories" value={d.quality.missingCategories} note={`${pctOf(d.quality.missingCategories, d.counts.products)} of total`} tone="yellow" href="/admin/products" />
                    <KpiCard icon="north_east" title="Total Amazon Clicks" value={d.clicks.total} note="0% vs last 7 days" tone="blue" href="/admin/products" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <ClicksChart thisWeek={d.clicks.thisWeek} lastWeek={d.clicks.lastWeek} />
                    <TopProducts products={d.recentProducts} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <ActivityFeed />
                    <TasksPanel
                        quality={{ ...d.quality, unpublished: d.counts.drafts }}
                        items={d.issueItems}
                    />
                    <CategoryDistribution categories={d.categories} total={d.counts.products} />
                </div>
            </div>
            <InteractionLayer data={data} />
        </>
    );
}

function OverviewContent() {
    const [data, setData] = useState<DashboardOverview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setError(null);
        getDashboardOverview().then((res) => {
            if (cancelled) return;
            if (res.error) {
                setError(res.error.message);
            } else {
                setData(res.data);
            }
        }).catch(() => {
            // FR4-B: network-level action failure must show the error state,
            // never an eternal skeleton.
            if (!cancelled) setError("Could not reach the server. Check your connection and retry.");
        });
        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-sm text-red-400 mb-2">Failed to load dashboard.</p>
                <p className="text-xs text-zinc-500 mb-3">{error}</p>
                <button
                    type="button"
                    data-testid="overview-retry"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="text-xs font-semibold text-[#b8e51f] underline hover:brightness-110"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 space-y-4 animate-pulse">
                <div className="h-9 bg-neutral-800 rounded w-64" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg h-[120px]" />
                    ))}
                </div>
            </div>
        );
    }

    return <OverviewBody data={data} />;
}

export default function OverviewDashboard() {
    return (
        <InteractionProvider>
            <SpecSidebar />
            <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64">
                <Topbar />
                <OverviewContent />
            </div>
        </InteractionProvider>
    );
}