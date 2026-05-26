"use client";

import { useState } from "react";
import { saveNavigation } from "@/lib/actions/navigation";
import { useRouter } from "next/navigation";

interface Props {
    doc: Record<string, unknown> | null;
}

export default function NavigationEditor({ doc }: Props) {
    const router = useRouter();
    const items = (doc?.items as Record<string, unknown>[]) || [];
    const [navItems, setNavItems] = useState<Record<string, unknown>[]>(items);
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        try {
            await saveNavigation(navItems);
            router.refresh();
        } catch (err) {
            console.error(err);
            alert("Failed to save");
        } finally {
            setSaving(false);
        }
    }

    function updateTree(items: Record<string, unknown>[]) {
        setNavItems([...items]);
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black uppercase tracking-tight">Navigation</h1>
                <button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded transition-colors">
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div className="space-y-2">
                {navItems.map((item, i) => (
                    <NavTreeItem
                        key={(item.id as string) || i}
                        item={item}
                        index={i}
                        items={navItems}
                        setItems={updateTree}
                    />
                ))}
                <button onClick={() => {
                    setNavItems([...navItems, { id: `nav-${Date.now()}`, level: 0, label: "", href: "/", children: [] }]);
                }} className="text-sm text-red-500 hover:text-red-400 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">add</span> Add Top-Level Item
                </button>
            </div>

            {navItems.length === 0 && (
                <p className="text-zinc-500 text-sm py-8 text-center">No navigation items. Add one above.</p>
            )}
        </div>
    );
}

