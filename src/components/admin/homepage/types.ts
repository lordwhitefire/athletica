// Shared types for the homepage editor's popup forms. These mirror the
// shapes the old monolithic HomepageEditor.tsx kept in component state,
// so the server-action contract is unchanged.

export interface BannerState {
    index: number;
    _key: string;
    title: string;
    subtitle: string;
    button_text: string;
    link: string;
    gradient: string;
    accent_color: string;
    image: string | null;
    saving: boolean;
}

export interface SectionStateItem {
    _key: string;
    label: string;
    link: string;
    bg: string;
    textColor: string;
    accent: string;
    image: string | null;
}

export interface SectionStateCard {
    _key: string;
    title: string;
    subtitle: string;
    link: string;
    gradient: string;
    emoji: string;
    image: string | null;
}

export interface SectionState {
    index: number;
    _key: string;
    type: string;
    title: string;
    variant: string;
    bg: string;
    viewAllLink: string;
    viewAllLabel: string;
    subtitle: string;
    sort: string;
    limit: string;
    link: string;
    link_label: string;
    category: string;
    brand: string;
    modelLine: string;
    traction: string;
    minPrice: string;
    maxPrice: string;
    autoSwitchMs: string;
    items: SectionStateItem[];
    cards: SectionStateCard[];
    saving: boolean;
    previewProducts: Record<string, unknown>[];
    previewLoaded: boolean;
    previewLoading: boolean;
    snapshot: string | null;
}

// Validation rules per category_grid variant. Bug #7 from the issues
// doc — the redesign gives each variant its own form template; the
// min/max here enforces the "fixed-slot" vs "flexible" split.
export const VARIANT_RULES = {
    "grid-4-equal":        { minItems: 4, maxItems: 4,  name: "Grid 4 Equal",        fields: ["label", "link", "bg", "textColor", "image"] as const },
    "grid-3-bordered":     { minItems: 3, maxItems: 3,  name: "Grid 3 Bordered",     fields: ["label", "link", "bg", "image"] as const },
    "asymmetric-3-2":      { minItems: 2, maxItems: 2,  name: "Asymmetric 3-2",      fields: ["label", "link", "image"] as const },
    "asymmetric-2-split":  { minItems: 2, maxItems: 2,  name: "Asymmetric 2 Split",  fields: ["label", "link", "image"] as const },
    "split-1-2":           { minItems: 2, maxItems: 2,  name: "Split 1-2",           fields: ["label", "link", "image"] as const },
    "stacked-banners":     { minItems: 2, maxItems: 2,  name: "Stacked Banners",     fields: ["label", "link", "bg", "textColor", "image"] as const },
    "grid-tiles-dark":     { minItems: 4, maxItems: 4,  name: "Grid Tiles Dark",     fields: ["label", "link", "bg", "textColor", "accent", "image"] as const },
    "scroll-brands":       { minItems: 3, maxItems: 10, name: "Scroll Brands",       fields: ["label", "link", "image"] as const },
    "scroll-categories":   { minItems: 3, maxItems: 10, name: "Scroll Categories",   fields: ["label", "link", "image"] as const },
} as const;

export type VariantKey = keyof typeof VARIANT_RULES;
export type ItemField = (typeof VARIANT_RULES)[VariantKey]["fields"][number];

// True if items can be added/removed by the editor. False for the seven
// fixed-slot variants where the slot count is hardcoded.
export function variantIsFlexible(variant: string): boolean {
    return variant === "scroll-brands" || variant === "scroll-categories";
}
