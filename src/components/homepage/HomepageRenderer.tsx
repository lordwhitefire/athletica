"use client";

import { HomepageSection, CategoryGridSection, ProductCarouselSection } from "@/types/homepage";
import { Product } from "@/types/product";
import ProductCarousel from "@/components/product/ProductCarousel";
import CategoryGridSectionComponent from "@/components/homepage/CategorySection";

interface SectionWithProducts {
    section: HomepageSection;
    products?: Product[];
}

interface HomepageRendererProps {
    sectionsWithProducts: SectionWithProducts[];
}

const MAX_W = "max-w-7xl mx-auto px-3 md:px-6";

export default function HomepageRenderer({ sectionsWithProducts }: HomepageRendererProps) {
    return (
        <div className="w-full flex flex-col items-center">
            {sectionsWithProducts.map(({ section, products }) => {
                if (section.type === "category_grid") {
                    const s = section as CategoryGridSection;
                    return (
                        <div key={s.id} className={`w-full py-6 md:py-10 border-b border-gray-100 ${s.bg || ""}`}>
                            <div className={MAX_W}>
                                <CategoryGridSectionComponent
                                    title={s.title}
                                    variant={s.variant}
                                    viewAllHref={s.viewAllHref}
                                    viewAllLabel={s.viewAllLabel}
                                    bg={s.bg}
                                    items={s.items}
                                />
                            </div>
                        </div>
                    );
                }

                if (section.type === "product_carousel") {
                    const s = section as ProductCarouselSection;
                    if (!products || products.length === 0) return null;
                    return (
                        <div key={s.id} className="w-full py-2 border-b border-gray-100">
                            <div className={MAX_W}>
                                <ProductCarousel
                                    title={s.title}
                                    subtitle={s.subtitle}
                                    products={products}
                                    link={s.link}
                                    linkLabel={s.link_label}
                                />
                            </div>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}