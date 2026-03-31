import { resolveRoute } from "@/lib/resolveRoute";
import { getAllProducts, getProductsByModelLine, getProductsByBrand, getProductsByTraction } from "@/lib/getProducts";
import { getAmazonLink } from "@/lib/getAmazonLinks";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CategoryPage from "@/components/category/CategoryPage";
import ProductPage from "@/components/product/ProductPage";
import { Suspense } from "react";

interface SlugPageProps {
    params: Promise<{
        slug: string[];
    }>;
}

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
    const { slug } = await params;
    const resolved = resolveRoute(slug);

    if (resolved.type === "product") {
        return {
            title: resolved.product.model,
            description: resolved.product.description.subtitle,
        };
    }

    if (resolved.type === "category") {
        return {
            title: resolved.pageTitle,
            description: resolved.pageSubtitle || resolved.pageTitle,
        };
    }

    return { title: "Page Not Found" };
}

export default async function SlugPage({ params }: SlugPageProps) {
    const { slug } = await params;
    const resolved = resolveRoute(slug);

    if (resolved.type === "not_found") {
        notFound();
    }

    if (resolved.type === "product") {
        const product = resolved.product;
        const amazonLink = getAmazonLink(product.id);

        const relatedByModelLine = product.model_line
            ? getProductsByModelLine(product.model_line, product.id).slice(0, 10)
            : [];

        const relatedByBrand = getProductsByBrand(
            product.brand,
            product.model_line || undefined,
            product.id
        ).slice(0, 10);

        const relatedByTraction = product.traction
            ? getProductsByTraction(product.traction, product.id).slice(0, 10)
            : [];

        const breadcrumbs = [
            { label: product.category, href: `/${product.category.toLowerCase().replace(/ /g, "-")}` },
            { label: product.brand, href: `/${product.brand.toLowerCase()}-football-boots` },
            { label: product.model },
        ];

        return (
            <ProductPage
                product={product}
                amazonLink={amazonLink}
                relatedByModelLine={relatedByModelLine}
                relatedByBrand={relatedByBrand}
                relatedByTraction={relatedByTraction}
                breadcrumbs={breadcrumbs}
            />
        );
    }

    if (resolved.type === "category") {
        const allProducts = getAllProducts();
        const breadcrumbs = [
            { label: resolved.pageTitle },
        ];

        return (
            <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
                <CategoryPage
                    allProducts={allProducts}
                    baseFilters={resolved.filters}
                    pageTitle={resolved.pageTitle}
                    pageSubtitle={resolved.pageSubtitle}
                    breadcrumbs={breadcrumbs}
                />
            </Suspense>
        );
    }
}