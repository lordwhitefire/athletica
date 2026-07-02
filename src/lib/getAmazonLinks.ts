import { cache } from "react";
import * as fs from "fs";
import * as path from "path";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";

const loadCachedLinks = cache(async (): Promise<Record<string, string>> => {
    const jsonPath = path.join(process.cwd(), "..", "data", "amazon-links.json");
    const raw = JSON.parse(await fs.promises.readFile(jsonPath, "utf-8"));
    const doc = raw["0"] ?? raw;
    const map: Record<string, string> = {};
    for (const entry of doc.links ?? []) {
        map[entry.productId] = entry.url;
    }
    return map;
});

export async function getAmazonLink(productId: string): Promise<ApiResult<string | null>> {
    try {
        const links = await loadCachedLinks();
        const link = links[productId];
        if (!link || link.trim() === "") {
            return ok(null);
        }
        return ok(link);
    } catch (err) {
        return fromCaughtError(err, "amazon_links_fetch_failed");
    }
}

export async function hasAmazonLink(productId: string): Promise<ApiResult<boolean>> {
    const result = await getAmazonLink(productId);
    if (result.error) return result;
    return ok(result.data !== null);
}

export async function getLinkedProductIds(): Promise<ApiResult<string[]>> {
    try {
        const links = await loadCachedLinks();
        const ids = Object.entries(links)
            .filter(([, link]) => link && link.trim() !== "")
            .map(([id]) => id);
        return ok(ids);
    } catch (err) {
        return fromCaughtError(err, "amazon_links_fetch_failed");
    }
}
