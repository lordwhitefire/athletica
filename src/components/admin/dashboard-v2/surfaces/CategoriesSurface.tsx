"use client";

import DrawerShell from "./DrawerShell";
import { useDashboardInteraction } from "../interaction-store";

export default function CategoriesSurface({
    categories,
    total,
}: {
    categories: { label: string; count: number }[];
    total: number;
}) {
    const { closeDrawer, showToast } = useDashboardInteraction();
    const safeTotal = Math.max(1, total);

    return (
        <DrawerShell
            title="Category Distribution"
            description="Current catalog category allocation."
            onClose={closeDrawer}
        >
            <ul>
                {categories.length === 0 && (
                    <li className="px-5 py-8 text-center text-xs text-zinc-500">No categories yet.</li>
                )}
                {categories.map((c) => {
                    const percentage = Math.round((c.count / safeTotal) * 100);
                    return (
                        <li key={c.label}>
                            <button
                                type="button"
                                onClick={() =>
                                    showToast({
                                        tone: "success",
                                        title: `${c.label} selected`,
                                        message: `${c.count} products currently belong to this category.`,
                                    })
                                }
                                className="w-full flex items-center gap-3 px-5 py-3 border-t border-neutral-800/70 hover:bg-neutral-800/40 transition-colors text-left"
                            >
                                <div className="w-16 flex-none">
                                    <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                                        <div className="h-full rounded-full bg-[#b7f52a]" style={{ width: `${Math.min(100, percentage)}%` }} />
                                    </div>
                                </div>
                                <span className="min-w-0 flex-1">
                                    <strong className="block text-[11px] text-zinc-300 truncate">{c.label}</strong>
                                    <small className="block text-[9px] text-zinc-500">{c.count} products</small>
                                </span>
                                <strong className="text-[11px] text-zinc-400 flex-none">{percentage}%</strong>
                                <span className="material-symbols-outlined text-[16px] text-zinc-600">chevron_right</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </DrawerShell>
    );
}