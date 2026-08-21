import {
    getCachedProductBySlug,
    getCachedProducts,
    getCachedFacets,
    resolveBrandFilter,
    resolveCategoryFilter,
} from "@/lib/products/product-service";
import {
    toPageProduct,
    toPageProductSummary,
    toFilterOptions,
    activeFiltersToProductFilters,
} from "@/lib/products/product-adapter";
import type { ProductFilters } from "@/lib/products/types";
import { resolveRoute } from "@/lib/resolveRoute";
import { getAmazonLink } from "@/lib/getAmazonLinks";
import { getNavigation, getMainCategoryHref, getBrandCategoryHref, getProductCategoryHref, getTractionCategoryHref } from "@/lib/getNavigation";
import { urlFor } from "@/lib/sanity";
import type { SanityImageSource } from "@sanity/image-url";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ActiveFilters, Product } from "@/types/product";
import CategoryPage from "@/components/category/CategoryPage";
import ProductPage from "@/components/product/ProductPage";
import { Suspense } from "react";

export const revalidate = 60;

const PRODUCTS_PER_PAGE = 24;

interface SlugPageProps {
    params: Promise<{
        slug: string[];
    }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const EMPTY_PAGE = { items: [], total: 0, page: 1, pageSize: PRODUCTS_PER_PAGE, totalPages: 0 };

function normalizeSlug(slug: string[]): string[] {
    const cleaned = slug.filter(Boolean);
    if (cleaned[0] === "en" || cleaned[0] === "es") return cleaned.slice(1);
    return cleaned;
}

function firstParam(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
}

function getAllParams(value: string | string[] | undefined): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return [value];
    return [];
}

function mergeBaseAndUrlFilters(base: ActiveFilters, params: Record<string, string | string[] | undefined>): ActiveFilters {
    const filters: ActiveFilters = { ...base };

    const brands = getAllParams(params.brand);
    if (brands.length > 0) filters.brand = brands;

    const models = getAllParams(params.model);
    if (models.length > 0) filters.model = models;

    const tractions = getAllParams(params.traction);
    if (tractions.length > 0) filters.traction = tractions;

    const colors = getAllParams(params.color);
    if (colors.length > 0) filters.color = colors;

    const genders = getAllParams(params.gender);
    if (genders.length > 0) filters.gender = genders;

    const sizes = getAllParams(params.size);
    if (sizes.length > 0) filters.size = sizes;

    const minPrice = firstParam(params.min_price);
    if (minPrice) filters.min_price = parseFloat(minPrice);

    const maxPrice = firstParam(params.max_price);
    if (maxPrice) filters.max_price = parseFloat(maxPrice);

    const sort = firstParam(params.sort);
    if (sort) filters.sort = sort as ActiveFilters["sort"];

    return filters;
}

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
    const { slug } = await params;
    const normalized = normalizeSlug(slug);

    const product = await getCachedProductBySlug(normalized.join("/"));
    if (product) {
        const description = product.description as string | null;
        let subtitle = "";
        if (description) {
            try { subtitle = JSON.parse(description).subtitle ?? ""; } catch { subtitle = ""; }
        }
        return {
            title: product.model ?? product.name ?? "Product",
            description: subtitle,
        };
    }

    const navigationResult = await getNavigation();
    if (navigationResult.error) return { title: "Page Not Found" };

    const resolved = resolveRoute(slug, [], navigationResult.data);
    if (resolved.type === "category") {
        return {
            title: resolved.pageTitle,
            description: resolved.pageSubtitle || resolved.pageTitle,
        };
    }

    return { title: "Page Not Found" };
}

