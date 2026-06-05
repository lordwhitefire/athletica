"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AutoSuggest from "@/components/admin/AutoSuggest";
import { suggestBrands } from "@/lib/actions/suggestions";
import ImageSelector from "@/components/admin/ImageSelector";

export default function BrandForm({ initial, brandId }: { initial?: Record<string, unknown>; brandId?: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [brandName, setBrandName] = useState(initial?.name as string || "");
  const [logoAsset, setLogoAsset] = useState<string | null>(
    initial?.logo && typeof initial.logo === "object"
      ? ((initial.logo as Record<string, unknown>).asset as Record<string, unknown>)?._ref as string || null
      : null
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    data.set("logo_asset", logoAsset || "");

    try {
      if (brandId) {
        const { updateBrand } = await import("@/lib/actions/brands");
        await updateBrand(brandId, data);
      } else {
        const { createBrand } = await import("@/lib/actions/brands");
        await createBrand(data);
      }
      router.push("/admin/brands");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save brand");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded p-6 space-y-4">
        <AutoSuggest name="name" label="Brand Name" value={brandName} onChange={setBrandName} fetchSuggestions={suggestBrands} />
        <ImageSelector name="logo_sel" label="Brand Logo" value={logoAsset} onChange={setLogoAsset} />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded transition-colors">
          {saving ? "Saving..." : brandId ? "Update Brand" : "Create Brand"}
        </button>
        <button type="button" onClick={() => router.back()} className="bg-neutral-800 hover:bg-neutral-700 text-zinc-300 font-medium px-6 py-2.5 rounded transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
