export type CategoryStatus = "active" | "inactive";

export interface CategoryNode {
    id: string;
    name: string;
    count: string;
    status: CategoryStatus;
    expanded?: boolean;
    selected?: boolean;
    children?: CategoryNode[];
}

export interface Subcategory {
    id: string;
    name: string;
    products: number;
    status: CategoryStatus;
    order: number;
}

export type NavItemType = "home" | "category" | "link" | "sale";

export interface NavItem {
    id: string;
    label: string;
    type: NavItemType;
    count?: number;
    visible: boolean;
    expanded?: boolean;
    children?: NavItem[];
}

export interface MenuRecord {
    id: string;
    name: string;
    lastUpdated: string;
    items: NavItem[];
}

export interface CategoryDetails {
    name: string;
    parentId: string | null;
    status: CategoryStatus;
    description: string;
}

export interface SeoContent {
    title: string;
    metaDescription: string;
    slug: string;
    canonicalUrl: string;
    intro: string;
}

export interface CategoryMetrics {
    totalProducts: number;
    productViews: number;
    amazonClicks: number;
    ctr: number;
}

export interface CategoryProduct {
    id: string;
    name: string;
    brand: string;
    status: "Active" | "Draft";
    price: number;
    amazonReadiness: "Ready" | "Needs ASIN" | "Missing images";
}

export interface CategoryWorkspaceData {
    subcategories: Subcategory[];
    details: CategoryDetails;
    seo: SeoContent;
    metrics: CategoryMetrics;
    products: CategoryProduct[];
}

export type CategoryTab = "subcategories" | "products" | "details" | "seo";

export const CATEGORY_TABS: { key: CategoryTab; label: string }[] = [
    { key: "subcategories", label: "Subcategories" },
    { key: "products", label: "Products" },
    { key: "details", label: "Category Details" },
    { key: "seo", label: "SEO & Content" },
];

export type DeleteStrategy = "move-descendants" | "delete-descendants" | "move-children" | "delete-children";

export interface Toast {
    id: number;
    type: "success" | "error" | "info";
    message: string;
}

let toastSeq = 1;
export function nextToastId() {
    return toastSeq++;
}

export function kebabCase(input: string) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export function formatCount(value: number) {
    return value.toLocaleString("en-US");
}

const BRANDS = ["Nike", "adidas", "Puma", "Mizuno", "New Balance", "Under Armour"];

const PRODUCT_NAMES = [
    "Mercurial Vapor 15",
    "Predator Elite",
    "Future Ultimate FG",
    "Furon V7",
    "Ultra 5",
    "Speedflow Pro",
    "Phantom GT2",
    "Match Gloves",
    "Home Jersey",
    "Elite Shorts",
    "Performance Socks",
    "Shin Guard Elite",
];

function buildProducts(total: number): CategoryProduct[] {
    const products: CategoryProduct[] = [];
    const count = Math.max(8, Math.min(26, Math.round(total / 90)));
    for (let i = 0; i < count; i++) {
        const brand = BRANDS[i % BRANDS.length];
        products.push({
            id: `p-${total}-${i}`,
            name: `${PRODUCT_NAMES[(i * 5 + Math.floor(total / 7)) % PRODUCT_NAMES.length]} ${String.fromCharCode(65 + (i % 4))}`,
            brand,
            status: i % 7 === 0 ? "Draft" : "Active",
            price: Math.round(((i * 137 + 47 + total) % 20000)) / 100 + 20,
            amazonReadiness: i % 9 === 0 ? "Needs ASIN" : i % 13 === 0 ? "Missing images" : "Ready",
        });
    }
    return products;
}

const SUBCAT_WEIGHTS = [0.45, 0.3, 0.15, 0.07, 0.02, 0.01];

function buildSubcategories(total: number, exact?: number[]): Subcategory[] {
    if (exact) {
        return exact.map((products, index) => ({
            id: `sub-${total}-${index}`,
            name: BRANDS[index],
            products,
            status: "active" as const,
            order: index + 1,
        }));
    }
    return SUBCAT_WEIGHTS.map((weight, index) => ({
        id: `sub-${total}-${index}`,
        name: BRANDS[index],
        products: Math.max(0, Math.round(total * weight)),
        status: "active" as const,
        order: index + 1,
    }));
}

