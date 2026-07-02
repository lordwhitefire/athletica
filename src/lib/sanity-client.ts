import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

const PROJECT_ID = "cuiis46d";
const DATASET = "production";

export const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: "2025-01-01",
    useCdn: true,
    timeout: 20000,
});

const builder = createImageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
    return builder.image(source);
}

export function sanityCdnUrl(assetRef: string): string {
    const parts = assetRef.replace(/^image-/, "").split("-");
    const ext = parts.pop();
    const dims = parts.pop();
    const hash = parts.join("-");
    return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${hash}-${dims}.${ext}`;
}
