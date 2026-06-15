import { joinModel } from "@/lib/model";
import type { Product, ActiveFilters } from "@/types/product";
import type { NavigationData, NavItem, NavLink } from "@/types/navigation";

export type ResolvedRoute =
    | { type: "product"; product: Product }
    | { type: "category"; filters: ActiveFilters; pageTitle: string; pageSubtitle?: string; featuredImage?: string; brandLogo?: string }
    | { type: "not_found" };

interface NavNode {
    item: NavItem | NavLink;
    ancestors: NavItem[];
}

function flattenNavTree(
    items: NavItem[],
    ancestors: NavItem[] = []
): NavNode[] {
    const result: NavNode[] = [];
    for (const item of items) {
        result.push({ item, ancestors });
        if (item.customLinks) {
            for (const link of item.customLinks) {
                result.push({ item: link, ancestors: [...ancestors, item] });
            }
        }
        if (item.sizeLinks) {
            for (const link of item.sizeLinks) {
                result.push({ item: link, ancestors: [...ancestors, item] });
            }
        }
        if (item.bottomLinks) {
            for (const link of item.bottomLinks) {
                result.push({ item: link, ancestors: [...ancestors, item] });
            }
        }
        if (item.children && item.children.length > 0) {
            result.push(...flattenNavTree(item.children, [...ancestors, item]));
        }
    }
    return result;
}

function normalizeSlug(raw: string): string {
    let slug = raw.trim();
    if (slug.startsWith("/")) slug = slug.slice(1);
    if (slug.startsWith("en/") || slug.startsWith("es/")) slug = slug.slice(3);
    return slug;
}

function deriveFilters(node: NavNode): ActiveFilters {
    const { item, ancestors } = node;
    const filters: ActiveFilters = {};

    const chain = [...ancestors, item];

    const l1 = chain.find((n) => 'level' in n && n.level === 1);
    if (l1) filters.category = [l1.label];

    const l2 = chain.find((n) => 'level' in n && n.level === 2);
    if (l2 && !isTractionNode(l2)) {
        filters.brand = [extractBrand(l2.label)];
    }

    const modelSegments: string[] = [];
    for (const n of chain) {
        if ('level' in n && n.level >= 3 && !isTractionNode(n)) {
            for (const segment of extractName(n.label).split(" ")) {
                modelSegments.push(segment);
            }
        }
    }
    if (modelSegments.length > 0) {
        filters.model = [joinModel(modelSegments)];
    }

    const traction = detectTraction(chain.map((n) => n.label).join(" "));
    if (traction) {
        filters.traction = [traction];
        if (isTractionNode(item)) {
            delete filters.brand;
            delete filters.model;
        }
    }

    return filters;
}

const TRACTION_CODES = ["FG", "AG", "MG", "SG", "TF", "IC", "HG"];

function isTractionNode(item: NavItem | NavLink): boolean {
    return TRACTION_CODES.some((code) =>
        new RegExp(`\\b${code}\\b`, "i").test(item.label)
    );
}

function detectTraction(text: string): string | null {
    for (const code of TRACTION_CODES) {
        if (new RegExp(`\\b${code}\\b`).test(text)) return code;
    }
    return null;
}

function extractBrand(label: string): string {
    const multiWordBrands = ["New Balance"];
    for (const brand of multiWordBrands) {
        if (label.toLowerCase().startsWith(brand.toLowerCase())) return brand;
    }
    return label.split(" ")[0];
}

function extractName(label: string): string {
    const brandPrefixes = [
        "Adidas", "adidas", "Nike", "Puma", "New Balance",
        "Mizuno", "Joma", "Kelme", "Lotto", "Munich", "Diadora",
    ];
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

function deriveSubtitle(node: NavNode): string | undefined {
    return node.item.description || undefined;
}

export function resolveRoute(slugArray: string[], products: Product[], navigation: NavigationData[]): ResolvedRoute {
    const slug = normalizeSlug(slugArray.join("/"));

    const matchedProduct = products.find((p) => p.url_slug === slug);
    if (matchedProduct) {
        return { type: "product", product: matchedProduct };
    }

    const allL1Items = navigation.flatMap((group) => group.children ?? []);
    const allNodes = flattenNavTree(allL1Items);

    const matchedNode = allNodes.find(
        (node) => node.item.href && normalizeSlug(node.item.href) === slug
    );

    if (matchedNode) {
        return {
            type: "category",
            filters: deriveFilters(matchedNode),
            pageTitle: matchedNode.item.label,
            pageSubtitle: deriveSubtitle(matchedNode),
            featuredImage: 'featuredImage' in matchedNode.item ? matchedNode.item.featuredImage : undefined,
        };
    }

    return { type: "not_found" };
}
