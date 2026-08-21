"use client";

import DrawerShell from "./DrawerShell";
import { useDashboardInteraction } from "../interaction-store";
import { taskMeta } from "../meta";

export default function TasksSurface({
    counts,
}: {
    counts: Record<string, number>;
}) {
    const { closeDrawer, openDrawer } = useDashboardInteraction();

    return (
        <DrawerShell
            title="Tasks Needing Attention"
            description="All currently actionable catalog problems."
            onClose={closeDrawer}
        >
            <ul>
                {taskMeta.map((meta) => {
                    const count = counts[meta.id] ?? 0;
                    return (
                        <li key={meta.id}>
                            <button
                                type="button"
                                onClick={() => openDrawer({ type: "task", issue: meta.id })}
                                className="w-full flex items-center gap-3 px-5 py-3 border-t border-neutral-800/70 hover:bg-neutral-800/40 transition-colors text-left"
                            >
                                <span
                                    className="w-7 h-7 rounded-full flex items-center justify-center flex-none"
                                    style={{ backgroundColor: "rgba(255,113,16,.10)", color: meta.tone }}
                                >
                                    <span className="material-symbols-outlined text-[14px]">{meta.icon}</span>
                                </span>
                                <span className="min-w-0 flex-1">
                                    <strong className="block text-[11px] text-zinc-300 truncate">{meta.title}</strong>
                                    <small className="block text-[9px] text-zinc-500 truncate">{meta.description}</small>
                                </span>
                                <span className="text-right flex-none">
                                    <strong
                                        className="block text-[11px] font-bold"
                                        style={{ color: count > 0 ? meta.tone : "#71717a" }}
                                    >
                                        {count}
                                    </strong>
                                    <small className="block text-[9px] text-zinc-500">affected</small>
                                </span>
                                <span className="material-symbols-outlined text-[16px] text-zinc-600">
                                    chevron_right
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </DrawerShell>
    );
}