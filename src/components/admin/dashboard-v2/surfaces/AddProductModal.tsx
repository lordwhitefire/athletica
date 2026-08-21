"use client";

import { useRef, useState } from "react";
import ModalShell from "./ModalShell";
import { createQuickProduct } from "@/lib/actions/products";
import { useDashboardInteraction } from "../interaction-store";
import { urlFor } from "@/lib/sanity-client";
import type { SanityImageSource } from "@sanity/image-url";

function assetThumbUrl(assetId: string): string {
    try {
        return urlFor({ _ref: assetId } as SanityImageSource).width(200).url();
    } catch {
        return "";
    }
}

export default function AddProductModal({
    brands,
    categories,
}: {
    brands: { _id: string; name: string }[];
    categories: { label: string }[];
}) {
    const { state, setDraft, resetDraft, setBusy, closeModal, showToast } = useDashboardInteraction();
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [model, setModel] = useState("");
    const [imageAssets, setImageAssets] = useState<string[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const imageFileRef = useRef<HTMLInputElement>(null);
    const draft = state.productDraft;

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!draft.name.trim()) errors.name = "Product name is required.";
        if (!draft.category) errors.category = "Select a category.";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
            const json = await res.json();
            if (!res.ok || json.error) {
                throw new Error(json.error?.message || "Upload failed");
            }
            setImageAssets((prev) => [...prev, json.data._id]);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Upload failed";
            showToast({ tone: "error", title: "Image upload failed", message: msg });
        } finally {
            setUploadingImage(false);
            if (imageFileRef.current) imageFileRef.current.value = "";
        }
    }

    async function handleSubmit() {
        if (!validate()) return;

        setSubmitError(null);
        setBusy(true);
        const formData = new FormData();
        formData.set("name", draft.name.trim());
        formData.set("asin", draft.asin.trim());
        formData.set("category", draft.category);
        formData.set("brand_ref", draft.brand);
        formData.set("model", model.trim());
        formData.set("gallery_assets", imageAssets.join(","));
        const result = await createQuickProduct(formData, { draft: draft.status === "unpublished" });
        setBusy(false);

        if (result.error) {
            setSubmitError(result.error.message);
            showToast({ tone: "error", title: "Failed to add product", message: result.error.message });
            return;
        }

        showToast({ tone: "success", title: "Product added", message: `${draft.name.trim()} was added to the catalog.` });
        resetDraft();
        setFieldErrors({});
        setModel("");
        setImageAssets([]);
        closeModal();
    }

    const clearError = (field: string) =>
        setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));

    return (
        <ModalShell
            title="Add Product"
            eyebrow="CATALOG"
            subtitle="Create a product record without leaving the dashboard."
            onClose={closeModal}
            footer={
                <>
                    <button
                        type="button"
                        onClick={closeModal}
                        className="text-xs text-zinc-400 border border-neutral-700 rounded px-4 py-2 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={state.busy}
                        className="text-xs font-bold bg-[#b7f52a] text-black rounded px-4 py-2 hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                        {state.busy ? (
                            <>
                                <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[14px]">add</span>
                                Add Product
                            </>
                        )}
                    </button>
                </>
            }
        >
            <div className="space-y-3">
                <label className="block">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">Product Name</span>
                    <input
                        type="text"
                        autoFocus
                        value={draft.name}
                        onChange={(e) => {
                            setDraft({ name: e.target.value });
                            clearError("name");
                        }}
                        className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                        placeholder="e.g. Nike Mercurial Vapor 15"
                    />
                    {fieldErrors.name && <span className="text-[10px] text-[#ff7110]">{fieldErrors.name}</span>}
                </label>

                <label className="block">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">Amazon ASIN (optional)</span>
                    <input
                        type="text"
                        value={draft.asin}
                        onChange={(e) => {
                            setDraft({ asin: e.target.value });
                            clearError("asin");
                        }}
                        maxLength={10}
                        className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-xs text-white uppercase"
                        placeholder="e.g. B0C2HSX28B"
                    />
                    {fieldErrors.asin && <span className="text-[10px] text-[#ff7110]">{fieldErrors.asin}</span>}
                </label>

                <label className="block">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">Model</span>
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                        placeholder="e.g. Football Boots/FG/Mercurial Vapor"
                    />
                    <span className="mt-1 block text-[9px] text-zinc-600">
                        Resolved through the model hierarchy when it matches a leaf model.
                    </span>
                </label>

                <div className="block">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Images</span>
                        <label
                            className={`text-[10px] uppercase tracking-wider font-medium cursor-pointer bg-neutral-700 hover:bg-neutral-600 text-white px-2.5 py-1 rounded transition-colors ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}
                        >
                            {uploadingImage ? "Uploading..." : "Add Image"}
                            <input ref={imageFileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                    </div>
                    {imageAssets.length === 0 ? (
                        <p className="mt-1 text-[9px] text-zinc-600">No images yet.</p>
                    ) : (
                        <div className="mt-2 grid grid-cols-4 gap-2">
                            {imageAssets.map((assetId, i) => (
                                <div key={`${assetId}-${i}`} className="relative aspect-square bg-neutral-800 border border-neutral-700 rounded overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={assetThumbUrl(assetId)} alt="" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setImageAssets((prev) => prev.filter((_, j) => j !== i))}
                                        className="absolute top-1 right-1 bg-red-600 text-white text-[10px] w-5 h-5 rounded flex items-center justify-center"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Category</span>
                        <select
                            value={draft.category}
                            onChange={(e) => {
                                setDraft({ category: e.target.value });
                                clearError("category");
                            }}
                            className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                        >
                            <option value="">Select category</option>
                            {categories.map((c) => (
                                <option key={c.label} value={c.label}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.category && (
                            <span className="text-[10px] text-[#ff7110]">{fieldErrors.category}</span>
                        )}
                    </label>

                    <label className="block">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Brand</span>
                        <select
                            value={draft.brand}
                            onChange={(e) => setDraft({ brand: e.target.value })}
                            className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                        >
                            <option value="">Select brand</option>
                            {brands.map((b) => (
                                <option key={b._id} value={b._id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <label className="block">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">Publishing status</span>
                    <select
                        value={draft.status}
                        onChange={(e) => setDraft({ status: e.target.value as "active" | "unpublished" })}
                        className="mt-1 w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                    >
                        <option value="active">Active</option>
                        <option value="unpublished">Unpublished</option>
                    </select>
                </label>

                {submitError && (
                    <p className="text-[10px] text-[#ff7110] bg-[rgba(255,113,16,.08)] rounded px-3 py-2">{submitError}</p>
                )}
            </div>
        </ModalShell>
    );
}