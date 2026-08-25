"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AutoSuggest from "@/components/admin/AutoSuggest";
import ImageSelector from "@/components/admin/ImageSelector";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
    suggestCategories,
    suggestTractions,
    suggestNames,
    suggestColors,
    suggestTechSole,
    suggestTechUpper,
    suggestTechRange,
    suggestTechAdjustment,
} from "@/lib/actions/suggestions";
import type { AdminModelCategoryGroup, AdminModelNode } from "@/lib/actions/models";

interface BrandOption {
    _id: string;
    name: string;
}

interface CategoryOption {
    id: string;
    slug: string;
    name: string;
    parent_id: string | null;
}

interface SizeEntry {
    size: string;
    available: boolean;
}

const inputClass =
    "w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#b8e51f]/70 placeholder:text-zinc-600";
const labelClass =
    "mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400";
const cardClass = "rounded-lg border border-neutral-800 bg-neutral-900 p-5 space-y-4";
const sectionTitleClass = "text-[11px] font-bold uppercase tracking-wider text-zinc-500";
const primaryBtn =
    "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-b from-[#c9f12d] to-[#b5e51b] px-6 text-xs font-bold text-[#151a06] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50";
const ghostBtn =
    "inline-flex h-10 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 px-6 text-xs font-medium text-zinc-300 transition hover:bg-neutral-700";

function Field({ label, error, tip, children }: { label?: string; error?: string; tip?: string; children: React.ReactNode }) {
    return (
        <div>
            {label && (
                <label className={labelClass}>
                    {label}
                    {tip && <InfoTooltip text={tip} />}
                </label>
            )}
            {children}
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
}

function val(initial: Record<string, unknown> | undefined, ...path: string[]): string {
    let v: unknown = initial;
    for (const key of path) {
        if (v && typeof v === "object" && key in v) {
            v = (v as Record<string, unknown>)[key];
        } else {
            return "";
        }
    }
    return String(v ?? "");
}

function assetRef(img: unknown): string | null {
    if (!img || typeof img !== "object") return typeof img === "string" ? img : null;
    const asset = (img as Record<string, unknown>).asset;
    if (!asset || typeof asset !== "object") return null;
    const ref = (asset as Record<string, unknown>)._ref;
    return typeof ref === "string" ? ref : null;
}

function assetRefs(imgs: unknown): string[] {
    if (!Array.isArray(imgs)) return [];
    return imgs.map((img) => assetRef(img)).filter(Boolean) as string[];
}

function parseBenefits(raw: string): string[] {
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((b): b is string => typeof b === "string") : [];
    } catch {
        return [];
    }
}

