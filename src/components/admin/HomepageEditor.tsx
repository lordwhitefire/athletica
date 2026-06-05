"use client";

import { useState, useEffect } from "react";
import {
    updateBanner, addBanner, deleteBanner,
    updateSection, addSection, deleteSection,
    updateSectionItem, addSectionItem, deleteSectionItem,
} from "@/lib/actions/homepage";
import { useRouter } from "next/navigation";
import ImageSelector from "./ImageSelector";
import AutoSuggest from "./AutoSuggest";
import { suggestCategories, suggestBrands, suggestNames, suggestRoutes } from "@/lib/actions/suggestions";

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

    return (
        <div>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-6">Homepage Editor</h1>

            <Section title="Hero Carousel" icon="slideshow">
                <div className="space-y-3">
                    {banners.map((banner, i) => (
                        <BannerEditor key={banner.id as string || i} banner={banner} index={i} />
                    ))}
                    <button onClick={async () => {
                        setAddingBanner(true);
                        const id = `hero-${Date.now()}`;
                        await addBanner({ id, title: "New Banner", subtitle: "", button_text: "Shop Now", link: "/", gradient: "from-gray-900 via-gray-800 to-gray-900", accent_color: "#ef4444", image: null });
                        router.refresh();
                        setAddingBanner(false);
                    }} disabled={addingBanner} className="text-sm text-red-500 hover:text-red-400 disabled:text-zinc-600 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">add</span> {addingBanner ? "Adding..." : "Add Banner"}
                    </button>
                </div>
            </Section>

            <Section title="Sections" icon="section">
                <div className="space-y-3">
                    {sections.map((section, i) => (
                        <SectionEditor key={section.id as string || i} section={section} index={i} />
                    ))}
                    <AddSectionForm />
                </div>
            </Section>
        </div>
    );

    function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
        return (
            <div className="bg-neutral-900 border border-neutral-800 rounded p-6 mb-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-800">
                    <span className="material-symbols-outlined text-zinc-500 text-[18px]">{icon}</span>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">{title}</h2>
                </div>
                {children}
            </div>
        );
    }

    function Field({ label, value, onChange, type = "text", step, placeholder }: {
        label: string; value: string; onChange: (v: string) => void; type?: string; step?: string; placeholder?: string;
    }) {
        return (
            <div>
                <label className="block text-zinc-500 text-xs font-medium mb-0.5">{label}</label>
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} step={step}
                    placeholder={placeholder}
                    className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded text-xs focus:outline-none focus:border-red-600 transition-colors" />
            </div>
        );
    }

    function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
        return (
            <div>
                <label className="block text-zinc-500 text-xs font-medium mb-0.5">{label}</label>
                <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2}
                    className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded text-xs focus:outline-none focus:border-red-600 transition-colors" />
            </div>
        );
    }

    function BannerEditor({ banner, index }: { banner: Record<string, unknown>; index: number }) {
        const [editing, setEditing] = useState(false);
        const [saving, setSaving] = useState(false);
        const [deleting, setDeleting] = useState(false);
        const [title, setTitle] = useState(banner.title as string || "");
        const [subtitle, setSubtitle] = useState(banner.subtitle as string || "");
        const [buttonText, setButtonText] = useState(banner.button_text as string || "");
        const [link, setLink] = useState(banner.link as string || "");
        const [gradient, setGradient] = useState(banner.gradient as string || "");
        const [accentColor, setAccentColor] = useState(banner.accent_color as string || "");
        const [image, setImage] = useState<string | null>(extractAssetId(banner.image));

        async function save() {
            setSaving(true);
            try {
                await updateBanner(index, { title, subtitle, button_text: buttonText, link, gradient, accent_color: accentColor, image: image ? { _type: "image", asset: { _ref: image, _type: "reference" } } : null });
                setEditing(false);
                router.refresh();
            } catch (err) {
                console.error("Failed to save banner:", err);
                alert("Save failed");
            } finally {
                setSaving(false);
            }
        }

        async function remove() {
            if (!confirm(`Delete banner "${title}"?`)) return;
            setDeleting(true);
            try {
                await deleteBanner(index);
                router.refresh();
            } catch (err) {
                console.error("Failed to delete banner:", err);
                alert("Delete failed");
            } finally {
                setDeleting(false);
            }
        }

        if (!editing) {
            return (
                <div className="bg-neutral-800 rounded p-3 flex items-center justify-between group">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded flex items-center justify-center bg-zinc-700 text-[10px] text-zinc-400 font-mono">{index + 1}</span>
                            <span className="text-sm font-medium text-zinc-200 truncate">{banner.title as string || "Untitled"}</span>
                        </div>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">{banner.subtitle as string}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setEditing(true)} className="text-zinc-500 hover:text-white p-1"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                        <button onClick={remove} className="text-zinc-500 hover:text-red-500 p-1"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-neutral-800 rounded p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Banner {index + 1}</span>
                    <button onClick={() => setEditing(false)} className="text-xs bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded transition-colors">Cancel</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Title" value={title} onChange={setTitle} />
                    <Field label="Button Text" value={buttonText} onChange={setButtonText} />
                    <Field label="Subtitle" value={subtitle} onChange={setSubtitle} />
                    <AutoSuggest label="Link" value={link} onChange={setLink} fetchSuggestions={suggestRoutes} />
                    <Field label="Gradient" value={gradient} onChange={setGradient} placeholder="from-gray-900 via-gray-800 to-red-900" />
                    <Field label="Accent Color" value={accentColor} onChange={setAccentColor} placeholder="#ef4444" />
                </div>
                <ImageSelector name="banner_image" value={image} onChange={setImage} label="Banner Image" />
                <div className="flex gap-2 pt-1">
                    <button onClick={save} disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded transition-colors">{saving ? "Saving..." : "Save"}</button>
                </div>
            </div>
        );
    }

    function SectionEditor({ section, index }: { section: Record<string, unknown>; index: number }) {
        const [editing, setEditing] = useState(false);
        const [saving, setSaving] = useState(false);
        const [deleting, setDeleting] = useState(false);
        const [addingItem, setAddingItem] = useState(false);
        const type = (section._type || section.type) as string;

        const [title, setTitle] = useState(section.title as string || "");
        const [variant, setVariant] = useState(section.variant as string || "grid-4-equal");
        const [bg, setBg] = useState(section.bg as string || "bg-surface");
        const [viewAllHref, setViewAllHref] = useState(section.viewAllHref as string || "");
        const [viewAllLabel, setViewAllLabel] = useState(section.viewAllLabel as string || "");
        const [subtitle, setSubtitle] = useState(section.subtitle as string || "");
        const [sort, setSort] = useState(section.sort as string || "newest");
        const [limit, setLimit] = useState(String(section.limit ?? "10"));
        const [link, setLink] = useState(section.link as string || "");
        const [linkLabel, setLinkLabel] = useState(section.link_label as string || "");
        const [category, setCategory] = useState(((section.filter as Record<string, unknown>)?.category as string) || "");
        const [brand, setBrand] = useState(((section.filter as Record<string, unknown>)?.brand as string) || "");
        const [modelLine, setModelLine] = useState(((section.filter as Record<string, unknown>)?.name as string) || "");
        const [traction, setTraction] = useState(((section.filter as Record<string, unknown>)?.traction as string) || "");
        const [tractionOptions, setTractionOptions] = useState<string[]>([]);
        const [minPrice, setMinPrice] = useState(String(((section.filter as Record<string, unknown>)?.min_price as number) ?? ""));
        const [maxPrice, setMaxPrice] = useState(String(((section.filter as Record<string, unknown>)?.max_price as number) ?? ""));
        const items = section.items as Record<string, unknown>[] || [];

        useEffect(() => {
            import("@/lib/actions/homepage").then(m =>
                m.getDistinctTractions().then(setTractionOptions)
            );
        }, []);

        async function saveSection() {
            setSaving(true);
            const base: Record<string, unknown> = { id: section.id, title, type: type };
            if (type === "category_grid") {
                base.variant = variant;
                base.bg = bg;
                base.viewAllHref = viewAllHref || undefined;
                base.viewAllLabel = viewAllLabel || undefined;
                base.items = items;
            } else {
                base.subtitle = subtitle || undefined;
                base.sort = sort;
                base.limit = parseInt(limit) || 10;
                base.link = link || undefined;
                base.link_label = linkLabel || undefined;
                base.filter = {};
                if (category) (base.filter as Record<string, unknown>).category = category;
                if (brand) (base.filter as Record<string, unknown>).brand = brand;
                if (modelLine) (base.filter as Record<string, unknown>).name = modelLine;
                if (traction) (base.filter as Record<string, unknown>).traction = traction;
                if (minPrice) (base.filter as Record<string, unknown>).min_price = parseFloat(minPrice);
                if (maxPrice) (base.filter as Record<string, unknown>).max_price = parseFloat(maxPrice);
            }
            await updateSection(index, base);
            setEditing(false);
            router.refresh();
            setSaving(false);
        }

        async function remove() {
            if (!confirm(`Delete section "${title}"?`)) return;
            setDeleting(true);
            await deleteSection(index);
            router.refresh();
            setDeleting(false);
        }

        if (!editing) {
            return (
                <div className="bg-neutral-800 rounded p-3 flex items-center justify-between group">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="bg-zinc-700 text-zinc-400 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">{type === "category_grid" ? "Grid" : "Carousel"}</span>
                            <span className="text-sm font-medium text-zinc-200 truncate">{title || "Untitled"}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {type === "category_grid" && items.map((item, ii) => (
                                <span key={ii} className="text-[10px] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">{item.label as string}</span>
                            ))}
                            {type === "product_carousel" && (
                                <span className="text-[10px] text-zinc-500">{subtitle} &middot; limit: {String(section.limit ?? "")}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setEditing(true)} className="text-zinc-500 hover:text-white p-1"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                        <button onClick={remove} className="text-zinc-500 hover:text-red-500 p-1"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-neutral-800 rounded p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{type === "category_grid" ? "Category Grid" : "Product Carousel"}</span>
                    <button onClick={() => setEditing(false)} className="text-xs bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded transition-colors">Cancel</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Title" value={title} onChange={setTitle} />
                    {type === "category_grid" && (
                        <>
                            <div>
                                <label className="block text-zinc-500 text-xs font-medium mb-0.5">Variant</label>
                                <select value={variant} onChange={(e) => setVariant(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded text-xs focus:outline-none focus:border-red-600">
                                    <option value="grid-4-equal">Grid 4 Equal</option>
                                    <option value="scroll-brands">Scroll Brands</option>
                                    <option value="grid-tiles-dark">Grid Tiles Dark</option>
                                    <option value="grid-3-bordered">Grid 3 Bordered</option>
                                    <option value="scroll-categories">Scroll Categories</option>
                                    <option value="asymmetric-3-2">Asymmetric 3-2</option>
                                    <option value="split-1-2">Split 1-2</option>
                                    <option value="asymmetric-2-split">Asymmetric 2 Split</option>
                                    <option value="stacked-banners">Stacked Banners</option>
                                </select>
                            </div>
                            <Field label="Background" value={bg} onChange={setBg} />
                            <AutoSuggest label="View All Href" value={viewAllHref} onChange={setViewAllHref} fetchSuggestions={suggestRoutes} />
                            <Field label="View All Label" value={viewAllLabel} onChange={setViewAllLabel} />
                        </>
                    )}
                    {type === "product_carousel" && (
                        <>
                            <Field label="Subtitle" value={subtitle} onChange={setSubtitle} />
                            <div>
                                <label className="block text-zinc-500 text-xs font-medium mb-0.5">Sort</label>
                                <select value={sort} onChange={(e) => setSort(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded text-xs focus:outline-none focus:border-red-600">
                                    <option value="newest">Newest</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                    <option value="biggest_discount">Biggest Discount</option>
                                </select>
                            </div>
                            <Field label="Limit" value={limit} onChange={setLimit} type="number" />
                            <AutoSuggest label="Link" value={link} onChange={setLink} fetchSuggestions={suggestRoutes} />
                            <Field label="Link Label" value={linkLabel} onChange={setLinkLabel} />
                            <AutoSuggest label="Category Filter" value={category} onChange={setCategory} fetchSuggestions={suggestCategories} />
                            <AutoSuggest label="Brand Filter" value={brand} onChange={setBrand} fetchSuggestions={suggestBrands} />
                            <AutoSuggest label="Name Filter" value={modelLine} onChange={setModelLine} fetchSuggestions={suggestNames} />
                            <div>
                                <label className="block text-zinc-500 text-xs font-medium mb-0.5">Traction Filter</label>
                                <select value={traction} onChange={(e) => setTraction(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded text-xs focus:outline-none focus:border-red-600">
                                    <option value="">Any</option>
                                    {tractionOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <Field label="Min Price" value={minPrice} onChange={setMinPrice} type="number" />
                            <Field label="Max Price" value={maxPrice} onChange={setMaxPrice} type="number" />
                        </>
                    )}
                </div>

                {type === "category_grid" && (
                    <div className="border-t border-neutral-700 pt-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Items ({items.length})</span>
                        </div>
                        <div className="space-y-2">
                            {items.map((item, ii) => (
                                <CategoryItemEditor key={ii} sectionIndex={index} item={item} itemIndex={ii} />
                            ))}
                            <button onClick={async () => {
                                setAddingItem(true);
                                await addSectionItem(index, { label: "New Item", href: "/" });
                                router.refresh();
                                setAddingItem(false);
                            }} disabled={addingItem} className="text-xs text-red-500 hover:text-red-400 disabled:text-zinc-600 font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">add</span> {addingItem ? "Adding..." : "Add Item"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex gap-2 pt-1">
                    <button onClick={saveSection} disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded transition-colors">{saving ? "Saving..." : "Save Section"}</button>
                </div>
            </div>
        );
    }

    function CategoryItemEditor({ sectionIndex, item, itemIndex }: { sectionIndex: number; item: Record<string, unknown>; itemIndex: number }) {
        const [label, setLabel] = useState(item.label as string || "");
        const [href, setHref] = useState(item.href as string || "");
        const [image, setImage] = useState<string | null>(extractAssetId(item.image));
        const [itemBg, setItemBg] = useState(item.bg as string || "");
        const [textColor, setTextColor] = useState(item.textColor as string || "");
        const [accent, setAccent] = useState(item.accent as string || "");
        const [saving, setSaving] = useState(false);
        const [deleting, setDeleting] = useState(false);

        async function save() {
            setSaving(true);
            try {
                const updated: Record<string, unknown> = { label, href };
                if (image) updated.image = { _type: "image", asset: { _ref: image, _type: "reference" } };
                if (itemBg) updated.bg = itemBg;
                if (textColor) updated.textColor = textColor;
                if (accent) updated.accent = accent;
                await updateSectionItem(sectionIndex, itemIndex, updated);
                router.refresh();
            } catch (err) {
                console.error("Failed to save category item:", err);
                alert("Save failed");
            } finally {
                setSaving(false);
            }
        }

        async function remove() {
            if (!confirm(`Delete item "${label}"?`)) return;
            setDeleting(true);
            try {
                await deleteSectionItem(sectionIndex, itemIndex);
                router.refresh();
            } catch (err) {
                console.error("Failed to delete category item:", err);
                alert("Delete failed");
            } finally {
                setDeleting(false);
            }
        }

        return (
            <div className="bg-neutral-750 border border-neutral-700 rounded p-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Field label="Label" value={label} onChange={setLabel} />
                    <AutoSuggest label="Href" value={href} onChange={setHref} fetchSuggestions={suggestRoutes} />
                    <Field label="Background" value={itemBg} onChange={setItemBg} />
                    <Field label="Text Color" value={textColor} onChange={setTextColor} />
                    <Field label="Accent" value={accent} onChange={setAccent} />
                </div>
                <ImageSelector name="item_image" value={image} onChange={setImage} label="Item Image" />
                <div className="flex gap-2 pt-1">
                    <button onClick={save} disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[10px] font-bold px-3 py-1 rounded transition-colors">{saving ? "Saving..." : "Save Item"}</button>
                    <button onClick={remove} disabled={deleting} className="text-[10px] bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-3 py-1 rounded transition-colors">{deleting ? "Deleting..." : "Delete"}</button>
                </div>
            </div>
        );
    }

    function AddSectionForm() {
        const [showForm, setShowForm] = useState(false);
        const [saving, setSaving] = useState(false);
        const [newType, setNewType] = useState<"category_grid" | "product_carousel">("category_grid");
        const [newTitle, setNewTitle] = useState("");
        const [newVariant, setNewVariant] = useState("grid-4-equal");

        async function handleAdd() {
            if (!newTitle.trim()) return;
            setSaving(true);
            const section: Record<string, unknown> = {
                id: `section-${Date.now()}`,
                type: newType,
                title: newTitle,
            };
            if (newType === "category_grid") {
                section.variant = newVariant;
                section.bg = "bg-surface";
                section.items = [];
            } else {
                section.filter = {};
                section.sort = "newest";
                section.limit = 10;
            }
            await addSection(section);
            setSaving(false);
            setShowForm(false);
            setNewTitle("");
            router.refresh();
        }

        if (!showForm) {
            return (
                <button onClick={() => setShowForm(true)} className="text-sm text-red-500 hover:text-red-400 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">add</span> Add Section
                </button>
            );
        }

        return (
            <div className="bg-neutral-800 rounded p-4 space-y-3 border border-dashed border-neutral-700">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">New Section</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-zinc-500 text-xs font-medium mb-0.5">Type</label>
                        <select value={newType} onChange={(e) => setNewType(e.target.value as "category_grid" | "product_carousel")}
                            className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded text-xs focus:outline-none focus:border-red-600">
                            <option value="category_grid">Category Grid</option>
                            <option value="product_carousel">Product Carousel</option>
                        </select>
                    </div>
                    <Field label="Title" value={newTitle} onChange={setNewTitle} />
                    {newType === "category_grid" && (
                        <div>
                            <label className="block text-zinc-500 text-xs font-medium mb-0.5">Variant</label>
                            <select value={newVariant} onChange={(e) => setNewVariant(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded text-xs focus:outline-none focus:border-red-600">
                                <option value="grid-4-equal">Grid 4 Equal</option>
                                <option value="scroll-brands">Scroll Brands</option>
                                <option value="grid-tiles-dark">Grid Tiles Dark</option>
                                <option value="grid-3-bordered">Grid 3 Bordered</option>
                                <option value="scroll-categories">Scroll Categories</option>
                                <option value="asymmetric-3-2">Asymmetric 3-2</option>
                                <option value="split-1-2">Split 1-2</option>
                                <option value="asymmetric-2-split">Asymmetric 2 Split</option>
                                <option value="stacked-banners">Stacked Banners</option>
                            </select>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={handleAdd} disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded transition-colors">{saving ? "Adding..." : "Add"}</button>
                    <button onClick={() => setShowForm(false)} className="text-xs bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded transition-colors">Cancel</button>
                </div>
            </div>
        );
    }
}
