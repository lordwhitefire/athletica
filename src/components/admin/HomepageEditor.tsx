"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getPreviewProducts, saveHomepage } from "@/lib/actions/homepage";
import { useUnsavedChanges } from "@/lib/hooks/useUnsavedChanges";
import { logger } from "@/lib/logger";
import { suggestRoutes } from "@/lib/actions/suggestions";
import { sanityCdnUrl } from "@/lib/sanity-client";
import EditPopup from "./homepage/EditPopup";
import Overview, { type OverviewItem } from "./homepage/Overview";
import BannerForm, { BannerPreview } from "./homepage/BannerForm";
import CategoryGridForm, { CategoryGridPreview } from "./homepage/CategoryGridForm";
import CategoryCarouselForm, { CategoryCarouselPreview } from "./homepage/CategoryCarouselForm";
import ProductCarouselForm, { ProductCarouselPreview } from "./homepage/ProductCarouselForm";
import {
    VARIANT_RULES,
    type BannerState,
    type SectionState,
    type SectionStateCard,
    type SectionStateItem,
    type VariantKey,
} from "./homepage/types";

interface Props {
    doc: Record<string, unknown>;
}

// --- helpers (kept verbatim from the old editor) ---

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

function generateEmptyItems(count: number): SectionStateItem[] {
    return Array.from({ length: count }, (_, i) => ({
        _key: `item-${Date.now()}-${i}`,
        label: "",
        link: "/",
        bg: "",
        textColor: "text-on-surface",
        accent: "",
        image: null,
    }));
}

