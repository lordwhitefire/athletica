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

function SectionError({ message }: { message: string }) {
    return (
        <div className="w-full py-12 text-center">
            <p className="text-zinc-500 text-sm">{message}</p>
        </div>
    );
}

export default function HomepageRenderer({ sectionsWithProducts }: HomepageRendererProps) {
    return (
        <div className="w-full flex flex-col items-center">
            {sectionsWithProducts.map(({ section, products }) => {
                if (section.type === "product_carousel" && (!products || products.length === 0)) {
                    return null;
                }

                try {
                    if (section.type === "category_grid") {
                        const s = section as CategoryGridSection;
                        return (
                            <div key={s.id} className={`w-full py-6 md:py-10 border-b border-zinc-800 ${s.bg || ""}`}>
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
                        return (
                            <div key={s.id} className="w-full py-2 border-b border-zinc-800">
                                <div className={MAX_W}>
                                    <ProductCarousel
                                        title={s.title}
                                        subtitle={s.subtitle}
                                        products={products!}
                                        link={s.link}
                                        linkLabel={s.link_label}
                                    />
                                </div>
                            </div>
                        );
                    }

                    return null;
                } catch {
                    return (
                        <div key={section.id || Math.random().toString()} className="w-full py-6 border-b border-zinc-800">
                            <SectionError message={`Failed to load "${section.title || "section"}"`} />
                        </div>
                    );
                }
            })}
        </div>
    );
}