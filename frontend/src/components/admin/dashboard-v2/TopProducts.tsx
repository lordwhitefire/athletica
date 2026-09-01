"use client";

import Panel from "./Panel";
import { useDashboardInteraction } from "./interaction-store";
import type { OverviewProduct } from "@/lib/actions/get-dashboard-overview";

export default function TopProducts({ products }: { products: OverviewProduct[] }) {
    const { openDrawer } = useDashboardInteraction();

    return (
        <Panel
            title="Top Performing Products"
            action={
                <button
                    type="button"
                    onClick={() => openDrawer({ type: "products" })}
                    className="text-[10px] text-zinc-400 hover:text-primary border border-neutral-700 rounded px-2.5 py-1.5 bg-neutral-800 transition-colors"
                >
                    View all
                </button>
            }
        >
            <div className="hidden md:grid grid-cols-[1fr_64px_64px_72px] px-4 py-2 text-[10px] text-zinc-500">
                <span>Product</span>
                <span>Clicks</span>
                <span>CTR</span>
                <span>Trend</span>
            </div>

            {products.length === 0 && (
                <p className="px-4 py-8 text-center text-xs text-zinc-500">No products yet</p>
            )}

            {products.map((p, i) => (
                <button
                    key={p._id}
                    type="button"
                    onClick={() => openDrawer({ type: "product", productId: p._id })}
                    className="w-full grid grid-cols-[1fr_64px_64px_72px] items-center px-4 py-2.5 border-t border-neutral-800/70 hover:bg-neutral-800/40 transition-colors text-left"
                >
                    <span className="flex items-center gap-3 min-w-0">
                        {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={p.imageUrl}
                                alt=""
                                className="w-9 h-9 rounded object-contain bg-zinc-800 flex-none"
                            />
                        ) : (
                            <span className="w-9 h-9 rounded bg-zinc-800 flex items-center justify-center text-zinc-600 text-sm flex-none">
                                ◇
                            </span>
                        )}
                        <span className="min-w-0">
                            <strong className="block text-[11px] text-zinc-200 truncate">{p.name}</strong>
                            <small className="block text-[9px] text-zinc-500 truncate">
                                {/^B0[A-Z0-9]{8}$/i.test(p.id) ? `ASIN: ${p.id}` : `ID: ${p.id || "—"}`}
                            </small>
                        </span>
                    </span>
                    <span className="text-[10px] text-zinc-300 hidden md:block">0</span>
                    <span className="text-[10px] text-zinc-300 hidden md:block">0%</span>
                    <svg className="w-[72px] h-6 hidden md:block" viewBox="0 0 90 30" preserveAspectRatio="none">
                        <polyline
                            points={`${i % 2 === 0 ? "0,24 90,24" : "0,26 90,26"}`}
                            fill="none"
                            stroke="#b7f52a"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            ))}
        </Panel>
    );
}