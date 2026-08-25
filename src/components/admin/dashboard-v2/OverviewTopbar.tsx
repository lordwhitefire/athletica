"use client";

import { useDashboardInteraction } from "./interaction-store";
import PopoverShell from "./surfaces/PopoverShell";
import DatePopover from "./surfaces/DatePopover";

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function OverviewTopbar() {
  const { state, openPopover, closePopover, openMobileSidebar } = useDashboardInteraction();
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
      </div>
    </header>
  );
}
