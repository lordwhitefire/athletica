"use client";

import { HomepageSection, CategoryGridSection, ProductCarouselSection, CategoryCarouselSection } from "@/types/homepage";
import { Product } from "@/types/product";
import ProductCarousel from "@/components/product/ProductCarousel";
import CategoryCarousel from "@/components/homepage/CategoryCarousel";
import CategoryGridSectionComponent from "@/components/homepage/CategorySection";

interface SectionWithProducts {
    section: HomepageSection;
    products?: Product[];
}

interface HomepageRendererProps {
    sectionsWithProducts: SectionWithProducts[];
}

const MAX_W = "max-w-[1500px] w-full mx-auto";

function SectionError({ message }: { message: string }) {
    return (
        <div className="w-full py-12 text-center">
            <p className="text-zinc-500 text-sm">{message}</p>
        </div>
    );
}

export default function HomepageRenderer({ sectionsWithProducts }: HomepageRendererProps) {
    const validSections = sectionsWithProducts.filter(({ section, products }) => {
        if (section.type === "product_carousel" && (!products || products.length === 0)) {
            return false;
        }
        return true;
    });

    return (
        <div className="w-full flex flex-col items-center">
            {validSections.map(({ section, products }, index) => {
                const isFirst = index === 0;

                try {
                    if (section.type === "category_grid") {
                        const s = section as CategoryGridSection;
                        const sectionPadding = isFirst ? "pt-2 pb-6 md:pt-4 md:pb-10" : "py-6 md:py-10";
                        return (
                            <div key={s.id} className={`w-full ${sectionPadding} border-b border-zinc-800 ${s.bg || ""}`}>
                                <div className={MAX_W}>
<CategoryGridSectionComponent
                                        title={s.title}
                                        variant={s.variant}
                                        viewAllLink={s.viewAllLink}
                                        viewAllLabel={s.viewAllLabel}
                                        items={s.items}
                                        bg={s.bg}
                                    />
                                </div>
                            </div>
                        );
                    }

                    if (section.type === "product_carousel") {
                        const s = section as ProductCarouselSection;
                        const sectionPadding = isFirst ? "pt-0 pb-2" : "py-2";
                        return (
                            <div key={s.id} className={`w-full ${sectionPadding} border-b border-zinc-800`}>
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

                    if (section.type === "category_carousel") {
                        const s = section as CategoryCarouselSection;
                        const sectionPadding = isFirst ? "pt-2 pb-6 md:pt-4 md:pb-10" : "py-6 md:py-10";
                        return (
                            <div key={s.id} className={`w-full ${sectionPadding} border-b border-zinc-800`}>
                                <div className={MAX_W}>
                                    <CategoryCarousel cards={s.cards} autoSwitchMs={s.autoSwitchMs} variant={s.variant} />
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