export default function ProductFullEditor({
    mode,
    productId,
}: {
    mode: "create" | "edit";
    productId?: string;
}) {
    const router = useRouter();
    const isNew = mode === "create";

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [savedOk, setSavedOk] = useState(false);

    const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
    const [modelGroups, setModelGroups] = useState<AdminModelCategoryGroup[]>([]);
    const [initialModelPath, setInitialModelPath] = useState("");

    // Identity
    const [productKey, setProductKey] = useState("");
    const [urlSlug, setUrlSlug] = useState("");
    const [name, setName] = useState("");
    // Classification
    const [brandRef, setBrandRef] = useState("");
    const [categoryName, setCategoryName] = useState("");
    const [modelChain, setModelChain] = useState<string[]>([]);
    // Attributes
    const [traction, setTraction] = useState("");
    const [gender, setGender] = useState("Unisex");
    const [color, setColor] = useState("");
    // Pricing
    const [priceCurrent, setPriceCurrent] = useState("");
    const [priceOriginal, setPriceOriginal] = useState("");
    const [discountPercent, setDiscountPercent] = useState("0");
    const [memberPrice, setMemberPrice] = useState("");
    const [currency, setCurrency] = useState("EUR");
    // Description
    const [descSubtitle, setDescSubtitle] = useState("");
    const [descTagline, setDescTagline] = useState("");
    const [descIntro, setDescIntro] = useState("");
    const [descCollection, setDescCollection] = useState("");
    const [keyBenefits, setKeyBenefits] = useState<string[]>([]);
    // Tech details
    const [techRange, setTechRange] = useState("");
    const [techSole, setTechSole] = useState("");
    const [techUpper, setTechUpper] = useState("");
    const [techAdjustment, setTechAdjustment] = useState("");
    // Commerce
    const [sizesList, setSizesList] = useState<SizeEntry[]>([]);
    const [asin, setAsin] = useState("");
    const [status, setStatus] = useState<"published" | "unpublished">("published");
    // Images
    const [mainImageAsset, setMainImageAsset] = useState<string | null>(null);
    const [thumbnailAsset, setThumbnailAsset] = useState<string | null>(null);
    const [galleryAssets, setGalleryAssets] = useState<string[]>([]);
    const galleryFileRef = useRef<HTMLInputElement>(null);
    const [uploadingGallery, setUploadingGallery] = useState(false);

    const loadReferenceData = useCallback(async () => {
        const [{ getAllBrandsAdmin }, { getCategoriesAdmin }, { getModelsAdmin }] = await Promise.all([
            import("@/lib/actions/brands"),
            import("@/lib/actions/categories"),
            import("@/lib/actions/models"),
        ]);
        const [brandsRes, catsRes, modelsRes] = await Promise.all([
            getAllBrandsAdmin(),
            getCategoriesAdmin(),
            getModelsAdmin(),
        ]);
        if (brandsRes.data) setBrandOptions(brandsRes.data as BrandOption[]);
        if (catsRes.data) setCategoryOptions(catsRes.data);
        if (modelsRes.data) setModelGroups(modelsRes.data);
        return { brandsRes, catsRes, modelsRes };
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await loadReferenceData();

                if (isNew) {
                    setProductKey(
                        Array.from({ length: 6 }, () =>
                            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
                                Math.floor(Math.random() * 62),
                            ),
                        ).join(""),
                    );
                    setLoading(false);
                    return;
                }

                const { getProductByIdAdmin } = await import("@/lib/actions/products");
                const result = await getProductByIdAdmin(productId!);
                if (cancelled) return;
                if (result.error || !result.data) {
                    setLoadError(result.error?.message ?? "Product not found.");
                    setLoading(false);
                    return;
                }
                const p = result.data as Record<string, unknown>;
                setProductKey(String(p.id ?? ""));
                setUrlSlug(val(p, "url_slug"));
                setName(val(p, "name"));
                setBrandRef((val(p, "brand", "_ref")));
                setCategoryName(val(p, "category"));
                setTraction(val(p, "traction"));
                setGender(val(p, "gender") || "Unisex");
                setColor(val(p, "color"));
                setPriceCurrent(String((p.price as Record<string, unknown>)?.current ?? ""));
                setPriceOriginal(String((p.price as Record<string, unknown>)?.original ?? ""));
                setDiscountPercent(String((p.price as Record<string, unknown>)?.discount_percent ?? "0"));
                setMemberPrice(String((p.price as Record<string, unknown>)?.member_price ?? ""));
                setCurrency(val(p, "price", "currency") || "EUR");
                setDescSubtitle(val(p, "description", "subtitle"));
                setDescTagline(val(p, "description", "tagline"));
                setDescIntro(val(p, "description", "intro"));
                setDescCollection(val(p, "description", "collection"));
                setKeyBenefits(parseBenefits(val(p, "description", "key_benefits")));
                setTechRange(val(p, "description", "technical_details", "range"));
                setTechSole(val(p, "description", "technical_details", "sole_type"));
                setTechUpper(val(p, "description", "technical_details", "upper_material"));
                setTechAdjustment(val(p, "description", "technical_details", "adjustment"));
                setAsin(val(p, "asin"));
                setStatus(p.status === "unpublished" ? "unpublished" : "published");

                const detail = p.sizes_detail;
                if (Array.isArray(detail) && detail.length > 0) {
                    setSizesList(
                        detail
                            .filter((s): s is { size: string } => Boolean(s) && typeof s === "object" && typeof (s as { size?: unknown }).size === "string")
                            .map((s) => ({
                                size: String(s.size),
                                available: (s as { available?: boolean }).available !== false,
                            })),
                    );
                } else if (Array.isArray(p.sizes)) {
                    setSizesList((p.sizes as unknown[]).map((s) => ({ size: String(s), available: true })));
                }

                setMainImageAsset(assetRef(p.main_image));
                setThumbnailAsset(assetRef(p.thumbnail));
                setGalleryAssets(assetRefs(p.image_gallery));
                setInitialModelPath(val(p, "model"));
                setLoading(false);
            } catch (err) {
                if (!cancelled) {
                    setLoadError(err instanceof Error ? err.message : "Failed to load editor data.");
                    setLoading(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isNew, productId, loadReferenceData]);

    // ---- model picker bound to the models table ----
    const modelRoots = useMemo(() => {
        const roots: { node: AdminModelNode; brandName: string }[] = [];
        for (const group of modelGroups) {
            for (const brand of group.brands) {
                for (const root of brand.models) {
                    roots.push({ node: root, brandName: brand.brandName });
                }
            }
        }
        return roots.sort((a, b) => a.node.name.localeCompare(b.node.name));
    }, [modelGroups]);

    function nodesAtLevel(level: number): { node: AdminModelNode; brandName: string }[] {
        if (level === 0) return modelRoots;
        const parent = resolveChainNode(level - 1);
        return (parent?.node.children ?? []).map((node) => ({ node, brandName: parent!.brandName }));
    }

    function resolveChainNode(level: number): { node: AdminModelNode; brandName: string } | null {
        let candidates = modelRoots;
        for (let i = 0; i <= level; i++) {
            const id = modelChain[i];
            if (!id) return null;
            const match = candidates.find((c) => c.node.id === id);
            if (!match) return null;
            if (i === level) return match;
            candidates = match.node.children.map((node) => ({ node, brandName: match.brandName }));
        }
        return null;
    }

    const modelChainNodes = useMemo(
        () => modelChain.map((_, i) => resolveChainNode(i)),
        [modelChain, modelGroups],
    );
    const modelValid = Boolean(
        modelChain.length > 0 &&
            modelChainNodes[modelChain.length - 1] &&
            !modelChainNodes[modelChain.length - 1]!.node.hasChildren,
    );
    const modelPath = useMemo(
        () => modelChainNodes.filter(Boolean).map((n) => n!.node.name).join("/"),
        [modelChainNodes],
    );
    const modelUnresolved =
        !isNew && !loading && initialModelPath && !modelValid && modelChain.length === 0;

    function setChainAt(level: number, id: string) {
        setModelChain((prev) => [...prev.slice(0, level), id]);
    }

    // ---- gallery upload ----
    async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingGallery(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
            const json = await res.json();
            if (!res.ok || json.error) throw new Error(json.error?.message || "Upload failed");
            const updated = [...galleryAssets, json.data._id];
            setGalleryAssets(updated);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploadingGallery(false);
            if (galleryFileRef.current) galleryFileRef.current.value = "";
        }
    }

    function removeGalleryAsset(index: number) {
        setGalleryAssets((prev) => prev.filter((_, i) => i !== index));
    }

    // ---- submit ----
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitError(null);

        if (!name.trim()) return setSubmitError("Name is required.");
        if (!categoryName.trim()) return setSubmitError("Category is required.");
        if (!brandRef) return setSubmitError("Brand is required.");
        if (!priceCurrent.trim() || isNaN(Number(priceCurrent))) return setSubmitError("A valid current price is required.");

        const finalModel = modelValid ? modelPath : initialModelPath;
        if (!finalModel.trim()) {
            setSubmitError("Select a model from the models table.");
            return;
        }
        if (!urlSlug.trim()) {
            setSubmitError("URL slug is required.");
            return;
        }

        setSaving(true);
        setSavedOk(false);
        try {
            const formData = new FormData();
            formData.set("id", productKey);
            formData.set("url_slug", urlSlug.trim());
            formData.set("model", finalModel);
            formData.set("name", name.trim());
            formData.set("category", categoryName.trim());
            formData.set("brand_ref", brandRef);
            formData.set("traction", traction.trim());
            formData.set("gender", gender);
            formData.set("color", color.trim());
            formData.set("price_current", priceCurrent);
            formData.set("price_original", priceOriginal || priceCurrent);
            formData.set("discount_percent", discountPercent || "0");
            formData.set("member_price", memberPrice || priceCurrent);
            formData.set("currency", currency);
            formData.set("desc_subtitle", descSubtitle);
            formData.set("desc_tagline", descTagline);
            formData.set("desc_intro", descIntro);
            formData.set("desc_collection", descCollection);
            formData.set("key_benefits_json", JSON.stringify(keyBenefits.filter((b) => b.trim())));
            formData.set("tech_range", techRange);
            formData.set("tech_sole", techSole);
            formData.set("tech_upper", techUpper);
            formData.set("tech_adjustment", techAdjustment);
            formData.set("main_image_asset", mainImageAsset || "");
            formData.set("thumbnail_asset", thumbnailAsset || "");
            formData.set("gallery_assets", galleryAssets.join(","));
            formData.set("asin", asin.trim().toUpperCase());
            formData.set("sizes", sizesList.map((s) => s.size.trim()).filter(Boolean).join(","));
            formData.set(
                "sizes_detail",
                JSON.stringify(sizesList.filter((s) => s.size.trim()).map((s) => ({ size: s.size.trim(), available: s.available }))),
            );
            formData.set("status", status);

            const { createProduct, updateProduct } = await import("@/lib/actions/products");
            const result = isNew
                ? await createProduct(formData)
                : await updateProduct(productId!, formData);

            if (result.error) {
                setSubmitError(result.error.message ?? "Save failed.");
                setSaving(false);
                return;
            }
            setSavedOk(true);
            router.push("/admin/products");
            router.refresh();
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Save failed. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-8">
                <div className="h-9 w-64 animate-pulse rounded bg-neutral-800" />
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-48 animate-pulse rounded-lg border border-neutral-800 bg-neutral-900" />
                ))}
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="mx-auto max-w-4xl p-4 md:p-8">
                <div className="rounded-lg border border-red-900 bg-red-950/40 p-6 text-center">
                    <p className="text-sm font-semibold text-red-300">Failed to load the product editor.</p>
                    <p className="mt-1 text-xs text-red-400/80">{loadError}</p>
                    <button type="button" onClick={() => router.refresh()} className={`${ghostBtn} mt-4`}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6 p-4 md:p-8" data-product-full-editor>
            <header className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Catalog</p>
                    <h1 className="text-xl font-bold text-white">{isNew ? "Add Product" : "Edit Product"}</h1>
                    {!isNew && <p className="mt-0.5 text-xs text-zinc-500">{name || productKey}</p>}
                </div>
                {status === "published" ? (
                    <span className="inline-flex h-6 items-center rounded-full bg-[rgba(132,184,25,0.15)] px-3 text-[11px] font-bold text-[#b9e728]">Published</span>
                ) : (
                    <span className="inline-flex h-6 items-center rounded-full bg-neutral-800 px-3 text-[11px] font-bold text-zinc-400">Unpublished</span>
                )}
            </header>

            {/* IMAGES */}
            <section className={cardClass}>
                <h2 className={sectionTitleClass}>Images</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Main Image" tip="Primary product photo shown first on the detail page.">
                        <ImageSelector name="main_image_sel" label="Main Image" value={mainImageAsset} onChange={setMainImageAsset} />
                    </Field>
                    <Field label="Thumbnail" tip="Small preview used in product lists and search results. Recommended: 200x200px.">
                        <ImageSelector name="thumbnail_sel" label="Thumbnail" value={thumbnailAsset} onChange={setThumbnailAsset} />
                    </Field>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-[11px] text-zinc-500">Gallery — extra angles shown below the main image.</p>
                    <label className={`cursor-pointer rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 transition hover:bg-neutral-700 ${uploadingGallery ? "pointer-events-none opacity-50" : ""}`}>
                        {uploadingGallery ? "Uploading…" : "Add Gallery Image"}
                        <input ref={galleryFileRef} type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                    </label>
                </div>
                {galleryAssets.length === 0 ? (
                    <p className="text-xs text-zinc-600">No gallery images yet.</p>
                ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {galleryAssets.map((assetId, i) => (
                            <div key={`${assetId}-${i}`} className="group relative aspect-square overflow-hidden rounded-md border border-neutral-700 bg-neutral-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={assetId.startsWith("http") ? assetId : ""}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    onError={(ev) => { (ev.target as HTMLImageElement).style.visibility = "hidden"; }}
                                />
                                <button
                                    type="button"
                                    aria-label={`Remove gallery image ${i + 1}`}
                                    onClick={() => removeGalleryAsset(i)}
                                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-red-600 text-[10px] text-white"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* BASIC INFO */}
            <section className={cardClass}>
                <h2 className={sectionTitleClass}>Basic Info</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Product ID" tip="Internal identifier used for system tracking.">
                        <input type="text" value={productKey} onChange={(e) => setProductKey(e.target.value)} className={inputClass} readOnly={!isNew} />
                    </Field>
                    <Field label="URL Slug" tip="Web-friendly identifier used in the storefront URL." error={undefined}>
                        <input type="text" value={urlSlug} onChange={(e) => setUrlSlug(e.target.value)} className={inputClass} placeholder="auto-from-model" />
                    </Field>
                </div>

                <Field label="Model" tip="Classification from the models table. Pick down to a final product type — e.g. Football Boots › FG › Mercurial Vapor › FG-Elite.">
                    <div className="space-y-2">
                        {modelChainNodes.length === 0 && (
                            <select
                                value=""
                                onChange={(e) => { if (e.target.value) setChainAt(0, e.target.value); }}
                                className={inputClass}
                            >
                                <option value="">Select root model…</option>
                                {modelRoots.map(({ node, brandName }) => (
                                    <option key={node.id} value={node.id}>
                                        {brandName ? `${brandName} › ${node.name}` : node.name}
                                        {node.hasChildren ? "  (classification)" : ""}
                                    </option>
                                ))}
                            </select>
                        )}
                        {modelChainNodes.map((entry, level) => (
                            <select
                                key={level}
                                value={modelChain[level] ?? ""}
                                onChange={(e) => setChainAt(level, e.target.value)}
                                className={inputClass}
                            >
                                <option value="">{level === 0 ? "Select root model…" : "Select sub-model…"}</option>
                                {nodesAtLevel(level).map(({ node, brandName }) => (
                                    <option key={node.id} value={node.id}>
                                        {level === 0 && brandName ? `${brandName} › ${node.name}` : node.name}
                                        {node.hasChildren ? "  (classification)" : ""}
                                    </option>
                                ))}
                            </select>
                        ))}
                        {modelChain.length > 0 && modelChainNodes[modelChain.length - 1]?.node.hasChildren && (
                            <select
                                value=""
                                onChange={(e) => { if (e.target.value) setChainAt(modelChain.length, e.target.value); }}
                                className={inputClass}
                            >
                                <option value="">Select sub-model…</option>
                                {nodesAtLevel(modelChain.length).map(({ node }) => (
                                    <option key={node.id} value={node.id}>{node.name}{node.hasChildren ? "  (classification)" : ""}</option>
                                ))}
                            </select>
                        )}
                        {modelUnresolved && (
                            <p className="rounded border border-amber-800 bg-amber-950/40 px-3 py-2 text-xs text-amber-300">
                                Current model “{initialModelPath}” is not in the models table. It will be kept unless you pick a new one.
                            </p>
                        )}
                        {modelValid && (
                            <p className="text-[11px] text-[#b9e728]">Model path: {modelPath}</p>
                        )}
                    </div>
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Brand" tip="Products belong to one brand; its logo shows automatically.">
                        <select value={brandRef} onChange={(e) => setBrandRef(e.target.value)} className={inputClass} required>
                            <option value="">Select brand…</option>
                            {brandOptions.map((b) => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Category" tip="Main category, e.g. Football Boots or Running Shoes.">
                        <AutoSuggest name="category" label="" value={categoryName} onChange={setCategoryName} fetchSuggestions={suggestCategories} />
                    </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Traction" tip="Sole configuration: FG=Firm Ground, AG=Artificial Grass, TF=Turf, SG=Soft Ground.">
                        <AutoSuggest name="traction" label="" value={traction} onChange={setTraction} fetchSuggestions={suggestTractions} />
                    </Field>
                    <Field label="Name" tip="Official product name, e.g. Mercurial Vapor.">
                        <AutoSuggest name="name" label="" value={name} onChange={setName} fetchSuggestions={suggestNames} />
                    </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Gender">
                        <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                            <option value="Unisex">Unisex</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </Field>
                    <Field label="Amazon ASIN" tip="10-character Amazon identifier driving the Buy button. Optional — an existing ASIN is kept if left empty.">
                        <input type="text" value={asin} maxLength={10} onChange={(e) => setAsin(e.target.value.toUpperCase())} className={inputClass} placeholder="e.g. B08N5WRWNW" />
                    </Field>
                </div>

                <Field label="Color">
                    <AutoSuggest name="color" label="" value={color} onChange={setColor} fetchSuggestions={suggestColors} />
                </Field>
            </section>

            {/* PRICING */}
            <section className={cardClass}>
                <h2 className={sectionTitleClass}>Pricing</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Current Price" tip="The price customers pay today.">
                        <input type="number" min="0" step="0.01" value={priceCurrent} onChange={(e) => setPriceCurrent(e.target.value)} className={inputClass} required />
                    </Field>
                    <Field label="Original Price" tip="MSRP before discounts; enables strike-through pricing.">
                        <input type="number" min="0" step="0.01" value={priceOriginal} onChange={(e) => setPriceOriginal(e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Discount %" tip="Percentage off original price. Shown as the -X% OFF badge.">
                        <input type="number" min="0" max="100" step="0.01" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Member Price" tip="Loyalty/member tier price.">
                        <input type="number" min="0" step="0.01" value={memberPrice} onChange={(e) => setMemberPrice(e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Currency">
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </Field>
                </div>
            </section>

            {/* DESCRIPTION */}
            <section className={cardClass}>
                <h2 className={sectionTitleClass}>Description</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Subtitle" tip="Secondary title under the product name.">
                        <input type="text" value={descSubtitle} onChange={(e) => setDescSubtitle(e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Tagline" tip="Marketing slogan shown above the intro.">
                        <input type="text" value={descTagline} onChange={(e) => setDescTagline(e.target.value)} className={inputClass} />
                    </Field>
                </div>
                <Field label="Intro" tip="Short paragraph introducing the product's key story.">
                    <textarea rows={3} value={descIntro} onChange={(e) => setDescIntro(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Collection" tip="Series or collection line, e.g. Mercurial Series.">
                    <input type="text" value={descCollection} onChange={(e) => setDescCollection(e.target.value)} className={inputClass} />
                </Field>
            </section>

            {/* KEY BENEFITS */}
            <section className={cardClass}>
                <div className="flex items-center justify-between">
                    <h2 className={sectionTitleClass}>Key Benefits</h2>
                    <button
                        type="button"
                        onClick={() => setKeyBenefits((prev) => [...prev, ""])}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#b9e728] hover:brightness-110"
                    >
                        <span className="material-symbols-outlined text-sm">add</span> Add benefit
                    </button>
                </div>
                {keyBenefits.length === 0 && <p className="text-xs text-zinc-600">No benefits yet — bullets shown on the detail page.</p>}
                <div className="space-y-2">
                    {keyBenefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={benefit}
                                onChange={(e) => setKeyBenefits((prev) => prev.map((b, i) => (i === idx ? e.target.value : b)))}
                                className={inputClass}
                                placeholder="e.g. Flyknit upper for lockdown fit"
                            />
                            <button
                                type="button"
                                aria-label={`Remove benefit ${idx + 1}`}
                                onClick={() => setKeyBenefits((prev) => prev.filter((_, i) => i !== idx))}
                                className="grid h-8 w-8 place-items-center rounded text-zinc-500 transition hover:bg-neutral-800 hover:text-red-400"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* SIZES */}
            <section className={cardClass}>
                <div className="flex items-center justify-between">
                    <h2 className={sectionTitleClass}>Sizes</h2>
                    <button
                        type="button"
                        onClick={() => setSizesList((prev) => [...prev, { size: "", available: true }])}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#b9e728] hover:brightness-110"
                    >
                        <span className="material-symbols-outlined text-sm">add</span> Add size
                    </button>
                </div>
                <p className="text-xs text-zinc-500">Untick “Available” to list a size as out of stock.</p>
                {sizesList.length === 0 && <p className="text-xs text-zinc-600">No sizes yet.</p>}
                <div className="space-y-2">
                    {sizesList.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <input
                                type="text"
                                value={item.size}
                                placeholder="e.g. 42 or M"
                                onChange={(e) => setSizesList((prev) => prev.map((s, i) => (i === idx ? { ...s, size: e.target.value } : s)))}
                                className={inputClass}
                            />
                            <label className="flex cursor-pointer select-none items-center gap-2 whitespace-nowrap text-xs text-zinc-300">
                                <input
                                    type="checkbox"
                                    checked={item.available}
                                    onChange={(e) => setSizesList((prev) => prev.map((s, i) => (i === idx ? { ...s, available: e.target.checked } : s)))}
                                    className="accent-[#b5e51b]"
                                />
                                Available
                            </label>
                            <button
                                type="button"
                                aria-label={`Remove size ${idx + 1}`}
                                onClick={() => setSizesList((prev) => prev.filter((_, i) => i !== idx))}
                                className="grid h-8 w-8 place-items-center rounded text-zinc-500 transition hover:bg-neutral-800 hover:text-red-400"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* TECH DETAILS */}
            <section className={cardClass}>
                <h2 className={sectionTitleClass}>Technical Details</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Range" tip="Performance range or series, e.g. Elite Series.">
                        <AutoSuggest name="tech_range" label="" value={techRange} onChange={setTechRange} fetchSuggestions={suggestTechRange} />
                    </Field>
                    <Field label="Sole Type" tip="Construction: Stud, Blade, Conical, Mixed…">
                        <AutoSuggest name="tech_sole" label="" value={techSole} onChange={setTechSole} fetchSuggestions={suggestTechSole} />
                    </Field>
                    <Field label="Upper Material" tip="Synthetic, Leather, Knit, Mesh…">
                        <AutoSuggest name="tech_upper" label="" value={techUpper} onChange={setTechUpper} fetchSuggestions={suggestTechUpper} />
                    </Field>
                    <Field label="Adjustment" tip="Fit system: Lacing System, Boa Dial, Flywire…">
                        <AutoSuggest name="tech_adjustment" label="" value={techAdjustment} onChange={setTechAdjustment} fetchSuggestions={suggestTechAdjustment} />
                    </Field>
                </div>
            </section>

            {/* STATUS + SUBMIT */}
            <section className={cardClass}>
                <h2 className={sectionTitleClass}>Visibility</h2>
                <Field label="Status" tip="Unpublished products stay out of the storefront until published.">
                    <select value={status} onChange={(e) => setStatus(e.target.value as "published" | "unpublished")} className={inputClass}>
                        <option value="published">Published</option>
                        <option value="unpublished">Unpublished</option>
                    </select>
                </Field>
            </section>

            {submitError && (
                <p role="alert" className="rounded-md border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                    {submitError}
                </p>
            )}

            <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-neutral-800 bg-neutral-950/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
                <button type="submit" disabled={saving || savedOk} className={primaryBtn}>
                    {saving ? "Saving…" : savedOk ? "Saved ✓" : isNew ? "Create Product" : "Update Product"}
                </button>
                <button type="button" onClick={() => router.back()} className={ghostBtn}>
                    Cancel
                </button>
                {!modelValid && !isNew && !initialModelPath && (
                    <span className="text-xs text-amber-400">Pick a model before saving.</span>
                )}
            </div>
        </form>
    );
}
