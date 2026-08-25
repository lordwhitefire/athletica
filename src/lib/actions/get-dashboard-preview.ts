"use server";

import { adminSupabase } from "@/lib/supabase/admin";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";

export interface DashboardPreview {
    products: {
        count: number;
        recent: { name: string; _id: string }[];
    };
    brands: {
        count: number;
        items: { name: string; logo: string | null }[];
    };
    navigation: {
        count: number;
        items: { title: string }[];
    };
    amazonLinks: {
        count: number;
    };
    homepage: {
        sections: number;
        banners: number;
    };
}

export async function getDashboardPreview(): Promise<ApiResult<DashboardPreview>> {
    try {
        const [productRes, brandsRes, navRes, linkRes, homepageRes] =
            await Promise.all([
                adminSupabase
                    .from("products")
                    .select("id, name")
                    .order("created_at", { ascending: false })
                    .limit(5),
                adminSupabase.from("brands").select("name, logo_link").order("name").limit(8),
                adminSupabase.from("navigation").select("label").order("order").limit(3),
                adminSupabase
                    .from("products")
                    .select("id", { count: "exact", head: true })
                    .not("asin", "is", null),
                adminSupabase.from("homepage_sections").select("type"),
            ]);

        const { count: productCount } = await adminSupabase
            .from("products")
            .select("id", { count: "exact", head: true });

        // FR4-B: failed reads must surface as an error, never as zeroed widgets.
        for (const [name, res] of [
            ["products", productRes],
            ["brands", brandsRes],
            ["navigation", navRes],
            ["amazon_links", linkRes],
            ["homepage", homepageRes],
        ] as const) {
            if (res.error) {
                throw new Error(`dashboard_preview_${name}_failed: ${res.error.message}`);
            }
        }

        return ok({
            products: {
                count: productCount ?? 0,
                recent: (productRes.data ?? []).map((p) => ({ name: p.name ?? "", _id: p.id })),
            },
            brands: {
                count: brandsRes.data?.length ?? 0,
                items: (brandsRes.data ?? []).map((b) => ({ name: b.name, logo: b.logo_link })),
            },
            navigation: {
                count: navRes.data?.length ?? 0,
                items: (navRes.data ?? []).map((n) => ({ title: n.label })),
            },
            amazonLinks: { count: linkRes.count ?? 0 },
            homepage: {
                sections: homepageRes.data?.length ?? 0,
                banners:
                    homepageRes.data?.filter((s) => s.type === "banner" || s.type === "hero").length ?? 0,
            },
        });
    } catch (err) {
        return fromCaughtError(err, "dashboard_preview_fetch_failed");
    }
}