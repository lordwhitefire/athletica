import { resolveRoute } from "@/lib/resolveRoute";
import { splitModel } from "@/lib/model";
import { getAllProducts, getProductsByModelPrefix, getProductsByBrand, getProductsByTraction } from "@/lib/getProducts";
import { getAmazonLink } from "@/lib/getAmazonLinks";
import { getNavigation, getMainCategoryHref, getBrandCategoryHref, getProductCategoryHref, getTractionCategoryHref } from "@/lib/getNavigation";
import { getBrandLogoMap } from "@/lib/actions/brands";
import { urlFor } from "@/lib/sanity";
import type { SanityImageSource } from "@sanity/image-url";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CategoryPage from "@/components/category/CategoryPage";
import ProductPage from "@/components/product/ProductPage";
import { Suspense } from "react";

export const revalidate = 60;

interface SlugPageProps {
    params: Promise<{
        slug: string[];
    }>;
}

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
    const { slug } = await params;
    const [productsResult, navigationResult] = await Promise.all([
        getAllProducts(),
        getNavigation(),
    ]);

    if (productsResult.error || navigationResult.error) {
        return { title: "Page Not Found" };
    }

    const allProducts = productsResult.data;
    const navigation = navigationResult.data;
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
    const [productsResult, navigationResult] = await Promise.all([
        getAllProducts(),
        getNavigation(),
    ]);

    if (productsResult.error || navigationResult.error) { notFound(); }

    const allProducts = productsResult.data;
    const navigation = navigationResult.data;
    const resolved = resolveRoute(slug, allProducts, navigation);

    if (resolved.type === "not_found") {
        notFound();
    }

    if (resolved.type === "product") {
        const product = resolved.product;
        const amazonLinkResult = await getAmazonLink(product.id);
        const amazonLink = amazonLinkResult.data ?? null;

        const [byNameResult, byBrandResult, byTractionResult] = await Promise.all([
            getProductsByModelPrefix(
                splitModel(product.model).slice(0, -1).join("/"),
                product.id
            ),
            getProductsByBrand(
                product.brand,
                product.name || undefined,
                product.id
            ),
            product.traction
                ? getProductsByTraction(product.traction, product.id)
                : Promise.resolve({ data: [], error: null } as const),
        ]);

        const relatedByModelLevel = (byNameResult.data ?? []).slice(0, 10);
        const relatedByBrand = (byBrandResult.data ?? []).slice(0, 10);
        const relatedByTraction = (byTractionResult.data ?? []).slice(0, 10);

        const [mainCategoryHref, brandCategoryHref, productCategoryHref, tractionCategoryHref] = await Promise.all([
            getMainCategoryHref(),
            getBrandCategoryHref(product.brand),
            Promise.resolve(getProductCategoryHref(product)),
            product.traction ? Promise.resolve(getTractionCategoryHref(product.traction)) : Promise.resolve(null),
        ]);

        const breadcrumbs = [
            { label: product.category, href: mainCategoryHref },
            { label: product.brand, href: brandCategoryHref ?? undefined },
            { label: product.model },
        ];

        return (
            <ProductPage
                product={product}
                amazonLink={amazonLink}
                relatedByModelLevel={relatedByModelLevel}
                relatedByBrand={relatedByBrand}
                relatedByTraction={relatedByTraction}
                breadcrumbs={breadcrumbs}
                brandCategoryHref={brandCategoryHref}
                tractionCategoryHref={tractionCategoryHref}
                productCategoryHref={productCategoryHref}
                mainCategoryHref={mainCategoryHref}
            />
        );
    }

    if (resolved.type === "category") {
        const breadcrumbs = [
            { label: resolved.pageTitle },
        ];

        const brandLogoMapResult = await getBrandLogoMap();
        const brandLogoMap = brandLogoMapResult.data ?? {};
        const brandName = resolved.filters.brand?.[0];
        const brandLogo = brandName ? brandLogoMap[brandName] || null : null;

        let featuredImage: string | null = null;
        if (resolved.featuredImage) {
            try {
                featuredImage = urlFor(resolved.featuredImage as SanityImageSource).width(1920).url();
            } catch { featuredImage = null; }
        }

        return (
            <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
                <CategoryPage
                    allProducts={allProducts}
                    baseFilters={resolved.filters}
                    pageTitle={resolved.pageTitle}
                    pageSubtitle={resolved.pageSubtitle}
                    featuredImage={featuredImage}
                    brandLogo={brandLogo}
                    brandLogoMap={brandLogoMap}
                    breadcrumbs={breadcrumbs}
                />
            </Suspense>
        );
    }
}