function generateEmptyCards(count: number): SectionStateCard[] {
    return Array.from({ length: count }, (_, i) => ({
        _key: `card-${Date.now()}-${i}`,
        title: "",
        subtitle: "",
        link: "/",
        gradient: "from-gray-900 via-gray-800 to-red-900",
        emoji: "⚡",
        image: null,
    }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomepageEditor({ doc }: Props) {
    const router = useRouter();
    const { isDirty, markDirty, markClean } = useUnsavedChanges();
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // --- Banner state ---
    const heroCarousel = doc.hero_carousel as Record<string, unknown> | undefined;
    const bannersRaw = ((heroCarousel?.banners as Record<string, unknown>[]) || []);
    const [bannerStates, setBannerStates] = useState<BannerState[]>(bannersRaw.map((banner, i) => ({
        index: i,
        _key: (banner._key as string) || `banner-${i}`,
        title: banner.title as string || "",
        subtitle: banner.subtitle as string || "",
        button_text: banner.button_text as string || "",
        link: banner.link as string || "/",
        gradient: banner.gradient as string || "",
        accent_color: banner.accent_color as string || "#d1fd40",
        image: extractAssetId(banner.image),
        saving: false,
    })));

    // --- Section state ---
    const sectionsRaw = (doc.sections as Record<string, unknown>[]) || [];
    const [sectionStates, setSectionStates] = useState<SectionState[]>(sectionsRaw.map((section, i) => ({
        index: i,
        _key: (section._key as string) || `section-${i}`,
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
            _key: (item._key as string) || `item-${ii}`,
            label: (item.title as string) || (item.label as string) || "",
            link: (item.link as string) || "/",
            bg: (item.bg as string) || "",
            textColor: (item.textColor as string) || "text-on-surface",
            accent: (item.accent as string) || "",
            image: extractAssetId(item.image),
        })),
        cards: (section.cards as Record<string, unknown>[] || []).map((card, ii) => ({
            _key: (card._key as string) || `card-${ii}`,
            title: card.title as string || "",
            subtitle: card.subtitle as string || "",
            link: card.link as string || "/",
            gradient: card.gradient as string || "",
            emoji: card.emoji as string || "⚡",
            image: extractAssetId(card.image),
        })),
        saving: false,
        previewProducts: [] as Record<string, unknown>[],
        previewLoaded: false,
        previewLoading: false,
    })));

    // --- Auto-dismiss toasts ---
    useEffect(() => {
        if (lastSaved === null) return;
        const t = setTimeout(() => setLastSaved(null), 2500);
        return () => clearTimeout(t);
    }, [lastSaved]);

    useEffect(() => {
        if (errorMessage === null) return;
        const t = setTimeout(() => setErrorMessage(null), 5000);
        return () => clearTimeout(t);
    }, [errorMessage]);

    if (!doc) return <p className="text-zinc-500">No homepage document found in Sanity.</p>;

    // --- Lazy preview loader (one product_carousel at a time). Bug #11. ---
    const loadPreview = useCallback(async (sectionIndex: number) => {
        const section = sectionStates.find(s => s.index === sectionIndex);
        if (!section || section.type !== "product_carousel") return;
        if (section.previewLoading) return;

        setSectionStates(prev => prev.map(s =>
            s.index === sectionIndex ? { ...s, previewLoading: true } : s
        ));

        const filter: Record<string, unknown> = {};
        if (section.category) filter.category = section.category;
        if (section.brand) filter.brand = section.brand;
        if (section.modelLine) filter.name = section.modelLine;
        if (section.traction) filter.traction = section.traction;
        if (section.minPrice) filter.minPrice = parseFloat(section.minPrice);
        if (section.maxPrice) filter.maxPrice = parseFloat(section.maxPrice);

        const result = await getPreviewProducts(filter, section.sort, parseInt(section.limit) || 10);
        const products = (!result.error && result.data) ? result.data : [];

        setSectionStates(prev => prev.map(s =>
            s.index === sectionIndex
                ? { ...s, previewProducts: products, previewLoaded: true, previewLoading: false }
                : s
        ));
    }, [sectionStates]);

    // Refetch live previews when their filters change (PR #4 lazy pattern).
    const liveCarouselDepKey = sectionStates
        .filter(s => s.type === "product_carousel" && s.previewLoaded)
        .map(s => `${s.index}:${s.category}|${s.brand}|${s.modelLine}|${s.traction}|${s.minPrice}|${s.maxPrice}|${s.sort}|${s.limit}`)
        .join("||");

    useEffect(() => {
        if (!liveCarouselDepKey) return;
        const liveIndexes = sectionStates
            .filter(s => s.type === "product_carousel" && s.previewLoaded)
            .map(s => s.index);
        liveIndexes.forEach(loadPreview);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [liveCarouselDepKey]);

    // --- Banner editing ---
    const updateBannerField = (index: number, field: keyof BannerState, value: string | null) => {
        setBannerStates(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
        markDirty();
    };

    const addNewBanner = () => {
        setBannerStates(prev => [...prev, {
            index: prev.length,
            _key: `hero-${Date.now()}`,
            title: "New Banner",
            subtitle: "",
            button_text: "Shop Now",
            link: "/",
            gradient: "from-gray-900 via-gray-800 to-gray-900",
            accent_color: "#d1fd40",
            image: null,
            saving: false,
        }]);
        markDirty();
    };

    const deleteBannerFunc = (index: number) => {
        if (!confirm(`Delete banner "${bannerStates[index].title}"?`)) return;
        setBannerStates(prev => prev.filter((_, i) => i !== index).map((b, i) => ({ ...b, index: i })));
        markDirty();
    };

    // --- Section editing ---
    const updateSectionField = (index: number, field: keyof SectionState, value: string | null) => {
        setSectionStates(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
        markDirty();
    };

    const updateSectionItem = (sectionIndex: number, itemIndex: number, field: keyof SectionStateItem, value: string | null) => {
        setSectionStates(prev => prev.map((s, i) => {
            if (i === sectionIndex) {
                const updatedItems = [...s.items];
                updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };
                return { ...s, items: updatedItems };
            }
            return s;
        }));
        markDirty();
    };

    const updateSectionCard = (sectionIndex: number, cardIndex: number, field: keyof SectionStateCard, value: string | null) => {
        setSectionStates(prev => prev.map((s, i) => {
            if (i === sectionIndex) {
                const updatedCards = [...s.cards];
                updatedCards[cardIndex] = { ...updatedCards[cardIndex], [field]: value };
                return { ...s, cards: updatedCards };
            }
            return s;
        }));
        markDirty();
    };

    const handleDeleteSection = (index: number) => {
        if (!confirm(`Delete section "${sectionStates[index].title}"?`)) return;
        setSectionStates(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, index: i })));
        markDirty();
    };

    // --- Reorder handlers (driven by @dnd-kit in Overview) ---
    const reorderBanners = (from: number, to: number) => {
        setBannerStates(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next.map((b, i) => ({ ...b, index: i }));
        });
        markDirty();
    };

    const reorderSections = (from: number, to: number) => {
        setSectionStates(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next.map((s, i) => ({ ...s, index: i }));
        });
        markDirty();
    };

    // --- Add/remove/reorder items & cards within sections ---
    const addItem = (sectionIndex: number) => {
        setSectionStates(prev => prev.map((s, i) => {
            if (i !== sectionIndex) return s;
            const rules = VARIANT_RULES[s.variant as VariantKey];
            if (rules && s.items.length >= rules.maxItems) return s;
            return { ...s, items: [...s.items, ...generateEmptyItems(1)] };
        }));
        markDirty();
    };

    const removeItem = (sectionIndex: number, itemIndex: number) => {
        setSectionStates(prev => prev.map((s, i) => {
            if (i !== sectionIndex) return s;
            const rules = VARIANT_RULES[s.variant as VariantKey];
            if (rules && s.items.length <= rules.minItems) return s;
            return { ...s, items: s.items.filter((_, j) => j !== itemIndex) };
        }));
        markDirty();
    };

    const reorderItems = (sectionIndex: number, from: number, to: number) => {
        setSectionStates(prev => prev.map((s, i) => {
            if (i !== sectionIndex) return s;
            const next = [...s.items];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return { ...s, items: next };
        }));
        markDirty();
    };

    const addCard = (sectionIndex: number) => {
        setSectionStates(prev => prev.map((s, i) =>
            i === sectionIndex ? { ...s, cards: [...s.cards, ...generateEmptyCards(1)] } : s
        ));
        markDirty();
    };

    const removeCard = (sectionIndex: number, cardIndex: number) => {
        setSectionStates(prev => prev.map((s, i) => {
            if (i !== sectionIndex) return s;
            if (s.cards.length <= 3) return s; // min 3 cards
            return { ...s, cards: s.cards.filter((_, j) => j !== cardIndex) };
        }));
        markDirty();
    };

    const reorderCards = (sectionIndex: number, from: number, to: number) => {
        setSectionStates(prev => prev.map((s, i) => {
            if (i !== sectionIndex) return s;
            const next = [...s.cards];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return { ...s, cards: next };
        }));
        markDirty();
    };

    // --- Add Section dialog ---
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newSectionType, setNewSectionType] = useState<"category_grid" | "product_carousel" | "category_carousel">("category_grid");
    const [newSectionVariant, setNewSectionVariant] = useState("grid-4-equal");

    const handleAddSectionConfirmed = () => {
        setShowAddDialog(false);
        const rules = newSectionType === "category_grid"
            ? VARIANT_RULES[newSectionVariant as VariantKey]
            : null;
        const section: SectionState = {
            index: sectionStates.length,
            _key: `section-${Date.now()}`,
            type: newSectionType,
            title: "New Section",
            variant: newSectionVariant,
            bg: "bg-surface",
            viewAllLink: "",
            viewAllLabel: "",
            subtitle: "",
            sort: "newest",
            limit: "10",
            link: "",
            link_label: "",
            category: "",
            brand: "",
            modelLine: "",
            traction: "",
            minPrice: "",
            maxPrice: "",
            autoSwitchMs: "4000",
            items: newSectionType === "category_grid" ? generateEmptyItems(rules?.minItems || 4) : [],
            cards: newSectionType === "category_carousel" ? generateEmptyCards(3) : [],
            saving: false,
            previewProducts: [],
            previewLoaded: false,
            previewLoading: false,
        };
        setSectionStates(prev => [...prev, section]);
        markDirty();
    };

    // --- Popup state ---
    const [editingBanner, setEditingBanner] = useState<number | null>(null);
    const [editingSection, setEditingSection] = useState<number | null>(null);

    const editingBannerState = editingBanner !== null ? bannerStates[editingBanner] : null;
    const editingSectionState = editingSection !== null ? sectionStates[editingSection] : null;

    // --- Save All ---
    const sectionToRaw = (s: SectionState): Record<string, unknown> => {
        const base: Record<string, unknown> = {
            _key: s._key,
            _type: s.type,
            title: s.title,
            bg: s.bg,
        };
        if (s.type === "category_grid") {
            base.variant = s.variant;
            base.viewAllLink = s.viewAllLink || undefined;
            base.viewAllLabel = s.viewAllLabel || undefined;
            base.items = s.items.map(item => ({
                _key: item._key,
                title: item.label,
                label: item.label,
                link: item.link,
                bg: item.bg,
                textColor: item.textColor,
                accent: item.accent,
                image: item.image ? { _type: "image", asset: { _ref: item.image, _type: "reference" } } : null,
            }));
        } else if (s.type === "product_carousel") {
            base.subtitle = s.subtitle || undefined;
            base.sort = s.sort;
            base.limit = parseInt(s.limit) || 10;
            base.link = s.link || undefined;
            base.link_label = s.link_label || undefined;
            base.filter = {} as Record<string, unknown>;
            if (s.category) (base.filter as Record<string, unknown>).category = s.category;
            if (s.brand) (base.filter as Record<string, unknown>).brand = s.brand;
            if (s.modelLine) (base.filter as Record<string, unknown>).name = s.modelLine;
            if (s.traction) (base.filter as Record<string, unknown>).traction = s.traction;
            if (s.minPrice) (base.filter as Record<string, unknown>).min_price = parseFloat(s.minPrice);
            if (s.maxPrice) (base.filter as Record<string, unknown>).max_price = parseFloat(s.maxPrice);
        } else if (s.type === "category_carousel") {
            base.autoSwitchMs = parseInt(s.autoSwitchMs) || 4000;
            base.cards = s.cards.map(card => ({
                _key: card._key,
                title: card.title,
                subtitle: card.subtitle,
                link: card.link,
                gradient: card.gradient,
                emoji: card.emoji,
                image: card.image ? { _type: "image", asset: { _ref: card.image, _type: "reference" } } : null,
            }));
        }
        return base;
    };

    const handleSaveAll = async () => {
        setErrorMessage(null);
        for (const s of sectionStates) {
            const rules = VARIANT_RULES[s.variant as VariantKey];
            if (rules) {
                if (s.items.length < rules.minItems) {
                    setErrorMessage(`"${s.title || "Untitled"}" (${rules.name}) requires at least ${rules.minItems} items`);
                    return;
                }
                if (s.items.length > rules.maxItems) {
                    setErrorMessage(`"${s.title || "Untitled"}" (${rules.name}) cannot have more than ${rules.maxItems} items`);
                    return;
                }
            }
            if (s.type === "category_carousel" && s.cards.length < 3) {
                setErrorMessage(`"${s.title || "Untitled"}" requires at least 3 cards`);
                return;
            }
        }
        setIsSaving(true);
        try {
            const hero_carousel = {
                banners: bannerStates.map(b => ({
                    _key: b._key,
                    title: b.title,
                    subtitle: b.subtitle,
                    button_text: b.button_text,
                    link: b.link,
                    gradient: b.gradient,
                    accent_color: b.accent_color,
                    image: b.image ? { _type: "image", asset: { _ref: b.image, _type: "reference" } } : null,
                })),
            };
            const sections = sectionStates.map(sectionToRaw);
            const result = await saveHomepage({ hero_carousel, sections });
            if (result.error) {
                setErrorMessage(result.error.message);
                return;
            }
            markClean();
            setLastSaved(Date.now());
            router.refresh();
        } catch (err) {
            logger.error(err, "Unexpected error in HomepageEditor");
            setErrorMessage("Save failed due to an unexpected error.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Overview item adapters ---
    const bannerOverviewItems: OverviewItem[] = bannerStates.map(b => ({
        _key: b._key,
        type: "banner",
        title: b.title,
        index: b.index,
        thumbUrl: b.image ? sanityCdnUrl(b.image) : null,
    }));

    const sectionOverviewItems: OverviewItem[] = sectionStates.map(s => ({
        _key: s._key,
        type: s.type,
        variant: s.variant,
        title: s.title,
        index: s.index,
        itemCount: s.type === "category_grid" ? s.items.length : s.type === "category_carousel" ? s.cards.length : undefined,
    }));

    // =========================================================================
    // Render
    // =========================================================================

    return (
        <div className="bg-neutral-950 min-h-screen" data-testid="homepage-editor-page">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Top toolbar */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-black uppercase tracking-tight">Homepage Editor</h1>
                    <div className="flex items-center gap-3">
                        {errorMessage !== null && (
                            <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">error</span>
                                {errorMessage}
                            </span>
                        )}
                        {lastSaved !== null && errorMessage === null && (
                            <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Saved!
                            </span>
                        )}
                        {isDirty && errorMessage === null && (
                            <span className="text-xs text-amber-400 font-medium">Unsaved changes</span>
                        )}
                        <button
                            onClick={handleSaveAll}
                            disabled={!isDirty || isSaving}
                            className="bg-primary hover:brightness-75 disabled:opacity-50 text-on-primary text-sm font-bold px-5 py-2 rounded transition-colors flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : lastSaved !== null ? (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                    Saved
                                </>
                            ) : (
                                "Save All"
                            )}
                        </button>
                    </div>
                </div>

                {/* Read-only overview (bug #9) with DnD reorder (bug #10) */}
                <Overview
                    banners={bannerOverviewItems}
                    sections={sectionOverviewItems}
                    onReorderBanners={reorderBanners}
                    onReorderSections={reorderSections}
                    onEditBanner={(index) => setEditingBanner(index)}
                    onEditSection={(index) => setEditingSection(index)}
                    onAddBanner={addNewBanner}
                    onAddSection={() => { setNewSectionType("category_grid"); setNewSectionVariant("grid-4-equal"); setShowAddDialog(true); }}
                />

                {/* Per-card delete actions on overview are tricky to surface
                    cleanly without making the card busy; we expose a small
                    "Manage" footer area where the user can delete banners
                    and sections by index. */}
                {(bannerStates.length > 0 || sectionStates.length > 0) && (
                    <div className="mt-10 pt-6 border-t border-neutral-800 space-y-3">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            Manage existing
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {bannerStates.map((b, i) => (
                                <button
                                    key={b._key}
                                    onClick={() => deleteBannerFunc(i)}
                                    className="text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                                >
                                    Delete banner #{i + 1} ({b.title || "Untitled"})
                                </button>
                            ))}
                            {sectionStates.map((s, i) => (
                                <button
                                    key={s._key}
                                    onClick={() => handleDeleteSection(i)}
                                    className="text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                                >
                                    Delete section #{i + 1} ({s.title || "Untitled"})
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Section dialog (unchanged from old editor) */}
            {showAddDialog && (
                <AddSectionDialog
                    newSectionType={newSectionType}
                    newSectionVariant={newSectionVariant}
                    onSetType={setNewSectionType}
                    onSetVariant={setNewSectionVariant}
                    onCancel={() => setShowAddDialog(false)}
                    onConfirm={handleAddSectionConfirmed}
                />
            )}

            {/* Banner edit popup (full-size preview — bug #8) */}
            <EditPopup
                open={editingBanner !== null}
                title={editingBannerState ? `Banner #${editingBanner! + 1}` : ""}
                subtitle="Edit banner — changes apply immediately, click Save All to persist"
                onClose={() => setEditingBanner(null)}
                preview={editingBannerState && (
                    <BannerPreview banners={bannerStates} />
                )}
            >
                {editingBannerState && (
                    <BannerForm
                        banner={editingBannerState}
                        allBanners={bannerStates}
                        onUpdate={(field, value) => updateBannerField(editingBanner!, field, value)}
                    />
                )}
            </EditPopup>

            {/* Section edit popup */}
            <EditPopup
                open={editingSection !== null}
                title={editingSectionState ? `Section #${editingSection! + 1}` : ""}
                subtitle={
                    editingSectionState
                        ? `${typeLabel(editingSectionState.type)}${editingSectionState.variant ? ` · ${variantLabel(editingSectionState.variant)}` : ""} — changes apply immediately, click Save All to persist`
                        : ""
                }
                onClose={() => setEditingSection(null)}
                preview={editingSectionState && (
                    <>
                        {editingSectionState.type === "category_grid" && (
                            <CategoryGridPreview section={editingSectionState} />
                        )}
                        {editingSectionState.type === "category_carousel" && (
                            <CategoryCarouselPreview section={editingSectionState} />
                        )}
                        {editingSectionState.type === "product_carousel" && (
                            <ProductCarouselPreview section={editingSectionState} />
                        )}
                    </>
                )}
            >
                {editingSectionState && (
                    <>
                        {editingSectionState.type === "category_grid" && (
                            <CategoryGridForm
                                section={editingSectionState}
                                onUpdateField={(field, value) => updateSectionField(editingSection!, field, value)}
                                onUpdateItem={(itemIndex, field, value) => updateSectionItem(editingSection!, itemIndex, field, value)}
                                onAddItem={() => addItem(editingSection!)}
                                onRemoveItem={(itemIndex) => removeItem(editingSection!, itemIndex)}
                                onReorderItems={(from, to) => reorderItems(editingSection!, from, to)}
                            />
                        )}
                        {editingSectionState.type === "category_carousel" && (
                            <CategoryCarouselForm
                                section={editingSectionState}
                                onUpdateField={(field, value) => updateSectionField(editingSection!, field, value)}
                                onUpdateCard={(cardIndex, field, value) => updateSectionCard(editingSection!, cardIndex, field, value)}
                                onAddCard={() => addCard(editingSection!)}
                                onRemoveCard={(cardIndex) => removeCard(editingSection!, cardIndex)}
                                onReorderCards={(from, to) => reorderCards(editingSection!, from, to)}
                            />
                        )}
                        {editingSectionState.type === "product_carousel" && (
                            <ProductCarouselForm
                                section={editingSectionState}
                                onUpdateField={(field, value) => updateSectionField(editingSection!, field, value)}
                                onLoadPreview={() => loadPreview(editingSection!)}
                            />
                        )}
                    </>
                )}
            </EditPopup>
        </div>
    );
}

// --- Add Section dialog (kept from old editor) ---
function AddSectionDialog({
    newSectionType,
    newSectionVariant,
    onSetType,
    onSetVariant,
    onCancel,
    onConfirm,
}: {
    newSectionType: "category_grid" | "product_carousel" | "category_carousel";
    newSectionVariant: string;
    onSetType: (t: "category_grid" | "product_carousel" | "category_carousel") => void;
    onSetVariant: (v: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
}) {
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
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md" role="dialog" aria-modal="true">
                <h3 className="text-lg font-bold text-white mb-4">Add Section</h3>

                <label className="text-xs text-zinc-500 block mb-2">Section Type</label>
                <div className="flex gap-2 mb-4">
                    {(["category_grid", "product_carousel", "category_carousel"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => {
                                onSetType(t);
                                const firstVariant = VARIANT_OPTIONS[t]?.[0]?.value || "default";
                                onSetVariant(firstVariant);
                            }}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                newSectionType === t
                                    ? "bg-primary text-on-primary"
                                    : "bg-neutral-800 text-zinc-400 hover:text-white"
                            }`}
                        >
                            {typeLabel(t)}
                        </button>
                    ))}
                </div>

                {newSectionType === "category_grid" && (
                    <>
                        <label className="text-xs text-zinc-500 block mb-2">Variant</label>
                        <select
                            value={newSectionVariant}
                            onChange={(e) => onSetVariant(e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm mb-4"
                        >
                            {VARIANT_OPTIONS.category_grid.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {newSectionVariant && VARIANT_RULES[newSectionVariant as VariantKey] && (
                            <p className="text-xs text-zinc-500 mb-4">
                                Requires {VARIANT_RULES[newSectionVariant as VariantKey].minItems}–{VARIANT_RULES[newSectionVariant as VariantKey].maxItems} items
                            </p>
                        )}
                    </>
                )}

                {newSectionType === "category_carousel" && (
                    <p className="text-xs text-zinc-500 mb-4">Starts with 3 cards (minimum). You can add more later.</p>
                )}

                {newSectionType === "product_carousel" && (
                    <p className="text-xs text-zinc-500 mb-4">A product carousel with filter options. Configure after adding.</p>
                )}

                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white bg-neutral-800 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm bg-primary text-on-primary rounded hover:brightness-75 transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- labels ---
function typeLabel(type: string): string {
    switch (type) {
        case "category_grid": return "Category Grid";
        case "product_carousel": return "Product Carousel";
        case "category_carousel": return "Category Carousel";
        default: return type;
    }
}

function variantLabel(variant: string): string {
    const labels: Record<string, string> = {
        "grid-4-equal": "Grid 4 Equal",
        "scroll-brands": "Scroll Brands",
        "grid-tiles-dark": "Grid Tiles Dark",
        "grid-3-bordered": "Grid 3 Bordered",
        "scroll-categories": "Scroll Categories",
        "asymmetric-3-2": "Asymmetric 3-2",
        "split-1-2": "Split 1-2",
        "asymmetric-2-split": "Asymmetric 2 Split",
        "stacked-banners": "Stacked Banners",
    };
    return labels[variant] || variant;
}
