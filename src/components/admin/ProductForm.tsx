"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import ImageSelector from "./ImageSelector";
import AutoSuggest from "./AutoSuggest";
import ModelInput from "./ModelInput";
import {
  suggestCategories, suggestTractions, suggestNames,
  suggestModels, suggestColors, suggestTechSole,
  suggestTechUpper, suggestTechRange, suggestTechAdjustment,
} from "@/lib/actions/suggestions";
import { urlFor } from "@/lib/sanity";
import type { SanityImageSource } from "@sanity/image-url";
import type { ModelNavNode } from "@/lib/getNavigation";
import type { ApiResult } from "@/lib/api-types";
import { logger } from "@/lib/logger";

interface ProductFormProps {
    action?: (formData: FormData) => Promise<ApiResult<{ id: string }>>;
    initial?: Record<string, unknown>;
    productId?: string;
}

interface BrandOption {
    _id: string;
    name: string;
    logo: { asset: { _ref: string } } | null;
}

function assetRef(img: unknown): string | null {
    if (!img || typeof img !== "object") return null;
    const asset = (img as Record<string, unknown>).asset;
    if (!asset || typeof asset !== "object") return null;
    const ref = (asset as Record<string, unknown>)._ref;
    return typeof ref === "string" ? ref : null;
}

function assetRefs(imgs: unknown): string[] {
    if (!Array.isArray(imgs)) return [];
    return imgs.map((img) => assetRef(img)).filter(Boolean) as string[];
}

function assetUrl(assetId: string): string {
    try {
        return urlFor({ _ref: assetId } as SanityImageSource).width(200).url();
    } catch {
        return "";
    }
}

