"use client";

import DrawerShell from "./DrawerShell";
import { useDashboardInteraction } from "../interaction-store";
import { taskMetaById } from "../meta";

export default function TaskSurface({ issue, count }: { issue: string; count: number }) {
    const { closeDrawer, navigate, openDrawer, showToast } = useDashboardInteraction();
    const meta = taskMetaById(issue);

    if (!meta) return null;

    const action = () => {
        navigate(meta.navigateTo);
        openDrawer({ type: "route", route: meta.navigateTo });
        if (meta.toast) {
            showToast({ tone: "success", title: meta.toast.title, message: meta.toast.message });
        }
    };

    return (
        <DrawerShell
            title={meta.title}
            description={`${count} products require attention.`}
            onClose={closeDrawer}
        >
            <div className="px-5 py-5 space-y-5">
                <div
                    className="rounded-lg px-5 py-6 text-center"
                    style={{ backgroundColor: "rgba(255,113,16,.06)", border: "1px solid rgba(255,113,16,.2)" }}
                >
                    <strong className="block text-3xl font-black text-white">{count}</strong>
                    <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mt-1">
                        affected products
                    </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{meta.description}</p>

                <div>
                    <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Next action</h3>
                    <button
                        type="button"
                        onClick={action}
                        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-800/50 border border-neutral-800 rounded hover:bg-neutral-800 transition-colors text-left"
                    >
                        <span className="text-xs text-zinc-300">Open affected products</span>
                        <span className="material-symbols-outlined text-[16px] text-zinc-500">chevron_right</span>
                    </button>
                </div>
            </div>
        </DrawerShell>
    );
}