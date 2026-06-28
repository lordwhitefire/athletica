"use client";

import { splitModel } from "@/lib/model";
import { Product } from "@/types/product";
import ImageGallery from "@/components/product/ImageGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductDescription from "@/components/product/ProductDescription";
import ProductCarousel from "@/components/product/ProductCarousel";
import Breadcrumb, { BreadcrumbItem } from "@/components/navigation/Breadcrumb";

interface ProductPageProps {
    product: Product;
    amazonLink: string | null;
    relatedByModelLevel: Product[];
    relatedByBrand: Product[];
    relatedByTraction: Product[];
    breadcrumbs: BreadcrumbItem[];
    brandCategoryHref: string | null;
    tractionCategoryHref: string | null;
    productCategoryHref: string | null;
    mainCategoryHref: string;
}

export default function ProductPage({
    product,
    amazonLink,
    relatedByModelLevel,
    relatedByBrand,
    relatedByTraction,
    breadcrumbs,
    brandCategoryHref,
    tractionCategoryHref,
    productCategoryHref,
}: ProductPageProps) {
    const segments = splitModel(product.model);
    const levelName = segments.slice(-2, -1)[0] || product.brand;
    return (
        <main className="max-w-[1400px] overflow-x-hidden mx-auto px-6 py-8">

            {/* Breadcrumb */}
            <Breadcrumb items={breadcrumbs} />

            {/* Two-column product section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24 mt-12">
                {/* Left: Image Gallery — 7 cols */}
                <div className="lg:col-span-7">
                    <ImageGallery
                        mainImage={product.main_image}
                        gallery={product.image_gallery}
                        productName={product.model}
                        badges={[
                            ...(product.description.collection ? [product.description.collection] : []),
                            ...(product.traction ? [product.traction] : []),
                        ]}
                    />
                </div>

                {/* Right: Product Info — 5 cols */}
                <div className="lg:col-span-5 flex flex-col">
                    <ProductInfo
                        product={product}
                        amazonLink={amazonLink}
                    />
                </div>
            </div>

            {/* Description + Tech specs — full bleed grey section */}
            <ProductDescription product={product} />

            {/* Related carousels */}
            <section className="space-y-0">
                {relatedByModelLevel.length > 0 && (
                    <ProductCarousel
                        title={`More ${levelName} Boots`}
                        subtitle="Same model line, different options"
                        products={relatedByModelLevel}
                        link={productCategoryHref ?? undefined}
                        linkLabel={`View All ${levelName}`}
                    />
                )}

                {relatedByBrand.length > 0 && (
                    <ProductCarousel
                        title={`More ${product.brand} Products`}
                        subtitle="Other products from this brand"
                        products={relatedByBrand}
                        link={brandCategoryHref ?? undefined}
                        linkLabel={`Explore Brand`}
                    />
                )}

                {relatedByTraction.length > 0 && (
                    <ProductCarousel
                        title={`More ${product.traction} Boots`}
                        subtitle="Other boots for the same surface"
                        products={relatedByTraction}
                        link={tractionCategoryHref ?? undefined}
                        linkLabel={`Shop ${product.traction} Range`}
                    />
                )}
            </section>
        </main>
    );
}