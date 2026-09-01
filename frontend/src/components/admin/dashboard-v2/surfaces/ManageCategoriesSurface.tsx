"use client";

import { useState } from "react";
import DrawerShell from "./DrawerShell";
import { useDashboardInteraction } from "../interaction-store";

export default function ManageCategoriesSurface({
    categories,
    total,
}: {
    categories: { label: string; count: number }[];
    total: number;
}) {
    const { closeDrawer, showToast } = useDashboardInteraction();
    const [query, setQuery] = useState("");
    const safeTotal = Math.max(1, total);

    const filtered = query.trim()
        ? categories.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()))
        : categories;

    return (
        <DrawerShell
            title="Manage Categories"
            description="Create, rename, and organize catalog categories."
            onClose={closeDrawer}
        >
            <div className="px-5 py-4 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded px-3 py-2">
                        <span className="material-symbols-outlined text-[16px] text-zinc-500">search</span>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search categories"
                            aria-label="Search categories"
                            className="w-full bg-transparent text-xs text-white placeholder-zinc-500 outline-none"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            showToast({
                                tone: "success",
                                title: "Create category",
                                message: "Category creation surface is ready.",
                            })
                        }
                        className="flex items-center gap-1 text-[10px] font-bold bg-[#b7f52a] text-black rounded px-3 py-2 hover:brightness-110 transition-all flex-none"
                    >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        New category
                    </button>
                </div>

                <ul className="space-y-2">
                    {filtered.length === 0 && (
                        <li className="py-8 text-center text-xs text-zinc-500">No categories match &quot;{query}&quot;</li>
                    )}
                    {filtered.map((c) => (
                        <li
                            key={c.label}
                            className="flex items-center gap-3 px-3 py-2.5 bg-neutral-800/50 border border-neutral-800 rounded"
                        >
                            <span className="material-symbols-outlined text-[16px] text-zinc-500 flex-none">folder</span>
                            <span className="min-w-0 flex-1">
                                <strong className="block text-[11px] text-zinc-300 truncate">{c.label}</strong>
                                <small className="block text-[9px] text-zinc-500">
                                    {c.count} products · {Math.round((c.count / safeTotal) * 100)}%
                                </small>
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    showToast({
                                        tone: "success",
                                        title: "Category editor",
                                        message: `${c.label} is ready for editing.`,
                                    })
                                }
                                aria-label={`Edit ${c.label}`}
                                className="text-zinc-400 border border-neutral-700 rounded p-2 hover:text-white transition-colors flex-none"
                            >
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </DrawerShell>
    );
}