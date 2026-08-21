"use client";

import { useState, useEffect, useCallback } from "react";
import { InteractionProvider, useDashboardInteraction } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import BulkImportInteractionLayer from "@/components/admin/bulk-import/BulkImportInteractionLayer";
import type { CatalogProduct } from "@/components/admin/product-catalog/product-catalog.interactions";
import {
    getCatalogProducts,
    getImportValidationData,
    type ImportValidationData,
} from "@/lib/actions/products";

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

function ImportBody() {
    const [validation, setValidation] = useState<ImportValidationData | null>(null);
    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [error, setError] = useState<string | null>(null);

    const loadInitial = useCallback(async () => {
        const [validationResult, productsResult] = await Promise.all([
            getImportValidationData(),
            getCatalogProducts({}),
        ]);
        if (validationResult.error) {
            setError(validationResult.error.message);
            return;
        }
        if (productsResult.error) {
            setError(productsResult.error.message);
            return;
        }
        setValidation(validationResult.data);
        setProducts(productsResult.data.items);
    }, []);

    useEffect(() => {
        loadInitial();
    }, [loadInitial]);

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-sm text-red-400 mb-2">Failed to load the import center.</p>
                <p className="text-xs text-zinc-500">{error}</p>
            </div>
        );
    }

    if (!validation) {
        return (
            <div className="p-6 space-y-4 animate-pulse">
                <div className="h-9 bg-neutral-800 rounded w-72" />
                <div className="h-16 bg-neutral-900 border border-neutral-800 rounded-lg" />
                <div className="h-40 bg-neutral-900 border border-neutral-800 rounded-lg" />
            </div>
        );
    }

    return <BulkImportInteractionLayer products={products} validation={validation} />;
}

export default function AdminImportCenterPage() {
    return (
        <InteractionProvider>
            <SpecSidebar />
            <MobileTopbar />
            <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64 max-[760px]:pt-14">
                <div data-import-center className="p-4 md:p-6">
                    <ImportBody />
                </div>
            </div>
        </InteractionProvider>
    );
}
