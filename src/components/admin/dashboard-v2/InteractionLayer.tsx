"use client";

import { useEffect } from "react";
import { useDashboardInteraction } from "./interaction-store";
import ProductDrawer from "./surfaces/ProductDrawer";
import ProductsSurface from "./surfaces/ProductsSurface";
import ActivitySurface from "./surfaces/ActivitySurface";
import TaskSurface from "./surfaces/TaskSurface";
import TasksSurface from "./surfaces/TasksSurface";
import CategoriesSurface from "./surfaces/CategoriesSurface";
import ManageCategoriesSurface from "./surfaces/ManageCategoriesSurface";
import RouteSurface from "./surfaces/RouteSurface";
import Toast from "./surfaces/Toast";
import type { DashboardOverview } from "@/lib/actions/get-dashboard-overview";

export default function InteractionLayer({ data }: { data: DashboardOverview }) {
    const { state, closePopover, closeDrawer } = useDashboardInteraction();

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (state.popover) closePopover();
            else if (state.drawer) closeDrawer();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [state.popover, state.drawer, closePopover, closeDrawer]);

    const quality = {
        missingImages: data.quality.missingImages,
        missingAsin: data.quality.missingAsin,
        missingCategories: data.quality.missingCategories,
        duplicates: data.quality.duplicates,
        unpublished: data.counts.drafts,
    };

    return (
        <>
            {state.drawer?.type === "product" && (
                <ProductDrawer
                    product={
                        data.allProducts.find((p) => p._id === state.drawer?.productId) ?? data.allProducts[0]
                    }
                />
            )}

            {state.drawer?.type === "products" && <ProductsSurface products={data.allProducts} />}

            {state.drawer?.type === "activity" && <ActivitySurface />}

            {state.drawer?.type === "task" && state.drawer.issue && (
                <TaskSurface
                    issue={state.drawer.issue}
                    count={
                        (state.drawer.issue === "unpublished"
                            ? quality.unpublished
                            : quality[state.drawer.issue as keyof typeof quality]) ?? 0
                    }
                />
            )}

            {state.drawer?.type === "tasks" && <TasksSurface counts={quality} />}

            {state.drawer?.type === "categories" && (
                <CategoriesSurface categories={data.categories} total={data.counts.products} />
            )}

            {state.drawer?.type === "manage-categories" && (
                <ManageCategoriesSurface categories={data.categories} total={data.counts.products} />
            )}

            {state.drawer?.type === "route" && state.drawer.route && (
                <RouteSurface route={state.drawer.route} />
            )}

            <Toast />
        </>
    );
}