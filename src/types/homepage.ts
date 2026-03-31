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

export interface CategoryCard {
    id: string;
    title: string;
    subtitle: string;
    link: string;
    gradient: string;
    emoji: string;
    image: string | null;
}

export interface CategoryPanel {
    id: string;
    title: string;
    subtitle: string;
    link: string;
    gradient: string;
    emoji: string;
    badge: string | null;
    image: string | null;
}

export interface ProductCarouselFilter {
    category?: string;
    brand?: string;
    model_line?: string;
    traction?: string;
    min_price?: number;
    max_price?: number;
}

export interface CategoryCarouselSection {
    id: string;
    type: "category_carousel";
    auto_switch_ms: number;
    cards: CategoryCard[];
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

export interface CategorySectionBlock {
    id: string;
    type: "category_section";
    panels: CategoryPanel[];
}

export type HomepageSection =
    | CategoryCarouselSection
    | ProductCarouselSection
    | CategorySectionBlock;

export interface HomepageConfig {
    hero_carousel: HeroCarousel;
    sections: HomepageSection[];
}