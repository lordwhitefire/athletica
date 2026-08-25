"use client";

import React, { useCallback, useEffect } from "react";
import ImageSelector from "@/components/admin/ImageSelector";
import {
    getDistinctTractions,
    getHomepageDoc,
    getPreviewProducts,
    saveHomepage,
} from "@/lib/actions/homepage";

// ---------------------------------------------------------------------------
// Draft types — mirror the editor document shape produced by getHomepageDoc
// ---------------------------------------------------------------------------

interface BannerDraft {
    _key: string;
    title: string;
    subtitle: string;
    button_text: string;
    link: string;
    gradient: string;
    accent_color: string;
    image: string | null;
}

interface ItemDraft {
    _key: string;
    title: string;
    label: string;
    link: string;
    bg: string;
    textColor: string;
    accent: string;
    image: string | null;
}

interface CardDraft {
    _key: string;
    id: string;
    title: string;
    subtitle: string;
    link: string;
    gradient: string;
    emoji: string;
    image: string | null;
}

interface SectionBaseDraft {
    _key: string;
    type: "category_grid" | "category_carousel" | "product_carousel";
    variant: string;
    title: string;
    subtitle: string;
}

interface GridSectionDraft extends SectionBaseDraft {
    type: "category_grid";
    bg: string;
    viewAllLink: string;
    viewAllLabel: string;
    items: ItemDraft[];
}

interface CarouselSectionDraft extends SectionBaseDraft {
    type: "category_carousel";
    autoSwitchMs: number;
    cards: CardDraft[];
}

interface ProductCarouselSectionDraft extends SectionBaseDraft {
    type: "product_carousel";
    sort: string;
    limit: number;
    link: string;
    link_label: string;
    filter: Record<string, string | number>;
}

type SectionDraft = GridSectionDraft | CarouselSectionDraft | ProductCarouselSectionDraft;

interface PreviewItem {
    name: string;
    brand: string;
    price: number | null;
    main_image: string | null;
}

const SORTS = ["newest", "price_asc", "price_desc"];
const GRID_VARIANTS = ["grid-4-equal", "grid-2-feature", "grid-3-equal"];

