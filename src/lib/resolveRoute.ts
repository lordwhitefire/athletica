import { Product, ActiveFilters } from "@/types/product";
import { getAllProducts } from "@/lib/getProducts";
import { NavigationData, NavItem } from "@/types/navigation";
import navigationData from "@/data/navigation.json";

export type ResolvedRoute =
    | { type: "product"; product: Product }
    | { type: "category"; filters: ActiveFilters; pageTitle: string; pageSubtitle?: string }
    | { type: "not_found" };

// ─── Nav tree traversal ────────────────────────────────────────────────────────

interface NavNode {
    item: NavItem;
    ancestors: NavItem[];
}

function flattenNavTree(
    items: NavItem[],
    ancestors: NavItem[] = []
): NavNode[] {
    const result: NavNode[] = [];
    for (const item of items) {
        result.push({ item, ancestors });
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

// ─── Filter derivation ─────────────────────────────────────────────────────────

function deriveFilters(node: NavNode): ActiveFilters {
    const { item, ancestors } = node;
    const filters: ActiveFilters = {};

    const chain = [...ancestors, item];

    const l1 = chain.find((n) => n.level === 1);
    if (l1) filters.category = [l1.label];

    const l2 = chain.find((n) => n.level === 2);
    if (l2 && !isTractionNode(l2)) {
        filters.brand = [extractBrand(l2.label)];
    }

    const l3 = chain.find((n) => n.level === 3);
    if (l3 && !isTractionNode(l3)) {
        filters.model_line = [extractModelLine(l3.label)];
    }

    const l4 = chain.find((n) => n.level === 4);
    if (l4) {
        filters.model_line = [extractModelLine(l4.label)];
    }

    const traction = detectTraction(chain.map((n) => n.label).join(" "));
    if (traction) {
        filters.traction = [traction];
        if (isTractionNode(item)) {
            delete filters.brand;
            delete filters.model_line;
        }
    }

    return filters;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TRACTION_CODES = ["FG", "AG", "MG", "SG", "TF", "IC", "HG"];

function isTractionNode(item: NavItem): boolean {
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

function extractModelLine(label: string): string {
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

/**
 * Returns the full description from the nav item — no truncation.
 * This is used as the category page subtitle/header description.
 */
function deriveSubtitle(node: NavNode): string | undefined {
    return node.item.description || undefined;
}

// ─── Main resolver ─────────────────────────────────────────────────────────────

export function resolveRoute(slugArray: string[]): ResolvedRoute {
    const slug = normalizeSlug(slugArray.join("/"));

    const products = getAllProducts();

    // 1. Product match first
    const matchedProduct = products.find((p) => p.url_slug === slug);
    if (matchedProduct) {
        return { type: "product", product: matchedProduct };
    }

    // 2. Dynamic nav tree traversal
    const nav = navigationData as NavigationData[];
    const allL1Items = nav.flatMap((group) => group.children ?? []);
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
        };
    }

    return { type: "not_found" };
}