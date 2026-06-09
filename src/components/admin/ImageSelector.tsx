"use client";

import { useState, useEffect, useRef } from "react";
import { urlFor } from "@/lib/sanity";
import type { SanityImageSource } from "@sanity/image-url";
import { logger } from "@/lib/logger";

interface Props {
    name: string;
    label: string;
    value?: string | null;
    onChange?: (assetId: string | null) => void;
}

interface Asset {
    _id: string;
    url: string;
    originalFilename: string;
}

export default function ImageSelector({ name, label, value, onChange }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (showPicker && assets.length === 0) {
            setLoading(true);
            fetch("/api/admin/media/assets")
                .then((r) => r.json())
                .then(setAssets)
                .finally(() => setLoading(false));
        }
    }, [showPicker, assets.length]);

    useEffect(() => {
        if (value && value.startsWith("image-")) {
            try {
                const url = urlFor({ _ref: value } as SanityImageSource).width(200).url();
                setPreview(url);
            } catch {
                setPreview(null);
            }
        } else if (!value) {
            setPreview(null);
        }
    }, [value]);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/admin/media/upload", {
                method: "POST",
                body: formData,
            });
            const asset = await res.json();
            selectAsset(asset);
        } catch (err) {
            logger.error(err, "ImageSelector error");
            alert("Upload failed");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    function selectAsset(asset: Asset) {
        onChange?.(asset._id);
        setPreview(asset.url);
        setShowPicker(false);
    }

    function clearSelection() {
        onChange?.(null);
        setPreview(null);
    }

    const selectedAsset = assets.find((a) => a._id === value);

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <label className="block text-zinc-500 text-xs font-medium">{label}</label>
                <div className="flex gap-2">
                    <label className={`text-[11px] uppercase tracking-wider font-medium cursor-pointer bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                        {uploading ? "Uploading..." : "Upload"}
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                    </label>
                    <button type="button" onClick={() => setShowPicker((v) => !v)}
                        className={`text-[11px] uppercase tracking-wider font-medium px-3 py-1.5 rounded transition-colors ${showPicker ? "bg-red-600 text-white" : "bg-neutral-700 hover:bg-neutral-600 text-white"}`}>
                        Media Library
                    </button>
                    {value && (
                        <button type="button" onClick={clearSelection} className="text-[11px] uppercase tracking-wider font-medium bg-neutral-700 hover:bg-red-600 text-white px-3 py-1.5 rounded transition-colors">
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <input type="hidden" name={name} value={value || ""} />

            {(preview || selectedAsset) && (
                <div className="relative w-32 h-32 bg-neutral-800 border border-neutral-700 rounded overflow-hidden mb-2">
                    <img src={preview || selectedAsset?.url || ""} alt="" className="w-full h-full object-cover" />
                </div>
            )}

            {showPicker && (
                <div className="mt-1">
                    {loading ? (
                        <p className="text-xs text-zinc-500">Loading...</p>
                    ) : assets.length === 0 ? (
                        <p className="text-xs text-zinc-500">No media uploaded yet. Upload one above.</p>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                            {assets.map((asset) => (
                                <button
                                    key={asset._id}
                                    type="button"
                                    onClick={() => selectAsset(asset)}
                                    className={`aspect-square bg-neutral-800 border-2 rounded overflow-hidden hover:border-red-600/50 transition-colors ${value === asset._id ? "border-red-600" : "border-transparent"}`}
                                    title={asset.originalFilename}
                                >
                                    <img src={asset.url} alt={asset.originalFilename} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
