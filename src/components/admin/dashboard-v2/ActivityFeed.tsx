"use client";

import Panel from "./Panel";
import { useDashboardInteraction } from "./interaction-store";

export default function ActivityFeed() {
    const { openDrawer } = useDashboardInteraction();
    return (
        <Panel
            title="Recent Activity"
            action={
                <button
                    type="button"
                    onClick={() => openDrawer({ type: "activity" })}
                    className="text-[10px] text-zinc-400 hover:text-primary border border-neutral-700 rounded px-2.5 py-1.5 bg-neutral-800 transition-colors"
                >
                    View all
                </button>
            }
        >
            <div className="px-4 py-10 flex flex-col items-center justify-center text-center gap-3">
                <span className="material-symbols-outlined text-zinc-600 text-2xl">history</span>
                <p className="text-xs text-zinc-400 max-w-[220px]">
                    No activity recorded yet — actions will appear here once logging exists.
                </p>
            </div>
        </Panel>
    );
}