"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    updateBanner, addBanner, deleteBanner,
    updateSection, addSection, deleteSection,
    updateSectionItem, addSectionItem, deleteSectionItem,
    addCarouselCard, updateCarouselCard, deleteCarouselCard,
    getPreviewProducts,
} from "@/lib/actions/homepage";
import type { Product } from "@/types/product";
import ImageSelector from "./ImageSelector";
import AutoSuggest from "./AutoSuggest";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { suggestCategories, suggestBrands, suggestNames, suggestRoutes } from "@/lib/actions/suggestions";
import { logger } from "@/lib/logger";
import HeroCarousel from "@/components/homepage/HeroCarousel";
import CategorySection from "@/components/homepage/CategorySection";
import CategoryCarousel from "@/components/homepage/CategoryCarousel";
import ProductCarousel from "@/components/product/ProductCarousel";
import { sanityCdnUrl } from "@/lib/sanity-client";

function extractAssetId(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === "string" && value.startsWith("image-")) return value;
    if (typeof value === "object" && value !== null) {
        const obj = value as Record<string, unknown>;
        const asset = obj.asset;
        if (asset && typeof asset === "object") {
            const ref = (asset as Record<string, unknown>)._ref;
            if (typeof ref === "string") return ref;
        }
    }
    if (typeof value === "string" && value.includes("cdn.sanity.io")) {
        const match = value.match(/production\/(.+)\.(\w+)$/);
        if (match) {
            const base = match[1];
            const ext = match[2];
            const lastDash = base.lastIndexOf("-");
            if (lastDash !== -1) {
                const hash = base.substring(0, lastDash);
                const dims = base.substring(lastDash + 1);
                return `image-${hash}-${dims}-${ext}`;
            }
        }
    }
    return null;
}

const VARIANT_OPTIONS: Record<string, { value: string; label: string }[]> = {
    category_grid: [
        { value: "grid-4-equal", label: "Grid 4 Equal" },
        { value: "scroll-brands", label: "Scroll Brands" },
        { value: "grid-tiles-dark", label: "Grid Tiles Dark" },
        { value: "grid-3-bordered", label: "Grid 3 Bordered" },
        { value: "scroll-categories", label: "Scroll Categories" },
        { value: "asymmetric-3-2", label: "Asymmetric 3-2" },
        { value: "split-1-2", label: "Split 1-2" },
        { value: "asymmetric-2-split", label: "Asymmetric 2 Split" },
        { value: "stacked-banners", label: "Stacked Banners" },
    ],
    product_carousel: [
        { value: "default", label: "Default" },
    ],
    category_carousel: [
        { value: "default", label: "Default" },
    ],
};

function typeLabel(type: string): string {
    switch (type) {
        case "category_grid": return "Category Grid";
        case "product_carousel": return "Product Carousel";
        case "category_carousel": return "Category Carousel";
        default: return type;
    }
}

function variantLabel(variant: string, type: string): string {
    const options = VARIANT_OPTIONS[type] || [];
    const option = options.find(o => o.value === variant);
    return option ? option.label : variant;
}

// Validation rules per variant
const VARIANT_RULES = {
    "grid-4-equal": { minItems: 4, maxItems: 8, name: "Grid 4 Equal" },
    "grid-3-bordered": { minItems: 3, maxItems: 6, name: "Grid 3 Bordered" },
    "asymmetric-3-2": { minItems: 2, maxItems: 2, name: "Asymmetric 3-2" },
    "asymmetric-2-split": { minItems: 2, maxItems: 2, name: "Asymmetric 2 Split" },
    "split-1-2": { minItems: 2, maxItems: 2, name: "Split 1-2" },
    "scroll-brands": { minItems: 3, maxItems: 10, name: "Scroll Brands" },
    "scroll-categories": { minItems: 3, maxItems: 10, name: "Scroll Categories" },
    "grid-tiles-dark": { minItems: 4, maxItems: 12, name: "Grid Tiles Dark" },
    "stacked-banners": { minItems: 2, maxItems: 6, name: "Stacked Banners" },
};

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

function previewHeight(section: { type: string; variant?: string }): number {
    if (section.type === "category_carousel") return 260;
    if (section.type === "product_carousel") return 260;
    if (section.type === "category_grid") {
        const tallVariants = ["grid-4-equal", "grid-tiles-dark", "grid-3-bordered", "asymmetric-3-2", "split-1-2", "asymmetric-2-split", "stacked-banners"];
        if (tallVariants.includes(section.variant || "")) return 320;
        return 260;
    }
    return 240;
}

