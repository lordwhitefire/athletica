"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { InteractionProvider, useDashboardInteraction } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import { AnalyticsInteractionLayer } from "@/components/admin/analytics/AnalyticsInteractionLayer";
import { AnalyticsPresentation } from "@/components/admin/analytics/AnalyticsPresentation";

export type AnalyticsPageName = "overview" | "products" | "traffic";

function MobileTopbar() {
    const { openMobileSidebar } = useDashboardInteraction();
    return (
        <div className="fixed top-0 left-0 right-0 z-[55] h-14 flex items-center justify-between px-4 bg-neutral-950/96 border-b border-neutral-800 backdrop-blur max-[760px]:flex hidden">
            <button
                type="button"
                onClick={openMobileSidebar}
                aria-label="Open navigation"
                className="w-9 h-9 grid place-items-center border border-neutral-700 rounded bg-neutral-900 text-neutral-200"
            >
                <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="text-[#b8ff18] text-[17px] font-black tracking-tight">ATHLETICA</div>
            <div className="w-9" />
        </div>
    );
}

function AnalyticsBody({ page }: { page: AnalyticsPageName }) {
    return (
        <Suspense
            fallback={
                <div className="p-6 space-y-4 animate-pulse">
                    <div className="h-9 bg-neutral-800 rounded w-72" />
                    <div className="h-16 bg-neutral-900 border border-neutral-800 rounded-lg" />
                    <div className="h-40 bg-neutral-900 border border-neutral-800 rounded-lg" />
                </div>
            }
        >
            <AnalyticsInteractionLayer>
                <AnalyticsPresentation page={page} />
            </AnalyticsInteractionLayer>
        </Suspense>
    );
}

export default function AnalyticsPage({ page }: { page: AnalyticsPageName }) {
    return (
        <InteractionProvider>
            <SpecSidebar />
            <MobileTopbar />
            <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64 max-[760px]:pt-14">
                <AnalyticsBody page={page} />
            </div>
        </InteractionProvider>
    );
}

export function AnalyticsPageFromPath() {
    const pathname = usePathname();
    const pagePath = pathname.split("/").pop() || "overview";
    const page = (pagePath === "products" || pagePath === "traffic" ? pagePath : "overview") as AnalyticsPageName;
    return <AnalyticsPage page={page} />;
}