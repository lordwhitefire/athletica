export interface NavLink {
    label: string;
    href: string;
}

export interface NavItem {
    id: string;
    level: number;
    label: string;
    href: string | null;
    disabled?: boolean;
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