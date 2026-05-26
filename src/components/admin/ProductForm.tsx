"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProductFormProps {
    action: (formData: FormData) => Promise<void>;
    initial?: Record<string, unknown>;
    productId?: string;
}

export default function ProductForm({ action, initial, productId }: ProductFormProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        const form = e.currentTarget;
        const data = new FormData(form);

        try {
            if (productId) {
                const { updateProduct } = await import("@/lib/actions/products");
                await updateProduct(productId, data);
            } else {
                await action(data);
            }
            router.push("/admin/products");
            router.refresh();
        } catch (err) {
            console.error(err);
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
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Basic Info</h2>

                <div className="grid grid-cols-2 gap-4">
                    <Field label="Product ID" name="id" required defaultValue={val("id")} />
                    <Field label="URL Slug" name="url_slug" required defaultValue={val("url_slug")} />
                </div>
                <Field label="Model Name" name="model" required defaultValue={val("model")} />
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Brand" name="brand" required defaultValue={val("brand")} />
                    <Field label="Category" name="category" required defaultValue={val("category")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Traction (FG/AG/TF/SG)" name="traction" defaultValue={val("traction")} />
                    <Field label="Model Line" name="model_line" defaultValue={val("model_line")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Gender" name="gender" defaultValue={val("gender") || "Unisex"} />
                    <Field label="Age Group" name="age_group" defaultValue={val("age_group") || "Adult"} />
                </div>
                <Field label="Color" name="color" defaultValue={val("color")} />
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Pricing</h2>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Current Price" name="price_current" type="number" step="0.01" defaultValue={val("price", "current")} />
                    <Field label="Original Price" name="price_original" type="number" step="0.01" defaultValue={val("price", "original")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Discount %" name="discount_percent" type="number" defaultValue={val("price", "discount_percent")} />
                    <Field label="Member Price" name="member_price" type="number" step="0.01" defaultValue={val("price", "member_price")} />
                </div>
                <Field label="Currency" name="currency" defaultValue={val("price", "currency") || "EUR"} />
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Description</h2>
                <Field label="Subtitle" name="desc_subtitle" defaultValue={val("description", "subtitle")} />
                <Field label="Tagline" name="desc_tagline" defaultValue={val("description", "tagline")} />
                <Field label="Intro" name="desc_intro" isTextarea defaultValue={val("description", "intro")} />
                <Field label="Collection" name="desc_collection" defaultValue={val("description", "collection")} />
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Technical Details</h2>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Range" name="tech_range" defaultValue={val("description", "technical_details", "range")} />
                    <Field label="Sole Type" name="tech_sole" defaultValue={val("description", "technical_details", "sole_type")} />
                    <Field label="Upper Material" name="tech_upper" defaultValue={val("description", "technical_details", "upper_material")} />
                    <Field label="Adjustment" name="tech_adjustment" defaultValue={val("description", "technical_details", "adjustment")} />
                </div>
            </div>

            <div className="flex gap-3">
                <button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded transition-colors">
                    {saving ? "Saving..." : productId ? "Update Product" : "Create Product"}
                </button>
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
