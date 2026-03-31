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
        <div className="container mx-auto px-4 py-6">
            <Breadcrumb items={breadcrumbs} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                <ImageGallery
                    mainImage={product.main_image}
                    gallery={product.image_gallery}
                    productName={product.model}
                />
                <ProductInfo
                    product={product}
                    amazonLink={amazonLink}
                />
            </div>

            <ProductDescription product={product} />

            <ProductCarousel
                title={`More ${product.model_line || product.brand} Boots`}
                subtitle="Same model line, different options"
                products={relatedByModelLine}
                link={product.model_line ? `/${product.brand.toLowerCase()}-${product.model_line.toLowerCase()}-football-boots` : undefined}
                linkLabel={`View all ${product.model_line}`}
            />

            <ProductCarousel
                title={`More ${product.brand} Products`}
                subtitle="Other products from this brand"
                products={relatedByBrand}
                link={`/${product.brand.toLowerCase()}-football-boots`}
                linkLabel={`View all ${product.brand}`}
            />

            {relatedByTraction.length > 0 && (
                <ProductCarousel
                    title={`More ${product.traction} Boots`}
                    subtitle={`Other boots for the same surface`}
                    products={relatedByTraction}
                    link={product.traction ? `/${product.traction.toLowerCase()}-football-boots` : undefined}
                    linkLabel={`View all ${product.traction} boots`}
                />
            )}
        </div>
    );
}