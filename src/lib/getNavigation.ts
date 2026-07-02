import { cache } from "react";
import * as fs from "fs";
import * as path from "path";
import { splitModel } from "@/lib/model";
import type { NavigationData, NavItem, NavLink } from "@/types/navigation";
import type { ApiResult } from "@/lib/api-types";
import type { Product } from "@/types/product";
import { ok, fromCaughtError } from "@/lib/api-types";
import { slugify } from "@/lib/rebuild-nav-urls";

function transformNavItems(items: Record<string, unknown>[]): NavItem[] {
    return items.map(item => ({
        id: (item.id as string) || (item._key as string) || "",
        level: (item.level as number) ?? 0,
        label: (item.label as string) || "",
        href: (item.href as string) ?? null,
        description: item.description as string | undefined,
        slug: item.slug as string | undefined,
        featuredImage: item.featuredImage as string | undefined,
        disabled: item.disabled as boolean | undefined,
        customLinks: item.customLinks as NavLink[] | undefined,
        sizeLinks: item.sizeLinks as NavLink[] | undefined,
        bottomLinks: item.bottomLinks as NavLink[] | undefined,
        children: item.children ? transformNavItems(item.children as Record<string, unknown>[]) : undefined,
    }));
}

const fetchNavigationData = cache(async () => {
    const jsonPath = path.join(process.cwd(), "data", "navigation.json");
    const raw = JSON.parse(await fs.promises.readFile(jsonPath, "utf-8"));
    return raw;
});

export async function getNavigation(): Promise<ApiResult<NavigationData[]>> {
    try {
        const data = await fetchNavigationData();
        const items = (data?.items ?? []).map((item: Record<string, unknown>) => ({
            id: item._key || item.id || "",
            level: item.level ?? 0,
            slug: item._key || "",
            label: item.label || "",
            href: item.href || "",
            children: transformNavItems((item.children || []) as Record<string, unknown>[]),
        }));
        return ok(items);
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

    function buildTree(items: NavItem[]): ModelNavNode[] {
        const nodes: ModelNavNode[] = [];
        for (const item of items) {
            if (item.level < 3) {
                if (item.children) {
                    nodes.push(...buildTree(item.children));
                }
                continue;
            }
            const label = item.label;
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

const TRACTION_CODES = ["FG", "AG", "MG", "SG", "TF", "IC", "HG"];

function extractBrand(label: string): string {
    const multiWordBrands = ["New Balance"];
    for (const brand of multiWordBrands) {
        if (label.toLowerCase().startsWith(brand.toLowerCase())) return brand;
    }
    return label.split(" ")[0];
}

function findFirstL1(nav: NavigationData[]): NavItem | undefined {
    for (const group of nav) {
        for (const child of group.children ?? []) {
            if (child.level === 1 && !child.disabled) return child;
        }
    }
    return undefined;
}

function findDescendant(items: NavItem[], predicate: (item: NavItem) => boolean): NavItem | undefined {
    for (const item of items) {
        if (predicate(item)) return item;
        if (item.children) {
            const found = findDescendant(item.children, predicate);
            if (found) return found;
        }
    }
    return undefined;
}

export async function getMainCategoryHref(): Promise<string> {
    const result = await getNavigation();
    if (result.error) return "/";
    const l1 = findFirstL1(result.data);
    return l1?.href ?? "/";
}

export async function getMainCategoryLabel(): Promise<string> {
    const result = await getNavigation();
    if (result.error) return "Products";
    const l1 = findFirstL1(result.data);
    return l1?.label ?? "Products";
}

export async function getBrandCategoryHref(brand: string): Promise<string | null> {
    const result = await getNavigation();
    if (result.error) return null;
    const l1 = findFirstL1(result.data);
    if (!l1?.children) return null;
    const found = findDescendant(l1.children, (item) =>
        item.level >= 2 && extractBrand(item.label).toLowerCase() === brand.toLowerCase()
    );
    return found?.href ?? null;
}

export async function getProductCategoryHref(product: Product): Promise<string> {
    const result = await getNavigation();
    if (result.error) return "/";

    const allL1Items = result.data.flatMap((group) => group.children ?? []);
    const categorySlug = slugify(product.category);

    const l1 = allL1Items.find(
        (item) => item.level === 1 && slugify(item.label) === categorySlug
    );
    if (!l1) return "/";

    const ids: string[] = [l1.id];
    let currentItems = l1.children;

    if (currentItems && product.brand) {
        const brandSlug = slugify(product.brand);
        const l2 = currentItems.find(
            (item) => item.level >= 2 && slugify(extractBrand(item.label)) === brandSlug
        );
        if (l2) {
            ids.push(l2.id);
            currentItems = l2.children;
        }
    }

    const modelSegments = splitModel(product.model).slice(0, -1);
    for (const seg of modelSegments) {
        if (!currentItems) break;
        const segSlug = slugify(seg);
        const match = currentItems.find(
            (item) => item.level >= 3 && slugify(item.label) === segSlug
        );
        if (match) {
            ids.push(match.id);
            currentItems = match.children;
        } else {
            break;
        }
    }

    return `/en/${ids.join("/")}`;
}

export function getTractionCategoryHref(traction: string): string {
    return `/en/traction/${slugify(traction)}`;
}
