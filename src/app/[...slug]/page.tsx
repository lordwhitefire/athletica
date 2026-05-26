import { resolveRoute } from "@/lib/resolveRoute";
import { getAllProducts, getProductsByModelLine, getProductsByBrand, getProductsByTraction } from "@/lib/getProducts";
import { getAmazonLink } from "@/lib/getAmazonLinks";
import { getNavigation } from "@/lib/getNavigation";
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
    const [allProducts, navigation] = await Promise.all([
        getAllProducts(),
        getNavigation(),
    ]);
    const resolved = resolveRoute(slug, allProducts, navigation);

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
    const [allProducts, navigation] = await Promise.all([
        getAllProducts(),
        getNavigation(),
    ]);
    const resolved = resolveRoute(slug, allProducts, navigation);

    if (resolved.type === "not_found") {
        notFound();
    }

    if (resolved.type === "product") {
        const product = resolved.product;
        const amazonLink = await getAmazonLink(product.id);

        const [relatedByModelLine, relatedByBrand, relatedByTraction] = await Promise.all([
            product.model_line
                ? getProductsByModelLine(product.model_line, product.id).then((p) => p.slice(0, 10))
                : Promise.resolve([]),
            getProductsByBrand(
                product.brand,
                product.model_line || undefined,
                product.id
            ).then((p) => p.slice(0, 10)),
            product.traction
                ? getProductsByTraction(product.traction, product.id).then((p) => p.slice(0, 10))
                : Promise.resolve([]),
        ]);

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
