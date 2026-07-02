"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormData } from "@/lib/schemas/product";
import { Form } from "@/components/ui/Form";
import ImageSelector from "./ImageSelector";
import AutoSuggest from "./AutoSuggest";
import ModelInput from "./ModelInput";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
    suggestCategories, suggestTractions, suggestNames,
    suggestModels, suggestColors, suggestTechSole,
    suggestTechUpper, suggestTechRange, suggestTechAdjustment,
} from "@/lib/actions/suggestions";
import { urlFor } from "@/lib/sanity-client";
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

function keyBenefitsDefault(initial: Record<string, unknown> | undefined): string {
    try {
        const raw = val(initial, "description", "key_benefits");
        return raw ? JSON.stringify(JSON.parse(raw)) : "[]";
    } catch {
        return "[]";
    }
}

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

export default function ProductForm({ action, initial, productId }: ProductFormProps) {
    const router = useRouter();
    const isNew = !productId;

    const [mainImageAsset, setMainImageAsset] = useState<string | null>(assetRef(initial?.main_image));
    const [thumbnailAsset, setThumbnailAsset] = useState<string | null>(assetRef(initial?.thumbnail));
    const [galleryAssets, setGalleryAssets] = useState<string[]>(assetRefs(initial?.image_gallery));
    const galleryFileRef = useRef<HTMLInputElement>(null);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);
    const [brandRef, setBrandRef] = useState<string | null>((initial?.brand as Record<string, unknown>)?._ref as string || null);
    const [modelNavTree, setModelNavTree] = useState<ModelNavNode[]>([]);
    const [modelValid, setModelValid] = useState(false);
    const [keyBenefits, setKeyBenefits] = useState<string[]>(() => {
        try {
            const raw = val(initial, "description", "key_benefits");
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    const methods = useForm({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            id: val(initial, "id") || (isNew ? generateId() : ""),
            url_slug: val(initial, "url_slug") || "",
            model: val(initial, "model"),
            name: val(initial, "name"),
            category: val(initial, "category"),
            brand_ref: (initial?.brand as Record<string, unknown>)?._ref as string || "",
            traction: val(initial, "traction"),
            gender: val(initial, "gender") || "Unisex",
            color: val(initial, "color"),
            price_current: val(initial, "price", "current"),
            price_original: val(initial, "price", "original"),
            discount_percent: val(initial, "price", "discount_percent"),
            member_price: val(initial, "price", "member_price"),
            currency: val(initial, "price", "currency") || "EUR",
            desc_subtitle: val(initial, "description", "subtitle"),
            desc_tagline: val(initial, "description", "tagline"),
            desc_intro: val(initial, "description", "intro"),
            desc_collection: val(initial, "description", "collection"),
            key_benefits_json: keyBenefitsDefault(initial),
            tech_range: val(initial, "description", "technical_details", "range"),
            tech_sole: val(initial, "description", "technical_details", "sole_type"),
            tech_upper: val(initial, "description", "technical_details", "upper_material"),
            tech_adjustment: val(initial, "description", "technical_details", "adjustment"),
            main_image_asset: assetRef(initial?.main_image) || "",
            thumbnail_asset: assetRef(initial?.thumbnail) || "",
            gallery_assets: assetRefs(initial?.image_gallery).join(","),
        },
    });

    const { handleSubmit, setError, control, register, setValue, watch, formState: { errors, isSubmitting } } = methods;
    const [slugValue, setSlugValue] = useState(val(initial, "url_slug") || "");
    const modelValue = watch("model");

    useEffect(() => {
        import("@/lib/actions/brands").then(m =>
            m.getAllBrandsAdmin().then(r => { if (r.data) setBrandOptions(r.data as BrandOption[]); })
        );
        import("@/lib/actions/navigation").then(m =>
            m.getModelNavTreeAction().then(r => { if (r.data) setModelNavTree(r.data); })
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
            const updated = [...galleryAssets, asset._id];
            setGalleryAssets(updated);
            setValue("gallery_assets", updated.join(","));
        } catch (err) {
            logger.error(err, "ProductForm error");
            alert("Upload failed");
        } finally {
            setUploadingGallery(false);
            if (galleryFileRef.current) galleryFileRef.current.value = "";
        }
    }

    function handleModelChange(value: string) {
        setValue("model", value);
        const firstSeg = value.split(",")[0] || value;
        if (isNew || slugValue === modelToSlug(watch("model")) || slugValue === modelToSlug(firstSeg)) {
            const newSlug = modelToSlug(firstSeg);
            setSlugValue(newSlug);
            setValue("url_slug", newSlug);
        }
    }

    async function onSubmit(data: ProductFormData) {
        const formData = new FormData();
        formData.set("id", data.id || "");
        formData.set("url_slug", data.url_slug);
        formData.set("model", data.model);
        formData.set("name", data.name);
        formData.set("category", data.category);
        formData.set("brand_ref", brandRef || "");
        formData.set("traction", data.traction || "");
        formData.set("gender", data.gender);
        formData.set("color", data.color);
        formData.set("price_current", data.price_current);
        formData.set("price_original", data.price_original);
        formData.set("discount_percent", data.discount_percent);
        formData.set("member_price", data.member_price);
        formData.set("currency", data.currency);
        formData.set("desc_subtitle", data.desc_subtitle);
        formData.set("desc_tagline", data.desc_tagline);
        formData.set("desc_intro", data.desc_intro);
        formData.set("desc_collection", data.desc_collection);
        formData.set("key_benefits_json", JSON.stringify(keyBenefits));
        formData.set("tech_range", data.tech_range);
        formData.set("tech_sole", data.tech_sole);
        formData.set("tech_upper", data.tech_upper);
        formData.set("tech_adjustment", data.tech_adjustment);
        formData.set("main_image_asset", mainImageAsset || "");
        formData.set("thumbnail_asset", thumbnailAsset || "");
        formData.set("gallery_assets", galleryAssets.join(","));

        try {
            let result;
            if (productId) {
                const { updateProduct } = await import("@/lib/actions/products");
                result = await updateProduct(productId, formData);
            } else if (action) {
                result = await action(formData);
            }
            if (result && result.error) {
                if (result.error.fields) {
                    for (const f of result.error.fields) {
                        setError(f.field as keyof ProductFormData, { message: f.message });
                    }
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
        }
    }

    return (
        <FormProvider {...methods}>
            <Form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Images</h2>
                    <Controller
                        name="main_image_asset"
                        control={control}
                        render={({ field }) => (
                            <ImageSelector name="main_image_sel" label="Main Image" value={field.value || null} onChange={(v) => { field.onChange(v); setMainImageAsset(v); }} />
                        )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Controller
                            name="thumbnail_asset"
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                        Thumbnail
                                        <InfoTooltip text="Small preview image used in product lists and search results. Recommended: 200x200px." />
                                    </label>
                                    <ImageSelector name="thumbnail_sel" label="Thumbnail" value={field.value || null} onChange={(v) => { field.onChange(v); setThumbnailAsset(v); }} />
                                </div>
                            )}
                        />
                        <div>
                            <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                Brand
                                <InfoTooltip text="Select the brand for this product. Brand logo will be displayed automatically." />
                            </label>
                            <div className="flex items-center gap-3">
                                <select
                                    value={brandRef || ""}
                                    onChange={(e) => {
                                        const v = e.target.value || null;
                                        setBrandRef(v);
                                        setValue("brand_ref", v || "");
                                    }}
                                    className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                >
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
                            {errors.brand_ref && (
                                <p className="text-red-500 text-xs mt-1">{errors.brand_ref.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Controller
                            name="thumbnail_asset"
                            control={control}
                            render={({ field }) => (
                                <ImageSelector name="thumbnail_sel" label="Thumbnail" value={field.value || null} onChange={(v) => { field.onChange(v); setThumbnailAsset(v); }} />
                            )}
                        />
                        <div>
                            <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">Brand</label>
                            <div className="flex items-center gap-3">
                                <select
                                    value={brandRef || ""}
                                    onChange={(e) => {
                                        const v = e.target.value || null;
                                        setBrandRef(v);
                                        setValue("brand_ref", v || "");
                                    }}
                                    className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                >
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
                            {errors.brand_ref && (
                                <p className="text-red-500 text-xs mt-1">{errors.brand_ref.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-zinc-500 text-xs font-medium flex items-center gap-2">
                                Image Gallery
                                <InfoTooltip text="Additional product images shown in the product detail page. Recommended: Multiple angles, features, and lifestyle shots." />
                            </label>
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
                                    <button type="button" onClick={() => {
                                        const updated = galleryAssets.filter((_, j) => j !== i);
                                        setGalleryAssets(updated);
                                        setValue("gallery_assets", updated.join(","));
                                    }}
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
                            <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                Product ID
                                <InfoTooltip text="Internal identifier for the product. Used for system tracking and reference." />
                            </label>
                            <input type="text" {...register("id")}
                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors" />
                        </div>
                        <div>
                            <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                URL Slug
                                <InfoTooltip text="Web-friendly version of the product name used in URLs. Auto-generated from model name." />
                            </label>
                            <input type="text" {...register("url_slug")}
                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors" />
                            {errors.url_slug && (
                                <p className="text-red-500 text-xs mt-1">{errors.url_slug.message}</p>
                            )}
                        </div>
                    </div>
                    <input type="hidden" {...register("model")} />
                    <Controller
                        name="model"
                        control={control}
                        render={({ field }) => (
                            <div>
                                <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                    Model
                                    <InfoTooltip text="Product classification using C/T system: C=Classification (category), T=Type (specific product). Must end with a product type (e.g., 'Football Boots/FG/Mercurial Vapor/FG-Elite/FG')." />
                                </label>
                                <ModelInput modelNavTree={modelNavTree} value={field.value || ""} onChange={handleModelChange} onValidChange={setModelValid} />
                                {errors.model && (
                                    <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>
                                )}
                            </div>
                        )}
                    />
                    <div>
                        <Controller
                            name="category"
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                        Category
                                        <InfoTooltip text="Main product category (e.g., Football Boots, Running Shoes, Training Apparel)." />
                                    </label>
                                    <AutoSuggest name="category" label="Category" value={field.value || ""} onChange={field.onChange} fetchSuggestions={suggestCategories} />
                                </div>
                            )}
                        />
                        {errors.category && (
                            <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Controller
                            name="traction"
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                        Traction
                                        <InfoTooltip text="Sole configuration: FG=Firm Ground, AG=Artificial Grass, TF=Turf, SG=Soft Ground." />
                                    </label>
                                    <AutoSuggest name="traction" label="Traction (FG/AG/TF/SG)" value={field.value || ""} onChange={field.onChange} fetchSuggestions={suggestTractions} />
                                </div>
                            )}
                        />
                        <div>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <div>
                                        <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                            Name
                                            <InfoTooltip text="Official product name (e.g., 'Mercurial Vapor', 'Ultra Boost')." />
                                        </label>
                                        <AutoSuggest name="name" label="Name" value={field.value || ""} onChange={field.onChange} fetchSuggestions={suggestNames} />
                                    </div>
                                )}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                Gender
                                <InfoTooltip text="Target gender demographic for the product." />
                            </label>
                            <select {...register("gender")}
                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors">
                                <option value="Unisex">Unisex</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <Controller
                            name="color"
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                        Color
                                        <InfoTooltip text="Primary color of the product (e.g., Black, White, Red, Blue)." />
                                    </label>
                                    <AutoSuggest name="color" label="Color" value={field.value || ""} onChange={field.onChange} fetchSuggestions={suggestColors} />
                                </div>
                            )}
                        />
                        {errors.color && (
                            <p className="text-red-500 text-xs mt-1">{errors.color.message}</p>
                        )}
                    </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Pricing</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Field label="Current Price" error={errors.price_current?.message}>
                                <input type="number" step="0.01" {...register("price_current")}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors" />
                            </Field>
                            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                <InfoTooltip text="Current selling price of the product. This is the price customers will pay." />
                            </p>
                        </div>
                        <div>
                            <Field label="Original Price" error={errors.price_original?.message}>
                                <input type="number" step="0.01" {...register("price_original")}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors" />
                            </Field>
                            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                <InfoTooltip text="Original MSRP or retail price before any discounts." />
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Field label="Discount %" error={errors.discount_percent?.message}>
                                <input type="number" {...register("discount_percent")}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors" />
                            </Field>
                            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                <InfoTooltip text="Percentage discount from original price. Auto-calculated if both prices are set." />
                            </p>
                        </div>
                        <div>
                            <Field label="Member Price" error={errors.member_price?.message}>
                                <input type="number" step="0.01" {...register("member_price")}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors" />
                            </Field>
                            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                <InfoTooltip text="Special price for loyalty program members or subscribers." />
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                            Currency
                            <InfoTooltip text="Currency code for all pricing fields (EUR, USD, GBP)." />
                        </label>
                        <select {...register("currency")}
                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors">
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                        </select>
                        {errors.currency && (
                            <p className="text-red-500 text-xs mt-1">{errors.currency.message}</p>
                        )}
                    </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Description</h2>
                    <div>
                        <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                            Subtitle
                            <InfoTooltip text="Short secondary title or product line description." />
                        </label>
                        <Field error={errors.desc_subtitle?.message}>
                            <input type="text" {...register("desc_subtitle")}
                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors" />
                        </Field>
                    </div>
                    <div>
                        <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                            Tagline
                            <InfoTooltip text="Catchy slogan or marketing phrase for the product." />
                        </label>
                        <Field error={errors.desc_tagline?.message}>
                            <input type="text" {...register("desc_tagline")}
                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors" />
                        </Field>
                    </div>
                    <div>
                        <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                            Intro
                            <InfoTooltip text="Brief introduction paragraph about the product's key features and benefits." />
                        </label>
                        <Field error={errors.desc_intro?.message}>
                            <textarea {...register("desc_intro")} rows={3}
                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors" />
                        </Field>
                    </div>
                    <div>
                        <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                            Collection
                            <InfoTooltip text="Product series or collection name (e.g., 'Mercurial Series', 'Ultra Boost Line')." />
                        </label>
                        <Field error={errors.desc_collection?.message}>
                            <input type="text" {...register("desc_collection")}
                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors" />
                        </Field>
                    </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Key Benefits</h2>
                    <div className="flex items-start gap-2">
                        <p className="text-xs text-zinc-500 flex-1">Product highlights shown in bullet points</p>
                        <InfoTooltip text="Main selling points and unique features that differentiate this product from competitors." />
                    </div>
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
                                        setValue("key_benefits_json", JSON.stringify(updated));
                                    }}
                                    className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const updated = keyBenefits.filter((_, i) => i !== idx);
                                        setKeyBenefits(updated);
                                        setValue("key_benefits_json", JSON.stringify(updated));
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded text-zinc-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                const updated = [...keyBenefits, ""];
                                setKeyBenefits(updated);
                                setValue("key_benefits_json", JSON.stringify(updated));
                            }}
                            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">add</span> Add benefit
                        </button>
                    </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Technical Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Controller
                            name="tech_range"
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                        Range
                                        <InfoTooltip text="Product performance range or series (e.g., 'Pro Range', 'Elite Series')." />
                                    </label>
                                    <AutoSuggest name="tech_range" label="Range" value={field.value || ""} onChange={field.onChange} fetchSuggestions={suggestTechRange} />
                                </div>
                            )}
                        />
                        <Controller
                            name="tech_sole"
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                        Sole Type
                                        <InfoTooltip text="Type of sole construction (e.g., 'Stud', 'Blade', 'Conical', 'Mixed')." />
                                    </label>
                                    <AutoSuggest name="tech_sole" label="Sole Type" value={field.value || ""} onChange={field.onChange} fetchSuggestions={suggestTechSole} />
                                </div>
                            )}
                        />
                        <Controller
                            name="tech_upper"
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                        Upper Material
                                        <InfoTooltip text="Material used for the upper part of the shoe (e.g., 'Synthetic', 'Leather', 'Knit', 'Mesh')." />
                                    </label>
                                    <AutoSuggest name="tech_upper" label="Upper Material" value={field.value || ""} onChange={field.onChange} fetchSuggestions={suggestTechUpper} />
                                </div>
                            )}
                        />
                        <Controller
                            name="tech_adjustment"
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                                        Adjustment
                                        <InfoTooltip text="Fit adjustment system or technology (e.g., 'Lacing System', 'Boa Dial', 'Flywire')." />
                                    </label>
                                    <AutoSuggest name="tech_adjustment" label="Adjustment" value={field.value || ""} onChange={field.onChange} fetchSuggestions={suggestTechAdjustment} />
                                </div>
                            )}
                        />
                    </div>
                </div>

                <div className="flex gap-3 flex-wrap items-center">
                    <button type="submit" disabled={isSubmitting || !modelValid} className="bg-primary hover:brightness-75 disabled:opacity-50 text-on-primary font-bold px-6 py-2.5 rounded transition-colors">
                        {isSubmitting ? "Saving..." : productId ? "Update Product" : "Create Product"}
                    </button>
                    {!modelValid && watch("model") && (
                        <span className="text-amber-400 text-xs">Model must end with a product type</span>
                    )}
                    <button type="button" onClick={() => router.back()} className="bg-neutral-800 hover:bg-neutral-700 text-zinc-300 font-medium px-6 py-2.5 rounded transition-colors">
                        Cancel
                    </button>
                </div>
            </Form>
        </FormProvider>
    );
}

function Field({ label, error, children }: { label?: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            {label && <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">{label}</label>}
            {children}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
