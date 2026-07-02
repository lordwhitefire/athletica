"use server";

import { adminClient } from "@/lib/admin-sanity";
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
        const [productCount, products, brandCount, brands, navCount, navs, linkCount, homepage] =
            await Promise.all([
                adminClient.fetch(`count(*[_type == "product"])`),
                adminClient.fetch(`*[_type == "product"] | order(_createdAt desc) [0...5] { name, _id }`),
                adminClient.fetch(`count(*[_type == "brand"])`),
                adminClient.fetch(`*[_type == "brand"] { name, "logo": logo.asset->_id } [0...8]`),
                adminClient.fetch(`count(*[_type == "navigation"])`),
                adminClient.fetch(`*[_type == "navigation"] { title } [0...3]`),
                adminClient.fetch(`count(*[_type == "amazonLinks"])`),
                adminClient.fetch(`*[_type == "homepage"][0] { "sections": count(sections), "banners": count(hero_carousel.banners) }`),
            ]);

        return ok({
            products: { count: productCount as number, recent: products as { name: string; _id: string }[] },
            brands: { count: brandCount as number, items: brands as { name: string; logo: string | null }[] },
            navigation: { count: navCount as number, items: navs as { title: string }[] },
            amazonLinks: { count: linkCount as number },
            homepage: {
                sections: (homepage as Record<string, number>)?.sections || 0,
                banners: (homepage as Record<string, number>)?.banners || 0,
            },
        });
    } catch (err) {
        return fromCaughtError(err, "dashboard_preview_fetch_failed");
    }
}
