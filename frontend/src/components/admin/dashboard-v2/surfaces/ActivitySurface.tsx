"use client";

import DrawerShell from "./DrawerShell";
import { useDashboardInteraction } from "../interaction-store";

export default function ActivitySurface() {
    const { closeDrawer } = useDashboardInteraction();
    return (
        <DrawerShell title="Recent Activity" description="Latest catalog and content events." onClose={closeDrawer}>
            <div className="px-5 py-12 flex flex-col items-center justify-center text-center gap-3">
                <span className="material-symbols-outlined text-zinc-600 text-2xl">history</span>
                <p className="text-xs text-zinc-400 max-w-[240px]">
                    No activity recorded yet — actions will appear here once logging exists.
                </p>
            </div>
        </DrawerShell>
    );
}