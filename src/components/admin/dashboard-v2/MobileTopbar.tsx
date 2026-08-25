"use client";

import { useDashboardInteraction } from "./interaction-store";

export default function MobileTopbar() {
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
