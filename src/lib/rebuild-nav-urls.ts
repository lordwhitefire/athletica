import type { NavItem } from "@/types/navigation";

export function slugify(text: string): string {
    return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function generateId(): string {
    return Math.random().toString(36).substring(2, 8);
}

export function rebuildNavUrls(items: NavItem[], parentIds: string[] = []): NavItem[] {
    return items.map((item) => {
        const itemId = item.id || generateId();
        const segments = [...parentIds, itemId];
        const href = `/en/${segments.join("/")}`;

        return {
            ...item,
            id: itemId,
            href,
            children: item.children ? rebuildNavUrls(item.children, segments) : item.children,
        };
    });
}

export function hasCorrectUrls(items: NavItem[], parentIds: string[] = []): boolean {
    for (const item of items) {
        const itemId = item.id || "";
        const segments = [...parentIds, itemId];
        const expectedHref = `/en/${segments.join("/")}`;
        if (item.href !== expectedHref) return false;
        if (item.children && !hasCorrectUrls(item.children, segments)) return false;
    }
    return true;
}
