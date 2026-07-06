"use client";

import { useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface OverviewItem {
    _key: string;
    type: string;
    variant?: string;
    title: string;
    index: number;
    thumbUrl?: string | null;
    itemCount?: number;
}

interface OverviewProps {
    banners: OverviewItem[];
    sections: OverviewItem[];
    onReorderBanners: (from: number, to: number) => void;
    onReorderSections: (from: number, to: number) => void;
    onEditBanner: (index: number) => void;
    onEditSection: (index: number) => void;
    onDeleteBanner?: (index: number) => void;
    onDeleteSection?: (index: number) => void;
    onAddBanner: () => void;
    onAddSection: () => void;
}

/**
 * Read-only overview of the homepage. Each banner and section is a compact
 * card with a thumbnail, a type chip, the title, and an Edit button. No
 * form fields here — the overview is for orientation only. Bug #9 from
 * issues/homepage-editor-bugs.md.
 *
 * Reordering is done with @dnd-kit/core drag-and-drop, which gives a
 * visual drop indicator (the dragged card follows the cursor, siblings
 * slide out of the way). Falls back to keyboard sorting via
 * sortableKeyboardCoordinates (Space to pick up, arrows to move, Space
 * to drop) for a11y. Bug #10 from issues/homepage-editor-bugs.md.
 */
export default function Overview({
    banners,
    sections,
    onReorderBanners,
    onReorderSections,
    onEditBanner,
    onEditSection,
    onDeleteBanner,
    onDeleteSection,
    onAddBanner,
    onAddSection,
}: OverviewProps) {
    return (
        <div className="space-y-10">
            <BannerList
                items={banners}
                onReorder={onReorderBanners}
                onEdit={onEditBanner}
                onDelete={onDeleteBanner}
                onAdd={onAddBanner}
            />
            <SectionList
                items={sections}
                onReorder={onReorderSections}
                onEdit={onEditSection}
                onDelete={onDeleteSection}
                onAdd={onAddSection}
            />
        </div>
    );
}

function BannerList({
    items,
    onReorder,
    onEdit,
    onDelete,
    onAdd,
}: {
    items: OverviewItem[];
    onReorder: (from: number, to: number) => void;
    onEdit: (index: number) => void;
    onDelete?: (index: number) => void;
    onAdd: () => void;
}) {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-white">Hero Carousel</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        {items.length} banner{items.length === 1 ? "" : "s"} · drag to reorder · click Edit to open
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onAdd}
                    className="text-sm bg-primary hover:brightness-90 text-on-primary px-4 py-2 rounded transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Banner
                </button>
            </div>

            <SortableGrid
                idPrefix="banner"
                items={items}
                onReorder={onReorder}
                onEdit={onEdit}
                onDelete={onDelete}
                typeLabel={() => "Banner"}
            />
        </section>
    );
}

function SectionList({
    items,
    onReorder,
    onEdit,
    onDelete,
    onAdd,
}: {
    items: OverviewItem[];
    onReorder: (from: number, to: number) => void;
    onEdit: (index: number) => void;
    onDelete?: (index: number) => void;
    onAdd: () => void;
}) {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-white">Homepage Sections</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        {items.length} section{items.length === 1 ? "" : "s"} · drag to reorder · click Edit to open
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onAdd}
                    className="text-sm bg-primary hover:brightness-90 text-on-primary px-4 py-2 rounded transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Section
                </button>
            </div>

            <SortableGrid
                idPrefix="section"
                items={items}
                onReorder={onReorder}
                onEdit={onEdit}
                onDelete={onDelete}
                typeLabel={(item) => typeLabel(item.type)}
                variantLabel={(item) => item.variant ? variantLabel(item.variant) : undefined}
            />
        </section>
    );
}

