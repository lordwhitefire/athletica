import { NavigationData, NavItem } from "@/types/navigation";
import navigationData from "@/data/navigation.json";

// Cast the imported JSON to our NavigationData type
const navigation: NavigationData[] = navigationData as NavigationData[];

// Get the full navigation tree
export function getNavigation(): NavigationData[] {
    return navigation;
}

// Get a single top level nav item by its slug
export function getNavItemBySlug(slug: string): NavigationData | undefined {
    return navigation.find((n) => n.slug === slug);
}

// Flatten the entire navigation tree into a single array
// Useful for finding any nav item at any level by href
export function flattenNavigation(items: NavItem[]): NavItem[] {
    return items.reduce<NavItem[]>((acc, item) => {
        acc.push(item);
        if (item.children && item.children.length > 0) {
            acc.push(...flattenNavigation(item.children));
        }
        return acc;
    }, []);
}

// Find a nav item at any level by its href
// Used to highlight active nav items based on current URL
export function findNavItemByHref(href: string): NavItem | undefined {
    const allItems = navigation.flatMap((n) =>
        flattenNavigation(n.children || [])
    );
    return allItems.find((item) => item.href === href);
}

// Get breadcrumb trail for a given href
// Returns array of nav items from root to the matched item
export function getBreadcrumbs(href: string): NavItem[] {
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

    navigation.forEach((n) => {
        if (n.children) {
            searchTree(n.children, href);
        }
    });

    return breadcrumbs;
}