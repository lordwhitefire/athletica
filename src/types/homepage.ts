export interface HeroBanner {
    id: string;
    title: string;
    subtitle: string;
    button_text: string;
    link: string;
    gradient: string;
    accent_color: string;
    image: string | null;
}

export interface HeroCarousel {
    id: string;
    auto_switch_ms: number;
    banners: HeroBanner[];
}

export interface CategoryGridItem {
    label: string;
    href: string;
    image?: string;
    bg?: string;
    textColor?: string;
    accent?: string;
    height?: string;
}

export type CategorySectionVariant =
    | "grid-4-equal"
    | "scroll-brands"
    | "grid-tiles-dark"
    | "grid-3-bordered"
    | "scroll-categories"
    | "asymmetric-3-2"
    | "split-1-2"
    | "asymmetric-2-split"
    | "stacked-banners";

export interface CategoryCard {
    id: string;
    title: string;
    subtitle: string;
    link: string;
    image?: string;
    gradient: string;
    emoji: string;
}

export interface CategoryGridSection {
    id: string;
    type: "category_grid";
    title: string;
    variant: CategorySectionVariant;
    bg?: string;
    viewAllHref?: string;
    viewAllLabel?: string;
    items: CategoryGridItem[];
}

export interface ProductCarouselFilter {
    category?: string;
    brand?: string;
    model_line?: string;
    traction?: string;
    min_price?: number;
    max_price?: number;
}

export interface ProductCarouselSection {
    id: string;
    type: "product_carousel";
    title: string;
    subtitle?: string;
    filter: ProductCarouselFilter;
    sort: "newest" | "price_asc" | "price_desc" | "biggest_discount";
    limit: number;
    link?: string;
    link_label?: string;
}

export type HomepageSection = CategoryGridSection | ProductCarouselSection;

export interface HomepageConfig {
    hero_carousel: HeroCarousel;
    sections: HomepageSection[];
}