export const CATEGORY_TREE: CategoryNode[] = [
    {
        id: "all",
        name: "All Categories",
        count: "12,450",
        status: "active",
        expanded: true,
        children: [
            {
                id: "football",
                name: "Football",
                count: "6,218",
                status: "active",
                expanded: true,
                children: [
                    { id: "football-boots", name: "Football Boots", count: "1,842", status: "active", selected: true },
                    { id: "goalkeeper-gloves", name: "Goalkeeper Gloves", count: "663", status: "active" },
                    { id: "football-jerseys", name: "Football Jerseys", count: "1,256", status: "active" },
                    { id: "football-shorts", name: "Football Shorts", count: "742", status: "active" },
                    { id: "football-socks", name: "Football Socks", count: "512", status: "active" },
                    { id: "shin-guards", name: "Shin Guards", count: "389", status: "active" },
                    { id: "training-equipment", name: "Training Equipment", count: "845", status: "active" },
                ],
            },
            { id: "running", name: "Running", count: "2,340", status: "active" },
            { id: "basketball", name: "Basketball", count: "1,850", status: "active" },
            { id: "gym-training", name: "Gym & Training", count: "1,420", status: "active" },
            { id: "lifestyle", name: "Lifestyle", count: "915", status: "active" },
            { id: "accessories", name: "Accessories", count: "1,207", status: "active" },
            { id: "sale", name: "Sale", count: "500", status: "active" },
        ],
    },
];

const FOOTBALL_BOOTS_SUBCATS = [842, 612, 198, 96, 74, 20];

function buildWorkspaceData(node: CategoryNode, parentId: string | null): CategoryWorkspaceData {
    const total = parseInt(node.count.replace(/,/g, ""), 10) || 0;
    const isBoots = node.id === "football-boots";
    return {
        subcategories: isBoots ? buildSubcategories(total, FOOTBALL_BOOTS_SUBCATS) : buildSubcategories(total),
        details: {
            name: node.name,
            parentId,
            status: node.status,
            description: `${node.name} — all products and subcategories for this part of the catalog.`,
        },
        seo: {
            title: `${node.name} | Athletica Store`,
            metaDescription: `Shop the full ${node.name.toLowerCase()} range with competitive prices and fast delivery.`,
            slug: kebabCase(node.name),
            canonicalUrl: `https://athletica.store/${kebabCase(node.name)}`,
            intro: `Browse our complete ${node.name.toLowerCase()} collection, curated for performance and everyday use.`,
        },
        metrics: isBoots
            ? { totalProducts: 1842, productViews: 326842, amazonClicks: 28642, ctr: 8.74 }
            : {
                  totalProducts: total,
                  productViews: Math.round(total * 177.44),
                  amazonClicks: Math.round(total * 177.44 * 0.0876),
                  ctr: Math.round(total * 177.44 * 0.0876 * 1000) / Math.round(total * 177.44) / 10,
              },
        products: buildProducts(total),
    };
}

export function buildWorkspaceMap(): Record<string, CategoryWorkspaceData> {
    const map: Record<string, CategoryWorkspaceData> = {};
    const walk = (nodes: CategoryNode[], parentId: string | null) => {
        nodes.forEach((node) => {
            if (node.id !== "all") {
                map[node.id] = buildWorkspaceData(node, parentId);
            }
            if (node.children) walk(node.children, node.id);
        });
    };
    walk(CATEGORY_TREE, null);
    return map;
}

export const DEFAULT_WORKSPACE = buildWorkspaceMap();

export function deriveCategoryData(node: CategoryNode): CategoryWorkspaceData {
    const parent = findCategoryParent(CATEGORY_TREE, node.id);
    return buildWorkspaceData({ ...node, selected: false }, parent ? parent.id : null);
}

