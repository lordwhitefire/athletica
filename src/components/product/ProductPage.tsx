"use client";

import { Product } from "@/types/product";
import ImageGallery from "@/components/product/ImageGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductDescription from "@/components/product/ProductDescription";
import ProductCarousel from "@/components/product/ProductCarousel";
import Breadcrumb, { BreadcrumbItem } from "@/components/navigation/Breadcrumb";

interface ProductPageProps {
    product: Product;
    amazonLink: string | null;
    relatedByModelLine: Product[];
    relatedByBrand: Product[];
    relatedByTraction: Product[];
    breadcrumbs: BreadcrumbItem[];
}

export default function ProductPage({
    product,
    amazonLink,
    relatedByModelLine,
    relatedByBrand,
    relatedByTraction,
    breadcrumbs,
}: ProductPageProps) {
    return (
        <main className="max-w-screen-2xl mx-auto px-6 py-8">

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
                {relatedByModelLine.length > 0 && (
                    <ProductCarousel
                        title={`More ${product.model_line || product.brand} Boots`}
                        subtitle="Same model line, different options"
                        products={relatedByModelLine}
                        link={
                            product.model_line
                                ? `/${product.brand.toLowerCase()}-${product.model_line.toLowerCase()}-football-boots`
                                : undefined
                        }
                        linkLabel={`View All ${product.model_line}`}
                    />
                )}

                {relatedByBrand.length > 0 && (
                    <ProductCarousel
                        title={`More ${product.brand} Products`}
                        subtitle="Other products from this brand"
                        products={relatedByBrand}
                        link={`/${product.brand.toLowerCase()}-football-boots`}
                        linkLabel={`Explore Brand`}
                    />
                )}

                {relatedByTraction.length > 0 && (
                    <ProductCarousel
                        title={`More ${product.traction} Boots`}
                        subtitle="Other boots for the same surface"
                        products={relatedByTraction}
                        link={
                            product.traction
                                ? `/${product.traction.toLowerCase()}-football-boots`
                                : undefined
                        }
                        linkLabel={`Shop ${product.traction} Range`}
                    />
                )}
            </section>
        </main>
    );
}