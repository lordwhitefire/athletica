"use client";

import { useState, useRef } from "react";
import { uploadImage, deleteAsset } from "@/lib/actions/media";
import { useRouter } from "next/navigation";

interface Props {
    assets: Record<string, unknown>[];
}

export default function MediaBrowser({ assets }: Props) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            await uploadImage(formData);
            router.refresh();
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this asset?")) return;
        try {
            await deleteAsset(id);
            router.refresh();
        } catch (err) {
            console.error(err);
            alert("Delete failed");
        }
    }

    function copyUrl(url: string) {
        navigator.clipboard.writeText(url);
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black uppercase tracking-tight">Media</h1>
                <label className={`bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                    <span className="material-symbols-outlined text-[16px]">upload</span>
                    {uploading ? "Uploading..." : "Upload"}
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {assets.map((asset) => {
                    const id = asset._id as string;
                    const url = asset.url as string;
                    const filename = asset.originalFilename as string;
                    const dims = (asset.metadata as Record<string, unknown>)?.dimensions as Record<string, unknown> | undefined;
                    return (
                        <div key={id} className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden group">
                            <div className="aspect-square bg-neutral-800 relative">
                                <img src={url} alt={filename} className="w-full h-full object-cover" />
                                <div className="absolute top-1 right-1 flex items-center gap-1">
                                    <button onClick={() => copyUrl(url)} className="bg-neutral-800/80 text-white text-[10px] w-6 h-6 rounded flex items-center justify-center hover:bg-neutral-700 transition-colors" title="Copy URL">
                                        <span className="material-symbols-outlined text-[12px]">link</span>
                                    </button>
                                    <button onClick={() => handleDelete(id)} className="bg-red-600/80 text-white text-[10px] w-6 h-6 rounded flex items-center justify-center hover:bg-red-700 transition-colors" title="Delete">
                                        <span className="material-symbols-outlined text-[12px]">delete</span>
                                    </button>
                                </div>
                            </div>
                            <div className="p-2">
                                <p className="text-xs text-zinc-400 truncate">{filename}</p>
                                {dims && (
                                    <p className="text-[10px] text-zinc-600">{dims.width as number} &times; {dims.height as number}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
                {assets.length === 0 && (
                    <div className="col-span-full p-12 text-center text-zinc-500">No media uploaded yet</div>
                )}
            </div>
        </div>
    );
}