export const NAV_MENUS: Record<string, MenuRecord> = {
    "main-menu": {
        id: "main-menu",
        name: "Main Menu",
        lastUpdated: "Today, 09:14",
        items: [
            { id: "nav-home", label: "Home", type: "home", visible: true },
            {
                id: "nav-football",
                label: "Football",
                type: "category",
                count: 6,
                visible: true,
                expanded: true,
                children: [
                    { id: "nav-boots", label: "Football Boots", type: "category", count: 6, visible: true },
                    { id: "nav-gloves", label: "Goalkeeper Gloves", type: "category", count: 4, visible: true },
                    { id: "nav-jerseys", label: "Football Jerseys", type: "category", count: 5, visible: true },
                    { id: "nav-training", label: "Training Equipment", type: "category", count: 7, visible: true },
                    { id: "nav-view-all", label: "View All Football", type: "link", visible: true },
                ],
            },
            { id: "nav-running", label: "Running", type: "category", count: 4, visible: true },
            { id: "nav-basketball", label: "Basketball", type: "category", count: 3, visible: true },
            { id: "nav-gym", label: "Gym & Training", type: "category", count: 5, visible: true },
            { id: "nav-lifestyle", label: "Lifestyle", type: "category", count: 3, visible: true },
            { id: "nav-sale", label: "Sale", type: "sale", count: 2, visible: true },
        ],
    },
    "footer-menu": {
        id: "footer-menu",
        name: "Footer Menu",
        lastUpdated: "Yesterday, 16:02",
        items: [
            { id: "nav-footer-about", label: "About", type: "link", visible: true },
            { id: "nav-footer-contact", label: "Contact", type: "link", visible: true },
            { id: "nav-footer-boots", label: "Football Boots", type: "category", count: 1, visible: true },
            { id: "nav-footer-sale", label: "Sale", type: "sale", count: 2, visible: true },
        ],
    },
    "mobile-menu": {
        id: "mobile-menu",
        name: "Mobile Menu",
        lastUpdated: "Aug 12, 2026",
        items: [
            { id: "nav-mobile-home", label: "Home", type: "home", visible: true },
            {
                id: "nav-mobile-football",
                label: "Football",
                type: "category",
                count: 2,
                visible: true,
                children: [
                    { id: "nav-mobile-boots", label: "Football Boots", type: "category", count: 6, visible: true },
                    { id: "nav-mobile-gloves", label: "Goalkeeper Gloves", type: "category", count: 4, visible: true },
                ],
            },
            { id: "nav-mobile-sale", label: "Sale", type: "sale", count: 2, visible: true },
        ],
    },
};

export const INTERNAL_PAGES = ["Homepage", "Products", "About Us", "Contact", "Blog", "Shipping"];

export const MOCK_PRODUCTS_PER_CATEGORY = DEFAULT_WORKSPACE;

export function flattenTree(nodes: CategoryNode[]): { node: CategoryNode; depth: number; parentId: string | null }[] {
    const rows: { node: CategoryNode; depth: number; parentId: string | null }[] = [];
    const walk = (list: CategoryNode[], depth: number, parentId: string | null, forceExpand: boolean) => {
        list.forEach((node) => {
            rows.push({ node, depth, parentId });
            if (node.children && (forceExpand || node.expanded)) {
                walk(node.children, depth + 1, node.id, forceExpand);
            }
        });
    };
    nodes.forEach((root) => walk([root], 0, null, false));
    return rows;
}