interface Props {
    doc: Record<string, unknown> | null;
}

export default function HomepageEditor({ doc }: Props) {
    const router = useRouter();
    const [addingBanner, setAddingBanner] = useState(false);
    
    if (!doc) return <p className="text-zinc-500">No homepage document found in Sanity.</p>;

    const heroCarousel = doc.hero_carousel as Record<string, unknown> | undefined;
    const banners = (heroCarousel?.banners as Record<string, unknown>[]) || [];
    const sections = (doc.sections as Record<string, unknown>[]) || [];

    // Banner editing states - all visible at once
    const [bannerStates, setBannerStates] = useState(banners.map((banner, i) => ({
        index: i,
        _key: banner._key || `banner-${i}`,
        title: banner.title as string || "",
        subtitle: banner.subtitle as string || "",
        button_text: banner.button_text as string || "",
        link: banner.link as string || "/",
        gradient: banner.gradient as string || "",
        accent_color: banner.accent_color as string || "#d1fd40",
        image: extractAssetId(banner.image),
        saving: false,
    })));

    // Section editing states - all visible at once
    const [sectionStates, setSectionStates] = useState(sections.map((section, i) => ({
        index: i,
        _key: section._key || `section-${i}`,
        type: (section._type || section.type) as string,
        title: section.title as string || "",
        variant: section.variant as string || "grid-4-equal",
        bg: section.bg as string || "bg-surface",
        viewAllLink: section.viewAllLink as string || "",
        viewAllLabel: section.viewAllLabel as string || "",
        subtitle: section.subtitle as string || "",
        sort: section.sort as string || "newest",
        limit: String(section.limit || "10"),
        link: section.link as string || "",
        link_label: section.link_label as string || "",
        category: ((section.filter as Record<string, unknown>)?.category as string) || "",
        brand: ((section.filter as Record<string, unknown>)?.brand as string) || "",
        modelLine: ((section.filter as Record<string, unknown>)?.name as string) || "",
        traction: ((section.filter as Record<string, unknown>)?.traction as string) || "",
        minPrice: String(((section.filter as Record<string, unknown>)?.min_price as number) ?? ""),
        maxPrice: String(((section.filter as Record<string, unknown>)?.max_price as number) ?? ""),
        autoSwitchMs: String(section.autoSwitchMs ?? "4000"),
        items: (section.items as Record<string, unknown>[] || []).map((item, ii) => ({
            _key: item._key || `item-${ii}`,
            label: item.title || item.label || "",
            link: item.link as string || "/",
            bg: item.bg as string || "",
            textColor: item.textColor as string || "text-on-surface",
            accent: item.accent as string || "",
            image: extractAssetId(item.image),
        })),
        cards: (section.cards as Record<string, unknown>[] || []).map((card, ii) => ({
            _key: card._key || `card-${ii}`,
            title: card.title as string || "",
            subtitle: card.subtitle as string || "",
            link: card.link as string || "/",
            gradient: card.gradient as string || "",
            emoji: card.emoji as string || "⚡",
            image: extractAssetId(card.image),
        })),
        saving: false,
        previewProducts: [] as Record<string, unknown>[],
    })));

    // Banner editing functions
    const updateBannerField = (index: number, field: string, value: string) => {
        setBannerStates(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
    };

    const saveBanner = async (index: number) => {
        setBannerStates(prev => prev.map((b, i) => i === index ? { ...b, saving: true } : b));
        
        const banner = bannerStates[index];
        try {
            const result = await updateBanner(index, {
                title: banner.title,
                subtitle: banner.subtitle,
                button_text: banner.button_text,
                link: banner.link,
                gradient: banner.gradient,
                accent_color: banner.accent_color,
                image: banner.image ? { _type: "image", asset: { _ref: banner.image, _type: "reference" } } : null,
            });
            if (result.error) {
                alert(result.error.message);
                return;
            }
            router.refresh();
        } catch (err) {
            logger.error(err, "Unexpected error in HomepageEditor");
            alert("Save failed due to an unexpected error.");
        } finally {
            setBannerStates(prev => prev.map((b, i) => i === index ? { ...b, saving: false } : b));
        }
    };

    const addNewBanner = async () => {
        setAddingBanner(true);
        try {
            const id = `hero-${Date.now()}`;
            await addBanner({ 
                id, 
                title: "New Banner", 
                subtitle: "", 
                button_text: "Shop Now", 
                link: "/", 
                gradient: "from-gray-900 via-gray-800 to-gray-900", 
                accent_color: "#d1fd40", 
                image: null 
            });
            router.refresh();
        } catch (err) {
            logger.error(err, "Unexpected error in HomepageEditor");
            alert("Save failed due to an unexpected error.");
        } finally {
            setAddingBanner(false);
        }
    };

    const deleteBannerFunc = async (index: number) => {
        if (!confirm(`Delete banner "${bannerStates[index].title}"?`)) return;
        
        setBannerStates(prev => prev.map((b, i) => i === index ? { ...b, saving: true } : b));
        
        try {
            const result = await deleteBanner(index);
            if (result.error) {
                alert(result.error.message);
                return;
            }
            router.refresh();
        } catch (err) {
            logger.error(err, "Unexpected error in HomepageEditor");
            alert("Delete failed due to an unexpected error.");
        } finally {
            setBannerStates(prev => prev.map((b, i) => i === index ? { ...b, saving: false } : b));
        }
    };

    // Section editing functions
    const updateSectionField = (index: number, field: string, value: string) => {
        setSectionStates(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    };

    const updateSectionItem = (sectionIndex: number, itemIndex: number, field: string, value: string) => {
        setSectionStates(prev => prev.map((s, i) => {
            if (i === sectionIndex) {
                const updatedItems = [...s.items];
                updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };
                return { ...s, items: updatedItems };
            }
            return s;
        }));
    };

    const updateSectionCard = (sectionIndex: number, cardIndex: number, field: string, value: string) => {
        setSectionStates(prev => prev.map((s, i) => {
            if (i === sectionIndex) {
                const updatedCards = [...s.cards];
                updatedCards[cardIndex] = { ...updatedCards[cardIndex], [field]: value };
                return { ...s, cards: updatedCards };
            }
            return s;
        }));
    };

    const saveSection = async (index: number) => {
        setSectionStates(prev => prev.map((s, i) => i === index ? { ...s, saving: true } : s));
        
        const section = sectionStates[index];
        
        // Validation
        const rules = VARIANT_RULES[section.variant as keyof typeof VARIANT_RULES];
        if (rules) {
            if (section.items.length < rules.minItems) {
                alert(`${rules.name} requires at least ${rules.minItems} items`);
                setSectionStates(prev => prev.map((s, i) => i === index ? { ...s, saving: false } : s));
                return;
            }
            if (section.items.length > rules.maxItems) {
                alert(`${rules.name} cannot have more than ${rules.maxItems} items`);
                setSectionStates(prev => prev.map((s, i) => i === index ? { ...s, saving: false } : s));
                return;
            }
        }
        
        if (section.type === "category_carousel" && section.cards.length < 3) {
            alert("Category Carousel requires at least 3 cards");
            setSectionStates(prev => prev.map((s, i) => i === index ? { ...s, saving: false } : s));
            return;
        }
        
        try {
            const base: Record<string, unknown> = { 
                id: section._key, 
                title: section.title, 
                type: section.type, 
                variant: section.variant 
            };
            
            if (section.type === "category_grid") {
                base.bg = section.bg;
                base.viewAllLink = section.viewAllLink || undefined;
                base.viewAllLabel = section.viewAllLabel || undefined;
                base.items = section.items.map(item => ({
                    _key: item._key,
                    label: item.label,
                    link: item.link,
                    bg: item.bg,
                    textColor: item.textColor,
                    accent: item.accent,
                    image: item.image ? { _type: "image", asset: { _ref: item.image, _type: "reference" } } : null,
                }));
            } else if (section.type === "product_carousel") {
                base.subtitle = section.subtitle || undefined;
                base.sort = section.sort;
                base.limit = parseInt(section.limit) || 10;
                base.link = section.link || undefined;
                base.link_label = section.link_label || undefined;
                base.filter = {};
                if (section.category) (base.filter as Record<string, unknown>).category = section.category;
                if (section.brand) (base.filter as Record<string, unknown>).brand = section.brand;
                if (section.modelLine) (base.filter as Record<string, unknown>).name = section.modelLine;
                if (section.traction) (base.filter as Record<string, unknown>).traction = section.traction;
                if (section.minPrice) (base.filter as Record<string, unknown>).min_price = parseFloat(section.minPrice);
                if (section.maxPrice) (base.filter as Record<string, unknown>).max_price = parseFloat(section.maxPrice);
            } else if (section.type === "category_carousel") {
                base.autoSwitchMs = parseInt(section.autoSwitchMs) || 4000;
                base.cards = section.cards.map(card => ({
                    _key: card._key,
                    title: card.title,
                    subtitle: card.subtitle,
                    link: card.link,
                    gradient: card.gradient,
                    emoji: card.emoji,
                    image: card.image ? { _type: "image", asset: { _ref: card.image, _type: "reference" } } : null,
                }));
            }
            
            const result = await updateSection(index, base);
            if (result.error) {
                alert(result.error.message);
                return;
            }
            router.refresh();
        } catch (err) {
            logger.error(err, "Unexpected error in HomepageEditor");
            alert("Save failed due to an unexpected error.");
        } finally {
            setSectionStates(prev => prev.map((s, i) => i === index ? { ...s, saving: false } : s));
        }
    };

    const handleDeleteSection = async (index: number) => {
        if (!confirm(`Delete section "${sectionStates[index].title}"?`)) return;
        
        setSectionStates(prev => prev.map((s, i) => i === index ? { ...s, saving: true } : s));
        
        try {
            const result = await handleDeleteSection(index);
            if (result.error) {
                alert(result.error.message);
                return;
            }
            router.refresh();
        } catch (err) {
            logger.error(err, "Unexpected error in HomepageEditor");
            alert("Delete failed due to an unexpected error.");
        } finally {
            setSectionStates(prev => prev.map((s, i) => i === index ? { ...s, saving: false } : s));
        }
    };

    // Fetch preview products for product_carousel sections
    const productCarouselDepKey = sectionStates
        .filter(s => s.type === "product_carousel")
        .map(s => `${s.index}:${s.category}|${s.brand}|${s.modelLine}|${s.traction}|${s.minPrice}|${s.maxPrice}|${s.sort}|${s.limit}`)
        .join("||");

    useEffect(() => {
        const fetchAll = async () => {
            const updates = await Promise.all(
                sectionStates
                    .filter(s => s.type === "product_carousel")
                    .map(async (section) => {
                        const filter: Record<string, unknown> = {};
                        if (section.category) filter.category = section.category;
                        if (section.brand) filter.brand = section.brand;
                        if (section.modelLine) filter.name = section.modelLine;
                        if (section.traction) filter.traction = section.traction;
                        if (section.minPrice) filter.minPrice = parseFloat(section.minPrice);
                        if (section.maxPrice) filter.maxPrice = parseFloat(section.maxPrice);

                        const result = await getPreviewProducts(filter, section.sort, parseInt(section.limit) || 10);
                        return { index: section.index, products: (!result.error && result.data) ? result.data : [] };
                    })
            );

            setSectionStates(prev => prev.map(s => {
                const update = updates.find(u => u.index === s.index);
                return update ? { ...s, previewProducts: update.products } : s;
            }));
        };

        fetchAll();
    }, [productCarouselDepKey]);

    const addNewSection = async () => {
        const newType: "category_grid" | "product_carousel" | "category_carousel" = "category_grid";
        const newVariant = VARIANT_OPTIONS[newType][0].value;
        
        try {
            const section: Record<string, unknown> = {
                id: `section-${Date.now()}`,
                type: newType,
                title: "New Section",
                variant: newVariant,
            };
            
            if (newType === "category_grid") {
                section.bg = "bg-surface";
                section.items = [];
            } else if (newType === "product_carousel") {
                section.filter = {};
                section.sort = "newest";
                section.limit = 10;
            } else if (newType === "category_carousel") {
                section.autoSwitchMs = 4000;
                section.cards = [];
            }
            
            const result = await addSection(section);
            if (result.error) {
                alert(result.error.message);
                return;
            }
            router.refresh();
        } catch (err) {
            logger.error(err, "Unexpected error in HomepageEditor");
            alert("Save failed due to an unexpected error.");
        }
    };

    return (
        <div className="bg-neutral-950 min-h-screen">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-black uppercase tracking-tight mb-8">Homepage Editor</h1>

                {/* Hero Section */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white">Hero Carousel</h2>
                        <button 
                            onClick={addNewBanner}
                            disabled={addingBanner}
                            className="text-sm bg-primary hover:brightness-75 disabled:opacity-50 text-on-primary px-4 py-2 rounded transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            {addingBanner ? "Adding..." : "Add Banner"}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {bannerStates.map((banner, index) => (
                            <div key={banner._key} className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-white">Banner {index + 1}</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => saveBanner(index)}
                                                disabled={banner.saving}
                                                className="text-xs bg-primary hover:brightness-75 disabled:opacity-50 text-on-primary px-3 py-1.5 rounded transition-colors"
                                            >
                                                {banner.saving ? "Saving..." : "Save"}
                                            </button>
                                            <button
                                                onClick={() => deleteBannerFunc(index)}
                                                disabled={banner.saving}
                                                className="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-zinc-500">Title</span>
                                                <InfoTooltip text="The main headline text for the banner" />
                                            </label>
                                            <input
                                                type="text"
                                                value={banner.title}
                                                onChange={(e) => updateBannerField(index, "title", e.target.value)}
                                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                placeholder="Enter banner title..."
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-zinc-500">Subtitle</span>
                                                <InfoTooltip text="Secondary text that appears below the title" />
                                            </label>
                                            <input
                                                type="text"
                                                value={banner.subtitle}
                                                onChange={(e) => updateBannerField(index, "subtitle", e.target.value)}
                                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                placeholder="Enter subtitle..."
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-zinc-500">Button Text</span>
                                                <InfoTooltip text="Text on the call-to-action button" />
                                            </label>
                                            <input
                                                type="text"
                                                value={banner.button_text}
                                                onChange={(e) => updateBannerField(index, "button_text", e.target.value)}
                                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                placeholder="Shop Now"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-zinc-500">Link</span>
                                                <InfoTooltip text="Page to navigate to when button is clicked" />
                                            </label>
                                            <AutoSuggest
                                                value={banner.link}
                                                onChange={(value) => updateBannerField(index, "link", value)}
                                                fetchSuggestions={suggestRoutes}
                                                placeholder="/path/to/page"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-zinc-500">Gradient</span>
                                                <InfoTooltip text="Background gradient for the banner" />
                                            </label>
                                            <input
                                                type="text"
                                                value={banner.gradient}
                                                onChange={(e) => updateBannerField(index, "gradient", e.target.value)}
                                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                placeholder="from-gray-900 via-gray-800 to-red-900"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-zinc-500">Accent Color</span>
                                                <InfoTooltip text="Highlight color for accents and buttons" />
                                            </label>
                                            <input
                                                type="text"
                                                value={banner.accent_color}
                                                onChange={(e) => updateBannerField(index, "accent_color", e.target.value)}
                                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                placeholder="#d1fd40"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-zinc-500">Banner Image</span>
                                                <InfoTooltip text="Large background image for the banner" />
                                            </label>
                                            <ImageSelector
                                                name={`banner-image-${index}`}
                                                value={banner.image || ""}
                                                onChange={(value) => updateBannerField(index, "image", value)}
                                                label="Banner Image"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {banner.image && (
                                    <div className="bg-neutral-800 border-t border-neutral-700 p-4">
                                        <img
                                            src={sanityCdnUrl(banner.image)}
                                            alt={banner.title}
                                            className="w-full h-24 rounded object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {/* Live Hero Carousel Preview */}
                        {bannerStates.length > 0 && (
                            <div className="border-t border-neutral-700">
                                <div className="px-6 pt-4 pb-2">
                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Live Preview</p>
                                </div>
                                <div className="relative w-full overflow-hidden" style={{ height: 240 }}>
                                    <div className="pointer-events-none scale-[0.6] origin-top-left" style={{ width: "166.67%", height: "166.67%" }}>
                                        <HeroCarousel
                                            banners={bannerStates.map(b => ({
                                                id: b._key,
                                                title: b.title,
                                                subtitle: b.subtitle,
                                                button_text: b.button_text,
                                                link: b.link,
                                                gradient: b.gradient,
                                                accent_color: b.accent_color,
                                                image: b.image ? sanityCdnUrl(b.image) : null,
                                            }))}
                                            autoSwitchMs={10000}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sections */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white">Homepage Sections</h2>
                        <button 
                            onClick={addNewSection}
                            className="text-sm bg-primary hover:brightness-75 text-on-primary px-4 py-2 rounded transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Add Section
                        </button>
                    </div>

                    <div className="space-y-6">
                        {sectionStates.map((section) => (
                            <div key={section._key} className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                                {/* Section Header */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="bg-zinc-700 text-zinc-400 text-[10px] font-bold px-2 py-1 rounded uppercase">
                                                    {typeLabel(section.type)}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 font-mono">{variantLabel(section.variant, section.type)}</span>
                                                <h3 className="text-sm font-medium text-white">{section.title || "Untitled Section"}</h3>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-1">
                                                {section.type === "category_grid" && `${section.items.length} items`}
                                                {section.type === "product_carousel" && `Limit: ${section.limit}`}
                                                {section.type === "category_carousel" && `${section.cards.length} cards`}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => saveSection(section.index)}
                                                disabled={section.saving}
                                                className="text-xs bg-primary hover:brightness-75 disabled:opacity-50 text-on-primary px-3 py-1.5 rounded transition-colors"
                                            >
                                                {section.saving ? "Saving..." : "Save Section"}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSection(section.index)}
                                                disabled={section.saving}
                                                className="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Section Settings */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-zinc-500">Title</span>
                                                <InfoTooltip text="Main heading for this section" />
                                            </label>
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => updateSectionField(section.index, "title", e.target.value)}
                                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                placeholder="Enter section title..."
                                            />
                                        </div>

                                        {section.type === "category_grid" && (
                                            <>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">Background</span>
                                                        <InfoTooltip text="Background color/style for this section" />
                                                    </label>
                                                    <select
                                                        value={section.bg}
                                                        onChange={(e) => updateSectionField(section.index, "bg", e.target.value)}
                                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                    >
                                                        <option value="bg-surface">Surface</option>
                                                        <option value="bg-surface-container">Surface Container</option>
                                                        <option value="bg-surface-container-low">Surface Container Low</option>
                                                        <option value="bg-neutral-900">Neutral 900</option>
                                                        <option value="bg-black">Black</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">View All Link</span>
                                                        <InfoTooltip text="Link to view all items in this category" />
                                                    </label>
                                                    <AutoSuggest
                                                        value={section.viewAllLink}
                                                        onChange={(value) => updateSectionField(section.index, "viewAllLink", value)}
                                                        fetchSuggestions={suggestRoutes}
                                                        placeholder="/path/to/all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">View All Label</span>
                                                        <InfoTooltip text="Text for the 'View All' button/link" />
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={section.viewAllLabel}
                                                        onChange={(e) => updateSectionField(section.index, "viewAllLabel", e.target.value)}
                                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                        placeholder="View All"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {section.type === "product_carousel" && (
                                            <>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">Subtitle</span>
                                                        <InfoTooltip text="Description text for this section" />
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={section.subtitle}
                                                        onChange={(e) => updateSectionField(section.index, "subtitle", e.target.value)}
                                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                        placeholder="Featured products"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">Sort Order</span>
                                                        <InfoTooltip text="How to sort products in this carousel" />
                                                    </label>
                                                    <select
                                                        value={section.sort}
                                                        onChange={(e) => updateSectionField(section.index, "sort", e.target.value)}
                                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                    >
                                                        <option value="newest">Newest</option>
                                                        <option value="price_asc">Price: Low to High</option>
                                                        <option value="price_desc">Price: High to Low</option>
                                                        <option value="biggest_discount">Biggest Discount</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">Limit</span>
                                                        <InfoTooltip text="Maximum number of products to show" />
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={section.limit}
                                                        onChange={(e) => updateSectionField(section.index, "limit", e.target.value)}
                                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                        min="1"
                                                        max="50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">Link</span>
                                                        <InfoTooltip text="Link to view all products in this carousel" />
                                                    </label>
                                                    <AutoSuggest
                                                        value={section.link}
                                                        onChange={(value) => updateSectionField(section.index, "link", value)}
                                                        fetchSuggestions={suggestRoutes}
                                                        placeholder="/path/to/products"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">Link Label</span>
                                                        <InfoTooltip text="Text for the link button" />
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={section.link_label}
                                                        onChange={(e) => updateSectionField(section.index, "link_label", e.target.value)}
                                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                        placeholder="View All Products"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">Category Filter</span>
                                                        <InfoTooltip text="Filter products by category" />
                                                    </label>
                                                    <AutoSuggest
                                                        value={section.category}
                                                        onChange={(value) => updateSectionField(section.index, "category", value)}
                                                        fetchSuggestions={suggestCategories}
                                                        placeholder="Select category"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">Brand Filter</span>
                                                        <InfoTooltip text="Filter products by brand" />
                                                    </label>
                                                    <AutoSuggest
                                                        value={section.brand}
                                                        onChange={(value) => updateSectionField(section.index, "brand", value)}
                                                        fetchSuggestions={suggestBrands}
                                                        placeholder="Select brand"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">Model Filter</span>
                                                        <InfoTooltip text="Filter products by model name (last segment after /)" />
                                                    </label>
                                                    <AutoSuggest
                                                        value={section.modelLine}
                                                        onChange={(value) => updateSectionField(section.index, "modelLine", value)}
                                                        fetchSuggestions={suggestNames}
                                                        placeholder="Select model"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">Traction Filter</span>
                                                        <InfoTooltip text="Filter products by traction type" />
                                                    </label>
                                                    <select
                                                        value={section.traction}
                                                        onChange={(e) => updateSectionField(section.index, "traction", e.target.value)}
                                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                    >
                                                        <option value="">Any</option>
                                                        <option value="Firm Ground">Firm Ground</option>
                                                        <option value="Soft Ground">Soft Ground</option>
                                                        <option value="Artificial Grass">Artificial Grass</option>
                                                        <option value="Indoor">Indoor</option>
                                                        <option value="Turf">Turf</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">Min Price</span>
                                                        <InfoTooltip text="Minimum price filter" />
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={section.minPrice}
                                                        onChange={(e) => updateSectionField(section.index, "minPrice", e.target.value)}
                                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-zinc-500">Max Price</span>
                                                        <InfoTooltip text="Maximum price filter" />
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={section.maxPrice}
                                                        onChange={(e) => updateSectionField(section.index, "maxPrice", e.target.value)}
                                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="999.99"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {section.type === "category_carousel" && (
                                            <div>
                                                <label className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-zinc-500">Auto Switch (ms)</span>
                                                    <InfoTooltip text="Time between automatic card switches in milliseconds" />
                                                </label>
                                                <input
                                                    type="number"
                                                    value={section.autoSwitchMs}
                                                    onChange={(e) => updateSectionField(section.index, "autoSwitchMs", e.target.value)}
                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                    min="1000"
                                                    max="10000"
                                                    step="500"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Items */}
                                    {section.type === "category_grid" && (
                                        <div className="border-t border-neutral-700 pt-4">
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                                                Category Items ({section.items.length})
                                            </h4>
                                            <div className="space-y-4">
                                                {section.items.map((item, itemIndex) => (
                                                    <div key={item._key} className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs text-zinc-500">Label</span>
                                                                    <InfoTooltip text="Display name for this category item" />
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={item.label}
                                                                    onChange={(e) => updateSectionItem(section.index, itemIndex, "label", e.target.value)}
                                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                                    placeholder="Item label"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs text-zinc-500">Link</span>
                                                                    <InfoTooltip text="Page to navigate to when item is clicked" />
                                                                </label>
                                                                <AutoSuggest
                                                                    value={item.link}
                                                                    onChange={(value) => updateSectionItem(section.index, itemIndex, "link", value)}
                                                                    fetchSuggestions={suggestRoutes}
                                                                    placeholder="/path/to/page"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs text-zinc-500">Background</span>
                                                                    <InfoTooltip text="Background color for this item" />
                                                                </label>
                                                                <select
                                                                    value={item.bg}
                                                                    onChange={(e) => updateSectionItem(section.index, itemIndex, "bg", e.target.value)}
                                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                                >
                                                                    <option value="bg-surface">Surface</option>
                                                                    <option value="bg-surface-container">Surface Container</option>
                                                                    <option value="bg-surface-container-low">Surface Container Low</option>
                                                                    <option value="bg-neutral-900">Neutral 900</option>
                                                                    <option value="bg-black">Black</option>
                                                                    <option value="bg-primary">Primary</option>
                                                                    <option value="bg-primary-container">Primary Container</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs text-zinc-500">Text Color</span>
                                                                    <InfoTooltip text="Text color for this item" />
                                                                </label>
                                                                <select
                                                                    value={item.textColor}
                                                                    onChange={(e) => updateSectionItem(section.index, itemIndex, "textColor", e.target.value)}
                                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                                >
                                                                    <option value="text-on-surface">On Surface</option>
                                                                    <option value="text-on-primary">On Primary</option>
                                                                    <option value="text-white">White</option>
                                                                    <option value="text-black">Black</option>
                                                                    <option value="text-zinc-300">Zinc 300</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs text-zinc-500">Item Image</span>
                                                                <InfoTooltip text="Image for this category item" />
                                                            </label>
                                                            <ImageSelector
                                                                name={`item-image-${section.index}-${itemIndex}`}
                                                                value={item.image || ""}
                                                                onChange={(value) => updateSectionItem(section.index, itemIndex, "image", value)}
                                                                label="Item Image"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {section.type === "category_carousel" && (
                                        <div className="border-t border-neutral-700 pt-4">
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                                                Carousel Cards ({section.cards.length})
                                                {section.cards.length < 3 && (
                                                    <span className="text-xs text-amber-500 ml-2">Minimum 3 cards required</span>
                                                )}
                                            </h4>
                                            <div className="space-y-4">
                                                {section.cards.map((card, cardIndex) => (
                                                    <div key={card._key} className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs text-zinc-500">Title</span>
                                                                    <InfoTooltip text="Main title for this card" />
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={card.title}
                                                                    onChange={(e) => updateSectionCard(section.index, cardIndex, "title", e.target.value)}
                                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                                    placeholder="Card title"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs text-zinc-500">Subtitle</span>
                                                                    <InfoTooltip text="Description text for this card" />
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={card.subtitle}
                                                                    onChange={(e) => updateSectionCard(section.index, cardIndex, "subtitle", e.target.value)}
                                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                                    placeholder="Card subtitle"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs text-zinc-500">Link</span>
                                                                    <InfoTooltip text="Page to navigate to when card is clicked" />
                                                                </label>
                                                                <AutoSuggest
                                                                    value={card.link}
                                                                    onChange={(value) => updateSectionCard(section.index, cardIndex, "link", value)}
                                                                    fetchSuggestions={suggestRoutes}
                                                                    placeholder="/path/to/page"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs text-zinc-500">Gradient</span>
                                                                    <InfoTooltip text="Background gradient for this card" />
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={card.gradient}
                                                                    onChange={(e) => updateSectionCard(section.index, cardIndex, "gradient", e.target.value)}
                                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                                    placeholder="from-gray-900 via-gray-800 to-red-900"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs text-zinc-500">Emoji</span>
                                                                    <InfoTooltip text="Icon emoji for this card" />
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={card.emoji}
                                                                    onChange={(e) => updateSectionCard(section.index, cardIndex, "emoji", e.target.value)}
                                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                                                    placeholder="⚡"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs text-zinc-500">Card Image</span>
                                                                <InfoTooltip text="Image for this carousel card" />
                                                            </label>
                                                            <ImageSelector
                                                                name={`card-image-${section.index}-${cardIndex}`}
                                                                value={card.image || ""}
                                                                onChange={(value) => updateSectionCard(section.index, cardIndex, "image", value)}
                                                                label="Card Image"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Live Section Preview */}
                                <div className="border-t border-neutral-700">
                                    <div className="px-6 pt-4 pb-2">
                                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Live Preview</p>
                                    </div>
                                    <div className="relative w-full overflow-hidden" style={{ height: previewHeight(section) }}>
                                        <div className="pointer-events-none scale-[0.6] origin-top-left" style={{ width: "166.67%", height: "166.67%" }}>
                                            {section.type === "category_grid" && (
                                                <CategorySection
                                                    title={section.title}
                                                    items={section.items.map(item => ({
                                                        _key: item._key,
                                                        label: item.label,
                                                        link: item.link,
                                                        image: item.image ? sanityCdnUrl(item.image) : undefined,
                                                        bg: item.bg,
                                                        textColor: item.textColor,
                                                        accent: item.accent,
                                                    }))}
                                                    variant={section.variant as any}
                                                    viewAllLink={section.viewAllLink || undefined}
                                                    viewAllLabel={section.viewAllLabel || undefined}
                                                    bg={section.bg}
                                                />
                                            )}
                                            {section.type === "category_carousel" && (
                                                <CategoryCarousel
                                                    cards={section.cards.map(card => ({
                                                        id: card._key,
                                                        title: card.title,
                                                        subtitle: card.subtitle,
                                                        link: card.link,
                                                        image: card.image ? sanityCdnUrl(card.image) : undefined,
                                                        gradient: card.gradient,
                                                        emoji: card.emoji,
                                                    }))}
                                                    autoSwitchMs={parseInt(section.autoSwitchMs) || 4000}
                                                />
                                            )}
                                            {section.type === "product_carousel" && section.previewProducts && section.previewProducts.length > 0 && (
                                                <ProductCarousel
                                                    title={section.title}
                                                    subtitle={section.subtitle || undefined}
                                                    products={section.previewProducts.map(mapRawToProduct)}
                                                    link={section.link || undefined}
                                                    linkLabel={section.link_label || undefined}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}