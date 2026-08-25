import React from "react";
import { CategoryLink, CategoryLinkTargetType } from "@/types/category-links";

interface CategoryAttachSectionProps {
    targetType: CategoryLinkTargetType;
    onAttach: (targetType: CategoryLinkTargetType, targetId: string) => void;
    onDetach: (targetType: CategoryLinkTargetType, targetId: string) => void;
    attachedEntities: CategoryLink[];
    availableEntities: { id: string; name: string }[];
}

const LABELS: Record<CategoryLinkTargetType, string> = {
    brand: "Brands",
    model: "Models",
    submodel: "Submodels",
    product_model: "Product Models",
};

// FR3-D: ATTACH-existing-only section (no creation here; creation lives on
// the dedicated Brands/Models pages).
export default function CategoryAttachSection({
    targetType,
    onAttach,
    onDetach,
    attachedEntities,
    availableEntities,
}: CategoryAttachSectionProps) {
    const [selectedEntity, setSelectedEntity] = React.useState("");

    const label = LABELS[targetType];

    return (
        <div data-testid={`attach-section-${targetType}`} className="rounded-[8px] border border-[#1b1f22] bg-[#0d0f11] p-6">
            <h3 className="text-[13px] font-semibold text-[#e5e7e8]">{label}</h3>

            <p className="mt-1 text-[10px] text-[#7c8289]" data-testid={`attach-count-${targetType}`}>
                {attachedEntities.length} attached
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <select
                    aria-label={`Attach ${label}`}
                    value={selectedEntity}
                    onChange={(e) => setSelectedEntity(e.target.value)}
                    className="h-[32px] min-w-[180px] rounded-[5px] border border-[#25292d] bg-[#0a0c0d] px-2 text-[11px] text-[#d5d8db] outline-none"
                >
                    <option value="">Select existing…</option>
                    {availableEntities
                        .filter((entity) => !attachedEntities.some((link) => link.entity_id === entity.id))
                        .map((entity) => (
                            <option key={entity.id} value={entity.id}>
                                {entity.name}
                            </option>
                        ))}
                </select>
                <button
                    type="button"
                    data-testid={`attach-btn-${targetType}`}
                    disabled={!selectedEntity}
                    onClick={() => {
                        if (!selectedEntity) return;
                        onAttach(targetType, selectedEntity);
                        setSelectedEntity("");
                    }}
                    className="inline-flex h-[32px] items-center gap-1 rounded-[5px] bg-[#b1f218] px-3 text-[11px] font-semibold text-[#0a0a0a] transition hover:bg-[#c2ff35] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-[14px]">add_link</span>
                    Attach
                </button>
            </div>

            {attachedEntities.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2" data-testid={`attach-list-${targetType}`}>
                    {attachedEntities.map((link) => {
                        const name = availableEntities.find((e) => e.id === link.entity_id)?.name ?? link.entity_id;
                        return (
                            <li
                                key={link.id}
                                className="inline-flex items-center gap-1 rounded-[5px] border border-[#25292d] bg-[#121416] px-2 py-1 text-[10px] text-[#cfd3d6]"
                            >
                                {name}
                                <button
                                    type="button"
                                    aria-label={`Detach ${name}`}
                                    data-testid={`detach-${targetType}-${link.entity_id}`}
                                    onClick={() => onDetach(targetType, link.entity_id)}
                                    className="text-[#7c8289] transition hover:text-[#e4612b]"
                                >
                                    <span className="material-symbols-outlined text-[12px]">link_off</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