export default async function SlugPage({ params, searchParams }: SlugPageProps) {
    const [{ slug }, paramsRecord] = await Promise.all([params, searchParams]);
    const normalized = normalizeSlug(slug);

    const [product, navigationResult] = await Promise.all([
        getCachedProductBySlug(normalized.join("/")),
        getNavigation(),
    ]);

    if (navigationResult.error) notFound();
    const navigation = navigationResult.data;

    // --- Product detail ---------------------------------------------------
    if (product) {
        const legacyProduct = toPageProduct(product);
        const amazonLinkResult = await getAmazonLink(product.id);
        const amazonLink = amazonLinkResult.data ?? null;

        const leafModel = product.leaf_model;
        const traction = (product.attributes as { traction?: string })?.traction ?? null;

        const [byModelResult, byBrandResult, byTractionResult] = await Promise.all([
            leafModel?.parent
                ? getCachedProducts({ rootModel: leafModel.parent.id, page: 1, pageSize: 10 })
                : leafModel
                    ? getCachedProducts({ leafModel: leafModel.id, page: 1, pageSize: 10 })
                    : Promise.resolve(EMPTY_PAGE),
            product.brand
                ? getCachedProducts({ brand: product.brand.slug, page: 1, pageSize: 10 })
                : Promise.resolve(EMPTY_PAGE),
            traction
                ? getCachedProducts({ traction, page: 1, pageSize: 10 })
                : Promise.resolve(EMPTY_PAGE),
        ]);

        const exclude = (p: Product) => p.id !== product.id;

        const relatedByModelLevel = byModelResult.items.map(toPageProductSummary).filter(exclude).slice(0, 10);
        const relatedByBrand = byBrandResult.items.map(toPageProductSummary).filter(exclude).slice(0, 10);
        const relatedByTraction = byTractionResult.items.map(toPageProductSummary).filter(exclude).slice(0, 10);

        const [mainCategoryHref, brandCategoryHref, productCategoryHref, tractionCategoryHref] = await Promise.all([
            getMainCategoryHref(),
            getBrandCategoryHref(product.brand?.name ?? ""),
            getProductCategoryHref(legacyProduct),
            traction ? Promise.resolve(getTractionCategoryHref(traction)) : Promise.resolve(null),
        ]);

        const modelLineName = leafModel?.parent?.name ?? leafModel?.name ?? product.brand?.name ?? "";

        const breadcrumbs = [
            { label: product.category?.name ?? "", href: mainCategoryHref },
            { label: product.brand?.name ?? "", href: brandCategoryHref ?? undefined },
            { label: product.model ?? "" },
        ];

        return (
            <ProductPage
                product={legacyProduct}
                amazonLink={amazonLink}
                relatedByModelLevel={relatedByModelLevel}
                relatedByBrand={relatedByBrand}
                relatedByTraction={relatedByTraction}
                breadcrumbs={breadcrumbs}
                brandCategoryHref={brandCategoryHref}
                tractionCategoryHref={tractionCategoryHref}
                productCategoryHref={productCategoryHref}
                mainCategoryHref={mainCategoryHref}
                modelLineName={modelLineName}
            />
        );
    }

    // --- Category ---------------------------------------------------------
    const resolved = resolveRoute(slug, [], navigation);

    if (resolved.type !== "category") {
        notFound();
    }

    const baseFilters: ActiveFilters = resolved.filters;
    const activeFilters = mergeBaseAndUrlFilters(baseFilters, paramsRecord);

    const productFilters: ProductFilters = activeFiltersToProductFilters(activeFilters);
    if (productFilters.brand) {
        productFilters.brand = (await resolveBrandFilter(productFilters.brand)) ?? productFilters.brand;
    }
    if (productFilters.category) {
        productFilters.category = (await resolveCategoryFilter(productFilters.category)) ?? productFilters.category;
    }

    const page = Math.max(1, parseInt(firstParam(paramsRecord.page) ?? "1", 10) || 1);

    const [dataResult, facetsResult] = await Promise.all([
        getCachedProducts({ ...productFilters, page, pageSize: PRODUCTS_PER_PAGE }),
        getCachedFacets(activeFiltersToProductFilters(baseFilters)),
    ]);

    const products = dataResult.items.map(toPageProductSummary);
    const filterOptions = toFilterOptions(facetsResult);

    const breadcrumbs = [{ label: resolved.pageTitle }];

    const brandName = activeFilters.brand?.[0];
    const brandLogo = brandName
        ? facetsResult.brands.find(b => b.name.toLowerCase() === brandName.toLowerCase())?.logo_link ?? null
        : null;

    let featuredImage: string | null = null;
    if (resolved.featuredImage) {
        try {
            featuredImage = urlFor(resolved.featuredImage as SanityImageSource).width(1920).url();
        } catch { featuredImage = null; }
    }

    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
            <CategoryPage
                products={products}
                filterOptions={filterOptions}
                totalProducts={dataResult.total}
                currentPage={page}
                totalPages={dataResult.totalPages}
                pageTitle={resolved.pageTitle}
                pageSubtitle={resolved.pageSubtitle}
                featuredImage={featuredImage}
                brandLogo={brandLogo}
                breadcrumbs={breadcrumbs}
            />
        </Suspense>
    );
}