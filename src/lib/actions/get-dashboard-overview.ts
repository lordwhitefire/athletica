"use server";

import { adminSupabase } from "@/lib/supabase/admin";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";
import {
    getProducts,
    getCachedCatalogStats,
    getCachedCategoryCounts,
} from "@/lib/products/product-service";
import type { ProductSummary } from "@/lib/products/types";

export interface OverviewProduct {
    _id: string;
    id: string;
    name: string;
    model: string;
    brand: string;
    category: string;
    imageUrl: string | null;
    price: number | null;
}

export interface OverviewIssueItem {
    _id: string;
    name: string;
    issue: "image" | "asin" | "category" | "duplicate" | "unpublished";
}

export interface DashboardOverview {
    counts: {
        products: number;
        active: number;
        drafts: number;
        brands: number;
        navigation: number;
        amazonLinks: number;
        createdThisMonth: number;
    };
    quality: {
        missingImages: number;
        missingAsin: number;
        missingCategories: number;
        duplicates: number;
    };
    clicks: {
        total: number;
        avgDaily: number;
        unique: number;
        ctr: number;
        thisWeek: number[];
        lastWeek: number[];
    };
    categories: { label: string; count: number }[];
    brands: { _id: string; name: string }[];
    recentProducts: OverviewProduct[];
    allProducts: OverviewProduct[];
    issueItems: OverviewIssueItem[];
}

function toOverviewProduct(p: ProductSummary): OverviewProduct {
    return {
        _id: p.id,
        id: p.id,
        name: p.name ?? p.model ?? "Unnamed",
        model: p.model ?? "",
        brand: p.brand?.name ?? "",
        category: p.category?.name ?? "",
        imageUrl: p.image_links?.[0] ?? null,
        price: typeof p.price === "number" ? p.price : null,
    };
}

export async function getDashboardOverview(): Promise<ApiResult<DashboardOverview>> {
    try {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [productsResult, stats, categoryCounts, brandRes, navRes, linkedRes, monthRes] =
            await Promise.all([
                getProducts({ page: 1, pageSize: 100, sort: "newest" }),
                getCachedCatalogStats(),
                getCachedCategoryCounts(),
                adminSupabase.from("brands").select("id, name").order("name"),
                adminSupabase.from("navigation").select("id", { count: "exact", head: true }),
                adminSupabase
                    .from("products")
                    .select("id", { count: "exact", head: true })
                    .not("asin", "is", null),
                adminSupabase
                    .from("products")
                    .select("id", { count: "exact", head: true })
                    .gte("created_at", monthStart.toISOString()),
            ]);

        const rawProducts = productsResult.items;

        const modelGroups = new Map<string, number>();
        for (const p of rawProducts) {
            if (!p.model) continue;
            const key = p.model.trim().toLowerCase();
            modelGroups.set(key, (modelGroups.get(key) ?? 0) + 1);
        }
        const duplicates = [...modelGroups.values()].filter((count) => count > 1).length;
        const duplicateModels = new Set(
            [...modelGroups.entries()].filter(([, count]) => count > 1).map(([key]) => key)
        );

        const allProducts: OverviewProduct[] = rawProducts.map(toOverviewProduct);
        const recentProducts = allProducts.slice(0, 5);

        const issueItems: OverviewIssueItem[] = [
            ...rawProducts.filter((p) => !p.image_links || p.image_links.length === 0).map((p) => ({ _id: p.id, name: p.name ?? p.model ?? "Unnamed", issue: "image" as const })),
            ...rawProducts.filter((p) => !p.asin).map((p) => ({ _id: p.id, name: p.name ?? p.model ?? "Unnamed", issue: "asin" as const })),
            ...rawProducts.filter((p) => !p.category).map((p) => ({ _id: p.id, name: p.name ?? p.model ?? "Unnamed", issue: "category" as const })),
            ...rawProducts
                .filter((p) => p.model && duplicateModels.has(p.model.trim().toLowerCase()))
                .map((p) => ({ _id: p.id, name: p.name ?? p.model ?? "Unnamed", issue: "duplicate" as const })),
            ...rawProducts
                .filter((p) => p.status === "unpublished")
                .map((p) => ({ _id: p.id, name: p.name ?? p.model ?? "Unnamed", issue: "unpublished" as const })),
        ].slice(0, 50);

        return ok({
            counts: {
                products: stats.total,
                active: stats.active,
                drafts: stats.unpublished,
                brands: brandRes.data?.length ?? 0,
                navigation: navRes.count ?? 0,
                amazonLinks: linkedRes.count ?? 0,
                createdThisMonth: monthRes.count ?? 0,
            },
            quality: {
                missingImages: stats.missingImages,
                missingAsin: stats.missingAsin,
                missingCategories: stats.missingCategories,
                duplicates,
            },
            clicks: {
                total: 0,
                avgDaily: 0,
                unique: 0,
                ctr: 0,
                thisWeek: [0, 0, 0, 0, 0, 0, 0],
                lastWeek: [0, 0, 0, 0, 0, 0, 0],
            },
            categories: categoryCounts
                .map((c) => ({ label: c.name, count: c.count }))
                .sort((a, b) => b.count - a.count),
            brands: (brandRes.data ?? []).map((b) => ({ _id: b.id, name: b.name })),
            recentProducts,
            allProducts,
            issueItems,
        });
    } catch (err) {
        return fromCaughtError(err, "dashboard_overview_fetch_failed");
    }
}