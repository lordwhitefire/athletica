"use client";

import { useEffect } from "react";
import AutoSuggest from "../AutoSuggest";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
    suggestBrands,
    suggestCategories,
    suggestNames,
    suggestRoutes,
} from "@/lib/actions/suggestions";
import ProductCarousel from "@/components/product/ProductCarousel";
import type { Product } from "@/types/product";
import type { SectionState } from "./types";

interface ProductCarouselFormProps {
    section: SectionState;
    onUpdateField: (field: keyof SectionState, value: string | null) => void;
    /**
     * Lazy-load the preview. The parent (HomepageEditor) owns the actual
     * fetch — we just call it once on mount of this form (i.e. when the
     * popup opens) and let the parent's refetch-on-filter-change effect
     * take over from there. This replaces the old "Load preview" button
     * from PR #4 — when the popup opens, we auto-load. Bug #11.
     */
    onLoadPreview: () => void;
}

const inputCls = "w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors";

/**
 * Popup form contents for a product_carousel section. Per the redesign
 * plan (Step 6), this variant has no items or cards — only filter
 * settings. The form is just subtitle / sort / limit / link / link label
 * plus all the filter fields (category, brand, model, traction, min/max
 * price).
 *
 * When the popup opens, this component fires onLoadPreview() once. The
 * parent's existing refetch-on-filter-change effect (see HomepageEditor)
 * then keeps the preview live as the editor changes filters.
 */
export default function ProductCarouselForm({
    section,
    onUpdateField,
    onLoadPreview,
}: ProductCarouselFormProps) {
    // Auto-load the preview when the popup opens. This is the deferred
    // fetch that used to be a button in PR #4 — now it happens
    // automatically because the user explicitly opened the popup.
    useEffect(() => {
        onLoadPreview();
        // We intentionally only fire this on mount. Subsequent filter
        // changes are handled by the parent's dep-key effect.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Section Title" tooltip="Main heading for this carousel section">
                    <input
                        type="text"
                        value={section.title}
                        onChange={(e) => onUpdateField("title", e.target.value)}
                        className={inputCls}
                        placeholder="Enter section title..."
                    />
                </Field>
                <Field label="Subtitle" tooltip="Description text for this section">
                    <input
                        type="text"
                        value={section.subtitle}
                        onChange={(e) => onUpdateField("subtitle", e.target.value)}
                        className={inputCls}
                        placeholder="Featured products"
                    />
                </Field>
                <Field label="Sort Order" tooltip="How to sort products in this carousel">
                    <select
                        value={section.sort}
                        onChange={(e) => onUpdateField("sort", e.target.value)}
                        className={inputCls}
                    >
                        <option value="newest">Newest</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="biggest_discount">Biggest Discount</option>
                    </select>
                </Field>
                <Field label="Limit" tooltip="Maximum number of products to show">
                    <input
                        type="number"
                        value={section.limit}
                        onChange={(e) => onUpdateField("limit", e.target.value)}
                        className={inputCls}
                        min="1"
                        max="50"
                    />
                </Field>
                <Field label="Link" tooltip="Link to view all products in this carousel">
                    <AutoSuggest
                        label="Link"
                        value={section.link}
                        onChange={(value) => onUpdateField("link", value)}
                        fetchSuggestions={suggestRoutes}
                        placeholder="/path/to/products"
                    />
                </Field>
                <Field label="Link Label" tooltip="Text for the link button">
                    <input
                        type="text"
                        value={section.link_label}
                        onChange={(e) => onUpdateField("link_label", e.target.value)}
                        className={inputCls}
                        placeholder="View All Products"
                    />
                </Field>
            </div>

            <div className="border-t border-neutral-800 pt-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                    Filters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Category Filter" tooltip="Filter products by category">
                        <AutoSuggest
                            label="Category Filter"
                            value={section.category}
                            onChange={(value) => onUpdateField("category", value)}
                            fetchSuggestions={suggestCategories}
                            placeholder="Select category"
                        />
                    </Field>
                    <Field label="Brand Filter" tooltip="Filter products by brand">
                        <AutoSuggest
                            label="Brand Filter"
                            value={section.brand}
                            onChange={(value) => onUpdateField("brand", value)}
                            fetchSuggestions={suggestBrands}
                            placeholder="Select brand"
                        />
                    </Field>
                    <Field label="Model Filter" tooltip="Filter products by model name">
                        <AutoSuggest
                            label="Model Filter"
                            value={section.modelLine}
                            onChange={(value) => onUpdateField("modelLine", value)}
                            fetchSuggestions={suggestNames}
                            placeholder="Select model"
                        />
                    </Field>
                    <Field label="Traction Filter" tooltip="Filter products by traction type">
                        <select
                            value={section.traction}
                            onChange={(e) => onUpdateField("traction", e.target.value)}
                            className={inputCls}
                        >
                            <option value="">Any</option>
                            <option value="Firm Ground">Firm Ground</option>
                            <option value="Soft Ground">Soft Ground</option>
                            <option value="Artificial Grass">Artificial Grass</option>
                            <option value="Indoor">Indoor</option>
                            <option value="Turf">Turf</option>
                        </select>
                    </Field>
                    <Field label="Min Price" tooltip="Minimum price filter">
                        <input
                            type="number"
                            value={section.minPrice}
                            onChange={(e) => onUpdateField("minPrice", e.target.value)}
                            className={inputCls}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        />
                    </Field>
                    <Field label="Max Price" tooltip="Maximum price filter">
                        <input
                            type="number"
                            value={section.maxPrice}
                            onChange={(e) => onUpdateField("maxPrice", e.target.value)}
                            className={inputCls}
                            min="0"
                            step="0.01"
                            placeholder="999.99"
                        />
                    </Field>
                </div>
            </div>
        </div>
    );
}

/**
 * Full-size ProductCarousel preview for the popup's right panel.
 * Reads from section.previewProducts (the lazy-loaded products).
 * Shows a loading state while previewLoading is true, and a prompt
 * (shouldn't happen since we auto-load, but defensive) when no
 * products have loaded yet.
 */
export function ProductCarouselPreview({ section }: { section: SectionState }) {
    if (section.previewLoading && section.previewProducts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
                <span className="w-6 h-6 border-2 border-zinc-600 border-t-primary rounded-full animate-spin" />
                <p className="text-xs">Loading products…</p>
            </div>
        );
    }
    if (!section.previewLoaded || section.previewProducts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
                <span className="material-symbols-outlined text-[32px] text-zinc-700">
                    inventory_2
                </span>
                <p className="text-xs">No products match the current filters.</p>
            </div>
        );
    }
    return (
        <div className="rounded overflow-hidden">
            <ProductCarousel
                title={section.title}
                subtitle={section.subtitle || undefined}
                products={section.previewProducts.map(mapRawToProduct)}
                link={section.link || undefined}
                linkLabel={section.link_label || undefined}
            />
        </div>
    );
}