export default function ProductForm({ action, initial, productId }: ProductFormProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [mainImageAsset, setMainImageAsset] = useState<string | null>(assetRef(initial?.main_image));
    const [thumbnailAsset, setThumbnailAsset] = useState<string | null>(assetRef(initial?.thumbnail));
    const [galleryAssets, setGalleryAssets] = useState<string[]>(assetRefs(initial?.image_gallery));

    const galleryFileRef = useRef<HTMLInputElement>(null);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);
    const [brandRef, setBrandRef] = useState<string | null>((initial?.brand as Record<string, unknown>)?._ref as string || null);
    const [modelNavTree, setModelNavTree] = useState<ModelNavNode[]>([]);

    const isNew = !productId;
    const [productIdValue, setProductIdValue] = useState(val("id") || (isNew ? generateId() : ""));
    const [modelName, setModelName] = useState(val("model"));
    const [slugValue, setSlugValue] = useState(val("url_slug") || "");
    const [category, setCategory] = useState(val("category"));
    const [traction, setTraction] = useState(val("traction"));
    const [productName, setProductName] = useState(val("name"));
    const [color, setColor] = useState(val("color"));
    const [techRange, setTechRange] = useState(val("description", "technical_details", "range"));
    const [techSole, setTechSole] = useState(val("description", "technical_details", "sole_type"));
    const [techUpper, setTechUpper] = useState(val("description", "technical_details", "upper_material"));
    const [techAdjustment, setTechAdjustment] = useState(val("description", "technical_details", "adjustment"));
    const [keyBenefits, setKeyBenefits] = useState<string[]>(() => {
        try {
            const raw = val("description", "key_benefits");
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    function generateId(): string {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function modelToSlug(name: string): string {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }

    const [modelValid, setModelValid] = useState(false);

    function handleModelChange(value: string) {
        setModelName(value);
        // Extract first segment for slug auto-generation
        const firstSeg = value.split(",")[0] || value;
        if (isNew || slugValue === modelToSlug(modelName) || slugValue === modelToSlug(firstSeg)) {
            setSlugValue(modelToSlug(firstSeg));
        }
    }

    useEffect(() => {
        import("@/lib/actions/brands").then(m =>
            m.getAllBrandsAdmin().then(r => { if (r.data) setBrandOptions(r.data as BrandOption[]); })
        );
        import("@/lib/getNavigation").then(m =>
            m.getModelNavTree().then(r => { if (r.data) setModelNavTree(r.data); })
        );
    }, []);

    const selectedBrand = brandOptions.find(b => b._id === brandRef);

    async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingGallery(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
            const asset = await res.json();
            setGalleryAssets((prev) => [...prev, asset._id]);
        } catch (err) {
            logger.error(err, "ProductForm error");
            alert("Upload failed");
        } finally {
            setUploadingGallery(false);
            if (galleryFileRef.current) galleryFileRef.current.value = "";
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setFieldErrors({});
        const form = e.currentTarget;
        const data = new FormData(form);

        data.set("main_image_asset", mainImageAsset || "");
        data.set("thumbnail_asset", thumbnailAsset || "");
        data.set("brand_ref", brandRef || "");
        data.set("gallery_assets", galleryAssets.join(","));
        data.set("key_benefits_json", JSON.stringify(keyBenefits));

        try {
            let result;
            if (productId) {
                const { updateProduct } = await import("@/lib/actions/products");
                result = await updateProduct(productId, data);
            } else if (action) {
                result = await action(data);
            }
            if (result && result.error) {
                if (result.error.fields) {
                    const errors: Record<string, string> = {};
                    for (const f of result.error.fields) {
                        errors[f.field] = f.message;
                    }
                    setFieldErrors(errors);
                } else {
                    alert(result.error.message);
                }
                return;
            }
            router.push("/admin/products");
            router.refresh();
        } catch (err) {
            logger.error(err, "ProductForm error");
            alert("Failed to save product");
        } finally {
            setSaving(false);
        }
    }

    function val(...path: string[]): string {
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

    return (
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Images</h2>
                <ImageSelector name="main_image_sel" label="Main Image" value={mainImageAsset} onChange={setMainImageAsset} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ImageSelector name="thumbnail_sel" label="Thumbnail" value={thumbnailAsset} onChange={setThumbnailAsset} />
                    <div>
                        <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">Brand</label>
                        <div className="flex items-center gap-3">
                            <select value={brandRef || ""} onChange={(e) => setBrandRef(e.target.value || null)}
                                className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-red-600 transition-colors">
                                <option value="">Select brand...</option>
                                {brandOptions.map(b => (
                                    <option key={b._id} value={b._id}>{b.name}</option>
                                ))}
                            </select>
                            {selectedBrand?.logo && (
                                <img src={assetUrl((selectedBrand.logo.asset as { _ref: string })._ref)} alt={selectedBrand.name}
                                    className="w-8 h-8 object-contain rounded bg-neutral-800" />
                            )}
                        </div>
                        {fieldErrors.brand_ref && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.brand_ref}</p>
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-zinc-500 text-xs font-medium">Image Gallery</label>
                        <label className={`text-[11px] uppercase tracking-wider font-medium cursor-pointer bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded transition-colors ${uploadingGallery ? "opacity-50 pointer-events-none" : ""}`}>
                            {uploadingGallery ? "Uploading..." : "Add Image"}
                            <input ref={galleryFileRef} type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                        </label>
                    </div>
                    {galleryAssets.length === 0 && (
                        <p className="text-xs text-zinc-600">No gallery images yet.</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {galleryAssets.map((assetId, i) => (
                            <div key={`${assetId}-${i}`} className="relative group aspect-square bg-neutral-800 border border-neutral-700 rounded overflow-hidden">
                                <img src={assetUrl(assetId)} alt="" className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                <button type="button" onClick={() => setGalleryAssets((prev) => prev.filter((_, j) => j !== i))}
                                    className="absolute top-1 right-1 bg-red-600 text-white text-[10px] w-5 h-5 rounded flex items-center justify-center">
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Basic Info</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">Product ID</label>
                        <input type="text" name="id" required value={productIdValue} onChange={(e) => setProductIdValue(e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-red-600 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">URL Slug</label>
                        <input type="text" name="url_slug" required value={slugValue} onChange={(e) => setSlugValue(e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-red-600 transition-colors" />
                        {fieldErrors.url_slug && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.url_slug}</p>
                        )}
                    </div>
                </div>
                <input type="hidden" name="model" value={modelName} />
                <div>
                    <ModelInput modelNavTree={modelNavTree} value={modelName} onChange={handleModelChange} onValidChange={setModelValid} />
                    {fieldErrors.model && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors.model}</p>
                    )}
                </div>
                <div>
                    <AutoSuggest name="category" label="Category" value={category} onChange={setCategory} fetchSuggestions={suggestCategories} />
                    {fieldErrors.category && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors.category}</p>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AutoSuggest name="traction" label="Traction (FG/AG/TF/SG)" value={traction} onChange={setTraction} fetchSuggestions={suggestTractions} />
                    <div>
                        <AutoSuggest name="name" label="Name" value={productName} onChange={setProductName} fetchSuggestions={suggestNames} />
                        {fieldErrors.name && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">Gender</label>
                        <select name="gender" defaultValue={val("gender") || "Unisex"}
                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-red-600 transition-colors">
                            <option value="Unisex">Unisex</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                </div>
                <div>
                    <AutoSuggest name="color" label="Color" value={color} onChange={setColor} fetchSuggestions={suggestColors} />
                    {fieldErrors.color && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors.color}</p>
                    )}
                </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Pricing</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Field label="Current Price" name="price_current" type="number" step="0.01" defaultValue={val("price", "current")} />
                        {fieldErrors.price_current && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.price_current}</p>
                        )}
                    </div>
                    <div>
                        <Field label="Original Price" name="price_original" type="number" step="0.01" defaultValue={val("price", "original")} />
                        {fieldErrors.price_original && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.price_original}</p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Field label="Discount %" name="discount_percent" type="number" defaultValue={val("price", "discount_percent")} />
                        {fieldErrors.discount_percent && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.discount_percent}</p>
                        )}
                    </div>
                    <div>
                        <Field label="Member Price" name="member_price" type="number" step="0.01" defaultValue={val("price", "member_price")} />
                        {fieldErrors.member_price && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.member_price}</p>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">Currency</label>
                    <select name="currency" defaultValue={val("price", "currency") || "EUR"}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-red-600 transition-colors">
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                    </select>
                    {fieldErrors.currency && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors.currency}</p>
                    )}
                </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Description</h2>
                <Field label="Subtitle" name="desc_subtitle" defaultValue={val("description", "subtitle")} />
                <Field label="Tagline" name="desc_tagline" defaultValue={val("description", "tagline")} />
                <Field label="Intro" name="desc_intro" isTextarea defaultValue={val("description", "intro")} />
                <Field label="Collection" name="desc_collection" defaultValue={val("description", "collection")} />
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Key Benefits</h2>
                <p className="text-xs text-zinc-500">Product highlights shown in bullet points</p>
                <div className="space-y-2">
                    {keyBenefits.map((benefit, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={benefit}
                                onChange={(e) => {
                                    const updated = [...keyBenefits];
                                    updated[idx] = e.target.value;
                                    setKeyBenefits(updated);
                                }}
                                className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-red-600 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setKeyBenefits(keyBenefits.filter((_, i) => i !== idx))}
                                className="w-8 h-8 flex items-center justify-center rounded text-zinc-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setKeyBenefits([...keyBenefits, ""])}
                        className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">add</span> Add benefit
                    </button>
                </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Technical Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AutoSuggest name="tech_range" label="Range" value={techRange} onChange={setTechRange} fetchSuggestions={suggestTechRange} />
                    <AutoSuggest name="tech_sole" label="Sole Type" value={techSole} onChange={setTechSole} fetchSuggestions={suggestTechSole} />
                    <AutoSuggest name="tech_upper" label="Upper Material" value={techUpper} onChange={setTechUpper} fetchSuggestions={suggestTechUpper} />
                    <AutoSuggest name="tech_adjustment" label="Adjustment" value={techAdjustment} onChange={setTechAdjustment} fetchSuggestions={suggestTechAdjustment} />
                </div>
            </div>

            <div className="flex gap-3 flex-wrap items-center">
                <button type="submit" disabled={saving || !modelValid} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded transition-colors">
                    {saving ? "Saving..." : productId ? "Update Product" : "Create Product"}
                </button>
                {!modelValid && modelName && (
                    <span className="text-amber-400 text-xs">Model must end with a product type</span>
                )}
                <button type="button" onClick={() => router.back()} className="bg-neutral-800 hover:bg-neutral-700 text-zinc-300 font-medium px-6 py-2.5 rounded transition-colors">
                    Cancel
                </button>
            </div>
        </form>
    );
}

function Field({ label, name, required, type = "text", step, isTextarea, defaultValue }: {
    label: string;
    name: string;
    required?: boolean;
    type?: string;
    step?: string;
    isTextarea?: boolean;
    defaultValue?: string;
}) {
    const inputClass = "w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-red-600 transition-colors";
    return (
        <div>
            <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">{label}</label>
            {isTextarea ? (
                <textarea name={name} required={required} defaultValue={defaultValue} rows={3} className={inputClass} />
            ) : (
                <input type={type} name={name} required={required} step={step} defaultValue={defaultValue} className={inputClass} />
            )}
        </div>
    );
}
