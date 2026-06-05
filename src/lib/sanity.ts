import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

export const client = createClient({
    projectId: "cuiis46d",
    dataset: "production",
    apiVersion: "2025-01-01",
    useCdn: true,
});

const builder = createImageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
    return builder.image(source);
}

export async function getSiteLogoUrl(): Promise<string | null> {
    try {
        const doc = await client.fetch(`*[_type == "siteSettings"][0]{site_logo}`);
        const logo = doc?.site_logo;
        if (!logo) return null;
        return urlFor(logo as SanityImageSource).width(200).url();
    } catch {
        return null;
    }
}
