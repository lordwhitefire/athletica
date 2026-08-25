"use client";

import React from "react";
import CategoryAttachSection from "@/components/admin/category-management/CategoryAttachSection";
import { useSearchParams, useRouter } from "next/navigation";
import {
    deriveCategoryData,
    type CategoryNode,
    type CategoryWorkspaceData,
    type CategoryStatus,
    type Toast,
    nextToastId,
    kebabCase,
    formatCount,
    findCategory,
    findCategoryParent,
    updateCategoryNode,
} from "./category-management.interactions";

import { ApiResult, ok, fail, fromCaughtError } from "@/lib/api-types";
import { CategoryLink, CategoryLinkTargetType } from "@/types/category-links";

export type CategoryTab = "details" | "seo" | "products" | "brands" | "models" | "submodels" | "productmodels";

export const CATEGORY_TABS: { key: CategoryTab; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "seo", label: "SEO" },
    { key: "products", label: "Products" },
    { key: "brands", label: "Brands" },
    { key: "models", label: "Models" },
    { key: "submodels", label: "Submodels" },
    { key: "productmodels", label: "Product Models" },
];
type CategoryEditorMode =
    | { mode: "closed" }
    | { mode: "create-root" }
    | { mode: "create-child"; parentId: string }
    | { mode: "edit"; categoryId: string };

type SurfaceType = null | "delete-category" | "unsaved";

type ActionMenuTarget =
    | { type: "category"; id: string }
    | { type: "subcategory"; categoryId: string; id: string };

type ActionMenuState = { x: number; y: number; target: ActionMenuTarget } | null;

type UnsavedContext =
    | { key: "tab"; tab: CategoryTab }
    | { key: "category"; id: string }
    | { key: "close-editor" };

type PendingKey =
    | null
    | "saving-category"
    | "saving-subcategory"
    | "saving-details"
    | "saving-seo";

type DeleteTarget =
    | { type: "category"; id: string }
    | { type: "subcategory"; categoryId: string; id: string }
    | null;

const STATUS_COLORS: Record<CategoryStatus, string> = {
    active: "bg-[rgba(132,184,25,0.13)] text-[#b9e728]",
    inactive: "bg-[#1d1f22] text-[#7c8289]",
};

function statusPill(status: CategoryStatus) {
    return (
        <span
            className={`inline-flex h-[25px] items-center rounded-[6px] px-[10px] text-[11px] font-bold ${STATUS_COLORS[status]}`}
        >
            {status === "active" ? "Active" : "Inactive"}
        </span>
    );
}

function ModalSurface({
    onClose,
    labelledBy,
    wide,
    children,
}: {
    onClose: () => void;
    labelledBy: string;
    wide?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                onClick={(e) => e.stopPropagation()}
                className={`w-full ${wide ? "max-w-[860px]" : "max-w-[560px]"} max-h-[calc(100vh-24px)] overflow-y-auto rounded-[10px] border border-[#1b1f22] bg-[#0d0f11] shadow-2xl`}
            >
                {children}
            </div>
        </div>
    );
}

function BottomSheet({
    onClose,
    labelledBy,
    children,
}: {
    onClose: () => void;
    labelledBy: string;
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/60" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-h-[85vh] overflow-y-auto rounded-t-[12px] border border-[#1b1f22] bg-[#0d0f11] p-4"
            >
                {children}
            </div>
        </div>
    );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold text-[#8e9398]">
                {label}
                {required && <span className="ml-0.5 text-[#e4612b]">*</span>}
            </span>
            {children}
        </label>
    );
}

const inputClass =
    "h-[36px] w-full rounded-[6px] border border-[#25292d] bg-[#0a0c0d] px-3 text-[12px] text-[#e5e7e8] outline-none focus:border-[#b8e51f]/60 placeholder:text-[#555b62]";
const textareaClass =
    "w-full rounded-[6px] border border-[#25292d] bg-[#0a0c0d] px-3 py-2 text-[12px] text-[#e5e7e8] outline-none focus:border-[#b8e51f]/60 placeholder:text-[#555b62]";

function btnClass(variant: "outline" | "primary" | "ghost" | "danger") {
    switch (variant) {
        case "primary":
            return "inline-flex h-[36px] items-center justify-center gap-2 rounded-[5px] border border-[#9cc816] bg-gradient-to-b from-[#c9f12d] to-[#b5e51b] px-4 text-[11px] font-semibold text-[#151a06] hover:brightness-105 active:translate-y-px";
        case "danger":
            return "inline-flex h-[36px] items-center justify-center gap-2 rounded-[5px] border border-[#5a2a1d] bg-[#241310] px-4 text-[11px] font-semibold text-[#e4612b] hover:bg-[#2c1712] active:translate-y-px";
        case "ghost":
            return "inline-flex h-[36px] items-center justify-center gap-2 rounded-[5px] px-3 text-[11px] font-medium text-[#b7bbc0] hover:bg-[#171a1d] active:translate-y-px";
        default:
            return "inline-flex h-[36px] items-center justify-center gap-2 rounded-[5px] border border-[#25292d] bg-[#0d0f11] px-4 text-[11px] font-semibold text-[#d5d8db] hover:border-[#3a4147] active:translate-y-px";
    }
}

