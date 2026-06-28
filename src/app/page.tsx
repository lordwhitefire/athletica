import type { Metadata } from "next";
import { getHomepageConfig, getHomepageSections, getProductsForCarousel } from "@/lib/getHomepage";
import { ProductCarouselSection } from "@/types/homepage";
import HeroCarousel from "@/components/homepage/HeroCarousel";
import HomepageRenderer from "@/components/homepage/HomepageRenderer";

export const revalidate = 60;

export const metadata: Metadata = {
    title: "Athletica | Football Store",
    description: "The ultimate football store. Shop football boots, goalkeeper gloves, footballs, shin guards, training wear and more.",
};

export default async function HomePage() {
    const [configResult, sectionsResult] = await Promise.all([
        getHomepageConfig(),
        getHomepageSections(),
    ]);

    if (configResult.error || sectionsResult.error) {
        return (
            <div className="min-h-screen overflow-x-hidden flex items-center justify-center">
                <p className="text-on-surface-variant">Unable to load homepage. Please try again later.</p>
            </div>
        );
    }

    const config = configResult.data;
    const sections = sectionsResult.data;

    const sectionsWithProducts = await Promise.all(
        sections.map(async (section) => {
            if (section.type === "product_carousel") {
                const s = section as ProductCarouselSection;
                const productsResult = await getProductsForCarousel(s);
                return { section, products: productsResult.data ?? [] };
            }
            return { section };
        })
    );

    return (
        <div className="min-h-screen overflow-x-hidden">
            <HeroCarousel
                banners={config.hero_carousel.banners}
                autoSwitchMs={config.hero_carousel.auto_switch_ms}
            />
            <div style={{ marginTop: "0px" }}>
                <HomepageRenderer sectionsWithProducts={sectionsWithProducts} />
            </div>
        </div>
    );
}
