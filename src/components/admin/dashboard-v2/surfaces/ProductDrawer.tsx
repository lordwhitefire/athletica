"use client";

import DrawerShell from "./DrawerShell";
import { useDashboardInteraction } from "../interaction-store";
import type { OverviewProduct } from "@/lib/actions/get-dashboard-overview";

function ProductThumb({ imageUrl, name }: { imageUrl: string | null; name: string }) {
    return imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="w-14 h-14 rounded object-contain bg-zinc-800 flex-none" />
    ) : (
        <span className="w-14 h-14 rounded bg-zinc-800 flex items-center justify-center text-zinc-600 text-base flex-none">
            ◇
        </span>
    );
}

export default function ProductDrawer({ product }: { product: OverviewProduct }) {
    const { closeDrawer, showToast } = useDashboardInteraction();
    const asin = product.id || "—";

    return (
        <DrawerShell
            title="Product details"
            description="Catalog and affiliate performance"
            onClose={closeDrawer}
        >
            <div className="px-5 py-5 space-y-5">
                <div className="flex items-center gap-4">
                    <ProductThumb imageUrl={product.imageUrl} name={product.name} />
                    <div className="min-w-0">
                        <span className="block text-[9px] uppercase tracking-wider text-zinc-500">PRODUCT</span>
                        <h3 className="text-sm font-bold text-white mt-0.5">{product.name}</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                            {product.brand || "—"} · {product.category || "—"}
                        </p>
                    </div>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-neutral-800/50 border border-neutral-800 rounded p-3">
                        <dt className="text-[9px] uppercase tracking-wider text-zinc-500">ASIN</dt>
                        <dd className="text-zinc-200 mt-1 truncate">{asin}</dd>
                    </div>
                    <div className="bg-neutral-800/50 border border-neutral-800 rounded p-3">
                        <dt className="text-[9px] uppercase tracking-wider text-zinc-500">Status</dt>
                        <dd className="text-[#b7f52a] mt-1">Active</dd>
                    </div>
                    <div className="bg-neutral-800/50 border border-neutral-800 rounded p-3">
                        <dt className="text-[9px] uppercase tracking-wider text-zinc-500">Clicks</dt>
                        <dd className="text-zinc-200 mt-1">0</dd>
                    </div>
                    <div className="bg-neutral-800/50 border border-neutral-800 rounded p-3">
                        <dt className="text-[9px] uppercase tracking-wider text-zinc-500">CTR</dt>
                        <dd className="text-zinc-200 mt-1">0%</dd>
                    </div>
                </dl>

                <div>
                    <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Actions</h3>
                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() =>
                                showToast({
                                    tone: "success",
                                    title: "Edit opened",
                                    message: `${product.name} is ready for editing.`,
                                })
                            }
                            className="w-full flex items-center justify-between px-4 py-3 bg-neutral-800/50 border border-neutral-800 rounded hover:bg-neutral-800 transition-colors text-left"
                        >
                            <span className="text-xs text-zinc-300">Edit product</span>
                            <span className="material-symbols-outlined text-[16px] text-zinc-500">chevron_right</span>
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                showToast({
                                    tone: "success",
                                    title: "Amazon destination",
                                    message: `Affiliate destination prepared for ${asin}.`,
                                })
                            }
                            className="w-full flex items-center justify-between px-4 py-3 bg-neutral-800/50 border border-neutral-800 rounded hover:bg-neutral-800 transition-colors text-left"
                        >
                            <span className="text-xs text-zinc-300">Open Amazon destination</span>
                            <span className="material-symbols-outlined text-[16px] text-zinc-500">chevron_right</span>
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                showToast({
                                    tone: "error",
                                    title: "Delete confirmation required",
                                    message: "The product was not deleted.",
                                })
                            }
                            className="w-full flex items-center justify-between px-4 py-3 bg-neutral-800/50 border border-neutral-800 rounded hover:bg-neutral-800 transition-colors text-left"
                        >
                            <span className="text-xs text-zinc-300">Delete product</span>
                            <span className="material-symbols-outlined text-[16px] text-zinc-500">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </DrawerShell>
    );
}