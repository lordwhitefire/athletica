import { client } from "@/lib/sanity";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";

let cachedLinks: Record<string, string> | null = null;

async function loadCachedLinks(): Promise<ApiResult<void>> {
    if (cachedLinks) return ok(undefined);
    try {
        const data = await client.fetch(`*[_type == "amazonLinks"][0]`);
        const linksArray = data?.links ?? [];
        cachedLinks = {};
        for (const entry of linksArray) {
            cachedLinks[entry.productId] = entry.url;
        }
        return ok(undefined);
    } catch (err) {
        return fromCaughtError(err, "amazon_links_fetch_failed");
    }
}

export async function getAmazonLink(productId: string): Promise<ApiResult<string | null>> {
    const loadResult = await loadCachedLinks();
    if (loadResult.error) return loadResult;
    const link = cachedLinks![productId];
    if (!link || link.trim() === "") {
        return ok(null);
    }
    return ok(link);
}

export async function hasAmazonLink(productId: string): Promise<ApiResult<boolean>> {
    const result = await getAmazonLink(productId);
    if (result.error) return result;
    return ok(result.data !== null);
}

export async function getLinkedProductIds(): Promise<ApiResult<string[]>> {
    const loadResult = await loadCachedLinks();
    if (loadResult.error) return loadResult;
    const ids = Object.entries(cachedLinks!)
        .filter(([, link]) => link && link.trim() !== "")
        .map(([id]) => id);
    return ok(ids);
}
