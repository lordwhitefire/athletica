"use client";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AutoSuggest from "../AutoSuggest";
import ImageSelector from "../ImageSelector";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { suggestRoutes } from "@/lib/actions/suggestions";
import { sanityCdnUrl } from "@/lib/sanity-client";
import CategorySection from "@/components/homepage/CategorySection";
import {
    VARIANT_RULES,
    variantIsFlexible,
    type ItemField,
    type SectionState,
    type SectionStateItem,
    type VariantKey,
} from "./types";

interface CategoryGridFormProps {
    section: SectionState;
    onUpdateField: (field: keyof SectionState, value: string | null) => void;
    onUpdateItem: (itemIndex: number, field: keyof SectionStateItem, value: string | null) => void;
    onAddItem: () => void;
    onRemoveItem: (itemIndex: number) => void;
    onReorderItems: (from: number, to: number) => void;
}

const inputCls = "w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors";

/**
 * Popup form contents for a category_grid section. Renders one of nine
 * variant-specific item templates per the redesign plan — see
 * prompts/homepage-editor-redesign.md Step 4 and bug #7.
 *
 * Variant families:
 *   - 7 fixed-slot variants (grid-4-equal, grid-3-bordered,
 *     asymmetric-3-2, asymmetric-2-split, split-1-2, stacked-banners,
 *     grid-tiles-dark): the item count is fixed; no Add/Remove buttons.
 *   - 2 flexible variants (scroll-brands, scroll-categories): items can
 *     be added (until maxItems), removed (until minItems), and reordered
 *     via drag-and-drop.
 *
 * Each variant declares which fields its items need (see VARIANT_RULES
 * in types.ts). The form renders only those fields per item — no more
 * identical 5-field form for every variant.
 */
export default function CategoryGridForm({
    section,
    onUpdateField,
    onUpdateItem,
    onAddItem,
    onRemoveItem,
    onReorderItems,
}: CategoryGridFormProps) {
    const variant = section.variant as VariantKey;
    const rules = VARIANT_RULES[variant];
    const flexible = variantIsFlexible(variant);

    return (
        <div className="space-y-6">
            {/* Section-level settings — same for all grid variants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Title" tooltip="Main heading for this section">
                    <input
                        type="text"
                        value={section.title}
                        onChange={(e) => onUpdateField("title", e.target.value)}
                        className={inputCls}
                        placeholder="Enter section title..."
                    />
                </Field>
                <Field label="Background" tooltip="Background color/style for this section">
                    <select
                        value={section.bg}
                        onChange={(e) => onUpdateField("bg", e.target.value)}
                        className={inputCls}
                    >
                        <option value="bg-surface">Surface</option>
                        <option value="bg-surface-container">Surface Container</option>
                        <option value="bg-surface-container-low">Surface Container Low</option>
                        <option value="bg-neutral-900">Neutral 900</option>
                        <option value="bg-black">Black</option>
                    </select>
                </Field>
                <Field label="View All Link" tooltip="Link to view all items in this category">
                    <AutoSuggest
                        label="View All Link"
                        value={section.viewAllLink}
                        onChange={(value) => onUpdateField("viewAllLink", value)}
                        fetchSuggestions={suggestRoutes}
                        placeholder="/path/to/all"
                    />
                </Field>
                <Field label="View All Label" tooltip="Text for the 'View All' button/link">
                    <input
                        type="text"
                        value={section.viewAllLabel}
                        onChange={(e) => onUpdateField("viewAllLabel", e.target.value)}
                        className={inputCls}
                        placeholder="View All"
                    />
                </Field>
            </div>

            {/* Items header */}
            <div className="border-t border-neutral-800 pt-4">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Items ({section.items.length})
                    </h4>
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-zinc-500">
                            {rules.name} · {flexible
                                ? `${rules.minItems}–${rules.maxItems} items`
                                : `${rules.minItems} fixed slots`}
                        </span>
                        {flexible && section.items.length < rules.maxItems && (
                            <button
                                type="button"
                                onClick={onAddItem}
                                className="text-[11px] bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1 rounded transition-colors"
                            >
                                + Add item
                            </button>
                        )}
                    </div>
                </div>

                {flexible ? (
                    <FlexibleItemList
                        section={section}
                        rules={rules}
                        onUpdateItem={onUpdateItem}
                        onRemoveItem={onRemoveItem}
                        onReorderItems={onReorderItems}
                    />
                ) : (
                    <FixedItemList
                        section={section}
                        rules={rules}
                        onUpdateItem={onUpdateItem}
                    />
                )}
            </div>
        </div>
    );
}

