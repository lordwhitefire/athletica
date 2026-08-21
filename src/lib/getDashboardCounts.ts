import { adminSupabase } from "@/lib/supabase/admin";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";

export interface DashboardCounts {
    productCount: number;
    brandCount: number;
    navCount: number;
    linkCount: number;
}

export async function getDashboardCounts(): Promise<ApiResult<DashboardCounts>> {
    try {
        const [productRes, brandRes, navRes, linkRes] = await Promise.all([
            adminSupabase.from("products").select("id", { count: "exact", head: true }),
            adminSupabase.from("brands").select("id", { count: "exact", head: true }),
            adminSupabase.from("navigation").select("id", { count: "exact", head: true }),
            adminSupabase
                .from("products")
                .select("id", { count: "exact", head: true })
                .not("asin", "is", null),
        ]);

        return ok({
            productCount: productRes.count ?? 0,
            brandCount: brandRes.count ?? 0,
            navCount: navRes.count ?? 0,
            linkCount: linkRes.count ?? 0,
        });
    } catch (err) {
        return fromCaughtError(err, "dashboard_counts_fetch_failed");
    }
}