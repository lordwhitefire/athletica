export interface NavLink {
    label: string;
    href: string;
    description?: string;
}

export interface NavItem {
    id: string;
    level: number;
    label: string;
    href: string | null;
    disabled?: boolean;
    description?: string;
    slug?: string;
    featuredImage?: string;
    customLinks?: NavLink[];
    sizeLinks?: NavLink[];
    bottomLinks?: NavLink[];
    children?: NavItem[];
}

export interface NavigationData {
    id: string;
    level: number;
    slug: string;
    label: string;
    href: string;
    children: NavItem[];
}