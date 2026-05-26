import { client } from "@/lib/sanity";
import type { NavigationData, NavItem } from "@/types/navigation";

let cachedNavigation: NavigationData[] | null = null;

export async function getNavigation(): Promise<NavigationData[]> {
    if (cachedNavigation) return cachedNavigation;
    const data = await client.fetch(`*[_type == "navigation"][0]`);
    cachedNavigation = (data?.items ?? []) as NavigationData[];
    return cachedNavigation;
}

export async function getNavItemBySlug(slug: string): Promise<NavigationData | undefined> {
    const nav = await getNavigation();
    return nav.find((n) => n.slug === slug);
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

export async function findNavItemByHref(href: string): Promise<NavItem | undefined> {
    const nav = await getNavigation();
    const allItems = nav.flatMap((n) =>
        flattenNavigation(n.children || [])
    );
    return allItems.find((item) => item.href === href);
}

export async function getBreadcrumbs(href: string): Promise<NavItem[]> {
    const nav = await getNavigation();
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

    return breadcrumbs;
}
