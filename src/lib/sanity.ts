import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail } from "@/lib/api-types";

export const client = createClient({
    projectId: "cuiis46d",
    dataset: "production",
    apiVersion: "2025-01-01",
    useCdn: true,
    timeout: 10000,
});

const builder = createImageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
    return builder.image(source);
}

export async function getSiteLogoUrl(): Promise<ApiResult<string | null>> {
    try {
        const doc = await client.fetch(`*[_type == "siteSettings"][0]{site_logo}`);
        const logo = doc?.site_logo;
        if (!logo) return ok(null);
        return ok(urlFor(logo as SanityImageSource).width(1000).url());
    } catch {
        return fail("api_error", "logo_fetch_failed", "Failed to fetch site logo.");
    }
}
