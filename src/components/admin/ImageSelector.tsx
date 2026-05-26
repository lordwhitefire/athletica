"use client";

import { useState, useEffect } from "react";

interface Props {
    value: string | null;
    onChange: (v: string | null) => void;
    label: string;
}

interface Asset {
    _id: string;
    url: string;
    originalFilename: string;
}

export default function ImageSelector({ value, onChange, label }: Props) {
    const [mode, setMode] = useState<"url" | "picker">(value ? "url" : "picker");
    const [url, setUrl] = useState(value || "");
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

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
        if (mode === "url" && url) {
            onChange(url);
        }
    }, [url, mode, onChange]);

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <label className="block text-zinc-500 text-xs font-medium">{label}</label>
                <div className="flex gap-2">
                    <button onClick={() => { setMode("url"); setShowPicker(false); }}
                        className={`text-[10px] uppercase tracking-wider font-medium ${mode === "url" ? "text-red-500" : "text-zinc-600 hover:text-zinc-400"}`}>
                        URL
                    </button>
                    <button onClick={() => { setMode("picker"); setShowPicker(true); }}
                        className={`text-[10px] uppercase tracking-wider font-medium ${mode === "picker" ? "text-red-500" : "text-zinc-600 hover:text-zinc-400"}`}>
                        Media Library
                    </button>
                </div>
            </div>

            {mode === "url" && (
                <div className="flex gap-2">
                    <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded text-xs focus:outline-none focus:border-red-600" />
                    {url && <button onClick={() => { setUrl(""); onChange(null); }} className="text-zinc-500 hover:text-red-500 text-xs">Clear</button>}
                </div>
            )}

            {mode === "picker" && showPicker && (
                <div className="mt-1">
                    {loading ? (
                        <p className="text-xs text-zinc-500">Loading...</p>
                    ) : assets.length === 0 ? (
                        <p className="text-xs text-zinc-500">No media uploaded yet. Go to Media page to upload.</p>
                    ) : (
                        <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                            <button
                                onClick={() => onChange(null)}
                                className={`aspect-square bg-neutral-800 border-2 rounded flex items-center justify-center text-xs text-zinc-500 hover:border-zinc-600 transition-colors ${!value ? "border-red-600" : "border-transparent"}`}
                            >
                                None
                            </button>
                            {assets.map((asset) => (
                                <button
                                    key={asset._id}
                                    onClick={() => onChange(asset.url)}
                                    className={`aspect-square bg-neutral-800 border-2 rounded overflow-hidden hover:border-red-600/50 transition-colors ${value === asset.url ? "border-red-600" : "border-transparent"}`}
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
