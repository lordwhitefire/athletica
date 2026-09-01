"use client";

import Panel from "./Panel";
import PopoverShell from "./surfaces/PopoverShell";
import ChartRangePopover from "./surfaces/ChartRangePopover";
import { useDashboardInteraction } from "./interaction-store";

function Metric({ value, label, change }: { value: string; label: string; change: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <strong className="text-xl font-black text-white tracking-tight">{value}</strong>
            <span className="text-[10px] text-zinc-500">{label}</span>
            <span className="text-[9px] text-zinc-600">{change}</span>
        </div>
    );
}

function lastNDays(n: number): Date[] {
    const days: Date[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        days.push(d);
    }
    return days;
}

const dayLabel = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function ClicksChart({
    thisWeek,
    lastWeek,
}: {
    thisWeek: number[];
    lastWeek: number[];
}) {
    const { state, openPopover, closePopover } = useDashboardInteraction();
    const max = Math.max(1, ...thisWeek, ...lastWeek);
    const days = lastNDays(7);

    const toPoints = (values: number[], width: number, height: number) => {
        if (values.length === 0) return "";
        const step = width / (values.length - 1);
        return values
            .map((v, i) => `${(i * step).toFixed(1)},${(height - (v / max) * height).toFixed(1)}`)
            .join(" ");
    };

    const w = 620;
    const h = 174;
    const grid = [8, 48, 88, 128, 168];

    return (
        <Panel
            title="Amazon Clicks Overview"
            action={
                <div className="relative">
                    <button
                        type="button"
                        onClick={() =>
                            state.popover === "chart-range" ? closePopover() : openPopover("chart-range")
                        }
                        className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-zinc-300"
                        aria-haspopup="dialog"
                        aria-expanded={state.popover === "chart-range"}
                    >
                        <span>{state.chart.range}</span>
                        <span className="material-symbols-outlined text-[12px] text-zinc-500">expand_more</span>
                    </button>
                    {state.popover === "chart-range" && (
                        <PopoverShell onClose={closePopover}>
                            <ChartRangePopover />
                        </PopoverShell>
                    )}
                </div>
            }
        >
            <div className="px-4 pt-3 pb-2 flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <i className="w-2 h-2 rounded-full inline-block bg-[#b7f52a]" />
                    This Week
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <i className="w-2 h-2 rounded-full inline-block bg-[#4e9eea]" />
                    Last Week
                </span>
            </div>

            <div className="px-4 pb-2">
                <div className="flex gap-2">
                    <div className="flex flex-col justify-between py-0.5 w-6 flex-none text-right">
                        {grid.map((y, i) => (
                            <span key={y} className="text-[9px] text-zinc-600 leading-none">
                                {i === 0 && max > 1 ? `${Math.round(max)}` : "0"}
                            </span>
                        ))}
                    </div>
                    <div className="flex-1 min-w-0">
                        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-[174px] overflow-visible">
                            {grid.map((y) => (
                                <line key={y} x1="0" y1={y} x2={w} y2={y} stroke="rgba(255,255,255,.06)" />
                            ))}
                            <polyline
                                points={toPoints(lastWeek, w, h)}
                                fill="none"
                                stroke="#4e9eea"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <polyline
                                points={toPoints(thisWeek, w, h)}
                                fill="none"
                                stroke="#b7f52a"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <div className="flex justify-between mt-1">
                            {days.map((d, i) => (
                                <span key={i} className="text-[9px] text-zinc-600">
                                    {dayLabel(d)}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-neutral-800 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Metric value="0" label="Total Clicks" change="0% vs last 7 days" />
                <Metric value="0" label="Avg. Daily Clicks" change="0% vs last 7 days" />
                <Metric value="0" label="Unique Clicks" change="0% vs last 7 days" />
                <Metric value="0%" label="CTR" change="0% vs last 7 days" />
            </div>
        </Panel>
    );
}