// Local copy of the mapper that lived in the old HomepageEditor. Kept
// here so this form component is self-contained for the preview.
function mapRawToProduct(raw: Record<string, unknown>): Product {
    const price = raw.price as Record<string, unknown> | undefined;
    return {
        id: (raw.id as string) || "",
        url_slug: typeof raw.url_slug === "string" ? raw.url_slug : "",
        model: (raw.model as string) || "",
        brand: (raw.brand as string) || "",
        category: (raw.category as string) || "",
        traction: (raw.traction as string | null) || null,
        name: (raw.name as string | null) || null,
        gender: (raw.gender as string) || "",
        main_image: (raw.main_image as string) || "",
        thumbnail: (raw.main_image as string) || "",
        color: (raw.color as string) || "",
        price: {
            current: (price?.current as number) || 0,
            original: (price?.original as number) || 0,
            discount_percent: (price?.discount_percent as number) || 0,
            member_price: (price?.member_price as number) || 0,
            currency: (price?.currency as string) || "£",
        },
        sizes: [],
        description: {
            subtitle: "",
            tagline: "",
            intro: "",
            collection: "",
            key_benefits: [],
            technical_details: { range: "", sole_type: "", upper_material: "", adjustment: "" },
        },
    };
}

function Field({
    label,
    tooltip,
    children,
}: {
    label: string;
    tooltip: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="flex items-center gap-2 mb-1">
                <span className="text-xs text-zinc-500">{label}</span>
                <InfoTooltip text={tooltip} />
            </label>
            {children}
        </div>
    );
}