function NavTreeItem({ item, index, items, setItems, depth = 0 }: {
    item: Record<string, unknown>;
    index: number;
    items: Record<string, unknown>[];
    setItems: (items: Record<string, unknown>[]) => void;
    depth?: number;
}) {
    const [expanded, setExpanded] = useState(true);
    const children = (item.children as Record<string, unknown>[]) || [];
    const customLinks = (item.customLinks as Record<string, unknown>[]) || [];
    const sizeLinks = (item.sizeLinks as Record<string, unknown>[]) || [];
    const bottomLinks = (item.bottomLinks as Record<string, unknown>[]) || [];
    const hasChildren = children.length > 0 || customLinks.length > 0 || sizeLinks.length > 0 || bottomLinks.length > 0;

    function updateField(field: string, value: string) {
        const updated = [...items];
        const target = { ...updated[index], [field]: value };
        updated[index] = target;
        setItems(updated);
    }

    function remove() {
        if (!confirm(`Delete "${item.label || "untitled"}"?`)) return;
        setItems(items.filter((_, i) => i !== index));
    }

    function addChild() {
        const newChild: Record<string, unknown> = { id: `nav-${Date.now()}`, level: (item.level as number || 0) + 1, label: "", href: "/", children: [] };
        const updated = [...items];
        const target = { ...updated[index] };
        target.children = [...(target.children as Record<string, unknown>[] || []), newChild];
        updated[index] = target;
        setItems(updated);
    }

    function updateChildren(newChildren: Record<string, unknown>[]) {
        const updated = [...items];
        updated[index] = { ...updated[index], children: newChildren };
        setItems(updated);
    }

    function addLinkTo(arrName: "customLinks" | "sizeLinks" | "bottomLinks") {
        const newLink: Record<string, unknown> = { label: "", href: "/", description: "" };
        const updated = [...items];
        const target = { ...updated[index] };
        target[arrName] = [...(target[arrName] as Record<string, unknown>[] || []), newLink];
        updated[index] = target;
        setItems(updated);
    }

    function updateLink(arrName: "customLinks" | "sizeLinks" | "bottomLinks", linkIndex: number, field: string, value: string) {
        const updated = [...items];
        const target = { ...updated[index] };
        const arr = [...(target[arrName] as Record<string, unknown>[] || [])];
        arr[linkIndex] = { ...arr[linkIndex], [field]: value };
        target[arrName] = arr;
        updated[index] = target;
        setItems(updated);
    }

    function removeLink(arrName: "customLinks" | "sizeLinks" | "bottomLinks", linkIndex: number) {
        const updated = [...items];
        const target = { ...updated[index] };
        const arr = [...(target[arrName] as Record<string, unknown>[] || [])];
        arr.splice(linkIndex, 1);
        target[arrName] = arr;
        updated[index] = target;
        setItems(updated);
    }

    const indentStyle = { marginLeft: `${depth * 24}px` };

    return (
        <div className="bg-neutral-800 border border-neutral-700 rounded overflow-hidden" style={indentStyle}>
            {/* Header row */}
            <div className="flex items-center gap-2 p-3 bg-neutral-750">
                <button onClick={() => setExpanded(!expanded)} className="text-zinc-500 hover:text-white p-0.5">
                    <span className="material-symbols-outlined text-[14px]">{expanded ? "expand_more" : "chevron_right"}</span>
                </button>
                <input value={item.label as string || ""} onChange={(e) => updateField("label", e.target.value)}
                    placeholder="Label"
                    className="flex-1 min-w-0 px-2 py-1 bg-neutral-800 border border-neutral-700 text-white rounded text-xs focus:outline-none focus:border-red-600" />
                <input value={item.href as string || ""} onChange={(e) => updateField("href", e.target.value)}
                    placeholder="/path"
                    className="w-48 px-2 py-1 bg-neutral-800 border border-neutral-700 text-white rounded text-xs font-mono focus:outline-none focus:border-red-600" />
                <input value={item.description as string || ""} onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Description (optional)"
                    className="flex-1 min-w-0 px-2 py-1 bg-neutral-800 border border-neutral-700 text-white rounded text-xs focus:outline-none focus:border-red-600 hidden md:block" />
                <button onClick={remove} className="text-zinc-500 hover:text-red-500 p-0.5 flex-shrink-0">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
            </div>

            {/* Expanded children */}
            {expanded && (
                <div className="pl-2 pr-2 pb-2 space-y-1">
                    {/* Nested children */}
                    {children.length > 0 && (
                        <div className="pt-1 space-y-1">
                            {children.map((child, ci) => (
                                <NavTreeItem key={(child.id as string) || ci} item={child} index={ci} items={children} setItems={updateChildren} depth={depth + 1} />
                            ))}
                        </div>
                    )}
                    <button onClick={addChild} className="text-[10px] text-red-500 hover:text-red-400 font-medium flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">add</span> Add Sub-Item
                    </button>

                    {/* Custom Links */}
                    {customLinks.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-neutral-700">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Custom Links</span>
                            {customLinks.map((link, li) => (
                                <LinkRow key={li} link={link} onChange={(f, v) => updateLink("customLinks", li, f, v)} onRemove={() => removeLink("customLinks", li)} />
                            ))}
                        </div>
                    )}
                    <button onClick={() => addLinkTo("customLinks")} className="text-[10px] text-red-500 hover:text-red-400 font-medium flex items-center gap-0.5 mt-1">
                        <span className="material-symbols-outlined text-[12px]">add</span> Add Custom Link
                    </button>

                    {/* Size Links */}
                    {sizeLinks.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-neutral-700">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Size Links</span>
                            {sizeLinks.map((link, li) => (
                                <LinkRow key={li} link={link} onChange={(f, v) => updateLink("sizeLinks", li, f, v)} onRemove={() => removeLink("sizeLinks", li)} />
                            ))}
                        </div>
                    )}
                    <button onClick={() => addLinkTo("sizeLinks")} className="text-[10px] text-red-500 hover:text-red-400 font-medium flex items-center gap-0.5 mt-1">
                        <span className="material-symbols-outlined text-[12px]">add</span> Add Size Link
                    </button>

                    {/* Bottom Links */}
                    {bottomLinks.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-neutral-700">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Bottom Links</span>
                            {bottomLinks.map((link, li) => (
                                <LinkRow key={li} link={link} onChange={(f, v) => updateLink("bottomLinks", li, f, v)} onRemove={() => removeLink("bottomLinks", li)} />
                            ))}
                        </div>
                    )}
                    <button onClick={() => addLinkTo("bottomLinks")} className="text-[10px] text-red-500 hover:text-red-400 font-medium flex items-center gap-0.5 mt-1">
                        <span className="material-symbols-outlined text-[12px]">add</span> Add Bottom Link
                    </button>
                </div>
            )}
        </div>
    );
}

function LinkRow({ link, onChange, onRemove }: {
    link: Record<string, unknown>;
    onChange: (field: string, value: string) => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex items-center gap-2 mt-1">
            <input value={link.label as string || ""} onChange={(e) => onChange("label", e.target.value)}
                placeholder="Label"
                className="flex-1 px-2 py-1 bg-neutral-800 border border-neutral-700 text-white rounded text-[11px] focus:outline-none focus:border-red-600" />
            <input value={link.href as string || ""} onChange={(e) => onChange("href", e.target.value)}
                placeholder="/path"
                className="w-32 px-2 py-1 bg-neutral-800 border border-neutral-700 text-white rounded text-[11px] font-mono focus:outline-none focus:border-red-600" />
            <input value={link.description as string || ""} onChange={(e) => onChange("description", e.target.value)}
                placeholder="Description"
                className="flex-1 px-2 py-1 bg-neutral-800 border border-neutral-700 text-white rounded text-[11px] focus:outline-none focus:border-red-600 hidden md:block" />
            <button onClick={onRemove} className="text-zinc-500 hover:text-red-500 p-0.5 flex-shrink-0">
                <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
        </div>
    );
}
