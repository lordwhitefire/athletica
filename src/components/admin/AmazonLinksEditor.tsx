"use client";

import { useState } from "react";
import AutoSuggest from "./AutoSuggest";
import { suggestProductIds } from "@/lib/actions/suggestions";
import { saveAmazonLinks } from "@/lib/actions/amazon-links";
import { useRouter } from "next/navigation";

interface Props {
    doc: Record<string, unknown> | null;
}

export default function AmazonLinksEditor({ doc }: Props) {
    const router = useRouter();
    const rawLinks = (doc?.links as Record<string, unknown>[]) || [];
    const [links, setLinks] = useState<{ productId: string; url: string }[]>(
        rawLinks.map((l) => ({ productId: (l.productId as string) || "", url: (l.url as string) || "" }))
    );
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        try {
            await saveAmazonLinks(links);
            router.refresh();
        } catch (err) {
            console.error(err);
            alert("Failed to save");
        } finally {
            setSaving(false);
        }
    }

    function update(index: number, field: "productId" | "url", value: string) {
        const updated = [...links];
        updated[index] = { ...updated[index], [field]: value };
        setLinks(updated);
    }

    function add() {
        setLinks([...links, { productId: "", url: "" }]);
    }

    function remove(index: number) {
        setLinks(links.filter((_, i) => i !== index));
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black uppercase tracking-tight">Amazon Links</h1>
                <div className="flex gap-2">
                    <button onClick={add} className="bg-neutral-800 hover:bg-neutral-700 text-zinc-300 text-sm font-medium px-4 py-2 rounded transition-colors flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Link
                    </button>
                    <button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded transition-colors">
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-800">
                        <tr className="text-zinc-400 uppercase tracking-wider text-xs">
                            <th className="text-left p-3 font-medium">Product ID</th>
                            <th className="text-left p-3 font-medium">Amazon URL</th>
                            <th className="text-right p-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {links.map((link, i) => (
                            <tr key={i} className="hover:bg-neutral-800/50">
                                <td className="p-2">
                                    <AutoSuggest
                                        value={link.productId}
                                        onChange={(v) => {
                                            const match = v.match(/\(([^)]+)\)$/);
                                            update(i, "productId", match ? match[1] : v);
                                        }}
                                        fetchSuggestions={suggestProductIds}
                                        label="Product ID"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        value={link.url}
                                        onChange={(e) => update(i, "url", e.target.value)}
                                        className="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-red-600"
                                    />
                                </td>
                                <td className="p-2 text-right">
                                    <button onClick={() => remove(i)} className="text-red-500 hover:text-red-400">
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {links.length === 0 && (
                            <tr><td colSpan={3} className="p-8 text-center text-zinc-500">No links</td></tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
}
