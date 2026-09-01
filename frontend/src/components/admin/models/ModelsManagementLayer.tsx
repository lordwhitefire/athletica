"use client";

import React from "react";
import type { AdminModelCategoryGroup, AdminModelNode } from "@/lib/actions/models";

type FormOptions = { categories: { id: string; name: string }[]; brands: { id: string; name: string }[] };

type ModalState =
    | { mode: "closed" }
    | { mode: "create-root" }
    | { mode: "create-child"; parentId: string; parentName: string; parentBrandId: string | null }
    | { mode: "edit"; modelId: string };

export default function ModelsManagementLayer({ initialGroups, initialFormOptions }: { initialGroups: AdminModelCategoryGroup[]; initialFormOptions: FormOptions }) {
    const [groups, setGroups] = React.useState<AdminModelCategoryGroup[]>(initialGroups);
    const [formOptions, setFormOptions] = React.useState<FormOptions>(initialFormOptions);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
    const [modal, setModal] = React.useState<ModalState>({ mode: "closed" });
    const [formName, setFormName] = React.useState("");
    const [formCategoryId, setFormCategoryId] = React.useState("");
    const [formBrandId, setFormBrandId] = React.useState("");
    const [formParentId, setFormParentId] = React.useState("");
    const [formError, setFormError] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);
    const [toast, setToast] = React.useState<{ tone: "success" | "error"; message: string } | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
    const [deleting, setDeleting] = React.useState(false);

    const showToast = React.useCallback((tone: "success" | "error", message: string) => {
        setToast({ tone, message });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [{ getModelsAdmin }, { getModelFormOptions }] = await Promise.all([
                import("@/lib/actions/models"),
                import("@/lib/actions/models"),
            ]);
            const [result, optionsResult] = await Promise.all([getModelsAdmin(), getModelFormOptions()]);
            if (result.error) {
                setError(result.error.message);
                return;
            }
            if (!optionsResult.error && optionsResult.data) {
                setFormOptions(optionsResult.data);
            }
            setGroups(result.data ?? []);
            setExpanded((prev) => {
                const next = new Set(prev);
                for (const group of result.data ?? []) {
                    for (const brand of group.brands) {
                        for (const root of brand.models) {
                            if (root.hasChildren) next.add(root.id);
                        }
                    }
                }
                return next;
            });
        } catch {
            setError("Unable to load models.");
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setModal({ mode: "closed" });
                setDeleteTarget(null);
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    const toggleExpand = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const flatten = React.useCallback((nodes: AdminModelNode[]): AdminModelNode[] => {
        const out: AdminModelNode[] = [];
        const walk = (list: AdminModelNode[]) => {
            for (const n of list) {
                out.push(n);
                walk(n.children);
            }
        };
        walk(nodes);
        return out;
    }, []);

    const allModels = React.useMemo(
        () => groups.flatMap((g) => g.brands.flatMap((b) => flatten(b.models))),
        [groups, flatten],
    );

    const openCreateChild = (node: AdminModelNode) => {
        setModal({
            mode: "create-child",
            parentId: node.id,
            parentName: node.name,
            parentBrandId: node.brandId,
        });
        setFormName("");
        setFormError(null);
    };

    const openEdit = (node: AdminModelNode) => {
        setModal({ mode: "edit", modelId: node.id });
        setFormName(node.name);
        setFormParentId(node.parentId ?? "");
        setFormError(null);
    };

    const parentOptionsFor = (node: AdminModelNode) =>
        allModels.filter(
            (m) =>
                m.id !== node.id &&
                !isDescendant(m, node.id) &&
                (m.brandId === node.brandId || m.brandId === null || node.brandId === null),
        );

    function isDescendant(ancestor: AdminModelNode, id: string): boolean {
        const walk = (n: AdminModelNode): boolean => {
            if (n.id === id) return true;
            return n.children.some(walk);
        };
        return walk(ancestor);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const name = formName.trim();
        if (!name) {
            setFormError("Model name is required.");
            return;
        }
        setSaving(true);
        setFormError(null);
        try {
            const { createModel, updateModel } = await import("@/lib/actions/models");
            let result;
            if (modal.mode === "create-root") {
                if (!formCategoryId) {
                    setFormError("A category is required — every root model is anchored to a category.");
                    setSaving(false);
                    return;
                }
                result = await createModel(name, formCategoryId, formBrandId || null, null);
            } else if (modal.mode === "create-child") {
                result = await createModel(name, "", modal.parentBrandId, modal.parentId);
            } else if (modal.mode === "edit") {
                result = await updateModel(modal.modelId, name, formParentId || null);
            } else {
                setFormError("Unknown modal state.");
                setSaving(false);
                return;
            }
            if (result.error) {
                setFormError(result.error.message);
                setSaving(false);
                return;
            }
            await load();
            setModal({ mode: "closed" });
            setSaving(false);
            showToast("success", modal.mode === "edit" ? "Model updated" : "Model created");
        } catch {
            setFormError("Unable to save this model.");
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const { deleteModel } = await import("@/lib/actions/models");
            const result = await deleteModel(deleteTarget.id);
            if (result.error) {
                showToast("error", result.error.message);
                setDeleteTarget(null);
                setDeleting(false);
                return;
            }
            await load();
            setDeleteTarget(null);
            setDeleting(false);
            showToast("success", "Model deleted");
        } catch {
            setDeleting(false);
            showToast("error", "Unable to delete this model.");
        }
    }

    const modalOpen = modal.mode !== "closed";
    const editNode =
        modal.mode === "edit" ? allModels.find((m) => m.id === modal.modelId) : null;
    const editParentOptions = editNode ? parentOptionsFor(editNode) : [];

    function typeLabel(node: AdminModelNode) {
        if (node.nodeType === "product") return "Product model";
        if (node.level === 0) return "Root model";
        return "Submodel";
    }

    function renderNode(node: AdminModelNode, depth: number) {
        const isOpen = expanded.has(node.id);
        return (
            <React.Fragment key={node.id}>
                <tr
                    className="border-b border-neutral-800/60 hover:bg-neutral-900/50"
                    data-level={node.level}
                    data-node-type={node.nodeType}
                >
                    <td className="py-2.5 pr-2" style={{ paddingLeft: `${depth * 24 + 12}px` }}>
                        <div className="flex items-center gap-2">
                            {node.hasChildren ? (
                                <button
                                    type="button"
                                    onClick={() => toggleExpand(node.id)}
                                    aria-label={isOpen ? "Collapse" : "Expand"}
                                    className="w-6 h-6 grid place-items-center rounded text-zinc-500 hover:text-white hover:bg-neutral-800"
                                >
                                    <span className="material-symbols-outlined text-[14px]">
                                        {isOpen ? "expand_more" : "chevron_right"}
                                    </span>
                                </button>
                            ) : (
                                <span className="w-6 h-6 grid place-items-center text-zinc-700">
                                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                                </span>
                            )}
                            <span className={`text-sm font-semibold ${node.level === 0 ? "text-white" : "text-zinc-300"}`}>
                                {node.name}
                            </span>
                        </div>
                    </td>
                    <td className="py-2.5 px-2 text-xs text-zinc-500 whitespace-nowrap">
                        <span
                            className={`inline-flex items-center rounded px-2 py-0.5 ${
                                node.nodeType === "product"
                                    ? "bg-[#b8e51f]/15 text-[#c9f45a]"
                                    : "bg-neutral-800 text-zinc-300"
                            }`}
                        >
                            {typeLabel(node)}
                        </span>
                    </td>
                    <td className="py-2.5 px-2 text-xs text-zinc-400 whitespace-nowrap">{node.slug}</td>
                    <td className="py-2.5 px-2 text-xs text-zinc-400 whitespace-nowrap">
                        {node.nodeType === "product" ? (
                            <span className="text-[#b8ff18] font-bold">{node.directProductCount}</span>
                        ) : node.subtreeProductCount > 0 ? (
                            <span className="text-zinc-300">{node.subtreeProductCount} below</span>
                        ) : (
                            <span className="text-zinc-600">0</span>
                        )}
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1 justify-end">
                            <button
                                type="button"
                                onClick={() => openCreateChild(node)}
                                className="px-2 py-1 rounded text-[11px] text-zinc-400 hover:text-white hover:bg-neutral-800"
                            >
                                <span className="material-symbols-outlined text-[14px] align-middle">add</span>
                                <span className="ml-1 align-middle">Sub</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => openEdit(node)}
                                className="px-2 py-1 rounded text-[11px] text-zinc-400 hover:text-white hover:bg-neutral-800"
                            >
                                <span className="material-symbols-outlined text-[14px] align-middle">edit</span>
                                <span className="ml-1 align-middle">Edit</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeleteTarget({ id: node.id, name: node.name })}
                                className="px-2 py-1 rounded text-[11px] text-zinc-400 hover:text-red-400 hover:bg-red-950/40"
                            >
                                <span className="material-symbols-outlined text-[14px] align-middle">delete</span>
                                <span className="ml-1 align-middle">Delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
                {isOpen && node.children.map((child) => renderNode(child, depth + 1))}
            </React.Fragment>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Models</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Category → brand → root model → submodels → product models. Product models carry exactly one product.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setModal({ mode: "create-root" });
                        setFormName("");
                        setFormCategoryId("");
                        setFormBrandId("");
                        setFormError(null);
                    }}
                    className="bg-primary hover:brightness-75 text-on-primary font-bold px-4 py-2 rounded transition-colors text-sm"
                >
                    <span className="material-symbols-outlined text-[16px] align-middle">add</span>
                    <span className="ml-1.5 align-middle">New Root Model</span>
                </button>
            </div>

            {toast && (
                <div
                    role="status"
                    className={`px-4 py-2.5 rounded text-sm border ${
                        toast.tone === "success"
                            ? "bg-emerald-950/60 border-emerald-800 text-emerald-200"
                            : "bg-red-950/60 border-red-800 text-red-200"
                    }`}
                >
                    {toast.message}
                </div>
            )}

            {loading ? (
                <div className="p-6 animate-pulse space-y-2">
                    <div className="h-8 bg-neutral-800 rounded w-1/2" />
                    <div className="h-32 bg-neutral-900 border border-neutral-800 rounded-lg" />
                </div>
            ) : error ? (
                <div className="p-6 border border-red-800 rounded-lg bg-red-950/40 text-red-200 text-sm">
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={() => void load()}
                        data-testid="models-retry"
                        className="mt-2 text-xs font-semibold text-[#b8e51f] underline hover:brightness-110"
                    >
                        Retry
                    </button>
                </div>
            ) : groups.length === 0 ? (
                <div className="p-6 border border-neutral-800 rounded-lg bg-neutral-900/50 text-zinc-400 text-sm">
                    No models yet. Create a root model to start building the hierarchy.
                </div>
            ) : (
                <div className="space-y-6">
                    {groups.map((group) => (
                        <div key={group.categoryId || "unanchored"}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-[18px] text-zinc-500">category</span>
                                <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                                    {group.categoryName}
                                </h2>
                                <span className="text-[11px] text-zinc-600">
                                    {group.brands.reduce((n, b) => n + b.models.length, 0)} root
                                    {group.brands.reduce((n, b) => n + b.models.length, 0) === 1 ? "" : "s"}
                                </span>
                            </div>
                            {group.brands.map((brand) => (
                                <div key={brand.brandId ?? "__none__"} className="mb-3">
                                    <div className="flex items-center gap-2 mb-1.5 pl-1">
                                        <span className="material-symbols-outlined text-[14px] text-zinc-600">local_offer</span>
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                                            {brand.brandName}
                                        </span>
                                    </div>
                                    <div className="border border-neutral-800 rounded-lg overflow-x-auto bg-neutral-950/40">
                                        <table className="w-full text-left min-w-[640px]">
                                            <thead>
                                                <tr className="text-[10px] uppercase tracking-wider text-zinc-600 border-b border-neutral-800">
                                                    <th className="py-2.5 px-3 font-semibold">Model</th>
                                                    <th className="py-2.5 px-2 font-semibold">Type</th>
                                                    <th className="py-2.5 px-2 font-semibold">Slug</th>
                                                    <th className="py-2.5 px-2 font-semibold">Products</th>
                                                    <th className="py-2.5 px-2 font-semibold text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {brand.models.map((root) => renderNode(root, 0))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3" onClick={() => setModal({ mode: "closed" })}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="models-dialog-title"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[520px] max-h-[calc(100vh-24px)] overflow-y-auto rounded-[10px] border border-[#1b1f22] bg-[#0d0f11] shadow-2xl p-5"
                    >
                        <h2 id="models-dialog-title" className="text-base font-bold text-white">
                            {modal.mode === "create-root"
                                ? "New Root Model"
                                : modal.mode === "create-child"
                                    ? `New Submodel under ${modal.parentName}`
                                    : "Edit Model"}
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5 mb-4">
                            {modal.mode === "create-root"
                                ? "Root models anchor directly to a category. Brand is optional."
                                : modal.mode === "create-child"
                                    ? "Submodels can nest at any depth."
                                    : "Rename or reparent. Depth is unlimited."}
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="block">
                                <span className="mb-1.5 block text-[10px] font-semibold text-[#8e9398]">Model name</span>
                                <input
                                    autoFocus
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g. Predator Elite"
                                    className="h-[36px] w-full rounded-[6px] border border-[#25292d] bg-[#0a0c0d] px-3 text-[12px] text-[#e5e7e8] outline-none focus:border-[#b8e51f]/60"
                                />
                            </label>

                            {modal.mode === "create-root" && (
                                <>
                                    <label className="block">
                                        <span className="mb-1.5 block text-[10px] font-semibold text-[#8e9398]">Category (required)</span>
                                        <select
                                            value={formCategoryId}
                                            onChange={(e) => setFormCategoryId(e.target.value)}
                                            className="h-[36px] w-full rounded-[6px] border border-[#25292d] bg-[#0a0c0d] px-3 text-[12px] text-[#e5e7e8] outline-none focus:border-[#b8e51f]/60"
                                        >
                                            <option value="">Select a category</option>
                                            {formOptions.categories.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="block">
                                        <span className="mb-1.5 block text-[10px] font-semibold text-[#8e9398]">Brand (optional)</span>
                                        <select
                                            value={formBrandId}
                                            onChange={(e) => setFormBrandId(e.target.value)}
                                            className="h-[36px] w-full rounded-[6px] border border-[#25292d] bg-[#0a0c0d] px-3 text-[12px] text-[#e5e7e8] outline-none focus:border-[#b8e51f]/60"
                                        >
                                            <option value="">No brand</option>
                                            {formOptions.brands.map((b) => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                </>
                            )}

                            {modal.mode === "edit" && editNode && (
                                <label className="block">
                                    <span className="mb-1.5 block text-[10px] font-semibold text-[#8e9398]">Parent model</span>
                                    <select
                                        value={formParentId}
                                        onChange={(e) => setFormParentId(e.target.value)}
                                        className="h-[36px] w-full rounded-[6px] border border-[#25292d] bg-[#0a0c0d] px-3 text-[12px] text-[#e5e7e8] outline-none focus:border-[#b8e51f]/60"
                                    >
                                        <option value="">(Root level)</option>
                                        {editParentOptions.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {"— ".repeat(m.level)}{m.name} ({typeLabel(m)})
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}

                            {formError && (
                                <div className="text-red-400 text-xs" role="alert">{formError}</div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-primary hover:brightness-75 disabled:opacity-50 text-on-primary font-bold px-5 py-2 rounded text-sm transition-colors"
                                >
                                    {saving ? "Saving..." : modal.mode === "edit" ? "Save Changes" : "Create Model"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModal({ mode: "closed" })}
                                    className="bg-neutral-800 hover:bg-neutral-700 text-zinc-300 font-medium px-5 py-2 rounded text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3" onClick={() => setDeleteTarget(null)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="models-delete-title"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[440px] rounded-[10px] border border-[#1b1f22] bg-[#0d0f11] shadow-2xl p-5"
                    >
                        <h2 id="models-delete-title" className="text-base font-bold text-white">Delete model</h2>
                        <p className="text-sm text-zinc-400 mt-2">
                            Delete <strong className="text-white">{deleteTarget.name}</strong>? Models with products or submodels cannot be deleted.
                        </p>
                        <div className="flex gap-3 mt-5">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded text-sm transition-colors"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="bg-neutral-800 hover:bg-neutral-700 text-zinc-300 font-medium px-5 py-2 rounded text-sm transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
