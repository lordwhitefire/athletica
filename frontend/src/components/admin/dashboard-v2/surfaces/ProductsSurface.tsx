"use client";

import { useState } from "react";
import DrawerShell from "./DrawerShell";
import { useDashboardInteraction } from "../interaction-store";
import type { OverviewProduct } from "@/lib/actions/get-dashboard-overview";

export default function ProductsSurface({ products }: { products: OverviewProduct[] }) {
    const { closeDrawer, openDrawer } = useDashboardInteraction();
    const [query, setQuery] = useState("");

    const filtered = query.trim()
        ? products.filter((p) =>
              [p.name, p.model, p.brand, p.category, p.id]
                  .join(" ")
                  .toLowerCase()
                  .includes(query.trim().toLowerCase())
          )
        : products;

    return (
        <DrawerShell
            title="Top Performing Products"
            description="All products currently represented by the dashboard performance view."
            onClose={closeDrawer}
        >
            <div className="px-5 py-4">
                <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded px-3 py-2">
                    <span className="material-symbols-outlined text-[16px] text-zinc-500">search</span>
                    <input
                        type="text"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search products"
                        aria-label="Search products"
                        className="w-full bg-transparent text-xs text-white placeholder-zinc-500 outline-none"
                    />
                </div>
            </div>
            <ul>
                {filtered.length === 0 && (
                    <li className="px-5 py-10 flex flex-col items-center justify-center text-center gap-2">
                        <span className="material-symbols-outlined text-2xl text-zinc-600">search</span>
                        <strong className="text-xs text-zinc-300">No products found</strong>
                        <span className="text-[10px] text-zinc-500">Try another product name, brand, or ASIN.</span>
                    </li>
                )}
                {filtered.map((p) => (
                    <li key={p._id}>
                        <button
                            type="button"
                            onClick={() => openDrawer({ type: "product", productId: p._id })}
                            className="w-full flex items-center gap-3 px-5 py-3 border-t border-neutral-800/70 hover:bg-neutral-800/40 transition-colors text-left"
                        >
                            {p.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.imageUrl} alt="" className="w-9 h-9 rounded object-contain bg-zinc-800 flex-none" />
                            ) : (
                                <span className="w-9 h-9 rounded bg-zinc-800 flex items-center justify-center text-zinc-600 text-sm flex-none">◇</span>
                            )}
                            <span className="min-w-0 flex-1">
                                <strong className="block text-[11px] text-zinc-200 truncate">{p.name}</strong>
                                <small className="block text-[9px] text-zinc-500 truncate">
                                    {p.brand || "—"} · ASIN {p.id || "—"}
                                </small>
                            </span>
                            <span className="text-right flex-none">
                                <strong className="block text-[11px] text-zinc-200">0</strong>
                                <small className="block text-[9px] text-zinc-500">0%</small>
                            </span>
                            <span className="material-symbols-outlined text-[16px] text-zinc-600">chevron_right</span>
                        </button>
                    </li>
                ))}
            </ul>
        </DrawerShell>
    );
}