export function findCategory(nodes: CategoryNode[], id: string): CategoryNode | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findCategory(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

export function findCategoryParent(nodes: CategoryNode[], id: string): CategoryNode | null {
    for (const node of nodes) {
        if (node.children) {
            if (node.children.some((child) => child.id === id)) return node;
            const found = findCategoryParent(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

export function createCategory(
    nodes: CategoryNode[],
    input: { name: string; parentId: string | null; status: CategoryStatus; description: string },
): CategoryNode[] {
    const node: CategoryNode = {
        id: `cat-${kebabCase(input.name)}-${Date.now()}`,
        name: input.name,
        count: "0",
        status: input.status,
    };
    if (!input.parentId || input.parentId === "all") {
        return [...nodes, node];
    }
    const map = (list: CategoryNode[]): CategoryNode[] =>
        list.map((item) => {
            if (item.id === input.parentId) {
                return { ...item, expanded: true, children: [...(item.children ?? []), node] };
            }
            if (item.children) return { ...item, children: map(item.children) };
            return item;
        });
    return map(nodes);
}

export function updateCategoryNode(
    nodes: CategoryNode[],
    id: string,
    patch: Partial<Pick<CategoryNode, "name" | "status">>,
): CategoryNode[] {
    const map = (list: CategoryNode[]): CategoryNode[] =>
        list.map((item) => {
            if (item.id === id) return { ...item, ...patch };
            if (item.children) return { ...item, children: map(item.children) };
            return item;
        });
    return map(nodes);
}

export function duplicateCategoryNode(nodes: CategoryNode[], id: string): CategoryNode[] {
    const source = findCategory(nodes, id);
    if (!source) return nodes;
    const parent = findCategoryParent(nodes, id);
    const copy: CategoryNode = {
        ...source,
        id: `${source.id}-copy-${Date.now()}`,
        name: `${source.name} Copy`,
        count: source.count,
        status: "inactive",
        selected: false,
        expanded: false,
        children: source.children ? source.children.map((child) => ({ ...child, selected: false })) : undefined,
    };
    const map = (list: CategoryNode[]): CategoryNode[] =>
        list.map((item) => {
            if (item.children) {
                if (parent && item.id === parent.id) {
                    const index = item.children.findIndex((child) => child.id === id);
                    const next = [...item.children];
                    next.splice(index + 1, 0, copy);
                    return { ...item, children: next };
                }
                return { ...item, children: map(item.children) };
            }
            return item;
        });
    if (!parent) {
        const index = nodes.findIndex((item) => item.id === id);
        const next = [...nodes];
        next.splice(index + 1, 0, copy);
        return next;
    }
    return map(nodes);
}

export function deleteCategoryNode(
    nodes: CategoryNode[],
    id: string,
    strategy: "move-descendants" | "delete-descendants",
    moveToId: string | null,
): CategoryNode[] {
    const prune = (list: CategoryNode[]): CategoryNode[] => {
        const result: CategoryNode[] = [];
        list.forEach((item) => {
            if (item.id === id) {
                if (item.children) {
                    if (strategy === "move-descendants" && moveToId) {
                        const children = item.children.map((child) => ({ ...child, selected: false }));
                        const moved = result.some((r) => r.id === moveToId);
                        const moveInto = (list2: CategoryNode[]): CategoryNode[] =>
                            list2.map((node) => {
                                if (node.id === moveToId) {
                                    return { ...node, expanded: true, children: [...(node.children ?? []), ...children] };
                                }
                                if (node.children) return { ...node, children: moveInto(node.children) };
                                return node;
                            });
                        return moveInto(result);
                    }
                }
                return result;
            }
            if (item.children) {
                const withChildren = prune(item.children);
                if (withChildren.length === item.children.length) {
                    result.push({ ...item, children: withChildren });
                } else {
                    const nextChildren = item.children.filter((child) => child.id !== id);
                    result.push({ ...item, children: nextChildren.length ? withChildren : undefined });
                }
            } else {
                result.push(item);
            }
        });
        return result;
    };
    return prune(nodes);
}

export function flattenNav(items: NavItem[]): { item: NavItem; depth: number; parentId: string | null }[] {
    const rows: { item: NavItem; depth: number; parentId: string | null }[] = [];
    const walk = (list: NavItem[], depth: number, parentId: string | null) => {
        list.forEach((item) => {
            rows.push({ item, depth, parentId });
            if (item.children && item.expanded) walk(item.children, depth + 1, item.id);
        });
    };
    walk(items, 0, null);
    return rows;
}

export function findNavItem(items: NavItem[], id: string): NavItem | null {
    for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
            const found = findNavItem(item.children, id);
            if (found) return found;
        }
    }
    return null;
}

export function isNavDescendant(items: NavItem[], id: string, maybeDescendantId: string): boolean {
    const item = findNavItem(items, id);
    if (!item) return false;
    return Boolean(findNavItem(item.children ?? [], maybeDescendantId));
}

export function insertNavItem(
    items: NavItem[],
    parentId: string | null,
    item: NavItem,
): NavItem[] {
    if (!parentId) return [...items, item];
    const map = (list: NavItem[]): NavItem[] =>
        list.map((entry) => {
            if (entry.id === parentId) {
                return { ...entry, expanded: true, children: [...(entry.children ?? []), item] };
            }
            if (entry.children) return { ...entry, children: map(entry.children) };
            return entry;
        });
    return map(items);
}

export function updateNavItem(items: NavItem[], id: string, patch: Partial<NavItem>): NavItem[] {
    const map = (list: NavItem[]): NavItem[] =>
        list.map((entry) => {
            if (entry.id === id) return { ...entry, ...patch };
            if (entry.children) return { ...entry, children: map(entry.children) };
            return entry;
        });
    return map(items);
}

export function deleteNavItem(
    items: NavItem[],
    id: string,
    strategy: "move-children" | "delete-children",
): NavItem[] {
    const prune = (list: NavItem[]): NavItem[] => {
        const result: NavItem[] = [];
        list.forEach((entry) => {
            if (entry.id === id) {
                if (entry.children && strategy === "move-children") {
                    result.push(...entry.children.map((child) => ({ ...child, expanded: false })));
                }
                return;
            }
            if (entry.children) {
                const next = prune(entry.children);
                if (next.length === 0) {
                    result.push({ ...entry, children: undefined });
                } else {
                    result.push({ ...entry, children: next });
                }
            } else {
                result.push(entry);
            }
        });
        return result;
    };
    return prune(items);
}

export function moveNavItemUpDown(
    items: NavItem[],
    id: string,
    direction: "up" | "down",
): NavItem[] {
    const map = (list: NavItem[]): NavItem[] => {
        const index = list.findIndex((entry) => entry.id === id);
        if (index === -1) {
            return list.map((entry) => (entry.children ? { ...entry, children: map(entry.children) } : entry));
        }
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= list.length) return list;
        const next = [...list];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
    };
    return map(items);
}

export function indentNavItem(items: NavItem[], id: string, mode: "indent" | "outdent"): NavItem[] {
    const rows = flattenNav(items);
    const row = rows.find((r) => r.item.id === id);
    if (!row) return items;
    if (mode === "indent") {
        const siblingIndex = rows.findIndex((r) => r.item.id === id);
        if (siblingIndex <= 0) return items;
        const target = rows[siblingIndex - 1];
        if (target.depth !== row.depth) return items;
        const remove = (list: NavItem[]): NavItem[] => list.filter((entry) => entry.id !== id);
        const stripped = remove(items);
        return insertNavItem(stripped, target.item.id, row.item);
    }
    if (!row.parentId) return items;
    const parentRow = rows.find((r) => r.item.id === row.parentId);
    if (!parentRow) return items;
    const grandParentId = parentRow.parentId;
    const without = (list: NavItem[]): NavItem[] =>
        list
            .map((entry) => {
                if (entry.id === id) return null;
                if (entry.children) return { ...entry, children: without(entry.children) };
                return entry;
            })
            .filter((entry): entry is NavItem => entry !== null);
    const stripped = without(items);
    const insertIndex = grandParentId
        ? (() => {
              const gpRows = flattenNav(stripped);
              const idx = gpRows.findIndex((r) => r.item.id === grandParentId);
              return idx + 1;
          })()
        : stripped.length;
    const insertInto = (grandParentId ? (list: NavItem[]): NavItem[] =>
          list.map((entry) => {
              if (entry.id === grandParentId) {
                  return { ...entry, children: [...(entry.children ?? []), row.item] };
              }
              if (entry.children) return { ...entry, children: insertInto(entry.children) };
              return entry;
          })
    : null)!;
    if (insertInto) return insertInto(stripped);
    const next = [...stripped];
    next.splice(Math.min(insertIndex, next.length), 0, row.item);
    return next;
}

export function reorderNavItem(
    items: NavItem[],
    dragId: string,
    targetId: string,
    position: "before" | "after",
): NavItem[] {
    if (dragId === targetId) return items;
    const rows = flattenNav(items);
    const dragRow = rows.find((r) => r.item.id === dragId);
    const targetRow = rows.find((r) => r.item.id === targetId);
    if (!dragRow || !targetRow) return items;
    const without = (list: NavItem[]): NavItem[] =>
        list
            .map((entry) => {
                if (entry.id === dragId) return null;
                if (entry.children) return { ...entry, children: without(entry.children) };
                return entry;
            })
            .filter((entry): entry is NavItem => entry !== null);
    const stripped = without(items);
    const insertParentId = position === "after" ? targetRow.parentId : targetRow.parentId;
    const into = (list: NavItem[]): NavItem[] => {
        const index = list.findIndex((entry) => entry.id === targetId);
        if (index === -1) {
            return list.map((entry) => (entry.children ? { ...entry, children: into(entry.children) } : entry));
        }
        const next = [...list];
        next.splice(position === "before" ? index : index + 1, 0, dragRow.item);
        return next;
    };
    if (!insertParentId) return into(stripped);
    return into(stripped);
}

export function menuRecordFromItems(menus: Record<string, MenuRecord>, id: string, items: NavItem[]): Record<string, MenuRecord> {
    return { ...menus, [id]: { ...menus[id], items, lastUpdated: "Just now" } };
}
