"use client";

import { useState, useEffect, useCallback } from "react";
import { InteractionProvider, useDashboardInteraction } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import ProductCatalogInteractionLayer from "@/components/admin/product-catalog/ProductCatalogInteractionLayer";
import type { CatalogProduct } from "@/components/admin/product-catalog/product-catalog.interactions";
import "@/components/admin/product-catalog/product-catalog-interactions.css";
import {
    getCatalogProducts,
    getCatalogFacets,
    createCatalogProduct,
    updateCatalogProduct,
    deleteProduct,
    bulkSetProductStatus,
    bulkAssignCategory,
    bulkAssignBrand,
    bulkSetAsin,
    bulkDeleteProducts,
    exportProductMetadata,
    type CatalogFacets,
    type ProductQuery,
} from "@/lib/actions/products";

function pctOf(n: number, total: number): string {
    if (total <= 0) return "0%";
    return `${Math.round((n / total) * 1000) / 10}%`;
}

function downloadRows(rows: { name: string; sku: string }[]): void {
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `athletica-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

function KpiCards({ kpis }: { kpis: CatalogFacets["kpis"] }) {
    const total = kpis.total;
    const cards = [
        {
            icon: "inventory_2",
            label: "Total Products",
            value: total.toLocaleString(),
            note: kpis.createdThisMonth > 0 ? `↑ ${kpis.createdThisMonth} this month` : "0 this month",
            tone: "lime",
        },
        {
            icon: "check_circle",
            label: "Active Products",
            value: kpis.active.toLocaleString(),
            note: `${pctOf(kpis.active, total)} of total`,
            tone: "lime",
        },
        {
            icon: "block",
            label: "Unpublished",
            value: kpis.unpublished.toLocaleString(),
            note: `${pctOf(kpis.unpublished, total)} of total`,
            tone: "orange",
        },
        {
            icon: "link_off",
            label: "Missing Amazon ASIN",
            value: kpis.missingAsin.toLocaleString(),
            note: `${pctOf(kpis.missingAsin, total)} of total`,
            tone: "orange",
        },
        {
            icon: "image_not_supported",
            label: "Missing Images",
            value: kpis.missingImages.toLocaleString(),
            note: `${pctOf(kpis.missingImages, total)} of total`,
            tone: "orange",
        },
        {
            icon: "folder_off",
            label: "Missing Categories",
            value: kpis.missingCategories.toLocaleString(),
            note: `${pctOf(kpis.missingCategories, total)} of total`,
            tone: "orange",
        },
    ];

    return (
        <section className="kpis">
            {cards.map((card) => (
                <article key={card.label} className={`kpi${card.tone === "orange" ? " orange" : ""}`}>
                    <div className="kpi-top">
                        <div className="kpi-icon">
                            <span className="material-symbols-outlined">{card.icon}</span>
                        </div>
                        <div className="kpi-label">{card.label}</div>
                    </div>
                    <div className="kpi-value">{card.value}</div>
                    <div className={`kpi-meta ${card.tone}`}>{card.note}</div>
                </article>
            ))}
        </section>
    );
}

function MobileTopbar() {
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

function ProductsBody() {
    const [facets, setFacets] = useState<CatalogFacets | null>(null);
    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [error, setError] = useState<string | null>(null);

    const loadInitial = useCallback(async () => {
        const [facetsResult, productsResult] = await Promise.all([
            getCatalogFacets(),
            getCatalogProducts({}),
        ]);
        if (facetsResult.error) {
            setError(facetsResult.error.message);
            return;
        }
        if (productsResult.error) {
            setError(productsResult.error.message);
            return;
        }
        setFacets(facetsResult.data);
        setProducts(productsResult.data.items);
    }, []);

    useEffect(() => {
        loadInitial();
    }, [loadInitial]);

    const refetch = useCallback(async (query: ProductQuery = {}) => {
        const result = await getCatalogProducts(query);
        if (result.error) return;
        setProducts(result.data.items);
    }, []);

    const throwOnError = <T,>(result: { error: unknown }): void => {
        if (result.error) {
            throw new Error(
                (result.error as { message?: string }).message ?? "Action failed",
            );
        }
    };

    const refresh = useCallback(async () => {
        await refetch({});
    }, [refetch]);

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-sm text-red-400 mb-2">Failed to load product catalog.</p>
                <p className="text-xs text-zinc-500">{error}</p>
            </div>
        );
    }

    if (!facets) {
        return (
            <div className="p-6 space-y-4 animate-pulse">
                <div className="h-9 bg-neutral-800 rounded w-72" />
                <div className="kpis">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg h-[123px]" />
                    ))}
                </div>
                <div className="h-16 bg-neutral-900 border border-neutral-800 rounded-lg" />
            </div>
        );
    }

    return (
        <>
            <ProductCatalogInteractionLayer
                products={products}
                categories={facets.categories}
                brands={facets.brands}
                kpis={<KpiCards kpis={facets.kpis} />}
                onSearch={(query) => {
                    refetch({ search: query });
                }}
                onFilter={(filters) => {
                    refetch({
                        search: filters.search,
                        category: filters.category === "all" ? undefined : filters.category,
                        brand: filters.brand === "all" ? undefined : filters.brand,
                        status:
                            filters.status === "all"
                                ? undefined
                                : (filters.status as "published" | "unpublished"),
                        missingData:
                            filters.missingData === "all"
                                ? undefined
                                : (filters.missingData as "asin" | "image" | "category" | "none"),
                        sort: filters.sort,
                    });
                }}
                onCreateProduct={async (payload) => {
                    const result = await createCatalogProduct(payload);
                    throwOnError(result);
                    await refresh();
                }}
                onUpdateProduct={async (id, payload) => {
                    const result = await updateCatalogProduct(id, payload);
                    throwOnError(result);
                    await refresh();
                }}
                onDeleteProduct={async (id) => {
                    const result = await deleteProduct(id);
                    throwOnError(result);
                    await refresh();
                }}
                onBulkAction={async (action, ids, payload) => {
                    switch (action) {
                        case "publish":
                            throwOnError(await bulkSetProductStatus(ids, "published"));
                            break;
                        case "unpublish":
                            throwOnError(await bulkSetProductStatus(ids, "unpublished"));
                            break;
                        case "delete":
                            throwOnError(await bulkDeleteProducts(ids));
                            break;
                        case "assign-category":
                            throwOnError(
                                await bulkAssignCategory(ids, String(payload?.value ?? "")),
                            );
                            break;
                        case "assign-brand":
                            throwOnError(
                                await bulkAssignBrand(ids, String(payload?.value ?? "")),
                            );
                            break;
                        case "add-asin":
                            throwOnError(
                                await bulkSetAsin(ids, String(payload?.asin ?? "")),
                            );
                            break;
                        case "export":
                            throwOnError(await exportProductMetadata(ids));
                            break;
                    }
                    await refresh();
                }}
                onExport={async (ids) => {
                    const result = await exportProductMetadata(ids);
                    throwOnError(result);
                    if (result.data) downloadRows(result.data.rows);
                }}
            />
        </>
    );
}

export default function AdminProductsPage() {
    return (
        <InteractionProvider>
            <SpecSidebar />
            <MobileTopbar />
            <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64 max-[760px]:pt-14">
                <div data-catalog-page className="p-4 md:p-6">
                    <ProductsBody />
                </div>
            </div>
        </InteractionProvider>
    );
}