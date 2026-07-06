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
import CategoryCarousel from "@/components/homepage/CategoryCarousel";
import type { SectionState, SectionStateCard } from "./types";

interface CategoryCarouselFormProps {
    section: SectionState;
    onUpdateField: (field: keyof SectionState, value: string | null) => void;
    onUpdateCard: (cardIndex: number, field: keyof SectionStateCard, value: string | null) => void;
    onAddCard: () => void;
    onRemoveCard: (cardIndex: number) => void;
    onReorderCards: (from: number, to: number) => void;
}

const inputCls = "w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors";

const MIN_CARDS = 3;

/**
 * Popup form contents for a category_carousel section. Per the redesign
 * plan (Step 5), this variant has only one form: a minimum of 3 cards,
 * no maximum, each with title / subtitle / link / gradient / emoji /
 * image. Add/Remove/Reorder buttons for cards.
 */
export default function CategoryCarouselForm({
    section,
    onUpdateField,
    onUpdateCard,
    onAddCard,
    onRemoveCard,
    onReorderCards,
}: CategoryCarouselFormProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const ids = section.cards.map(c => `card-${c._key}`);
        const from = ids.indexOf(String(active.id));
        const to = ids.indexOf(String(over.id));
        if (from === -1 || to === -1) return;
        onReorderCards(from, to);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Section Title" tooltip="Main heading for this carousel section">
                    <input
                        type="text"
                        value={section.title}
                        onChange={(e) => onUpdateField("title", e.target.value)}
                        className={inputCls}
                        placeholder="Enter section title..."
                    />
                </Field>
                <Field label="Auto Switch (ms)" tooltip="Time between automatic card switches in milliseconds">
                    <input
                        type="number"
                        value={section.autoSwitchMs}
                        onChange={(e) => onUpdateField("autoSwitchMs", e.target.value)}
                        className={inputCls}
                        min="1000"
                        max="10000"
                        step="500"
                    />
                </Field>
            </div>

            <div className="border-t border-neutral-800 pt-4">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Cards ({section.cards.length})
                        {section.cards.length < MIN_CARDS && (
                            <span className="text-xs text-amber-500 ml-2">
                                Minimum {MIN_CARDS} cards required
                            </span>
                        )}
                    </h4>
                    <button
                        type="button"
                        onClick={onAddCard}
                        className="text-[11px] bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1 rounded transition-colors"
                    >
                        + Add card
                    </button>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={section.cards.map(c => `card-${c._key}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-4">
                            {section.cards.map((card, cardIndex) => (
                                <SortableCard
                                    key={card._key}
                                    card={card}
                                    cardIndex={cardIndex}
                                    onUpdateCard={onUpdateCard}
                                    canRemove={section.cards.length > MIN_CARDS}
                                    onRemove={() => onRemoveCard(cardIndex)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}

/**
 * Full-size CategoryCarousel preview for the popup's right panel.
 */
export function CategoryCarouselPreview({ section }: { section: SectionState }) {
    return (
        <div className="rounded overflow-hidden">
            <CategoryCarousel
                title={section.title}
                cards={section.cards.map(card => ({
                    _key: card._key,
                    title: card.title,
                    subtitle: card.subtitle,
                    link: card.link,
                    image: card.image ? sanityCdnUrl(card.image) : undefined,
                    gradient: card.gradient,
                    emoji: card.emoji,
                }))}
                autoSwitchMs={parseInt(section.autoSwitchMs) || 4000}
            />
        </div>
    );
}

function SortableCard({
    card,
    cardIndex,
    onUpdateCard,
    canRemove,
    onRemove,
}: {
    card: SectionStateCard;
    cardIndex: number;
    onUpdateCard: (cardIndex: number, field: keyof SectionStateCard, value: string | null) => void;
    canRemove: boolean;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `card-${card._key}`,
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.6 : 1,
    } as React.CSSProperties;
    return (
        <div ref={setNodeRef} style={style} className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Card #{cardIndex + 1}
                </span>
                <div className="flex items-center gap-1">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 text-zinc-500 hover:text-zinc-300"
                        aria-label="Reorder card"
                    >
                        <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                    </div>
                    {canRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            aria-label="Remove card"
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Title" tooltip="Main title for this card">
                    <input
                        type="text"
                        value={card.title}
                        onChange={(e) => onUpdateCard(cardIndex, "title", e.target.value)}
                        className={inputCls}
                        placeholder="Card title"
                    />
                </Field>
                <Field label="Subtitle" tooltip="Description text for this card">
                    <input
                        type="text"
                        value={card.subtitle}
                        onChange={(e) => onUpdateCard(cardIndex, "subtitle", e.target.value)}
                        className={inputCls}
                        placeholder="Card subtitle"
                    />
                </Field>
                <Field label="Link" tooltip="Page to navigate to when card is clicked">
                    <AutoSuggest
                        label="Link"
                        value={card.link}
                        onChange={(value) => onUpdateCard(cardIndex, "link", value)}
                        fetchSuggestions={suggestRoutes}
                        placeholder="/path/to/page"
                    />
                </Field>
                <Field label="Gradient" tooltip="Background gradient for this card (Tailwind classes)">
                    <input
                        type="text"
                        value={card.gradient}
                        onChange={(e) => onUpdateCard(cardIndex, "gradient", e.target.value)}
                        className={inputCls}
                        placeholder="from-gray-900 via-gray-800 to-red-900"
                    />
                </Field>
                <Field label="Emoji" tooltip="Icon emoji for this card">
                    <input
                        type="text"
                        value={card.emoji}
                        onChange={(e) => onUpdateCard(cardIndex, "emoji", e.target.value)}
                        className={inputCls}
                        placeholder="⚡"
                    />
                </Field>
                <div className="md:col-span-2">
                    <Field label="Card Image" tooltip="Image for this carousel card">
                        <ImageSelector
                            name={`card-image-${cardIndex}`}
                            value={card.image || ""}
                            onChange={(value) => onUpdateCard(cardIndex, "image", value)}
                            label="Card Image"
                        />
                    </Field>
                </div>
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

export { arrayMove };
