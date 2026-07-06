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

// sanityCdnUrl is a pure string transform over a deterministic asset ref,
// so its result is safe to memoize for the lifetime of the process. The
// homepage editor calls this once per image per render (banners + every
// item in every section + every card), which previously meant hundreds of
// redundant string ops on each re-render. The cache keeps the produced
// URL strings referentially stable, which also prevents downstream
// preview components from re-rendering when nothing actually changed.
// See issues/homepage-editor-bugs.md bug #11.
const sanityCdnUrlCache = new Map<string, string>();

export function sanityCdnUrl(assetRef: string): string {
    const cached = sanityCdnUrlCache.get(assetRef);
    if (cached) return cached;

    const parts = assetRef.replace(/^image-/, "").split("-");
    const ext = parts.pop();
    const dims = parts.pop();
    const hash = parts.join("-");
    const url = `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${hash}-${dims}.${ext}`;
    sanityCdnUrlCache.set(assetRef, url);
    return url;
}
