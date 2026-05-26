import { client } from "@/lib/sanity";

let cachedLinks: Record<string, string> | null = null;

export async function getAmazonLink(productId: string): Promise<string | null> {
    if (!cachedLinks) {
        const data = await client.fetch(`*[_type == "amazonLinks"][0]`);
        const linksArray = data?.links ?? [];
        cachedLinks = {};
        for (const entry of linksArray) {
            cachedLinks[entry.productId] = entry.url;
        }
    }
    const link = cachedLinks[productId];
    if (!link || link.trim() === "") {
        return null;
    }
    return link;
}

export async function hasAmazonLink(productId: string): Promise<boolean> {
    return (await getAmazonLink(productId)) !== null;
}

export async function getLinkedProductIds(): Promise<string[]> {
    if (!cachedLinks) {
        const data = await client.fetch(`*[_type == "amazonLinks"][0]`);
        const linksArray = data?.links ?? [];
        cachedLinks = {};
        for (const entry of linksArray) {
            cachedLinks[entry.productId] = entry.url;
        }
    }
    return Object.entries(cachedLinks)
        .filter(([, link]) => link && link.trim() !== "")
        .map(([id]) => id);
}
