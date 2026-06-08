import { client, urlFor } from "@/lib/sanity";
import { getAllProducts } from "@/lib/getProducts";
import { filterProducts } from "@/lib/filterProducts";
import type { SanityImageSource } from "@sanity/image-url";
import type { HomepageConfig, HomepageSection, ProductCarouselSection } from "@/types/homepage";
import type { Product, ActiveFilters } from "@/types/product";

function resolveImage(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (typeof value === "object" && value !== null) {
        try {
            return `${urlFor(value as SanityImageSource).url()}?v=${Date.now()}`;
        } catch {
            return null;
        }
    }
    return null;
}

function resolveHomepageImages(config: Record<string, unknown>): Record<string, unknown> {
    const resolved = { ...config };

    if (resolved.hero_carousel) {
        const hero = { ...(resolved.hero_carousel as Record<string, unknown>) };
        if (Array.isArray(hero.banners)) {
            hero.banners = (hero.banners as Record<string, unknown>[]).map((banner) => {
                const b = { ...banner };
                b.image = resolveImage(b.image);
                return b;
            });
        }
        resolved.hero_carousel = hero;
    }

    if (Array.isArray(resolved.sections)) {
        resolved.sections = (resolved.sections as Record<string, unknown>[]).map((section) => {
            const s = { ...section };
            if (s.type === "category_grid" && Array.isArray(s.items)) {
                s.items = (s.items as Record<string, unknown>[]).map((item) => {
                    const it = { ...item };
                    it.image = resolveImage(it.image);
                    return it;
                });
            }
            return s;
        });
    }

    return resolved;
}

export async function getHomepageConfig(): Promise<HomepageConfig> {
    const data = await client.fetch(`*[_type == "homepage"][0]`);
    const resolved = resolveHomepageImages(data);
    return resolved as unknown as HomepageConfig;
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
    const config = await getHomepageConfig();
    return config.sections;
}

export async function getProductsForCarousel(section: ProductCarouselSection): Promise<Product[]> {
    const allProducts = await getAllProducts();
    const filters: ActiveFilters = {};

    if (section.filter.category) filters.category = [section.filter.category];
    if (section.filter.brand) filters.brand = [section.filter.brand];
    if (section.filter.model) filters.model = [section.filter.model];
    if (section.filter.traction) filters.traction = [section.filter.traction];
    if (section.filter.min_price) filters.min_price = section.filter.min_price;
    if (section.filter.max_price) filters.max_price = section.filter.max_price;
    if (section.sort) filters.sort = section.sort;

    let filtered = filterProducts(allProducts, filters);

    if (filtered.length === 0) {
        filtered = allProducts.slice(0, section.limit);
    }

    if (filtered.length < section.limit) {
        const needed = section.limit - filtered.length;
        const extras = allProducts
            .filter((p) => !filtered.find((f) => f.id === p.id))
            .slice(0, needed);
        filtered = [...filtered, ...extras];
    }

    return filtered.slice(0, section.limit);
}
