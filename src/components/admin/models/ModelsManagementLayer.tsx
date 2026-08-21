"use client";

import React from "react";
import type { AdminModelGroup, AdminModelNode } from "@/lib/actions/models";

type ModalState =
    | { mode: "closed" }
    | { mode: "create-root" }
    | { mode: "create-child"; parentId: string; parentName: string }
    | { mode: "edit"; modelId: string };

export default function ModelsManagementLayer() {
    const [groups, setGroups] = React.useState<AdminModelGroup[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
    const [modal, setModal] = React.useState<ModalState>({ mode: "closed" });
    const [formName, setFormName] = React.useState("");
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
            const { getModelsAdmin } = await import("@/lib/actions/models");
            const result = await getModelsAdmin();
            if (result.error) {
                setError(result.error.message);
                return;
            }
            setGroups(result.data ?? []);
            setExpanded((prev) => {
                const next = new Set(prev);
                for (const group of result.data ?? []) {
                    for (const root of group.models) {
                        if (root.hasChildren) next.add(root.id);
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
        load();
    }, [load]);

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
        () => groups.flatMap((g) => flatten(g.models)),
        [groups, flatten],
    );

    const openCreateChild = (node: AdminModelNode) => {
        setModal({ mode: "create-child", parentId: node.id, parentName: node.name });
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
                m.brandId === node.brandId &&
                m.id !== node.id &&
                m.level < 2 &&
                !isDescendant(m, node.id),
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
                if (!formParentId) {
                    setFormError("A brand is required.");
                    setSaving(false);
                    return;
                }
                result = await createModel(name, formParentId, null);
            } else if (modal.mode === "create-child") {
                const parent = allModels.find((m) => m.id === modal.parentId);
                if (!parent) {
                    setFormError("Parent model no longer exists.");
                    setSaving(false);
                    return;
                }
                result = await createModel(name, parent.brandId, parent.id);
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

    function indentLabel(node: AdminModelNode) {
        if (node.level === 0) return "Root model";
        if (node.level === 1) return "Sub model";
        return "Leaf model";
    }

    function renderNode(node: AdminModelNode, depth: number) {
        const isOpen = expanded.has(node.id);
        return (
            <React.Fragment key={node.id}>
                <tr
                    className="border-b border-neutral-800/60 hover:bg-neutral-900/50"
                    data-level={node.level}
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
                        <span className="inline-flex items-center rounded px-2 py-0.5 bg-neutral-800 text-zinc-300">
                            {indentLabel(node)}
                        </span>
                    </td>
                    <td className="py-2.5 px-2 text-xs text-zinc-400 whitespace-nowrap">{node.slug}</td>
                    <td className="py-2.5 px-2 text-xs text-zinc-400 whitespace-nowrap">
                        {node.hasChildren ? (
                            <span className="text-zinc-500">—</span>
                        ) : (
                            <span className="text-[#b8ff18] font-bold">{node.productCount}</span>
                        )}
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1 justify-end">
                            {node.level < 2 && (
                                <button
                                    type="button"
                                    onClick={() => openCreateChild(node)}
                                    className="px-2 py-1 rounded text-[11px] text-zinc-400 hover:text-white hover:bg-neutral-800"
                                >
                                    <span className="material-symbols-outlined text-[14px] align-middle">add</span>
                                    <span className="ml-1 align-middle">Sub</span>
                                </button>
                            )}
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
                        Manage the model hierarchy — brand → root → sub → leaf. Leaf models carry the product counts.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setModal({ mode: "create-root" });
                        setFormName("");
                        setFormParentId("");
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
                    {error}
                </div>
            ) : groups.length === 0 ? (
                <div className="p-6 border border-neutral-800 rounded-lg bg-neutral-900/50 text-zinc-400 text-sm">
                    No models yet. Create a root model to start building the hierarchy.
                </div>
            ) : (
                <div className="space-y-6">
                    {groups.map((group) => (
                        <div key={group.brandId}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-[18px] text-zinc-500">local_offer</span>
                                <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                                    {group.brandName}
                                </h2>
                                <span className="text-[11px] text-zinc-600">
                                    {group.models.length} root{group.models.length === 1 ? "" : "s"}
                                </span>
                            </div>
                            <div className="border border-neutral-800 rounded-lg overflow-x-auto bg-neutral-950/40">
                                <table className="w-full text-left min-w-[640px]">
                                    <thead>
                                        <tr className="text-[10px] uppercase tracking-wider text-zinc-600 border-b border-neutral-800">
                                            <th className="py-2.5 px-3 font-semibold">Model</th>
                                            <th className="py-2.5 px-2 font-semibold">Level</th>
                                            <th className="py-2.5 px-2 font-semibold">Slug</th>
                                            <th className="py-2.5 px-2 font-semibold">Products</th>
                                            <th className="py-2.5 px-2 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.models.map((root) => renderNode(root, 0))}
                                    </tbody>
                                </table>
                            </div>
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
                                    ? `New Sub Model under ${modal.parentName}`
                                    : "Edit Model"}
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5 mb-4">
                            {modal.mode === "create-child" ? "Child is created at level 2 (leaf)." : "Max depth is 2 (root → sub → leaf)."}
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
                                <label className="block">
                                    <span className="mb-1.5 block text-[10px] font-semibold text-[#8e9398]">Brand</span>
                                    <select
                                        value={formParentId}
                                        onChange={(e) => setFormParentId(e.target.value)}
                                        className="h-[36px] w-full rounded-[6px] border border-[#25292d] bg-[#0a0c0d] px-3 text-[12px] text-[#e5e7e8] outline-none focus:border-[#b8e51f]/60"
                                    >
                                        <option value="">Select a brand</option>
                                        {groups.map((g) => (
                                            <option key={g.brandId} value={g.brandId}>{g.brandName}</option>
                                        ))}
                                    </select>
                                </label>
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
                                                {"— ".repeat(m.level)}{m.name} ({indentLabel(m)})
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