"use client";

import { useDashboardInteraction } from "../interaction-store";

const options: ("Daily" | "Weekly" | "Monthly")[] = ["Daily", "Weekly", "Monthly"];

export default function ChartRangePopover() {
    const { state, setChartRange, closePopover } = useDashboardInteraction();
    return (
        <div>
            {options.map((o) => (
                <button
                    key={o}
                    type="button"
                    onClick={() => setChartRange(o)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors ${
                        state.chart.range === o
                            ? "bg-neutral-700 text-white"
                            : "text-zinc-300 hover:bg-neutral-700"
                    }`}
                >
                    <span>{o}</span>
                    {state.chart.range === o && (
                        <span className="material-symbols-outlined text-[14px] text-[#b7f52a]">check</span>
                    )}
                </button>
            ))}
            <button
                type="button"
                onClick={closePopover}
                className="w-full px-4 py-2.5 text-xs text-zinc-400 hover:bg-neutral-700 hover:text-white text-left transition-colors border-t border-neutral-700"
            >
                Cancel
            </button>
        </div>
    );
}