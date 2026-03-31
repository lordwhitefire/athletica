"use client";

import { HomepageSection, CategoryCarouselSection, ProductCarouselSection, CategorySectionBlock } from "@/types/homepage";
import { Product } from "@/types/product";
import CategoryCarousel from "@/components/homepage/CategoryCarousel";
import CategorySection from "@/components/homepage/CategorySection";
import ProductCarousel from "@/components/product/ProductCarousel";

interface SectionWithProducts {
    section: HomepageSection;
    products?: Product[];
}

interface HomepageRendererProps {
    sectionsWithProducts: SectionWithProducts[];
}

const CONTAINER = "w-full max-w-[1500px] px-6";

export default function HomepageRenderer({ sectionsWithProducts }: HomepageRendererProps) {
    return (
        <div className="w-full flex flex-col items-center  gap-y-12">
            {sectionsWithProducts.map(({ section, products }) => {
                if (section.type === "category_carousel") {
                    const s = section as CategoryCarouselSection;
                    return (
                        <div key={s.id} className="w-full flex justify-center py-10 border-b border-gray-100">
                            <div className={CONTAINER}>
                                <CategoryCarousel cards={s.cards} autoSwitchMs={s.auto_switch_ms} />
                            </div>
                        </div>
                    );
                }

                if (section.type === "product_carousel") {
                    const s = section as ProductCarouselSection;
                    if (!products || products.length === 0) return null;
                    return (
                        <div key={s.id} className="w-full flex justify-center py-2 border-b border-gray-100">
                            <div className={CONTAINER}>
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

                if (section.type === "category_section") {
                    const s = section as CategorySectionBlock;
                    return (
                        <div key={s.id} className="w-full flex justify-center py-10 border-b border-gray-100">
                            <div className={CONTAINER}>
                                <CategorySection panels={s.panels} />
                            </div>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}