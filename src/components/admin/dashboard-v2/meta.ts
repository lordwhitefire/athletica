export const routeMeta: Record<
    string,
    { title: string; description: string; href?: string }
> = {
    dashboard: {
        title: "Dashboard",
        description: "Store overview and actionable catalog health.",
        href: "/admin/overview",
    },
    products: {
        title: "Products",
        description: "Search, filter, edit, publish, and manage products.",
        href: "/admin/products",
    },
    import: {
        title: "Import Center",
        description: "Upload, validate, preview, and confirm product imports.",
        href: "/admin/products/batch-upload",
    },
    categories: {
        title: "Categories",
        description: "Manage product categories and classification.",
        href: "/admin/navigation",
    },
    brands: {
        title: "Brands",
        description: "Manage brands used throughout the product catalog.",
        href: "/admin/brands",
    },
    homepage: {
        title: "Homepage",
        description: "Manage homepage content and featured product references.",
        href: "/admin/homepage",
    },
    navigation: {
        title: "Navigation",
        description: "Manage storefront navigation and category destinations.",
        href: "/admin/navigation",
    },
    media: {
        title: "Media Library",
        description: "Manage product and homepage media.",
        href: "/admin/media",
    },
    analytics: {
        title: "Analytics Overview",
        description: "Review business performance and affiliate activity.",
        href: "/admin/analytics",
    },
    analyticsProducts: {
        title: "Product Analytics",
        description: "Review product-level affiliate performance.",
        href: "/admin/analytics/products",
    },
    traffic: {
        title: "Traffic",
        description: "Review views, clicks, and traffic activity.",
        href: "/admin/analytics/traffic",
    },
    affiliateSettings: {
        title: "Affiliate Settings",
        description: "Manage Amazon Associate configuration and test links.",
        href: "/admin/affiliate-settings",
    },
    quality: {
        title: "System Health",
        description: "Monitor data quality, sync status, and system performance.",
        href: "/admin/system-health",
    },
    settings: {
        title: "Settings",
        description: "Manage admin and system settings.",
        href: "/admin/settings",
    },
};

export interface TaskMeta {
    id: string;
    title: string;
    description: string;
    tone: string;
    icon: string;
    navigateTo: string;
    toast?: { title: string; message: string };
}

export const taskMeta: TaskMeta[] = [
    {
        id: "image",
        title: "Products need images",
        description:
            "Products currently published or queued for publication without usable primary images.",
        tone: "#ff7110",
        icon: "image_not_supported",
        navigateTo: "media",
        toast: { title: "Media Library opened", message: "Filter the library for products missing images." },
    },
    {
        id: "asin",
        title: "Products missing Amazon ASIN",
        description:
            "Products that cannot generate a complete Amazon destination until an ASIN is supplied.",
        tone: "#ff7110",
        icon: "link_off",
        navigateTo: "products",
        toast: { title: "Products opened", message: "Products missing ASIN are ready to be filtered." },
    },
    {
        id: "category",
        title: "Products missing categories",
        description: "Products that do not currently have a catalog category assigned.",
        tone: "#e7bc2d",
        icon: "folder_off",
        navigateTo: "products",
        toast: { title: "Products opened", message: "Products missing categories are ready to be filtered." },
    },
    {
        id: "unpublished",
        title: "Products unpublished",
        description: "Products currently held out of the customer-facing catalog.",
        tone: "#e7bc2d",
        icon: "publish",
        navigateTo: "products",
    },
    {
        id: "duplicate",
        title: "Duplicate products",
        description: "Potential duplicate records requiring review before cleanup.",
        tone: "#e5e6e3",
        icon: "content_copy",
        navigateTo: "quality",
    },
];

export const taskMetaById = (id: string): TaskMeta | undefined => taskMeta.find((t) => t.id === id);