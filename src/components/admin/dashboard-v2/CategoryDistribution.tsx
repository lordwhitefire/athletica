"use client";

import Panel from "./Panel";
import { useDashboardInteraction } from "./interaction-store";

const palette = ["#b7f52a", "#4f92d7", "#e7bc2d", "#b5dd4e", "#ff7110", "#8fca75", "#51a8fb", "#a6aa9d", "#b5a45b", "#71aab2"];

export default function CategoryDistribution({
    categories,
    total,
}: {
    categories: { label: string; count: number }[];
    total: number;
}) {
    const { openDrawer } = useDashboardInteraction();
    const safeTotal = Math.max(1, total);
    let acc = 0;
    const segments = categories.map((c, i) => {
        const from = (acc / safeTotal) * 360;
        acc += c.count;
        const to = (acc / safeTotal) * 360;
        return { ...c, color: palette[i % palette.length], from, to };
    });

    const donut =
        segments.length === 0
            ? "conic-gradient(#27272a 0deg 360deg)"
            : `conic-gradient(${segments.map((s) => `${s.color} ${s.from}deg ${s.to}deg`).join(", ")})`;

    return (
        <Panel
            title="Category Distribution"
            action={
                <button
                    type="button"
                    onClick={() => openDrawer({ type: "categories" })}
                    className="text-[10px] text-zinc-400 hover:text-primary border border-neutral-700 rounded px-2.5 py-1.5 bg-neutral-800 transition-colors"
                >
                    View all
                </button>
            }
        >
            <div className="px-4 py-5">
                <div className="flex items-center gap-5">
                    <div
                        className="w-28 h-28 rounded-full flex-none"
                        style={{
                            background: donut,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div className="w-20 h-20 rounded-full bg-neutral-900 flex flex-col items-center justify-center">
                            <strong className="text-sm font-black text-white">{total}</strong>
                            <span className="text-[9px] text-zinc-500">Products</span>
                        </div>
                    </div>
                    <ul className="flex-1 min-w-0 space-y-1.5">
                        {segments.length === 0 && (
                            <li className="text-[10px] text-zinc-500">No categories yet.</li>
                        )}
                        {segments.map((s) => (
                            <li key={s.label} className="flex items-center gap-2 text-[10px]">
                                <i className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: s.color }} />
                                <span className="text-zinc-300 flex-1 truncate">{s.label}</span>
                                <span className="text-zinc-500">{s.count}</span>
                                <span className="text-zinc-500 w-9 text-right">
                                    {Math.round((s.count / safeTotal) * 100)}%
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <button
                    type="button"
                    onClick={() => openDrawer({ type: "manage-categories" })}
                    className="mt-4 w-full text-center text-[10px] text-zinc-300 border border-neutral-700 rounded px-2.5 py-1.5 bg-neutral-800 hover:text-primary transition-colors"
                >
                    Manage Categories
                </button>
            </div>
        </Panel>
    );
}