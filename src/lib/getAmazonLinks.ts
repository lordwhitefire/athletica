import amazonLinksData from "@/data/amazon-links.json";

const amazonLinks = amazonLinksData as Record<string, string>;

export function getAmazonLink(productId: string): string | null {
    const link = amazonLinks[productId];
    if (!link || link.trim() === "") {
        return null;
    }
    return link;
}

export function hasAmazonLink(productId: string): boolean {
    return getAmazonLink(productId) !== null;
}

export function getLinkedProductIds(): string[] {
    return Object.entries(amazonLinks)
        .filter(([, link]) => link && link.trim() !== "")
        .map(([id]) => id);
}