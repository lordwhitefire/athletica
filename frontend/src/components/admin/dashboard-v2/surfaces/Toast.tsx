"use client";

import { useDashboardInteraction } from "../interaction-store";

export default function Toast() {
    const { state, clearToast } = useDashboardInteraction();
    const toast = state.toast;

    if (!toast) return null;
    const isError = toast.tone === "error";

    return (
        <div
            role="status"
            className="fixed z-[90] bottom-4 inset-x-4 sm:left-auto sm:right-4 sm:w-96 bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl p-4 flex items-start gap-3"
        >
            <span
                className="material-symbols-outlined text-[18px] mt-0.5"
                style={{ color: isError ? "#ff7110" : "#b7f52a" }}
            >
                {isError ? "error" : "check_circle"}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">{toast.title}</p>
                {toast.message && <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{toast.message}</p>}
            </div>
            <button type="button" onClick={clearToast} aria-label="Dismiss notification" className="text-zinc-500 hover:text-white p-0.5">
                <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
        </div>
    );
}