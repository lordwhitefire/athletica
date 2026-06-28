import { adminClient } from "@/lib/admin-sanity";
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
        const [productCount, brandCount, navCount, linkCount] = await Promise.all([
            adminClient.fetch(`count(*[_type == "product"])`, {}, { signal: AbortSignal.timeout(20000) }),
            adminClient.fetch(`count(*[_type == "brand"])`, {}, { signal: AbortSignal.timeout(20000) }),
            adminClient.fetch(`count(*[_type == "navigation"])`, {}, { signal: AbortSignal.timeout(20000) }),
            adminClient.fetch(`count(*[_type == "amazonLinks"])`, {}, { signal: AbortSignal.timeout(20000) }),
        ]);

        return ok({ productCount, brandCount, navCount, linkCount });
    } catch (err) {
        return fromCaughtError(err, "dashboard_counts_fetch_failed");
    }
}