function newKey(): string {
    return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function str(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseBanner(raw: Record<string, unknown>): BannerDraft {
    return {
        _key: str(raw._key) || str(raw.id) || newKey(),
        title: str(raw.title),
        subtitle: str(raw.subtitle),
        button_text: str(raw.button_text),
        link: str(raw.link, "/"),
        gradient: str(raw.gradient),
        accent_color: str(raw.accent_color),
        image: typeof raw.image === "string" && raw.image ? raw.image : null,
    };
}

function parseItem(raw: Record<string, unknown>): ItemDraft {
    return {
        _key: str(raw._key) || newKey(),
        title: str(raw.title),
        label: str(raw.label),
        link: str(raw.link, "/"),
        bg: str(raw.bg),
        textColor: str(raw.textColor),
        accent: str(raw.accent),
        image: typeof raw.image === "string" && raw.image ? raw.image : null,
    };
}

function parseCard(raw: Record<string, unknown>): CardDraft {
    return {
        _key: str(raw._key) || newKey(),
        id: str(raw.id) || newKey(),
        title: str(raw.title),
        subtitle: str(raw.subtitle),
        link: str(raw.link, "/"),
        gradient: str(raw.gradient),
        emoji: str(raw.emoji),
        image: typeof raw.image === "string" && raw.image ? raw.image : null,
    };
}

function parseSection(raw: Record<string, unknown>): SectionDraft {
    const type = str(raw.type);
    const base = {
        _key: str(raw._key) || newKey(),
        variant: str(raw.variant, "default"),
        title: str(raw.title),
        subtitle: str(raw.subtitle),
    };
    if (type === "category_grid") {
        const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
        return {
            ...base,
            type: "category_grid",
            variant: str(raw.variant, "grid-4-equal"),
            bg: str(raw.bg, "bg-surface"),
            viewAllLink: str(raw.viewAllLink),
            viewAllLabel: str(raw.viewAllLabel),
            items: itemsRaw.map((it) => parseItem((it ?? {}) as Record<string, unknown>)),
        };
    }
    if (type === "category_carousel") {
        const cardsRaw = Array.isArray(raw.cards) ? raw.cards : [];
        return {
            ...base,
            type: "category_carousel",
            autoSwitchMs: num(raw.autoSwitchMs, 4000),
            cards: cardsRaw.map((c) => parseCard((c ?? {}) as Record<string, unknown>)),
        };
    }
    const filter =
        raw.filter && typeof raw.filter === "object"
            ? (raw.filter as Record<string, unknown>)
            : {};
    const cleaned: Record<string, string | number> = {};
    for (const key of ["brand", "category", "traction", "name"]) {
        if (typeof filter[key] === "string" && filter[key]) cleaned[key] = filter[key] as string;
    }
    for (const key of ["min_price", "max_price"]) {
        if (typeof filter[key] === "number") cleaned[key] = filter[key] as number;
    }
    return {
        ...base,
        type: "product_carousel",
        sort: str(raw.sort, "newest"),
        limit: num(raw.limit, 10),
        link: str(raw.link),
        link_label: str(raw.link_label),
        filter: cleaned,
    };
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

const inputCls =
    "w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#b8ff18]/60 focus:outline-none";
const labelCls = "block text-[11px] uppercase tracking-wider font-medium text-zinc-500 mb-1";

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className={labelCls}>{label}</span>
            {children}
        </label>
    );
}

function Thumb({ value }: { value: string | null }) {
    if (!value) {
        return (
            <div className="w-full h-full grid place-items-center text-neutral-600 material-symbols-outlined">
                image
            </div>
        );
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={value} alt="" className="w-full h-full object-cover" />;
}

function ListControls({
    index,
    count,
    onMove,
    onRemove,
    removeLabel,
}: {
    index: number;
    count: number;
    onMove: (from: number, to: number) => void;
    onRemove: () => void;
    removeLabel: string;
}) {
    return (
        <div className="flex items-center gap-1">
            <button
                type="button"
                disabled={index === 0}
                onClick={() => onMove(index, index - 1)}
                className="w-7 h-7 grid place-items-center rounded border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 disabled:opacity-30"
                aria-label="Move up"
            >
                <span className="material-symbols-outlined text-base">keyboard_arrow_up</span>
            </button>
            <button
                type="button"
                disabled={index === count - 1}
                onClick={() => onMove(index, index + 1)}
                className="w-7 h-7 grid place-items-center rounded border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 disabled:opacity-30"
                aria-label="Move down"
            >
                <span className="material-symbols-outlined text-base">keyboard_arrow_down</span>
            </button>
            <button
                type="button"
                onClick={onRemove}
                className="h-7 px-2 grid place-items-center rounded border border-red-900/60 text-red-400 hover:bg-red-950/40 text-xs"
                aria-label={removeLabel}
            >
                <span className="material-symbols-outlined text-base">delete</span>
            </button>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Hero banners
// ---------------------------------------------------------------------------

function BannerCard({
    banner,
    index,
    count,
    onChange,
    onMove,
    onRemove,
}: {
    banner: BannerDraft;
    index: number;
    count: number;
    onChange: (patch: Partial<BannerDraft>) => void;
    onMove: (from: number, to: number) => void;
    onRemove: () => void;
}) {
    return (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Banner {index + 1}
                </span>
                <ListControls
                    index={index}
                    count={count}
                    onMove={onMove}
                    onRemove={onRemove}
                    removeLabel={`Delete banner ${index + 1}`}
                />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <Field label="Title">
                    <input
                        className={inputCls}
                        value={banner.title}
                        onChange={(e) => onChange({ title: e.target.value })}
                    />
                </Field>
                <Field label="Subtitle">
                    <input
                        className={inputCls}
                        value={banner.subtitle}
                        onChange={(e) => onChange({ subtitle: e.target.value })}
                    />
                </Field>
                <Field label="Button text">
                    <input
                        className={inputCls}
                        value={banner.button_text}
                        onChange={(e) => onChange({ button_text: e.target.value })}
                        placeholder="Shop Now"
                    />
                </Field>
                <Field label="Link">
                    <input
                        className={inputCls}
                        value={banner.link}
                        onChange={(e) => onChange({ link: e.target.value })}
                        placeholder="/category/football-boots"
                    />
                </Field>
                <Field label="Gradient (tailwind classes)">
                    <input
                        className={inputCls}
                        value={banner.gradient}
                        onChange={(e) => onChange({ gradient: e.target.value })}
                        placeholder="from-emerald-900 to-black"
                    />
                </Field>
                <Field label="Accent color (hex)">
                    <input
                        className={inputCls}
                        value={banner.accent_color}
                        onChange={(e) => onChange({ accent_color: e.target.value })}
                        placeholder="#b8ff18"
                    />
                </Field>
            </div>

            <ImageSelector
                name={`banner-${banner._key}-image`}
                label="Background image"
                value={banner.image}
                onChange={(assetId) => onChange({ image: assetId })}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Category grid section
// ---------------------------------------------------------------------------

function GridSectionEditor({
    section,
    onPatch,
}: {
    section: GridSectionDraft;
    onPatch: (patch: Partial<GridSectionDraft>) => void;
}) {
    const items = section.items;

    function setItem(index: number, patch: Partial<ItemDraft>) {
        onPatch({
            items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        });
    }

    function addItem() {
        onPatch({
            items: [
                ...items,
                {
                    _key: newKey(),
                    title: "",
                    label: "",
                    link: "/",
                    bg: "",
                    textColor: "",
                    accent: "",
                    image: null,
                },
            ],
        });
    }

    function removeItem(index: number) {
        onPatch({ items: items.filter((_, i) => i !== index) });
    }

    function moveItem(from: number, to: number) {
        const next = [...items];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onPatch({ items: next });
    }

    return (
        <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-4">
                <Field label="Variant">
                    <select
                        className={inputCls}
                        value={section.variant}
                        onChange={(e) => onPatch({ variant: e.target.value })}
                    >
                        {GRID_VARIANTS.map((v) => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Background class">
                    <input
                        className={inputCls}
                        value={section.bg}
                        onChange={(e) => onPatch({ bg: e.target.value })}
                        placeholder="bg-surface"
                    />
                </Field>
                <Field label="View-all link">
                    <input
                        className={inputCls}
                        value={section.viewAllLink}
                        onChange={(e) => onPatch({ viewAllLink: e.target.value })}
                        placeholder="/collections"
                    />
                </Field>
                <Field label="View-all label">
                    <input
                        className={inputCls}
                        value={section.viewAllLabel}
                        onChange={(e) => onPatch({ viewAllLabel: e.target.value })}
                        placeholder="View all"
                    />
                </Field>
            </div>

            <div className="space-y-2">
                {items.map((item, i) => (
                    <div
                        key={item._key}
                        className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 flex flex-col gap-3 lg:flex-row lg:items-start"
                    >
                        <div className="w-20 h-20 shrink-0 rounded overflow-hidden border border-neutral-800 bg-neutral-950">
                            <Thumb value={item.image} />
                        </div>
                        <div className="flex-1 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            <Field label="Title">
                                <input
                                    className={inputCls}
                                    value={item.title}
                                    onChange={(e) => setItem(i, { title: e.target.value })}
                                />
                            </Field>
                            <Field label="Label">
                                <input
                                    className={inputCls}
                                    value={item.label}
                                    onChange={(e) => setItem(i, { label: e.target.value })}
                                />
                            </Field>
                            <Field label="Link">
                                <input
                                    className={inputCls}
                                    value={item.link}
                                    onChange={(e) => setItem(i, { link: e.target.value })}
                                />
                            </Field>
                            <Field label="BG class">
                                <input
                                    className={inputCls}
                                    value={item.bg}
                                    onChange={(e) => setItem(i, { bg: e.target.value })}
                                />
                            </Field>
                            <Field label="Text color class">
                                <input
                                    className={inputCls}
                                    value={item.textColor}
                                    onChange={(e) => setItem(i, { textColor: e.target.value })}
                                />
                            </Field>
                            <Field label="Accent color">
                                <input
                                    className={inputCls}
                                    value={item.accent}
                                    onChange={(e) => setItem(i, { accent: e.target.value })}
                                />
                            </Field>
                            <div className="sm:col-span-2 xl:col-span-3">
                                <ImageSelector
                                    name={`${section._key}-item-${item._key}`}
                                    label="Tile image"
                                    value={item.image}
                                    onChange={(assetId) => setItem(i, { image: assetId })}
                                />
                            </div>
                        </div>
                        <ListControls
                            index={i}
                            count={items.length}
                            onMove={moveItem}
                            onRemove={() => removeItem(i)}
                            removeLabel={`Remove tile ${i + 1}`}
                        />
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addItem}
                    className="text-xs uppercase tracking-wider font-medium border border-dashed border-neutral-700 rounded-lg w-full py-2.5 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
                >
                    + Add tile
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Category carousel section
// ---------------------------------------------------------------------------

function CarouselSectionEditor({
    section,
    onPatch,
}: {
    section: CarouselSectionDraft;
    onPatch: (patch: Partial<CarouselSectionDraft>) => void;
}) {
    const cards = section.cards;

    function setCard(index: number, patch: Partial<CardDraft>) {
        onPatch({
            cards: cards.map((card, i) => (i === index ? { ...card, ...patch } : card)),
        });
    }

    function addCard() {
        onPatch({
            cards: [
                ...cards,
                {
                    _key: newKey(),
                    id: newKey(),
                    title: "",
                    subtitle: "",
                    link: "/",
                    gradient: "",
                    emoji: "",
                    image: null,
                },
            ],
        });
    }

    function removeCard(index: number) {
        onPatch({ cards: cards.filter((_, i) => i !== index) });
    }

    function moveCard(from: number, to: number) {
        const next = [...cards];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onPatch({ cards: next });
    }

    return (
        <div className="space-y-3">
            <Field label="Auto-switch interval (ms)">
                <input
                    type="number"
                    min={1000}
                    step={500}
                    className={`${inputCls} max-w-40`}
                    value={section.autoSwitchMs}
                    onChange={(e) => onPatch({ autoSwitchMs: Number(e.target.value) || 4000 })}
                />
            </Field>

            <div className="space-y-2">
                {cards.map((card, i) => (
                    <div
                        key={card._key}
                        className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 flex flex-col gap-3 lg:flex-row lg:items-start"
                    >
                        <div className="w-20 h-20 shrink-0 rounded overflow-hidden border border-neutral-800 bg-neutral-950">
                            <Thumb value={card.image} />
                        </div>
                        <div className="flex-1 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            <Field label="Title">
                                <input
                                    className={inputCls}
                                    value={card.title}
                                    onChange={(e) => setCard(i, { title: e.target.value })}
                                />
                            </Field>
                            <Field label="Subtitle">
                                <input
                                    className={inputCls}
                                    value={card.subtitle}
                                    onChange={(e) => setCard(i, { subtitle: e.target.value })}
                                />
                            </Field>
                            <Field label="Link">
                                <input
                                    className={inputCls}
                                    value={card.link}
                                    onChange={(e) => setCard(i, { link: e.target.value })}
                                />
                            </Field>
                            <Field label="Gradient classes">
                                <input
                                    className={inputCls}
                                    value={card.gradient}
                                    onChange={(e) => setCard(i, { gradient: e.target.value })}
                                />
                            </Field>
                            <Field label="Emoji">
                                <input
                                    className={inputCls}
                                    value={card.emoji}
                                    onChange={(e) => setCard(i, { emoji: e.target.value })}
                                    placeholder="⚽"
                                />
                            </Field>
                            <div className="xl:col-span-3">
                                <ImageSelector
                                    name={`${section._key}-card-${card._key}`}
                                    label="Card image"
                                    value={card.image}
                                    onChange={(assetId) => setCard(i, { image: assetId })}
                                />
                            </div>
                        </div>
                        <ListControls
                            index={i}
                            count={cards.length}
                            onMove={moveCard}
                            onRemove={() => removeCard(i)}
                            removeLabel={`Remove slide ${i + 1}`}
                        />
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addCard}
                    className="text-xs uppercase tracking-wider font-medium border border-dashed border-neutral-700 rounded-lg w-full py-2.5 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
                >
                    + Add slide
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Product carousel section (DB-driven, live preview)
// ---------------------------------------------------------------------------

function ProductCarouselEditor({
    section,
    tractions,
    preview,
    onPreview,
    onPatch,
}: {
    section: ProductCarouselSectionDraft;
    tractions: string[];
    preview: { loading: boolean; error: string | null; items: PreviewItem[] } | undefined;
    onPreview: () => void;
    onPatch: (patch: Partial<ProductCarouselSectionDraft>) => void;
}) {
    const filter = section.filter;

    function setFilter(key: string, value: string) {
        const next: Record<string, string | number> = { ...filter };
        if (value === "") delete next[key];
        else next[key] = key === "min_price" || key === "max_price" ? Number(value) || 0 : value;
        onPatch({ filter: next });
    }

    return (
    <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-4">
            <Field label="Sort">
                <select
                    className={inputCls}
                    value={section.sort}
                    onChange={(e) => onPatch({ sort: e.target.value })}
                >
                    {SORTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </Field>
            <Field label="Product limit">
                <input
                    type="number"
                    min={1}
                    max={24}
                    className={inputCls}
                    value={section.limit}
                    onChange={(e) => onPatch({ limit: Math.max(1, Number(e.target.value) || 10) })}
                />
            </Field>
            <Field label="View-all link">
                <input
                    className={inputCls}
                    value={section.link}
                    onChange={(e) => onPatch({ link: e.target.value })}
                    placeholder="/collections/all"
                />
            </Field>
            <Field label="View-all label">
                <input
                    className={inputCls}
                    value={section.link_label}
                    onChange={(e) => onPatch({ link_label: e.target.value })}
                    placeholder="View all"
                />
            </Field>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 space-y-3">
            <p className="text-[11px] uppercase tracking-wider font-medium text-zinc-500">
                Product filter — resolved against live catalog data
            </p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="Brand">
                    <input
                        className={inputCls}
                        value={str(filter.brand)}
                        onChange={(e) => setFilter("brand", e.target.value)}
                        placeholder="e.g. Nike"
                    />
                </Field>
                <Field label="Category">
                    <input
                        className={inputCls}
                        value={str(filter.category)}
                        onChange={(e) => setFilter("category", e.target.value)}
                        placeholder="e.g. Football Boots"
                    />
                </Field>
                <Field label="Traction">
                    <select
                        className={inputCls}
                        value={str(filter.traction)}
                        onChange={(e) => setFilter("traction", e.target.value)}
                    >
                        <option value="">Any</option>
                        {tractions.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Name contains">
                    <input
                        className={inputCls}
                        value={str(filter.name)}
                        onChange={(e) => setFilter("name", e.target.value)}
                        placeholder="Mercurial"
                    />
                </Field>
                <Field label="Min price">
                    <input
                        type="number"
                        min={0}
                        className={inputCls}
                        value={filter.min_price !== undefined ? String(filter.min_price) : ""}
                        onChange={(e) => setFilter("min_price", e.target.value)}
                    />
                </Field>
                <Field label="Max price">
                    <input
                        type="number"
                        min={0}
                        className={inputCls}
                        value={filter.max_price !== undefined ? String(filter.max_price) : ""}
                        onChange={(e) => setFilter("max_price", e.target.value)}
                    />
                </Field>
            </div>

            <button
                type="button"
                onClick={onPreview}
                className="text-xs uppercase tracking-wider font-medium bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded transition-colors"
            >
                {preview?.loading ? "Loading…" : "Preview matched products"}
            </button>

            {preview?.error && (
                <p role="alert" className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                    {preview.error}
                </p>
            )}

            {preview && preview.items.length > 0 && !preview.error && (
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-2 pt-1">
                    {preview.items.map((item, i) => (
                        <div
                            key={`${section._key}-preview-${i}`}
                            className="rounded border border-neutral-800 overflow-hidden bg-neutral-950"
                        >
                            <div className="aspect-square bg-neutral-900">
                                <Thumb value={item.main_image} />
                            </div>
                            <div className="p-2">
                                <p className="text-xs text-white truncate">{item.name}</p>
                                <p className="text-[11px] text-neutral-500 truncate">
                                    {item.brand}
                                    {item.price != null ? ` · €${item.price}` : ""}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {preview && !preview.loading && preview.items.length === 0 && !preview.error && (
                <p className="text-xs text-neutral-500">No products match this filter yet.</p>
            )}
        </div>
    </div>
    );
}

// ---------------------------------------------------------------------------
// Main manager
// ---------------------------------------------------------------------------

export default function HomepageManager() {
    const [loading, setLoading] = React.useState(true);
    const [loadError, setLoadError] = React.useState<string | null>(null);
    const [banners, setBanners] = React.useState<BannerDraft[]>([]);
    const [sections, setSections] = React.useState<SectionDraft[]>([]);
    const [tractions, setTractions] = React.useState<string[]>([]);
    const [dirty, setDirty] = React.useState(false);
    const [confirming, setConfirming] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [saveError, setSaveError] = React.useState<string | null>(null);
    const [savedAt, setSavedAt] = React.useState<string | null>(null);
    const [addingSection, setAddingSection] = React.useState(false);
    const [loadedRowIds, setLoadedRowIds] = React.useState<string[]>([]);
    const [previews, setPreviews] = React.useState<
        Record<string, { loading: boolean; error: string | null; items: PreviewItem[] }>
    >({});

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [docResult, tractionResult] = await Promise.all([
                getHomepageDoc(),
                getDistinctTractions(),
            ]);
            if (docResult.error || !docResult.data) {
                throw new Error(docResult.error?.message ?? "Failed to load homepage.");
            }
            const doc = docResult.data as Record<string, unknown>;
            const hero = (doc.hero_carousel ?? {}) as Record<string, unknown>;
            const bannersRaw = Array.isArray(hero.banners) ? hero.banners : [];
            const sectionsRaw = Array.isArray(doc.sections) ? doc.sections : [];
            setBanners(bannersRaw.map((b) => parseBanner((b ?? {}) as Record<string, unknown>)));
            setSections(sectionsRaw.map((s) => parseSection((s ?? {}) as Record<string, unknown>)));
            const meta = (doc._meta ?? {}) as { loaded_row_ids?: unknown };
            setLoadedRowIds(
                Array.isArray(meta.loaded_row_ids) ? (meta.loaded_row_ids as string[]) : [],
            );
            if (tractionResult.data) setTractions(tractionResult.data);
            setDirty(false);
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : "Failed to load homepage.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    function touch() {
        setDirty(true);
        setSavedAt(null);
    }

    function setBanner(index: number, patch: Partial<BannerDraft>) {
        touch();
        setBanners((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
    }

    function moveBanner(from: number, to: number) {
        touch();
        setBanners((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    }

    function addBanner() {
        touch();
        setBanners((prev) => [
            ...prev,
            {
                _key: newKey(),
                title: "",
                subtitle: "",
                button_text: "Shop Now",
                link: "/",
                gradient: "",
                accent_color: "#b8ff18",
                image: null,
            },
        ]);
    }

    function removeBanner(index: number) {
        touch();
        setBanners((prev) => prev.filter((_, i) => i !== index));
    }

    function patchSection(index: number, patch: Partial<SectionDraft>) {
        touch();
        setSections(
            (prev) =>
                prev.map((s, i) => {
                    if (i !== index) return s;
                    return { ...s, ...patch } as SectionDraft;
                }),
        );
    }

    function moveSection(from: number, to: number) {
        touch();
        setSections((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    }

    function removeSection(index: number) {
        touch();
        setSections((prev) => prev.filter((_, i) => i !== index));
    }

    function addSection(type: SectionDraft["type"]) {
        touch();
        setAddingSection(false);
        const key = newKey();
        if (type === "category_grid") {
            setSections((prev) => [
                ...prev,
                {
                    _key: key,
                    type,
                    variant: "grid-4-equal",
                    title: "",
                    subtitle: "",
                    bg: "bg-surface",
                    viewAllLink: "",
                    viewAllLabel: "",
                    items: [],
                },
            ]);
        } else if (type === "category_carousel") {
            setSections((prev) => [
                ...prev,
                {
                    _key: key,
                    type,
                    variant: "default",
                    title: "",
                    subtitle: "",
                    autoSwitchMs: 4000,
                    cards: [],
                },
            ]);
        } else {
            setSections((prev) => [
                ...prev,
                {
                    _key: key,
                    type,
                    variant: "default",
                    title: "",
                    subtitle: "",
                    sort: "newest",
                    limit: 10,
                    link: "",
                    link_label: "",
                    filter: {},
                },
            ]);
        }
    }

    async function runPreview(section: ProductCarouselSectionDraft) {
        setPreviews((prev) => ({
            ...prev,
            [section._key]: { loading: true, error: null, items: [] },
        }));
        try {
            const result = await getPreviewProducts(section.filter, section.sort, section.limit);
            if (result.error || !result.data) {
                throw new Error(result.error?.message ?? "Preview failed.");
            }
            setPreviews((prev) => ({
                ...prev,
                [section._key]: {
                    loading: false,
                    error: null,
                    items: result.data as unknown as PreviewItem[],
                },
            }));
        } catch (err) {
            setPreviews((prev) => ({
                ...prev,
                [section._key]: {
                    loading: false,
                    error: err instanceof Error ? err.message : "Preview failed.",
                    items: [],
                },
            }));
        }
    }

    async function publish() {
        // Total-wipe second confirmation: an empty draft over existing content
        // must be confirmed twice (the publish modal is the first ask).
        const emptyDraft = banners.length === 0 && sections.length === 0;
        const wiping = emptyDraft && loadedRowIds.length > 0;
        if (
            wiping &&
            !window.confirm(
                `You are about to DELETE ALL ${loadedRowIds.length} homepage items. This cannot be undone. Continue?`,
            )
        ) {
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const result = await saveHomepage(
                {
                    hero_carousel: { banners },
                    sections: sections.map((s) => ({ ...s, _type: s.type })) as unknown as Record<
                        string,
                        unknown
                    >[],
                },
                loadedRowIds,
                wiping,
            );
            if (result.error) {
                throw new Error(result.error.message ?? "Save failed.");
            }
            setConfirming(false);
            setDirty(false);
            setSavedAt(new Date().toLocaleTimeString());
            await load();
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Save failed.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="p-6 space-y-4 animate-pulse">
                <div className="h-9 bg-neutral-800 rounded w-72" />
                <div className="h-16 bg-neutral-900 border border-neutral-800 rounded-lg" />
                <div className="h-64 bg-neutral-900 border border-neutral-800 rounded-lg" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="p-6">
                <div className="rounded-lg border border-red-900 bg-red-950/40 p-4 max-w-xl">
                    <p className="font-semibold text-red-200 mb-1">Could not load the homepage</p>
                    <p className="text-sm text-red-300/80 mb-3">{loadError}</p>
                    <button
                        type="button"
                        onClick={() => void load()}
                        className="text-xs uppercase tracking-wider font-medium bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 pb-32">
            {/* Header */}
            <header className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="page-title text-2xl font-black uppercase tracking-tight text-white">
                        Homepage Management
                    </h1>
                    <p className="page-subtitle text-sm text-neutral-500 mt-1">
                        Edit the live homepage: hero carousel, category grids and product carousels.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {savedAt && !dirty && (
                        <span className="text-xs text-emerald-400">Published at {savedAt}</span>
                    )}
                    {dirty && (
                        <span className="text-xs text-amber-400 uppercase tracking-wider font-semibold">
                            Unpublished changes
                        </span>
                    )}
                    {!dirty ? (
                        <button
                            type="button"
                            disabled
                            className="text-xs uppercase tracking-wider font-bold bg-neutral-800 text-neutral-500 px-5 py-2.5 rounded cursor-not-allowed"
                        >
                            Publish changes
                        </button>
                    ) : confirming ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-300">
                                Replace the live homepage with this version?
                            </span>
                            <button
                                type="button"
                                onClick={() => setConfirming(false)}
                                className="text-xs uppercase tracking-wider font-medium bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void publish()}
                                disabled={saving}
                                className="text-xs uppercase tracking-wider font-bold bg-[#b8ff18] hover:brightness-110 text-black px-5 py-2 rounded disabled:opacity-50"
                            >
                                {saving ? "Publishing…" : "Yes, publish"}
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            className="text-xs uppercase tracking-wider font-bold bg-[#b8ff18] hover:brightness-110 text-black px-5 py-2.5 rounded transition"
                        >
                            Publish changes
                        </button>
                    )}
                </div>
            </header>

            {saveError && (
                <p role="alert" className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                    {saveError}
                </p>
            )}

            {/* Hero carousel */}
            <section className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">
                        Hero carousel
                    </h2>
                    <button
                        type="button"
                        onClick={addBanner}
                        className="text-xs uppercase tracking-wider font-medium border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white px-3 py-1.5 rounded transition-colors"
                    >
                        + Add banner
                    </button>
                </div>
                {banners.length === 0 && (
                    <p className="text-sm text-neutral-500">No hero banners yet.</p>
                )}
                <div className="space-y-3">
                    {banners.map((banner, i) => (
                        <BannerCard
                            key={banner._key}
                            banner={banner}
                            index={i}
                            count={banners.length}
                            onChange={(patch) => setBanner(i, patch)}
                            onMove={moveBanner}
                            onRemove={() => removeBanner(i)}
                        />
                    ))}
                </div>
            </section>

            {/* Sections */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">
                        Homepage sections ({sections.length})
                    </h2>
                    <button
                        type="button"
                        onClick={() => setAddingSection((v) => !v)}
                        className="text-xs uppercase tracking-wider font-medium border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white px-3 py-1.5 rounded transition-colors"
                    >
                        + Add section
                    </button>
                </div>

                {addingSection && (
                    <div className="rounded-xl border border-dashed border-neutral-700 p-4 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => addSection("category_grid")}
                            className="text-xs uppercase tracking-wider font-medium bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded"
                        >
                            Category grid
                        </button>
                        <button
                            type="button"
                            onClick={() => addSection("category_carousel")}
                            className="text-xs uppercase tracking-wider font-medium bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded"
                        >
                            Category carousel
                        </button>
                        <button
                            type="button"
                            onClick={() => addSection("product_carousel")}
                            className="text-xs uppercase tracking-wider font-medium bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded"
                        >
                            Product carousel
                        </button>
                    </div>
                )}

                {sections.map((section, i) => (
                    <div
                        key={section._key}
                        className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3"
                    >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-neutral-800 text-[#b8ff18] px-2 py-1 rounded">
                                    {section.type.replace(/_/g, " ")}
                                </span>
                                <input
                                    className={`${inputCls} max-w-xs`}
                                    value={section.title}
                                    onChange={(e) =>
                                        patchSection(i, { title: e.target.value } as Partial<SectionDraft>)
                                    }
                                    placeholder="Section title"
                                />
                                <input
                                    className={`${inputCls} max-w-md`}
                                    value={section.subtitle}
                                    onChange={(e) =>
                                        patchSection(i, { subtitle: e.target.value } as Partial<SectionDraft>)
                                    }
                                    placeholder="Subtitle (optional)"
                                />
                            </div>
                            <ListControls
                                index={i}
                                count={sections.length}
                                onMove={moveSection}
                                onRemove={() => removeSection(i)}
                                removeLabel={`Delete section ${i + 1}`}
                            />
                        </div>

                        {section.type === "category_grid" && (
                            <GridSectionEditor
                                section={section}
                                onPatch={(patch) => patchSection(i, patch)}
                            />
                        )}
                        {section.type === "category_carousel" && (
                            <CarouselSectionEditor
                                section={section}
                                onPatch={(patch) => patchSection(i, patch)}
                            />
                        )}
                        {section.type === "product_carousel" && (
                            <ProductCarouselEditor
                                section={section}
                                tractions={tractions}
                                preview={previews[section._key]}
                                onPreview={() => void runPreview(section)}
                                onPatch={(patch) => patchSection(i, patch)}
                            />
                        )}
                    </div>
                ))}
            </section>

            {/* Sticky save bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
                <div className="max-w-full mx-0 px-6 py-3 bg-neutral-950/95 border-t border-neutral-800 backdrop-blur flex justify-end pointer-events-auto">
                    <div className="flex items-center gap-3">
                        {dirty ? (
                            <>
                                <span className="text-xs text-amber-400 uppercase tracking-wider font-semibold">
                                    Unpublished changes
                                </span>
                                {confirming ? (
                                    <>
                                        <span className="text-xs text-neutral-300 hidden md:inline">
                                            Replace the live homepage?
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setConfirming(false)}
                                            className="text-xs uppercase tracking-wider font-medium bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void publish()}
                                            disabled={saving}
                                            className="text-xs uppercase tracking-wider font-bold bg-[#b8ff18] hover:brightness-110 text-black px-5 py-2 rounded disabled:opacity-50"
                                        >
                                            {saving ? "Publishing…" : "Yes, publish"}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setConfirming(true)}
                                        className="text-xs uppercase tracking-wider font-bold bg-[#b8ff18] hover:brightness-110 text-black px-5 py-2.5 rounded transition"
                                    >
                                        Publish changes
                                    </button>
                                )}
                            </>
                        ) : (
                            <span className="text-xs text-neutral-500">
                                {savedAt ? `Published at ${savedAt}` : "No pending changes"}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