function SortableGrid({
    idPrefix,
    items,
    onReorder,
    onEdit,
    onDelete,
    typeLabel,
    variantLabel,
}: {
    idPrefix: string;
    items: OverviewItem[];
    onReorder: (from: number, to: number) => void;
    onEdit: (index: number) => void;
    onDelete?: (index: number) => void;
    typeLabel: (item: OverviewItem) => string;
    variantLabel?: (item: OverviewItem) => string | undefined;
}) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            // Require a small movement before drag starts so a click on the
            // Edit button is never misinterpreted as a drag.
            activationConstraint: { distance: 6 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (e: DragStartEvent) => {
        setActiveId(String(e.active.id));
    };

    const handleDragEnd = (e: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const ids = items.map(i => `${idPrefix}-${i._key}`);
        const from = ids.indexOf(String(active.id));
        const to = ids.indexOf(String(over.id));
        if (from === -1 || to === -1) return;
        onReorder(from, to);
    };

    if (items.length === 0) {
        return (
            <div className="border border-dashed border-neutral-800 rounded-lg p-10 text-center text-sm text-zinc-500">
                Nothing here yet. Use the Add button above to create one.
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items.map(i => `${idPrefix}-${i._key}`)}
                strategy={verticalListSortingStrategy}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <SortableCard
                            key={item._key}
                            id={`${idPrefix}-${item._key}`}
                            item={item}
                            active={activeId === `${idPrefix}-${item._key}`}
                            onEdit={() => onEdit(item.index)}
                            onDelete={onDelete ? () => onDelete(item.index) : undefined}
                            typeLabel={typeLabel(item)}
                            variantLabel={variantLabel ? variantLabel(item) : undefined}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

function SortableCard({
    id,
    item,
    active,
    onEdit,
    onDelete,
    typeLabel,
    variantLabel,
}: {
    id: string;
    item: OverviewItem;
    active: boolean;
    onEdit: () => void;
    onDelete?: () => void;
    typeLabel: string;
    variantLabel?: string;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.6 : 1,
    } as React.CSSProperties;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={[
                "bg-neutral-900 border rounded-lg overflow-hidden flex flex-col",
                active ? "border-primary ring-2 ring-primary/40" : "border-neutral-800",
                isDragging ? "shadow-2xl" : "",
            ].join(" ")}
        >
            {/* Drag handle (top strip) */}
            <div
                {...attributes}
                {...listeners}
                className="px-4 py-2 border-b border-neutral-800 cursor-grab active:cursor-grabbing flex items-center justify-between"
                aria-label={`Reorder ${typeLabel}: ${item.title || "Untitled"}`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="bg-zinc-800 text-zinc-500 text-[10px] font-mono font-bold px-2 py-1 rounded shrink-0">
                        #{item.index + 1}
                    </span>
                    <span className="bg-zinc-700 text-zinc-300 text-[10px] font-bold px-2 py-1 rounded uppercase shrink-0">
                        {typeLabel}
                    </span>
                    {variantLabel && (
                        <span className="text-[10px] text-zinc-500 font-mono truncate">
                            {variantLabel}
                        </span>
                    )}
                </div>
                <span className="material-symbols-outlined text-[16px] text-zinc-600 shrink-0">
                    drag_indicator
                </span>
            </div>

            {/* Thumbnail */}
            <div className="aspect-[16/9] bg-neutral-950 flex items-center justify-center overflow-hidden">
                {item.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.thumbUrl}
                        alt={item.title || "thumbnail"}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="material-symbols-outlined text-[32px] text-zinc-700">
                        image
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 flex-1 flex flex-col gap-2">
                <h3 className="text-sm font-medium text-white truncate">
                    {item.title || "Untitled"}
                </h3>
                {typeof item.itemCount === "number" && (
                    <p className="text-xs text-zinc-500">
                        {item.itemCount} item{item.itemCount === 1 ? "" : "s"}
                    </p>
                )}
                <div className="mt-auto flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-primary text-on-primary rounded hover:brightness-90 transition-colors"
                    >
                        Edit
                    </button>
                    {onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            aria-label="Delete"
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- label helpers (mirrored from the old HomepageEditor for now) ---

function typeLabel(type: string): string {
    switch (type) {
        case "category_grid": return "Grid";
        case "product_carousel": return "Products";
        case "category_carousel": return "Cat Carousel";
        default: return type;
    }
}

function variantLabel(variant: string): string {
    const labels: Record<string, string> = {
        "grid-4-equal": "Grid 4 Equal",
        "scroll-brands": "Scroll Brands",
        "grid-tiles-dark": "Grid Tiles Dark",
        "grid-3-bordered": "Grid 3 Bordered",
        "scroll-categories": "Scroll Categories",
        "asymmetric-3-2": "Asymmetric 3-2",
        "split-1-2": "Split 1-2",
        "asymmetric-2-split": "Asymmetric 2 Split",
        "stacked-banners": "Stacked Banners",
    };
    return labels[variant] || variant;
}

// Re-exported so callers can import the SortableContext + DnD pieces if
// they want to compose their own overview (e.g. for the redesign in
// prompts/homepage-editor-redesign.md Step 4 scroll variants, which need
// nested DnD for item-level reordering inside the popup form).
export { arrayMove };
