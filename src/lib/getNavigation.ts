import { client } from "@/lib/sanity";
import type { NavigationData, NavItem } from "@/types/navigation";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";

let cachedNavigation: NavigationData[] | null = null;

const BRAND_PREFIXES = [
    "Adidas", "adidas", "Nike", "Puma", "New Balance",
    "Mizuno", "Joma", "Kelme", "Lotto", "Munich", "Diadora",
    "G-Form", "Macron",
];

function slugify(text: string): string {
    return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function getSegment(label: string, level: number): string {
    if (level === 1 || level === 0) return slugify(label);

    let name = label.replace(/\b(Football Boots?|Boots?|Shoes?|Gloves?)\b/gi, "").trim();

    for (const brand of BRAND_PREFIXES) {
        if (name.toLowerCase() === brand.toLowerCase()) {
            return slugify(brand);
        }
    }

    for (const brand of BRAND_PREFIXES) {
        if (name.toLowerCase().startsWith(brand.toLowerCase())) {
            name = name.slice(brand.length).trim();
            break;
        }
    }

    if (!name) {
        const MULTI_WORD = ["New Balance"];
        for (const brand of MULTI_WORD) {
            if (label.toLowerCase().startsWith(brand.toLowerCase())) return slugify(brand);
        }
        return slugify(label.split(" ")[0]);
    }

    return slugify(name);
}

function setHierarchicalHref(target: { level: number; label: string; href?: string | null }, ancestorSegments: string[]): string {
    const segment = getSegment(target.label, target.level);
    const segments = [...ancestorSegments, segment];
    const href = `/en/${segments.join("/")}`;
    if (target.href !== undefined) {
        (target as Record<string, unknown>).href = href;
    }
    return href;
}

function applyHierarchicalHrefs(items: NavItem[], ancestorSegments: string[]): void {
    for (const child of items) {
        if (child.disabled) continue;
        const href = setHierarchicalHref(child, ancestorSegments);
        if (child.children && child.children.length > 0) {
            const segments = href.replace(/^\/en\//, "").split("/");
            applyHierarchicalHrefs(child.children, segments);
        }
    }
}

function computeHierarchicalHrefs(data: NavigationData[]): NavigationData[] {
    for (const group of data) {
        if (group.level === 0) {
            if (group.children && group.children.length > 0) {
                for (const child of group.children) {
                    const href = setHierarchicalHref(child, []);
                    if (child.children && child.children.length > 0) {
                        const segments = href.replace(/^\/en\//, "").split("/");
                        applyHierarchicalHrefs(child.children, segments);
                    }
                }
            }
        } else {
            const href = setHierarchicalHref(group, []);
            if (group.children && group.children.length > 0) {
                const segments = href.replace(/^\/en\//, "").split("/");
                applyHierarchicalHrefs(group.children, segments);
            }
        }
    }
    return data;
}

export async function getNavigation(): Promise<ApiResult<NavigationData[]>> {
    if (cachedNavigation) return ok(cachedNavigation);
    try {
        const data = await client.fetch(`*[_type == "navigation"][0]`);
        cachedNavigation = computeHierarchicalHrefs((data?.items ?? []) as NavigationData[]);
        return ok(cachedNavigation);
    } catch (err) {
        return fromCaughtError(err, "navigation_fetch_failed");
    }
}

export async function getNavItemBySlug(slug: string): Promise<ApiResult<NavigationData | undefined>> {
    const result = await getNavigation();
    if (result.error) return result;
    return ok(result.data.find((n) => n.slug === slug));
}

export function flattenNavigation(items: NavItem[]): NavItem[] {
    return items.reduce<NavItem[]>((acc, item) => {
        acc.push(item);
        if (item.children && item.children.length > 0) {
            acc.push(...flattenNavigation(item.children));
        }
        return acc;
    }, []);
}

export async function findNavItemByHref(href: string): Promise<ApiResult<NavItem | undefined>> {
    const result = await getNavigation();
    if (result.error) return result;
    const allItems = result.data.flatMap((n) =>
        flattenNavigation(n.children || [])
    );
    return ok(allItems.find((item) => item.href === href));
}

export async function getBreadcrumbs(href: string): Promise<ApiResult<NavItem[]>> {
    const result = await getNavigation();
    if (result.error) return result;
    const nav = result.data;
    const breadcrumbs: NavItem[] = [];

    function searchTree(items: NavItem[], targetHref: string): boolean {
        for (const item of items) {
            if (item.href === targetHref) {
                breadcrumbs.push(item);
                return true;
            }
            if (item.children && item.children.length > 0) {
                if (searchTree(item.children, targetHref)) {
                    breadcrumbs.unshift(item);
                    return true;
                }
            }
        }
        return false;
    }

    nav.forEach((n) => {
        if (n.children) {
            searchTree(n.children, href);
        }
    });

    return ok(breadcrumbs);
}

export interface ModelNavNode {
    label: string;
    children: ModelNavNode[];
}

export async function getModelNavTree(): Promise<ApiResult<ModelNavNode[]>> {
    const result = await getNavigation();
    if (result.error) return result;
    const nav = result.data;

    const brandPrefixes = [
        "Adidas", "adidas", "Nike", "Puma", "New Balance",
        "Mizuno", "Joma", "Kelme", "Lotto", "Munich", "Diadora",
        "G-Form", "Macron",
    ];

    function extractKeyword(label: string): string {
        let result = label;
        for (const brand of brandPrefixes) {
            if (result.toLowerCase().startsWith(brand.toLowerCase())) {
                result = result.slice(brand.length).trim();
                break;
            }
        }
        result = result.replace(/\b(Football Boots?|Boots?|Shoes?|Gloves?)\b/gi, "").trim();
        return result;
    }

    function buildTree(items: NavItem[]): ModelNavNode[] {
        const nodes: ModelNavNode[] = [];
        for (const item of items) {
            if (item.level < 3) {
                if (item.children) {
                    nodes.push(...buildTree(item.children));
                }
                continue;
            }
            const label = extractKeyword(item.label);
            if (!label) continue;
            nodes.push({
                label,
                children: item.children ? buildTree(item.children) : [],
            });
        }
        return nodes;
    }

    const rawNodes: ModelNavNode[] = [];
    for (const group of nav) {
        if (group.children) {
            rawNodes.push(...buildTree(group.children));
        }
    }

    const merged = new Map<string, ModelNavNode>();
    for (const node of rawNodes) {
        if (merged.has(node.label)) {
            const existing = merged.get(node.label)!;
            for (const child of node.children) {
                if (!existing.children.find((c) => c.label === child.label)) {
                    existing.children.push(child);
                }
            }
        } else {
            merged.set(node.label, { label: node.label, children: [...node.children] });
        }
    }

    return ok([...merged.values()]);
}