export default function CategoryManagementInteractionLayer({ initialTree }: { initialTree: CategoryNode[] }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [tree, setTree] = React.useState<CategoryNode[]>(initialTree);
    const [workspace, setWorkspace] = React.useState<Record<string, CategoryWorkspaceData>>({});
    const [selectedCategoryId, setSelectedCategoryId] = React.useState("all");
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => new Set(["all"]));
    const [searchQuery, setSearchQuery] = React.useState("");
    const [debouncedQuery, setDebouncedQuery] = React.useState("");
    const [filter, setFilter] = React.useState<"all" | "active" | "inactive">("all");
    const [filterDraft, setFilterDraft] = React.useState<"all" | "active" | "inactive">("all");
    const [filterOpen, setFilterOpen] = React.useState(false);
    const [filterRect, setFilterRect] = React.useState<{ x: number; y: number } | null>(null);
    const [activeTab, setActiveTab] = React.useState<CategoryTab>("details");
    const [loadingCategory, setLoadingCategory] = React.useState(false);
    const [categoryError, setCategoryError] = React.useState<string | null>(null);
    const [treeError, setTreeError] = React.useState<string | null>(null);

     const [categoryEditor, setCategoryEditor] = React.useState<CategoryEditorMode>({ mode: "closed" });
    const [surface, setSurface] = React.useState<SurfaceType>(null);
     const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget>(null);
    const [unsaved, setUnsaved] = React.useState<UnsavedContext | null>(null);
    const [actionMenu, setActionMenu] = React.useState<ActionMenuState>(null);
    const [toasts, setToasts] = React.useState<Toast[]>([]);
    const [pending, setPending] = React.useState<PendingKey>(null);
     const [dirty, setDirty] = React.useState<Set<string>>(new Set());
    const [deleteProductCount, setDeleteProductCount] = React.useState<number | null>(null);
    const [deleteCountState, setDeleteCountState] = React.useState<"idle" | "loading" | "ready" | "error">("idle");
    const [deleteCategoryState, setDeleteCategoryState] = React.useState<{
        descendantStrategy: "move-descendants" | "delete-descendants";
        moveDescendantsTo: string;
        moveProductsTo: string;
    }>({ descendantStrategy: "move-descendants", moveDescendantsTo: "", moveProductsTo: "" });

     const [attachedEntities, setAttachedEntities] = React.useState<Record<CategoryLinkTargetType, CategoryLink[]>>({
        brand: [],
        model: [],
        submodel: [],
        product_model: [],
    });

     const [availableEntities, setAvailableEntities] = React.useState<Record<CategoryLinkTargetType, { id: string; name: string }[]>>({
        brand: [],
        model: [],
        submodel: [],
        product_model: [],
    });

    // --- FR3-D attach-sections data (via server actions) ---
    const fetchAttachedEntities = React.useCallback(async (categoryId: string) => {
        const result = await (await import("@/lib/actions/category-links")).getCategoryLinks(categoryId);
        if (!result.data) {
            showToast("error", result.error?.message ?? "Failed to load attachments");
            return;
        }
        const grouped: Record<CategoryLinkTargetType, CategoryLink[]> = { brand: [], model: [], submodel: [], product_model: [] };
        for (const link of result.data) {
            grouped[link.entity_type as CategoryLinkTargetType]?.push(link);
        }
        setAttachedEntities(grouped);
    }, []);

    const fetchAvailableEntities = React.useCallback(async (targetType: CategoryLinkTargetType) => {
        const result = await (await import("@/lib/actions/category-links")).getAttachOptions(targetType);
        if (!result.data) {
            showToast("error", result.error?.message ?? `Failed to load ${targetType} options`);
            return;
        }
        setAvailableEntities((prev) => ({ ...prev, [targetType]: result.data ?? [] }));
    }, []);

    const handleAttach = async (targetType: CategoryLinkTargetType, targetId: string) => {
        if (!selectedCategoryId || selectedCategoryId === "all") return;
        const result = await (await import("@/lib/actions/category-links")).attachCategoryLink(selectedCategoryId, targetType, targetId);
        if (!result.data) {
            showToast("error", result.error?.message ?? "Failed to attach");
            return;
        }
        showToast("success", "Attached");
        await fetchAttachedEntities(selectedCategoryId);
    };

    const handleDetach = async (targetType: CategoryLinkTargetType, targetId: string) => {
        if (!selectedCategoryId || selectedCategoryId === "all") return;
        const result = await (await import("@/lib/actions/category-links")).detachCategoryLink(selectedCategoryId, targetType, targetId);
        if (!result.data) {
            showToast("error", result.error?.message ?? "Failed to detach");
            return;
        }
        showToast("success", "Detached");
        await fetchAttachedEntities(selectedCategoryId);
    };
    React.useEffect(() => {
        if (!deleteTarget || deleteTarget.type !== "category") {
            return;
        }
        // Simplified - no product count check needed
    }, [deleteTarget]);

    const [detailsForm, setDetailsForm] = React.useState({ name: "", parentId: "", status: "active" as CategoryStatus, description: "" });
    const [seoForm, setSeoForm] = React.useState({ title: "", metaDescription: "", slug: "", canonicalUrl: "", intro: "" });
    const [seoError, setSeoError] = React.useState<string | null>(null);
    const [productsPage, setProductsPage] = React.useState(1);
    const [productsSearch, setProductsSearch] = React.useState("");
    const [productsStatus, setProductsStatus] = React.useState<"all" | "Active" | "Draft">("all");
    const [productsSort, setProductsSort] = React.useState<"name" | "price-asc" | "price-desc">("name");

    const showToast = React.useCallback((type: Toast["type"], message: string) => {
        const id = nextToastId();
        setToasts((list) => [...list.slice(-2), { id, type, message }]);
    }, []);

    const dismissToast = (id: number) => setToasts((list) => list.filter((t) => t.id !== id));

    const loadCategories = React.useCallback(async () => {
        try {
            const { getCategoriesAdmin } = await import("@/lib/actions/categories");
            const result = await getCategoriesAdmin();
            if (!result.data) {
                throw new Error(result.error?.message ?? "Could not load categories.");
            }
            const cats = result.data;

            const countByParent = new Map<string | null, typeof cats>();
            for (const c of cats) {
                const key = c.parent_id;
                if (!countByParent.has(key)) countByParent.set(key, []);
                countByParent.get(key)!.push(c);
            }

            const build = (parentId: string | null): CategoryNode[] =>
                (countByParent.get(parentId) ?? [])
                    .map((c): CategoryNode => ({
                        id: c.id,
                        name: c.name,
                        count: formatCount(c.productCount),
                        status: "active",
                        children: build(c.id),
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name));

            const children = build(null);

            // Categories whose parent chain is broken (missing parent, import
            // drift, cycles) never appear under any root — collect them into
            // an explicit "Unsorted" group so they stay visible and fixable.
            const reachable = new Set<string>();
            const collect = (nodes: CategoryNode[]) => {
                nodes.forEach((node) => {
                    reachable.add(node.id);
                    if (node.children) collect(node.children);
                });
            };
            collect(children);
            const orphans = cats.filter((c) => !reachable.has(c.id));
            const orphanIds = new Set(orphans.map((o) => o.id));
            const rootOrphanCats = orphans.filter((o) => !o.parent_id || !orphanIds.has(o.parent_id));
            const orphanRoots: CategoryNode[] = rootOrphanCats
                .map((c): CategoryNode => ({
                    id: c.id,
                    name: c.name,
                    count: formatCount(c.productCount),
                    status: "active",
                    children: build(c.id),
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            let topLevels = children;
            if (orphanRoots.length > 0) {
                topLevels = [
                    ...children,
                    {
                        id: "unsorted",
                        name: "Unsorted",
                        count: formatCount(rootOrphanCats.reduce((sum, c) => sum + c.productCount, 0)),
                        status: "active" as const,
                        expanded: true,
                        children: orphanRoots,
                    },
                ];
            }

            const totalProducts = cats.reduce((sum, c) => sum + c.productCount, 0);
            const nextTree: CategoryNode[] = [
                { id: "all", name: "All Categories", count: formatCount(totalProducts), status: "active", expanded: true, children: topLevels },
            ];
            setTree(nextTree);
            setTreeError(null);
            setSelectedCategoryId((current) => (findCategory(nextTree, current) ? current : "all"));
        } catch (err) {
            setTreeError(err instanceof Error ? err.message : "Could not load categories.");
        }
    }, []);

    const selectedNode = findCategory(tree, selectedCategoryId);
    const selectedData: CategoryWorkspaceData = selectedNode
        ? (workspace[selectedCategoryId] ?? deriveCategoryData(selectedNode))
        : {
              subcategories: [],
              details: { name: "", parentId: null, status: "active", description: "" },
              seo: { title: "", metaDescription: "", slug: "", canonicalUrl: "", intro: "" },
              metrics: { totalProducts: 0, productViews: 0, amazonClicks: 0, ctr: 0 },
              products: [],
          };

    const setDirtyKey = (key: string, value: boolean) =>
        setDirty((prev) => {
            const next = new Set(prev);
            if (value) next.add(key);
            else next.delete(key);
            return next;
        });

    const isPhone = () => window.innerWidth < 700;

    // ---- URL state ----
    React.useEffect(() => {
        const cat = searchParams.get("category");
        const tab = searchParams.get("tab");
        if (cat && findCategory(tree, cat)) setSelectedCategoryId(cat);
        if (tab && CATEGORY_TABS.some(t => t.key === tab)) setActiveTab(tab as CategoryTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        const params = new URLSearchParams();
        params.set("category", selectedCategoryId);
        params.set("tab", activeTab);
        router.replace(`/admin/categories?${params.toString()}`, { scroll: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategoryId, activeTab]);

    React.useEffect(() => {
        const cat = searchParams.get("category");
        const tab = searchParams.get("tab");
        if (cat && cat !== selectedCategoryId && findCategory(tree, cat)) {
            setSelectedCategoryId(cat);
        }
        if (tab && CATEGORY_TABS.some(t => t.key === tab) && tab !== activeTab) {
            setActiveTab(tab as CategoryTab);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, tree]);

    // FR3-D: load attachments + attachable options for the selected category
    React.useEffect(() => {
        if (!selectedCategoryId || selectedCategoryId === "all") return;
        fetchAttachedEntities(selectedCategoryId);
        (["brand", "model", "submodel", "product_model"] as CategoryLinkTargetType[]).forEach((t) => fetchAvailableEntities(t));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategoryId]);

    // ---- search debounce ----
    React.useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQuery(searchQuery), 250);
        return () => window.clearTimeout(timer);
    }, [searchQuery]);

    // ---- global escape + scroll lock + beforeunload ----
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (actionMenu) return setActionMenu(null);
            if (filterOpen) return setFilterOpen(false);
            if (surface) return;
            if (categoryEditor.mode !== "closed") return setCategoryEditor({ mode: "closed" });

        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [actionMenu, filterOpen, surface, categoryEditor]);

    React.useEffect(() => {
        const open = surface !== null || categoryEditor.mode !== "closed";
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [surface, categoryEditor]);

    React.useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (dirty.size > 0) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [dirty]);

    React.useEffect(() => {
        if (!actionMenu) return;
        const onDown = (e: MouseEvent) => {
            const el = e.target as HTMLElement;
            if (!el.closest("[data-action-menu]")) setActionMenu(null);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [actionMenu]);

    // ---- filtered tree ----
    const filteredTree = React.useMemo(() => {
        const q = debouncedQuery.trim().toLowerCase();
        const walk = (list: CategoryNode[]): CategoryNode[] => {
            const out: CategoryNode[] = [];
            list.forEach((node) => {
                const matchesQuery = !q || node.name.toLowerCase().includes(q);
                const matchesStatus = filter === "all" || node.status === filter;
                const children = node.children ? walk(node.children) : [];
                if (matchesQuery && matchesStatus) {
                    out.push({ ...node, children: children.length ? children : undefined });
                } else if (children.length > 0) {
                    out.push({ ...node, expanded: true, children });
                }
            });
            return out;
        };
        return walk(tree);
    }, [tree, debouncedQuery, filter]);

    const treeRows = React.useMemo(() => {
        const rows: { node: CategoryNode; depth: number }[] = [];
        const walk = (list: CategoryNode[], depth: number, forceExpand: boolean) => {
            list.forEach((node) => {
                rows.push({ node, depth });
                if (node.children && (forceExpand || expandedIds.has(node.id))) walk(node.children, depth + 1, forceExpand);
            });
        };
        walk(filteredTree, 0, debouncedQuery.trim().length > 0);
        return rows;
    }, [filteredTree, expandedIds, debouncedQuery]);

    const urlCategoryMissing = Boolean(searchParams.get("category")) && !findCategory(tree, searchParams.get("category") ?? "");

    // ---- category selection ----
    function selectCategory(id: string) {
        if (id === selectedCategoryId) return;
        if (dirty.size > 0) {
            setUnsaved({ key: "category", id });
            setSurface("unsaved");
            return;
        }
        commitSelectCategory(id);
    }

    function commitSelectCategory(id: string) {
        const node = findCategory(tree, id);
        if (!node) return;
        setLoadingCategory(true);
        setCategoryError(null);
        setExpandedIds((prev) => {
            const next = new Set(prev);
            const parent = findCategoryParent(tree, id);
            if (parent) next.add(parent.id);
            const grand = parent ? findCategoryParent(tree, parent.id) : null;
            if (grand) next.add(grand.id);
            return next;
        });
        window.setTimeout(() => {
            setSelectedCategoryId(id);
            setLoadingCategory(false);
            setProductsPage(1);
            setProductsSearch("");
        }, 420);
    }

    function toggleExpand(id: string) {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function openActionMenu(e: React.MouseEvent, target: ActionMenuTarget) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = Math.min(rect.left, window.innerWidth - 230);
        const y = Math.min(rect.bottom + 4, window.innerHeight - 260);
        setActionMenu({ x, y, target });
        e.stopPropagation();
    }

    // ---- category CRUD ----
    async function handleCreateCategory(input: { name: string; parentId: string | null; status: CategoryStatus; description: string }) {
        setPending("saving-category");
        try {
            const { createCategory } = await import("@/lib/actions/categories");
            const result = await createCategory(input.name.trim(), input.parentId);
            if (result.error) {
                setPending(null);
                showToast("error", result.error.message);
                return;
            }
            await loadCategories();
            setCategoryEditor({ mode: "closed" });
            setSelectedCategoryId(result.data.id);
            showToast("success", "Category created");
        } catch {
            setPending(null);
            showToast("error", "Unable to create this category.");
        } finally {
            setPending(null);
        }
    }

    async function handleUpdateCategory(id: string, input: { name: string; parentId: string | null; status: CategoryStatus; description: string }) {
        setPending("saving-category");
        try {
            const { updateCategory } = await import("@/lib/actions/categories");
            const result = await updateCategory(id, input.name.trim(), input.parentId);
            if (result.error) {
                setPending(null);
                showToast("error", result.error.message);
                return;
            }
            await loadCategories();
            setCategoryEditor({ mode: "closed" });
            showToast("success", "Category updated");
        } catch {
            setPending(null);
            showToast("error", "Unable to update this category.");
        } finally {
            setPending(null);
        }
    }

    // ---- details / seo save ----
    async function saveDetails() {
        const name = detailsForm.name.trim();
        if (!name) {
            showToast("error", "Category name is required.");
            return;
        }
        setPending("saving-details");
        try {
            const { updateCategory } = await import("@/lib/actions/categories");
            const result = await updateCategory(selectedCategoryId, name, detailsForm.parentId || null);
            if (result.error) {
                showToast("error", result.error.message);
                setPending(null);
                return;
            }
            await loadCategories();
            const data = selectedData;
            setWorkspace((prev) => ({
                ...prev,
                [selectedCategoryId]: {
                    ...data,
                    details: {
                        name,
                        parentId: detailsForm.parentId || null,
                        status: detailsForm.status,
                        description: detailsForm.description,
                    },
                },
            }));
            setDirtyKey("details", false);
            setPending(null);
            showToast("success", "Category updated");
        } catch {
            setPending(null);
            showToast("error", "Unable to update this category.");
        }
    }

    function saveSeo() {
        const slug = seoForm.slug.trim();
        if (!/^[a-z0-9-]+$/.test(slug)) {
            setSeoError("Slug must be lowercase letters, numbers, and dashes only.");
            return;
        }
        const siblings = selectedNode
            ? (findCategoryParent(tree, selectedNode.id)?.children ?? tree)
            : [];
        if (siblings.some((s) => s.id !== selectedNode?.id && kebabCase(s.name) === slug)) {
            setSeoError("This slug is already used by another category.");
            return;
        }
        if (seoForm.canonicalUrl.trim() && !/^https?:\/\/.+/.test(seoForm.canonicalUrl.trim())) {
            setSeoError("Canonical URL must be a valid http(s) URL.");
            return;
        }
        setSeoError(null);
        setPending("saving-seo");
        window.setTimeout(() => {
            setWorkspace((prev) => ({
                ...prev,
                [selectedCategoryId]: { ...selectedData, seo: { ...seoForm, slug } },
            }));
            setDirtyKey("seo", false);
            setPending(null);
            showToast("success", "SEO & content updated");
        }, 450);
    }

    // ---- unsaved discard ----
    function performDiscard(ctx: UnsavedContext) {
        setSurface(null);
        setUnsaved(null);
        setDirty(new Set());
        if (ctx.key === "tab") {
            setActiveTab(ctx.tab);
        } else if (ctx.key === "category") {
            commitSelectCategory(ctx.id);
        } else if (ctx.key === "close-editor") {
            setCategoryEditor({ mode: "closed" });
        // move-subcategory removed
        }
    }

    async function confirmDeleteCategory() {
        if (!deleteTarget || deleteTarget.type !== "category") return;
        const id = deleteTarget.id;
        const node = findCategory(tree, id);
        if (!node) return;
        setSurface(null);
        setDeleteTarget(null);
        try {
            const { deleteCategory } = await import("@/lib/actions/categories");
            const result = await deleteCategory(id);
            if (result.error) {
                showToast("error", result.error.message);
                return;
            }
            const parent = findCategoryParent(tree, id);
            await loadCategories();
            commitSelectCategory(parent?.id ?? "all");
            showToast("success", "Category deleted");
        } catch {
            showToast("error", "Unable to delete this category.");
        }
    }

    // ---- products tab ----
    const filteredProducts = React.useMemo(() => {
        const q = productsSearch.trim().toLowerCase();
        const list = (selectedData?.products ?? []).filter(
            (p) =>
                (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)) &&
                (productsStatus === "all" || p.status === productsStatus),
        );
        if (productsSort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name));
        if (productsSort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
        return [...list].sort((a, b) => b.price - a.price);
    }, [selectedData, productsSearch, productsStatus, productsSort]);

    const pageSize = 8;
    const productsTotal = filteredProducts.length;
    const productsTotalPages = Math.max(1, Math.ceil(productsTotal / pageSize));
    const pageProducts = filteredProducts.slice((productsPage - 1) * pageSize, productsPage * pageSize);

    // ---- dialogs render ----
    const editorDialogOpen = categoryEditor.mode !== "closed";
    const editorIsEdit = categoryEditor.mode === "edit";
    const editorCategory = editorIsEdit ? findCategory(tree, categoryEditor.categoryId) : null;
    const editorInitial = editorCategory
        ? workspace[editorCategory.id]?.details
        : null;

    const deleteNode = deleteTarget?.type === "category" ? findCategory(tree, deleteTarget.id) : null;
    const deleteHasChildren = Boolean(deleteNode?.children?.length);
    const deleteMoveOptions = tree
        .flatMap((n) => (n.children ? [n, ...n.children] : [n]))
        .filter((n) => n.id !== "all" && n.id !== (deleteTarget?.type === "category" ? deleteTarget.id : ""));
    const deleteProducts = deleteProductCount ?? 0;
    const deleteEnabled =
        deleteCountState === "ready" &&
        (!deleteHasChildren ||
            deleteCategoryState.descendantStrategy === "delete-descendants" ||
            Boolean(deleteCategoryState.moveDescendantsTo)) &&
        (deleteProducts === 0 || Boolean(deleteCategoryState.moveProductsTo));

    // ---- subcategory table row data ----
    const renderTreeRow = (node: CategoryNode, depth: number) => {
        const hasChildren = Boolean(node.children?.length);
        const expanded = hasChildren && (expandedIds.has(node.id) || debouncedQuery.trim().length > 0);
        const selected = node.id === selectedCategoryId;
        const q = debouncedQuery.trim().toLowerCase();
        const highlight = (text: string) => {
            if (!q || !text.toLowerCase().includes(q)) return text;
            const idx = text.toLowerCase().indexOf(q);
            return (
                <>
                    {text.slice(0, idx)}
                    <mark className="rounded-[2px] bg-[rgba(184,229,31,0.22)] px-0 text-[#d8f66a]">{text.slice(idx, idx + q.length)}</mark>
                    {text.slice(idx + q.length)}
                </>
            );
        };
        return (
            <div key={node.id} className="relative">
                <div
                    className={`group flex min-h-[34px] items-center gap-[7px] rounded-[5px] pr-[8px] text-[#c9cdd1] transition-colors duration-150 hover:bg-[#171a1d] ${
                        selected ? "bg-gradient-to-r from-[#191c1f] to-[#202326]" : ""
                    }`}
                    style={{ paddingLeft: 8 + depth * 14 }}
                    data-category-row={node.id}
                    aria-selected={selected}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            data-existing-control={`tree-toggle-${node.id}`}
                            aria-expanded={expanded}
                            aria-label={`${expanded ? "Collapse" : "Expand"} ${node.name}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(node.id);
                            }}
                            className="grid h-[17px] w-[17px] shrink-0 place-items-center text-[#7c8289] hover:text-[#c9cdd1]"
                        >
                            <span className={`material-symbols-outlined text-[13px] transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}>
                                chevron_right
                            </span>
                        </button>
                    ) : (
                        <span className="w-[17px] shrink-0" />
                    )}
                    <span className="material-symbols-outlined h-[16px] w-[16px] shrink-0 text-[15px] text-[#c99d18]">
                        folder
                    </span>
                    <button
                        type="button"
                        onClick={() => selectCategory(node.id)}
                        className="min-w-0 flex-1 truncate text-left text-[12px] font-medium"
                    >
                        {highlight(node.name)}
                    </button>
                    <span className="inline-flex h-[24px] min-w-[37px] shrink-0 items-center justify-center rounded-[6px] bg-[#222529] px-[8px] text-[10px] font-semibold text-[#d1d4d6]">
                        {node.count}
                    </span>
                </div>
                {node.children && expanded && (
                    <div className="ml-[13px] border-l border-[#24282c]">
                        {node.children.map((child) => renderTreeRow(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div data-category-layer className="min-h-screen bg-[#050607] text-[13px] text-[#e5e7e8]">
            {/* ================= PAGE HEAD ================= */}
            <div className="flex min-h-[88px] flex-wrap items-center justify-between gap-4 border-b border-[#1b1f22]">
                <div>
                    <h1 className="m-0 text-[25px] font-bold leading-[1.15] tracking-[-0.5px] text-[#d9dcdf]">
                        Category & Navigation Management
                    </h1>
                    <p className="mt-[7px] text-[13px] text-[#b8bdc2]">
                        Organize your store categories and manage navigation menus.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button type="button" data-existing-control="view-store" className={btnClass("outline")} onClick={() => window.open("/", "_blank", "noopener,noreferrer")}>
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        View Store
                    </button>
                    <button
                        type="button"
                        data-existing-control="add-category"
                        className={btnClass("primary")}
                        onClick={() => setCategoryEditor({ mode: "create-root" })}
                    >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        Add Category
                    </button>
                </div>
            </div>

            {/* ================= TWO-COLUMN LAYOUT ================= */}
            <div className="grid gap-4 pt-4 min-[1180px]:grid-cols-[304px_minmax(0,1fr)] min-[900px]:max-[1179px]:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.7fr)] max-[899px]:grid-cols-1">
                {/* ---------- LEFT: CATEGORY TREE ---------- */}
                <section className="flex min-h-[748px] flex-col overflow-hidden rounded-[8px] border border-[#1b1f22] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.025),transparent_40%),#0d0f11] min-[1180px]:col-span-1 min-[900px]:max-[1179px]:col-span-1 max-[899px]:min-h-0">
                    <div className="flex h-[53px] items-center justify-between px-4">
                        <h2 className="text-[14px] font-semibold text-[#e5e7e8]">Category Tree</h2>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                data-existing-control="tree-actions"
                                aria-label="Category tree actions"
                                onClick={(e) => openActionMenu(e, { type: "category", id: selectedCategoryId })}
                                className="grid h-[34px] w-[34px] place-items-center rounded-[6px] text-[#9ca2a8] hover:bg-[#171a1d]"
                            >
                                <span className="material-symbols-outlined text-[16px]">more_vert</span>
                            </button>
                            <button
                                type="button"
                                data-existing-control="tree-add"
                                aria-label="Add root category"
                                onClick={() => setCategoryEditor({ mode: "create-root" })}
                                className="grid h-[34px] w-[34px] place-items-center rounded-[6px] border border-[#25292d] bg-[#101214] text-[#d5d8db] hover:border-[#3a4147]"
                            >
                                <span className="material-symbols-outlined text-[15px]">add</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 px-4 pb-3">
                        <div className="flex h-[36px] flex-1 min-w-0 items-center gap-[9px] rounded-[7px] border border-[#25292d] bg-[#0d0f11] px-[11px]">
                            <span className="material-symbols-outlined text-[14px] text-[#858b91]">search</span>
                            <input
                                type="search"
                                data-existing-control="tree-search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                        if (searchQuery) setSearchQuery("");
                                        else (e.target as HTMLInputElement).blur();
                                    }
                                }}
                                placeholder="Search categories"
                                className="w-full min-w-0 bg-transparent text-[11px] text-[#e5e7e8] outline-none placeholder:text-[#555b62]"
                            />
                        </div>
                        <button
                            type="button"
                            data-existing-control="tree-filter"
                            aria-label="Filter categories"
                            aria-expanded={filterOpen}
                            onClick={(e) => {
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setFilterRect({ x: rect.left, y: rect.bottom + 6 });
                                setFilterDraft(filter);
                                setFilterOpen((v) => !v);
                            }}
                            className={`grid h-[36px] w-[36px] shrink-0 place-items-center rounded-[6px] border text-[15px] transition-colors ${
                                filter !== "all"
                                    ? "border-[#b8e51f]/50 bg-[rgba(184,229,31,0.1)] text-[#b8e51f]"
                                    : "border-[#25292d] bg-[#101214] text-[#9ca2a8] hover:border-[#3a4147]"
                            }`}
                        >
                            <span className="material-symbols-outlined">filter_alt</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2">
                        {treeError && (
                            <div
                                className="mx-1 my-2 rounded-[6px] border border-[#5a2a1d] bg-[#241310] px-3 py-2"
                                data-testid="categories-load-error"
                                role="alert"
                            >
                                <p className="text-[10px] text-[#e4612b]">{treeError}</p>
                                <button
                                    type="button"
                                    onClick={() => void loadCategories()}
                                    className="mt-1.5 text-[10px] font-semibold text-[#b8e51f] underline hover:brightness-110"
                                >
                                    Retry
                                </button>
                            </div>
                        )}
                        {treeRows.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <p className="text-[12px] font-semibold text-[#c9cdd1]">No categories found</p>
                                <p className="mt-1 text-[10px] text-[#7c8289]">Try another search term or clear the search.</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setDebouncedQuery("");
                                        setFilter("all");
                                    }}
                                    className="mt-3 rounded-[5px] border border-[#25292d] px-3 py-1.5 text-[10px] font-semibold text-[#b8e51f] hover:bg-[#171a1d]"
                                >
                                    Clear Search
                                </button>
                            </div>
                        ) : (
                            treeRows.map(({ node, depth }) => renderTreeRow(node, depth))
                        )}
                    </div>

                    <div className="mt-auto px-4 pb-[18px] pt-3">
                        <button
                            type="button"
                            data-existing-control="add-root-category"
                            onClick={() => setCategoryEditor({ mode: "create-root" })}
                            className="h-[36px] w-full rounded-[6px] border border-[#282c2f] bg-[#0d0f11] text-[11px] font-semibold text-[#b8e51f] hover:bg-[#171a1d]"
                        >
                            + Add Root Category
                        </button>
                    </div>
                </section>

                {/* ---------- CENTER: WORKSPACE + OVERVIEW ---------- */}
                <div className="min-w-0 min-[900px]:max-[1179px]:col-span-1 max-[899px]:col-span-1">
                    {urlCategoryMissing ? (
                        <section className="rounded-[8px] border border-[#1b1f22] bg-[#0d0f11] p-10 text-center">
                            <span className="material-symbols-outlined text-[28px] text-[#7c8289]">category</span>
                            <h2 className="mt-3 text-[16px] font-bold text-[#d9dcdf]">Category not found</h2>
                            <p className="mt-1 text-[11px] text-[#7c8289]">The category may have been moved or deleted.</p>
                            <button
                                type="button"
                                onClick={() => {
                                    commitSelectCategory("all");
                                    router.replace("/admin/categories", { scroll: false });
                                }}
                                className="mt-4 rounded-[5px] border border-[#25292d] bg-[#0d0f11] px-4 py-2 text-[11px] font-semibold text-[#b8e51f] hover:bg-[#171a1d]"
                            >
                                Back to Categories
                            </button>
                        </section>
                    ) : (
                        <>
                            <section className="overflow-hidden rounded-[8px] border border-[#1b1f22] bg-[#0d0f11]">
                                <div className="flex min-h-[96px] flex-wrap items-start justify-between gap-4 px-4 pb-[15px] pt-5">
                                    <div className="min-w-0">
                                        {loadingCategory ? (
                                            <>
                                                <div className="h-[20px] w-40 animate-pulse rounded bg-[#1a1d20]" />
                                                <div className="mt-2 h-[12px] w-24 animate-pulse rounded bg-[#1a1d20]" />
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <h2 className="m-0 text-[17px] font-bold leading-[1.2] text-[#e5e7e8]">
                                                        {selectedData.details.name}
                                                    </h2>
                                                    {statusPill(selectedData.details.status)}
                                                </div>
                                                <p className="mt-2 text-[11px] text-[#9ba0a6]">
                                                    {formatCount(selectedData.metrics.totalProducts)} products
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            data-existing-control="edit-category"
                                            className={btnClass("outline")}
                                            onClick={() => {
                                                setCategoryEditor({ mode: "edit", categoryId: selectedCategoryId });
                                            }}
                                        >
                                            <span className="material-symbols-outlined text-[14px]">edit</span>
                                            Edit Category
                                        </button>
                                        <button
                                            type="button"
                                            data-existing-control="more-category"
                                            aria-label="More category actions"
                                            onClick={(e) => openActionMenu(e, { type: "category", id: selectedCategoryId })}
                                            className="inline-flex h-[36px] items-center justify-center gap-1 rounded-[5px] border border-[#25292d] bg-[#0d0f11] px-3 text-[11px] font-semibold text-[#d5d8db] hover:border-[#3a4147]"
                                        >
                                            More
                                            <span className="material-symbols-outlined text-[13px]">expand_more</span>
                                        </button>
                                    </div>
                                </div>

                                {categoryError && (
                                    <div className="mx-4 mb-3 rounded-[6px] border border-[#5a2a1d] bg-[#241310] px-3 py-2 text-[10px] text-[#e4612b]">
                                        {categoryError}
                                        <button type="button" className="ml-2 font-semibold underline" onClick={() => commitSelectCategory(selectedCategoryId)}>
                                            Retry
                                        </button>
                                    </div>
                                )}

                                <div className="flex h-[37px] items-end overflow-x-auto border-b border-[#1b1f22] [scrollbar-width:none]">
                                    {CATEGORY_TABS.map((tab) => {
                                        const count = tab.key === "products" ? selectedData.metrics.totalProducts : null;
                                        const label = `${tab.label}${count !== null ? ` (${formatCount(count)})` : ""}`;
                                        const isActive = activeTab === tab.key;
                                        return (
                                            <button
                                                key={tab.key}
                                                type="button"
                                                data-existing-control={`tab-${tab.key}`}
                                                aria-selected={isActive}
                                                onClick={() => {
                                                    if (dirty.size > 0) {
                                                        setUnsaved({ key: "tab", tab: tab.key });
                                                        setSurface("unsaved");
                                                        return;
                                                    }
                                                    setActiveTab(tab.key);
                                                }}
                                                className={`h-[37px] shrink-0 whitespace-nowrap border-b-2 px-[17px] text-[11px] transition-colors ${
                                                    isActive
                                                        ? "border-[#b8e51f] font-bold text-[#c1ec27]"
                                                        : "border-transparent text-[#aeb3b8] hover:text-[#e5e7e8]"
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>


                                {activeTab === "products" && (
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                                            <div className="flex h-[34px] flex-1 min-w-[180px] items-center gap-2 rounded-[6px] border border-[#25292d] bg-[#0a0c0d] px-3">
                                                <span className="material-symbols-outlined text-[13px] text-[#7c8289]">search</span>
                                                <input
                                                    type="search"
                                                    data-existing-control="products-search"
                                                    value={productsSearch}
                                                    onChange={(e) => {
                                                        setProductsSearch(e.target.value);
                                                        setProductsPage(1);
                                                    }}
                                                    placeholder="Search products"
                                                    className="w-full min-w-0 bg-transparent text-[11px] outline-none placeholder:text-[#555b62]"
                                                />
                                            </div>
                                            <select
                                                data-existing-control="products-status"
                                                value={productsStatus}
                                                onChange={(e) => {
                                                    setProductsStatus(e.target.value as "all" | "Active" | "Draft");
                                                    setProductsPage(1);
                                                }}
                                                className="h-[34px] rounded-[6px] border border-[#25292d] bg-[#0a0c0d] px-2 text-[11px] text-[#d5d8db] outline-none"
                                            >
                                                <option value="all">All statuses</option>
                                                <option value="Active">Active</option>
                                                <option value="Draft">Draft</option>
                                            </select>
                                            <select
                                                data-existing-control="products-sort"
                                                value={productsSort}
                                                onChange={(e) => setProductsSort(e.target.value as "name" | "price-asc" | "price-desc")}
                                                className="h-[34px] rounded-[6px] border border-[#25292d] bg-[#0a0c0d] px-2 text-[11px] text-[#d5d8db] outline-none"
                                            >
                                                <option value="name">Name A–Z</option>
                                                <option value="price-asc">Price: low to high</option>
                                                <option value="price-desc">Price: high to low</option>
                                            </select>
                                        </div>

                                        {pageProducts.length === 0 ? (
                                            <div className="px-4 pb-10 text-center">
                                                <p className="text-[12px] font-semibold text-[#c9cdd1]">No products found in this category</p>
                                                <p className="mt-1 text-[10px] text-[#7c8289]">Products assigned to this category will appear here.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => router.push("/admin/products")}
                                                    className="mt-3 rounded-[5px] border border-[#25292d] bg-[#0d0f11] px-4 py-2 text-[11px] font-semibold text-[#b8e51f] hover:bg-[#171a1d]"
                                                >
                                                    View All Products
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="hidden overflow-x-auto md:block">
                                                    <table className="w-full min-w-[640px] border-collapse">
                                                        <thead>
                                                            <tr>
                                                                <th className="px-[14px] text-left text-[10px] font-semibold text-[#9ba1a7]">Product</th>
                                                                <th className="px-[14px] text-left text-[10px] font-semibold text-[#9ba1a7]">Brand</th>
                                                                <th className="px-[14px] text-left text-[10px] font-semibold text-[#9ba1a7]">Status</th>
                                                                <th className="px-[14px] text-right text-[10px] font-semibold text-[#9ba1a7]">Price</th>
                                                                <th className="px-[14px] text-left text-[10px] font-semibold text-[#9ba1a7]">Amazon Readiness</th>
                                                                <th className="px-[14px] text-right text-[10px] font-semibold text-[#9ba1a7]">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {pageProducts.map((product) => (
                                                                <tr key={product.id} className="border-t border-[#202428] hover:bg-[#14161a]">
                                                                    <td className="px-[14px] text-[11px] font-semibold text-[#cfd3d6]">{product.name}</td>
                                                                    <td className="px-[14px] text-[11px] text-[#b7bbc0]">{product.brand}</td>
                                                                    <td className="px-[14px]">{statusPill(product.status === "Active" ? "active" : "inactive")}</td>
                                                                    <td className="px-[14px] text-right text-[11px] font-semibold text-[#d5d8da]">${product.price.toFixed(2)}</td>
                                                                    <td className="px-[14px]">
                                                                        <span
                                                                            className={`inline-flex h-[22px] items-center rounded-[5px] px-2 text-[9px] font-semibold ${
                                                                                product.amazonReadiness === "Ready"
                                                                                    ? "bg-[rgba(132,184,25,0.13)] text-[#b9e728]"
                                                                                    : product.amazonReadiness === "Needs ASIN"
                                                                                      ? "bg-[rgba(216,170,24,0.12)] text-[#d8aa18]"
                                                                                      : "bg-[rgba(228,97,43,0.12)] text-[#e4612b]"
                                                                            }`}
                                                                        >
                                                                            {product.amazonReadiness}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-[14px]">
                                                                        <div className="flex justify-end">
                                                                            <button
                                                                                type="button"
                                                                                aria-label={`Actions for ${product.name}`}
                                                                                onClick={() => showToast("info", "Product editing is handled in the Product Catalog.")}
                                                                                className="grid h-[30px] w-[30px] place-items-center rounded-[6px] border border-[#222529] bg-[#101214] text-[#9ca2a8] hover:border-[#3a4147] hover:text-[#e5e7e8]"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[13px]">more_horiz</span>
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="grid gap-2 p-3 md:hidden">
                                                    {pageProducts.map((product) => (
                                                        <div key={product.id} className="rounded-[8px] border border-[#1d2124] bg-[#0a0c0d] p-3">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-[12px] font-semibold text-[#e5e7e8]">{product.name}</p>
                                                                    <p className="mt-0.5 text-[10px] text-[#7c8289]">{product.brand}</p>
                                                                </div>
                                                                {statusPill(product.status === "Active" ? "active" : "inactive")}
                                                            </div>
                                                            <div className="mt-2 flex items-center justify-between">
                                                                <span className="text-[12px] font-bold text-[#d5d8da]">${product.price.toFixed(2)}</span>
                                                                <span
                                                                    className={`rounded-[5px] px-2 py-0.5 text-[9px] font-semibold ${
                                                                        product.amazonReadiness === "Ready"
                                                                            ? "bg-[rgba(132,184,25,0.13)] text-[#b9e728]"
                                                                            : "bg-[rgba(216,170,24,0.12)] text-[#d8aa18]"
                                                                    }`}
                                                                >
                                                                    {product.amazonReadiness}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center justify-between px-4 py-3">
                                                    <p className="text-[10px] text-[#7c8289]">
                                                        Showing {(productsPage - 1) * pageSize + 1} to {Math.min(productsPage * pageSize, productsTotal)} of {formatCount(productsTotal)} products
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            data-existing-control="products-prev"
                                                            disabled={productsPage <= 1}
                                                            onClick={() => setProductsPage((p) => Math.max(1, p - 1))}
                                                            className="grid h-[30px] w-[30px] place-items-center rounded-[6px] border border-[#25292d] bg-[#0d0f11] text-[#d5d8db] hover:border-[#3a4147] disabled:opacity-40"
                                                        >
                                                            <span className="material-symbols-outlined text-[13px]">chevron_left</span>
                                                        </button>
                                                        <span className="text-[10px] text-[#7c8289]">
                                                            {productsPage} / {productsTotalPages}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            data-existing-control="products-next"
                                                            disabled={productsPage >= productsTotalPages}
                                                            onClick={() => setProductsPage((p) => Math.min(productsTotalPages, p + 1))}
                                                            className="grid h-[30px] w-[30px] place-items-center rounded-[6px] border border-[#25292d] bg-[#0d0f11] text-[#d5d8db] hover:border-[#3a4147] disabled:opacity-40"
                                                        >
                                                            <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {activeTab === "details" && (
                                    <div className="grid gap-4 p-4 md:grid-cols-2">
                                        <Field label="Category Name" required>
                                            <input
                                                data-existing-control="details-name"
                                                className={inputClass}
                                                value={detailsForm.name}
                                                onChange={(e) => {
                                                    setDetailsForm((f) => ({ ...f, name: e.target.value }));
                                                    setDirtyKey("details", true);
                                                }}
                                            />
                                        </Field>
                                        <Field label="Parent Category">
                                            <select
                                                data-existing-control="details-parent"
                                                className={inputClass}
                                                value={detailsForm.parentId}
                                                onChange={(e) => {
                                                    setDetailsForm((f) => ({ ...f, parentId: e.target.value }));
                                                    setDirtyKey("details", true);
                                                }}
                                            >
                                                <option value="">None (root)</option>
                                                {tree
                                                    .flatMap((n) => (n.children ? [n, ...n.children] : [n]))
                                                    .filter((n) => n.id !== "all" && n.id !== selectedCategoryId)
                                                    .map((n) => (
                                                        <option key={n.id} value={n.id}>
                                                            {n.name}
                                                        </option>
                                                    ))}
                                            </select>
                                        </Field>
                                        <Field label="Status">
                                            <select
                                                data-existing-control="details-status"
                                                className={inputClass}
                                                value={detailsForm.status}
                                                onChange={(e) => {
                                                    setDetailsForm((f) => ({ ...f, status: e.target.value as CategoryStatus }));
                                                    setDirtyKey("details", true);
                                                }}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </Field>
                                        <Field label="Description">
                                            <textarea
                                                data-existing-control="details-description"
                                                className={`${textareaClass} h-[36px]`}
                                                rows={1}
                                                value={detailsForm.description}
                                                onChange={(e) => {
                                                    setDetailsForm((f) => ({ ...f, description: e.target.value }));
                                                    setDirtyKey("details", true);
                                                }}
                                            />
                                        </Field>
                                        <div className="flex items-center justify-end gap-2 md:col-span-2">
                                            <button
                                                type="button"
                                                data-existing-control="details-reset"
                                                className={btnClass("outline")}
                                                disabled={!dirty.has("details")}
                                                onClick={() => {
                                                    setDetailsForm({
                                                        name: selectedData.details.name,
                                                        parentId: selectedData.details.parentId ?? "",
                                                        status: selectedData.details.status,
                                                        description: selectedData.details.description,
                                                    });
                                                    setDirtyKey("details", false);
                                                }}
                                            >
                                                Reset
                                            </button>
                                            <button
                                                type="button"
                                                data-existing-control="details-save"
                                                className={btnClass("primary")}
                                                disabled={!dirty.has("details") || pending === "saving-details"}
                                                onClick={saveDetails}
                                            >
                                                {pending === "saving-details" ? "Saving…" : "Save Changes"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "seo" && (
                                    <div className="grid gap-4 p-4 md:grid-cols-2">
                                        <Field label={`SEO Title (${seoForm.title.length}/60)`}>
                                            <input
                                                data-existing-control="seo-title"
                                                className={inputClass}
                                                maxLength={60}
                                                value={seoForm.title}
                                                onChange={(e) => {
                                                    setSeoForm((f) => ({ ...f, title: e.target.value }));
                                                    setDirtyKey("seo", true);
                                                }}
                                            />
                                        </Field>
                                        <Field label={`Meta Description (${seoForm.metaDescription.length}/160)`}>
                                            <textarea
                                                data-existing-control="seo-meta"
                                                className={textareaClass}
                                                rows={2}
                                                maxLength={160}
                                                value={seoForm.metaDescription}
                                                onChange={(e) => {
                                                    setSeoForm((f) => ({ ...f, metaDescription: e.target.value }));
                                                    setDirtyKey("seo", true);
                                                }}
                                            />
                                        </Field>
                                        <Field label="URL Slug">
                                            <input
                                                data-existing-control="seo-slug"
                                                className={inputClass}
                                                value={seoForm.slug}
                                                onChange={(e) => {
                                                    setSeoForm((f) => ({ ...f, slug: e.target.value }));
                                                    setDirtyKey("seo", true);
                                                }}
                                            />
                                        </Field>
                                        <Field label="Canonical URL (optional)">
                                            <input
                                                data-existing-control="seo-canonical"
                                                className={inputClass}
                                                value={seoForm.canonicalUrl}
                                                onChange={(e) => {
                                                    setSeoForm((f) => ({ ...f, canonicalUrl: e.target.value }));
                                                    setDirtyKey("seo", true);
                                                }}
                                            />
                                        </Field>
                                        <Field label="Intro Content">
                                            <textarea
                                                data-existing-control="seo-intro"
                                                className={textareaClass}
                                                rows={3}
                                                value={seoForm.intro}
                                                onChange={(e) => {
                                                    setSeoForm((f) => ({ ...f, intro: e.target.value }));
                                                    setDirtyKey("seo", true);
                                                }}
                                            />
                                        </Field>
                                        <div className="flex items-start justify-end gap-2 md:col-span-2">
                                            {seoError && (
                                                <p className="mr-auto text-[10px] text-[#e4612b]">{seoError}</p>
                                            )}
                                            <button
                                                type="button"
                                                data-existing-control="seo-reset"
                                                className={btnClass("outline")}
                                                disabled={!dirty.has("seo")}
                                                onClick={() => {
                                                    setSeoForm({
                                                        title: selectedData.seo.title,
                                                        metaDescription: selectedData.seo.metaDescription,
                                                        slug: selectedData.seo.slug,
                                                        canonicalUrl: selectedData.seo.canonicalUrl,
                                                        intro: selectedData.seo.intro,
                                                    });
                                                    setSeoError(null);
                                                    setDirtyKey("seo", false);
                                                }}
                                            >
                                                Reset
                                            </button>
                                            <button
                                                type="button"
                                                data-existing-control="seo-save"
                                                className={btnClass("primary")}
                                                disabled={!dirty.has("seo") || pending === "saving-seo"}
                                                onClick={saveSeo}
                                            >
                                                {pending === "saving-seo" ? "Saving…" : "Save Changes"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* ---------- OVERVIEW ---------- */}
                            {/* ---------- ATTACH SECTIONS ---------- */}
                            {(() => {
                                const TAB_TO_TARGET: Record<string, CategoryLinkTargetType> = {
                                    brands: "brand",
                                    models: "model",
                                    submodels: "submodel",
                                    productmodels: "product_model",
                                };
                                const attachTarget = TAB_TO_TARGET[activeTab];
                                if (!attachTarget || selectedCategoryId === "all") return null;
                                return (
                                    <CategoryAttachSection
                                        targetType={attachTarget}
                                        onAttach={handleAttach}
                                        onDetach={handleDetach}
                                        attachedEntities={attachedEntities[attachTarget] ?? []}
                                        availableEntities={availableEntities[attachTarget] ?? []}
                                    />
                                );
                            })()}
                            {/* ---------- END ATTACH SECTIONS ---------- */}
                            <section className="mt-2 min-h-[146px] rounded-[8px] border border-[#1b1f22] bg-[#0d0f11] p-4">
                                <h3 className="mb-[14px] text-[14px] font-semibold text-[#e5e7e8]">Category Overview</h3>
                                {loadingCategory ? (
                                    <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div key={i} className="flex h-[62px] items-center gap-[10px] rounded-[6px] bg-gradient-to-br from-[#131619] to-[#17191b] px-3">
                                                <div className="h-[28px] w-[28px] animate-pulse rounded bg-[#1a1d20]" />
                                                <div className="flex-1">
                                                    <div className="h-[16px] w-16 animate-pulse rounded bg-[#1a1d20]" />
                                                    <div className="mt-1.5 h-[10px] w-20 animate-pulse rounded bg-[#1a1d20]" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
                                        {[
                                            { key: "total", icon: "inventory_2", color: "text-[#b8e51f]", value: formatCount(selectedData.metrics.totalProducts), label: "Total Products" },
                                            { key: "views", icon: "visibility", color: "text-[#5595df]", value: formatCount(selectedData.metrics.productViews), label: "Product Views" },
                                            { key: "clicks", icon: "ads_click", color: "text-[#5595df]", value: formatCount(selectedData.metrics.amazonClicks), label: "Amazon Clicks" },
                                            { key: "ctr", icon: "monitoring", color: "text-[#e4612b]", value: `${selectedData.metrics.ctr.toFixed(2)}%`, label: "CTR" },
                                        ].map((metric) => (
                                            <button
                                                key={metric.key}
                                                type="button"
                                                data-existing-control={`metric-${metric.key}`}
                                                onClick={() => {
                                                    if (metric.key === "total") {
                                                        if (dirty.size > 0) {
                                                            setUnsaved({ key: "tab", tab: "products" });
                                                            setSurface("unsaved");
                                                            return;
                                                        }
                                                        setActiveTab("products");
                                                    } else {
                                                        showToast("info", "Category analytics is not available yet.");
                                                    }
                                                }}
                                                className="flex h-[62px] items-center gap-[10px] rounded-[6px] bg-gradient-to-br from-[#131619] to-[#17191b] px-3 text-left transition-colors hover:from-[#171a1d] hover:to-[#1a1d20]"
                                            >
                                                <span className={`material-symbols-outlined text-[22px] ${metric.color}`}>{metric.icon}</span>
                                                <span>
                                                    <span className="block text-[16px] font-bold leading-none text-[#e5e7e8]">{metric.value}</span>
                                                    <span className="mt-1 block text-[10px] text-[#7c8289]">{metric.label}</span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>

                {/* ---------- RIGHT: nav builder removed — single source of truth lives at /admin/navigation ---------- */}


            </div>

            {/* ---------- HELP STRIP ---------- */}
            <div className="mt-4 flex min-h-[53px] items-center gap-[10px] rounded-[7px] border border-[#171b1e] bg-gradient-to-r from-[#101214] to-[#111315] px-[15px] text-[11px] text-[#a7adb3]">
                <span className="material-symbols-outlined text-[14px] text-[#7c8289]">info</span>
                <span className="min-w-0 flex-1">Categories help organize your products and improve store navigation.</span>
                <button
                    type="button"
                    onClick={() => showToast("info", "Category documentation is not available yet.")}
                    className="shrink-0 font-semibold text-[#b8e51f] hover:underline"
                >
                    Learn more about managing categories ↗
                </button>
            </div>

            {/* ================= ACTION MENU ================= */}
            {actionMenu && (
                <div
                    data-action-menu
                    className="fixed z-[80] w-[210px] overflow-hidden rounded-[8px] border border-[#1b1f22] bg-[#0f1113] py-1 shadow-2xl"
                    style={{ left: actionMenu.x, top: actionMenu.y }}
                >
                    {actionMenu.target.type === "category" && (
                        <>

                            <ActionMenuItem icon="inventory_2" label="View Products" onClick={() => { if (dirty.size > 0) { setUnsaved({ key: "tab", tab: "products" }); setSurface("unsaved"); } else setActiveTab("products"); setActionMenu(null); }} />
                            <ActionMenuItem icon="content_copy" label="Duplicate Category" onClick={async () => {
                                const node = findCategory(tree, actionMenu.target.id);
                                if (node) {
                                    const parent = findCategoryParent(tree, node.id);
                                    const { createCategory } = await import("@/lib/actions/categories");
                                    const result = await createCategory(`${node.name} Copy`, parent?.id ?? null);
                                    if (result.error) {
                                        showToast("error", result.error.message);
                                    } else {
                                        await loadCategories();
                                        setSelectedCategoryId(result.data.id);
                                        showToast("success", "Category duplicated");
                                    }
                                }
                                setActionMenu(null);
                            }} />
                            <ActionMenuItem
                                icon={selectedData.details.status === "active" ? "pause_circle" : "play_circle"}
                                label={selectedData.details.status === "active" ? "Deactivate" : "Activate"}
                                onClick={() => {
                                    const nextStatus: CategoryStatus = selectedData.details.status === "active" ? "inactive" : "active";
                                    setTree((prev) => updateCategoryNode(prev, actionMenu.target.id, { status: nextStatus }));
                                    setWorkspace((prev) => ({ ...prev, [actionMenu.target.id]: { ...prev[actionMenu.target.id], details: { ...prev[actionMenu.target.id].details, status: nextStatus } } }));
                                    showToast("success", nextStatus === "active" ? "Category activated" : "Category deactivated");
                                    setActionMenu(null);
                                }}
                            />
                            <div className="my-1 h-px bg-[#1b1f22]" />
                            <ActionMenuItem danger icon="delete" label="Delete Category" onClick={() => { setDeleteTarget({ type: "category", id: actionMenu.target.id }); setDeleteCategoryState({ descendantStrategy: "move-descendants", moveDescendantsTo: "", moveProductsTo: "" }); setSurface("delete-category"); setActionMenu(null); }} />
                        </>
                    )}
                </div>
            )}

            {/* ================= FILTER POPOVER / SHEET ================= */}
            {filterOpen && (
                isPhone() ? (
                    <BottomSheet onClose={() => setFilterOpen(false)} labelledBy="filter-sheet-title">
                        <h3 id="filter-sheet-title" className="text-[14px] font-semibold text-[#e5e7e8]">Filter Categories</h3>
                        <FilterBody
                            filterDraft={filterDraft}
                            setFilterDraft={setFilterDraft}
                            onApply={() => { setFilter(filterDraft); setFilterOpen(false); }}
                            onReset={() => setFilterDraft("all")}
                        />
                    </BottomSheet>
                ) : (
                    <div
                        className="fixed z-[80] w-[260px] rounded-[8px] border border-[#1b1f22] bg-[#0f1113] p-3 shadow-2xl"
                        style={{ left: Math.min(filterRect?.x ?? 0, window.innerWidth - 276), top: filterRect?.y ?? 0 }}
                        role="dialog"
                        aria-modal="false"
                        aria-label="Category filter"
                    >
                        <FilterBody
                            filterDraft={filterDraft}
                            setFilterDraft={setFilterDraft}
                            onApply={() => { setFilter(filterDraft); setFilterOpen(false); }}
                            onReset={() => setFilterDraft("all")}
                        />
                    </div>
                )
            )}

            {/* ================= CATEGORY EDITOR DIALOG ================= */}
            {editorDialogOpen && (
                <CategoryEditorDialog
                    mode={categoryEditor}
                    tree={tree}
                    initial={editorInitial ?? null}
                    pending={pending === "saving-category"}
                    onCancel={() => setCategoryEditor({ mode: "closed" })}
                    onSave={(input) => {
                        if (editorIsEdit) handleUpdateCategory(categoryEditor.categoryId, input);
                        else handleCreateCategory(input);
                    }}
                />
            )}


            {/* ================= DELETE DIALOGS ================= */}
            {surface === "delete-category" && deleteTarget && (
                    <ModalSurface onClose={() => setSurface(null)} labelledBy="delete-cat-title">
                        <div className="p-5">
                            <h3 id="delete-cat-title" className="text-[15px] font-semibold text-[#ededed]">
                                Delete “{deleteNode?.name}”?
                            </h3>
                            <p className="mt-2 text-[11px] text-[#9ba0a6]">
                                {deleteHasChildren
                                    ? `This category contains ${deleteNode?.children?.length} subcategories. Choose how to handle its descendants.`
                                    : "This category will be removed from the category tree."}
                            </p>
                            {deleteHasChildren && (
                                <div className="mt-3 space-y-2">
                                    <label className="flex items-start gap-2 text-[11px] text-[#cfd3d6]">
                                        <input
                                            type="radio"
                                            checked={deleteCategoryState.descendantStrategy === "move-descendants"}
                                            onChange={() => setDeleteCategoryState((s) => ({ ...s, descendantStrategy: "move-descendants" }))}
                                            className="mt-0.5 accent-[#b8e51f]"
                                        />
                                        <span>
                                            Move descendants to another parent
                                            {deleteCategoryState.descendantStrategy === "move-descendants" && (
                                                <select
                                                    value={deleteCategoryState.moveDescendantsTo}
                                                    onChange={(e) => setDeleteCategoryState((s) => ({ ...s, moveDescendantsTo: e.target.value }))}
                                                    className="ml-2 h-[30px] rounded-[5px] border border-[#25292d] bg-[#0a0c0d] px-2 text-[10px] text-[#d5d8db] outline-none"
                                                >
                                                    <option value="">Select parent…</option>
                                                    {deleteMoveOptions.map((n) => (
                                                        <option key={n.id} value={n.id}>{n.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 text-[11px] text-[#cfd3d6]">
                                        <input
                                            type="radio"
                                            checked={deleteCategoryState.descendantStrategy === "delete-descendants"}
                                            onChange={() => setDeleteCategoryState((s) => ({ ...s, descendantStrategy: "delete-descendants" }))}
                                            className="accent-[#b8e51f]"
                                        />
                                        Delete empty descendants only
                                    </label>
                                </div>
                            )}
                            {deleteProducts > 0 && (
                                <div className="mt-4 rounded-[6px] border border-[#2a2d31] bg-[#121416] p-3">
                                    <p className="text-[10px] text-[#9ba0a6]">
                                        <span className="font-semibold text-[#e5e7e8]">{formatCount(deleteProducts)} products</span> are assigned to this category. Move them to:
                                    </p>
                                    <select
                                        value={deleteCategoryState.moveProductsTo}
                                        onChange={(e) => setDeleteCategoryState((s) => ({ ...s, moveProductsTo: e.target.value }))}
                                        className="mt-2 h-[32px] w-full rounded-[5px] border border-[#25292d] bg-[#0a0c0d] px-2 text-[10px] text-[#d5d8db] outline-none"
                                    >
                                        <option value="">Select category…</option>
                                        {deleteMoveOptions.map((n) => (
                                            <option key={n.id} value={n.id}>{n.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {!deleteEnabled && (
                                <p className="mt-3 text-[10px] text-[#e4612b]">
                                    {deleteCountState === "loading"
                                        ? "Checking how many products reference this category…"
                                        : deleteCountState === "error"
                                          ? "Could not verify the product count. Deletion stays disabled until the count is confirmed."
                                          : deleteProducts > 0 && !deleteCategoryState.moveProductsTo
                                            ? "Products must be moved to another category before deletion."
                                            : "Choose where to move the descendants."}
                                </p>
                            )}
                            <div className="mt-5 flex items-center justify-between gap-2">
                                <button type="button" data-existing-control="delete-view-products" className={btnClass("ghost")} onClick={() => { setSurface(null); setActiveTab("products"); }}>
                                    View Products
                                </button>
                                <div className="flex gap-2">
                                    <button type="button" className={btnClass("outline")} onClick={() => setSurface(null)}>Cancel</button>
                                    <button type="button" className={btnClass("danger")} disabled={!deleteEnabled} onClick={confirmDeleteCategory}>
                                        Delete Category
                                    </button>
                                </div>
                            </div>
                        </div>
                    </ModalSurface>
            )}
            {/* ================= UNSAVED CHANGES DIALOG ================= */}
            {surface === "unsaved" && unsaved && (
                <ModalSurface onClose={() => setSurface(null)} labelledBy="unsaved-title">
                    <div className="p-5">
                        <h3 id="unsaved-title" className="text-[15px] font-semibold text-[#ededed]">Discard unsaved changes?</h3>
                        <p className="mt-2 text-[11px] text-[#9ba0a6]">Your edits have not been saved.</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" className={btnClass("outline")} onClick={() => setSurface(null)}>Keep Editing</button>
                            {unsaved.key === "tab" && dirty.has("details") && (
                                <button type="button" className={btnClass("primary")} onClick={() => { saveDetails(); setSurface(null); setUnsaved(null); }}>
                                    Save Changes
                                </button>
                            )}
                            {unsaved.key === "tab" && dirty.has("seo") && (
                                <button type="button" className={btnClass("primary")} onClick={() => { saveSeo(); setSurface(null); setUnsaved(null); }}>
                                    Save Changes
                                </button>
                            )}
                            <button type="button" className={btnClass("danger")} onClick={() => performDiscard(unsaved)}>Discard Changes</button>
                        </div>
                    </div>
                </ModalSurface>
            )}

            {/* ================= TOASTS ================= */}
            <div className="fixed bottom-4 right-4 z-[90] flex w-[320px] flex-col gap-2">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
                ))}
            </div>

            {/* ================= DEBUG STATE ================= */}
            <pre data-category-state className="hidden">
                {JSON.stringify({
                    selectedCategoryId,
                    activeTab,
                    filter,
                    searchQuery: debouncedQuery,
                    expandedIds: [...expandedIds],
                    surface,
                    editor: categoryEditor.mode,
            
                    dirty: [...dirty],
                    pending,
                    treeCount: treeRows.length,
                })}
            </pre>
        </div>
    );
}

function ActionMenuItem({
    icon,
    label,
    danger,
    disabled,
    onClick,
}: {
    icon: string;
    label: string;
    danger?: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] transition-colors disabled:cursor-default disabled:opacity-35 ${
                danger ? "text-[#e4612b] hover:bg-[#241310]" : "text-[#cfd3d6] hover:bg-[#171a1d]"
            }`}
        >
            <span className="material-symbols-outlined text-[13px]">{icon}</span>
            {label}
        </button>
    );
}

function FilterBody({
    filterDraft,
    setFilterDraft,
    onApply,
    onReset,
}: {
    filterDraft: "all" | "active" | "inactive";
    setFilterDraft: (v: "all" | "active" | "inactive") => void;
    onApply: () => void;
    onReset: () => void;
}) {
    return (
        <div>
            <p className="text-[10px] font-semibold text-[#8e9398]">Category Status</p>
            <div className="mt-2 space-y-1.5">
                {(
                    [
                        ["all", "All categories"],
                        ["active", "Active"],
                        ["inactive", "Inactive"],
                    ] as const
                ).map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 text-[11px] text-[#cfd3d6]">
                        <input
                            type="radio"
                            checked={filterDraft === value}
                            onChange={() => setFilterDraft(value)}
                            className="accent-[#b8e51f]"
                        />
                        {label}
                    </label>
                ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <button type="button" data-existing-control="tree-filter-reset" className={btnClass("ghost")} onClick={onReset}>
                    Reset
                </button>
                <button type="button" data-existing-control="tree-filter-apply" className={btnClass("primary")} onClick={onApply}>
                    Apply Filter
                </button>
            </div>
        </div>
    );
}

function CategoryEditorDialog({
    mode,
    tree,
    initial,
    pending,
    onCancel,
    onSave,
}: {
    mode: CategoryEditorMode;
    tree: CategoryNode[];
    initial: { name: string; parentId: string | null; status: CategoryStatus; description: string } | null;
    pending: boolean;
    onCancel: () => void;
    onSave: (input: { name: string; parentId: string | null; status: CategoryStatus; description: string }) => void;
}) {
    const isEdit = mode.mode === "edit";
    const isChild = mode.mode === "create-child";
    const [form, setForm] = React.useState({
        name: initial?.name ?? "",
        parentId: initial?.parentId ?? (isChild ? mode.parentId : ""),
        status: initial?.status ?? ("active" as CategoryStatus),
        description: initial?.description ?? "",
    });
    const [error, setError] = React.useState<string | null>(null);
    const parentCandidates = tree
        .flatMap((n) => (n.children ? [n, ...n.children] : [n]))
        .filter((n) => n.id !== "all" && (isEdit ? n.id !== mode.categoryId : true));

    React.useEffect(() => {
        const timer = window.setTimeout(() => {
            document.querySelector<HTMLInputElement>('[data-category-layer] input[type="text"], [data-category-layer] input:not([type])')?.focus();
        }, 60);
        return () => window.clearTimeout(timer);
    }, []);

    return (
        <ModalSurface onClose={onCancel} labelledBy={isEdit ? "edit-category-title" : "create-category-title"}>
            <div className="p-5">
                <h3 id={isEdit ? "edit-category-title" : "create-category-title"} className="text-[15px] font-semibold text-[#ededed]">
                    {isEdit ? "Edit Category" : "Create Category"}
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field label="Category Name" required>
                        <input className={inputClass} value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError(null); }} />
                    </Field>
                    <Field label="Parent Category">
                        <select className={inputClass} value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}>
                            <option value="">None (root)</option>
                            {parentCandidates.map((n) => (
                                <option key={n.id} value={n.id}>{n.name}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Status">
                        <select className={inputClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CategoryStatus }))}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </Field>
                    <Field label="Description">
                        <textarea className={textareaClass} rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                    </Field>
                </div>
                {error && <p className="mt-3 text-[10px] text-[#e4612b]">{error}</p>}
                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" className={btnClass("outline")} onClick={onCancel}>Cancel</button>
                    <button
                        type="button"
                        data-existing-control="category-save"
                        className={btnClass("primary")}
                        disabled={pending || !form.name.trim()}
                        onClick={() => {
                            // parent cycle check for edits: cannot move under own descendant
                            if (isEdit) {
                                const isDesc = (() => {
                                    let parent = findCategoryParent(tree, mode.categoryId);
                                    let guard = 0;
                                    while (parent && guard < 10) {
                                        if (parent.id === form.parentId) return true;
                                        parent = findCategoryParent(tree, parent.id);
                                        guard += 1;
                                    }
                                    return false;
                                })();
                                if (isDesc) {
                                    setError("A category cannot be its own parent or descendant.");
                                    return;
                                }
                            }
                            onSave(form);
                        }}
                    >
                        {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Category"}
                    </button>
                </div>
            </div>
        </ModalSurface>
    );
}



function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    React.useEffect(() => {
        const duration = toast.type === "error" ? 5000 : toast.type === "success" ? 3000 : 2500;
        const timer = window.setTimeout(onDismiss, duration);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast.id]);
    const colors = {
        success: "border-[#9cc816]/40 text-[#b9e728]",
        error: "border-[#5a2a1d] text-[#e4612b]",
        info: "border-[#25292d] text-[#5595df]",
    };
    return (
        <div
            role="status"
            className={`flex items-start gap-2 rounded-[8px] border ${colors[toast.type]} bg-[#0f1113] px-3 py-2.5 text-[11px] shadow-xl`}
        >
            <span className="material-symbols-outlined mt-px text-[13px]">
                {toast.type === "success" ? "check_circle" : toast.type === "error" ? "error" : "info"}
            </span>
            <span className="flex-1 text-[#e5e7e8]">{toast.message}</span>
            <button type="button" aria-label="Dismiss" onClick={onDismiss} className="text-[#7c8289] hover:text-[#e5e7e8]">
                <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
        </div>
    );
}