/**
 * Full-size CategorySection preview for the popup's right panel.
 */
export function CategoryGridPreview({ section }: { section: SectionState }) {
    return (
        <div className="rounded overflow-hidden">
            <CategorySection
                title={section.title}
                items={section.items.map(item => ({
                    _key: item._key,
                    label: item.label,
                    link: item.link,
                    bg: item.bg,
                    textColor: item.textColor,
                    accent: item.accent,
                    image: item.image ? sanityCdnUrl(item.image) : null,
                }))}
                variant={section.variant as any}
                viewAllLink={section.viewAllLink || undefined}
                viewAllLabel={section.viewAllLabel || undefined}
                bg={section.bg}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Item list variants
// ---------------------------------------------------------------------------

function FixedItemList({
    section,
    rules,
    onUpdateItem,
}: {
    section: SectionState;
    rules: (typeof VARIANT_RULES)[VariantKey];
    onUpdateItem: (itemIndex: number, field: keyof SectionStateItem, value: string | null) => void;
}) {
    return (
        <div className="space-y-4">
            {section.items.map((item, itemIndex) => (
                <ItemCard
                    key={item._key}
                    item={item}
                    itemIndex={itemIndex}
                    fields={[...rules.fields] as ItemField[]}
                    onUpdateItem={onUpdateItem}
                    onRemove={null}
                    dragHandle={null}
                />
            ))}
            {/* Render empty placeholder slots if the section somehow has
                fewer items than the variant requires (shouldn't happen
                but protects against data drift). */}
            {section.items.length < rules.minItems && (
                <div className="text-xs text-amber-500 p-3 bg-amber-500/10 rounded">
                    This variant requires {rules.minItems} items.{" "}
                    Only {section.items.length} are present. Save All will refuse to commit
                    until the missing slots are added.
                </div>
            )}
        </div>
    );
}

function FlexibleItemList({
    section,
    rules,
    onUpdateItem,
    onRemoveItem,
    onReorderItems,
}: {
    section: SectionState;
    rules: (typeof VARIANT_RULES)[VariantKey];
    onUpdateItem: (itemIndex: number, field: keyof SectionStateItem, value: string | null) => void;
    onRemoveItem: (itemIndex: number) => void;
    onReorderItems: (from: number, to: number) => void;
}) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const ids = section.items.map(i => `item-${i._key}`);
        const from = ids.indexOf(String(active.id));
        const to = ids.indexOf(String(over.id));
        if (from === -1 || to === -1) return;
        onReorderItems(from, to);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={section.items.map(i => `item-${i._key}`)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4">
                    {section.items.map((item, itemIndex) => (
                        <SortableItemCard
                            key={item._key}
                            item={item}
                            itemIndex={itemIndex}
                            fields={[...rules.fields] as ItemField[]}
                            onUpdateItem={onUpdateItem}
                            canRemove={section.items.length > rules.minItems}
                            onRemove={() => onRemoveItem(itemIndex)}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

function SortableItemCard(props: {
    item: SectionStateItem;
    itemIndex: number;
    fields: ItemField[];
    onUpdateItem: (itemIndex: number, field: keyof SectionStateItem, value: string | null) => void;
    canRemove: boolean;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `item-${props.item._key}`,
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.6 : 1,
    } as React.CSSProperties;
    const dragHandle = (
        <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-zinc-500 hover:text-zinc-300"
            aria-label="Reorder item"
        >
            <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
        </div>
    );
    return (
        <div ref={setNodeRef} style={style}>
            <ItemCard
                item={props.item}
                itemIndex={props.itemIndex}
                fields={props.fields}
                onUpdateItem={props.onUpdateItem}
                onRemove={props.canRemove ? props.onRemove : null}
                dragHandle={dragHandle}
            />
        </div>
    );
}

function ItemCard({
    item,
    itemIndex,
    fields,
    onUpdateItem,
    onRemove,
    dragHandle,
}: {
    item: SectionStateItem;
    itemIndex: number;
    fields: ItemField[];
    onUpdateItem: (itemIndex: number, field: keyof SectionStateItem, value: string | null) => void;
    onRemove: (() => void) | null;
    dragHandle: React.ReactNode | null;
}) {
    return (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Item #{itemIndex + 1}
                </span>
                <div className="flex items-center gap-1">
                    {dragHandle}
                    {onRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            aria-label="Remove item"
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.includes("label") && (
                    <Field label="Label" tooltip="Display name for this item">
                        <input
                            type="text"
                            value={item.label}
                            onChange={(e) => onUpdateItem(itemIndex, "label", e.target.value)}
                            className={inputCls}
                            placeholder="Item label"
                        />
                    </Field>
                )}
                {fields.includes("link") && (
                    <Field label="Link" tooltip="Page to navigate to when item is clicked">
                        <AutoSuggest
                            label="Link"
                            value={item.link}
                            onChange={(value) => onUpdateItem(itemIndex, "link", value)}
                            fetchSuggestions={suggestRoutes}
                            placeholder="/path/to/page"
                        />
                    </Field>
                )}
                {fields.includes("bg") && (
                    <Field label="Background" tooltip="Background color for this item">
                        <select
                            value={item.bg}
                            onChange={(e) => onUpdateItem(itemIndex, "bg", e.target.value)}
                            className={inputCls}
                        >
                            <option value="bg-surface">Surface</option>
                            <option value="bg-surface-container">Surface Container</option>
                            <option value="bg-surface-container-low">Surface Container Low</option>
                            <option value="bg-neutral-900">Neutral 900</option>
                            <option value="bg-black">Black</option>
                            <option value="bg-primary">Primary</option>
                            <option value="bg-primary-container">Primary Container</option>
                        </select>
                    </Field>
                )}
                {fields.includes("textColor") && (
                    <Field label="Text Color" tooltip="Text color for this item">
                        <select
                            value={item.textColor}
                            onChange={(e) => onUpdateItem(itemIndex, "textColor", e.target.value)}
                            className={inputCls}
                        >
                            <option value="text-on-surface">On Surface</option>
                            <option value="text-on-primary">On Primary</option>
                            <option value="text-white">White</option>
                            <option value="text-black">Black</option>
                            <option value="text-zinc-300">Zinc 300</option>
                        </select>
                    </Field>
                )}
                {fields.includes("accent") && (
                    <Field label="Accent Color" tooltip="Highlight color for accents on this item (bug #5 — was missing)">
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={item.accent || "#d1fd40"}
                                onChange={(e) => onUpdateItem(itemIndex, "accent", e.target.value)}
                                className="h-10 w-12 bg-neutral-800 border border-neutral-700 rounded cursor-pointer"
                                aria-label="Accent color picker"
                            />
                            <input
                                type="text"
                                value={item.accent}
                                onChange={(e) => onUpdateItem(itemIndex, "accent", e.target.value)}
                                className={`${inputCls} flex-1`}
                                placeholder="#d1fd40"
                            />
                        </div>
                    </Field>
                )}
                {fields.includes("image") && (
                    <div className="md:col-span-2">
                        <Field label="Item Image" tooltip="Image for this item">
                            <ImageSelector
                                name={`item-image-${itemIndex}`}
                                value={item.image || ""}
                                onChange={(value) => onUpdateItem(itemIndex, "image", value)}
                                label="Item Image"
                            />
                        </Field>
                    </div>
                )}
            </div>
        </div>
    );
}

function Field({
    label,
    tooltip,
    children,
}: {
    label: string;
    tooltip: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="flex items-center gap-2 mb-1">
                <span className="text-xs text-zinc-500">{label}</span>
                <InfoTooltip text={tooltip} />
            </label>
            {children}
        </div>
    );
}

// Re-export so the orchestrator can import arrayMove if it needs to.
export { arrayMove };
