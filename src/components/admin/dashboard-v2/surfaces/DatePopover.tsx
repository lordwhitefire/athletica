"use client";

import { useState } from "react";
import { useDashboardInteraction } from "../interaction-store";

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtFull = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function startOfWeek(d: Date): Date {
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function rangePresets() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const thisWeekStart = startOfWeek(today);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
    const last30 = new Date(today);
    last30.setDate(today.getDate() - 29);
    return [
        { label: "Today", start: today, end: today },
        { label: "Yesterday", start: yesterday, end: yesterday },
        { label: "This week", start: thisWeekStart, end: today },
        { label: "Last week", start: lastWeekStart, end: lastWeekEnd },
        { label: "Last 30 days", start: last30, end: today },
    ];
}

export default function DatePopover() {
    const { state, setDateRange, closePopover } = useDashboardInteraction();
    const presets = rangePresets();
    const sameRange = (a: Date, b: Date) => a.getTime() === b.getTime();
    const [selected, setSelected] = useState(
        presets.find((p) => sameRange(p.start, state.dateRange.start) && sameRange(p.end, state.dateRange.end))
            ?.label ?? null
    );

    return (
        <div>
            <div className="px-4 py-2.5 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-neutral-700">
                Date range
            </div>

            <div className="max-h-56 overflow-y-auto">
                {presets.map((p) => (
                    <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                            setSelected(p.label);
                            setDateRange(p.start, p.end);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors ${
                            selected === p.label
                                ? "bg-neutral-700 text-white"
                                : "text-zinc-300 hover:bg-neutral-700"
                        }`}
                    >
                        <span>{p.label}</span>
                        <span className="flex items-center gap-2 text-[10px] text-zinc-500">
                            {fmt(p.start)} – {fmt(p.end)}
                            {selected === p.label && (
                                <span className="material-symbols-outlined text-[14px] text-[#b7f52a]">
                                    check
                                </span>
                            )}
                        </span>
                    </button>
                ))}
            </div>

            <div className="px-4 py-3 border-t border-neutral-700">
                <span className="block text-[9px] uppercase tracking-wider text-zinc-500">Selected period</span>
                <strong className="block text-[11px] text-zinc-200 mt-0.5">
                    {fmtFull(state.dateRange.start)} – {fmtFull(state.dateRange.end)}
                </strong>
            </div>

            <div className="px-4 py-2.5 border-t border-neutral-700 flex justify-end">
                <button
                    type="button"
                    onClick={closePopover}
                    className="text-[11px] font-bold text-[#b7f52a] hover:brightness-110"
                >
                    Done
                </button>
            </div>
        </div>
    );
}