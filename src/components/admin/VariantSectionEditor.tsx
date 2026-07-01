"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import MediaLibrary from "./MediaLibrary";
import type { CategoryGridItem } from "@/types/homepage";

interface VariantSectionProps {
  variant: string;
  items: CategoryGridItem[];
  onItemsChange: (items: CategoryGridItem[]) => void;
  title: string;
  subtitle?: string;
  onTitleChange: (title: string) => void;
  onSubtitleChange?: (subtitle: string) => void;
  onBgChange?: (bg: string) => void;
  bg?: string;
}

// Variant-specific configurations
const VARIANT_CONFIGS = {
  "grid-4-equal": {
    name: "Grid 4 Equal",
    description: "4-column grid layout",
    minItems: 4,
    maxItems: 8,
    itemSize: "h-40 md:h-96",
    aspectRatio: "auto",
    fallbackBg: "bg-surface-container",
  },
  "grid-3-bordered": {
    name: "Grid 3 Bordered",
    description: "3-column grid with borders",
    minItems: 3,
    maxItems: 6,
    itemSize: "h-32 md:h-64",
    aspectRatio: "auto",
    fallbackBg: "bg-surface-container-low",
  },
  "asymmetric-3-2": {
    name: "Asymmetric 3-2",
    description: "Large 2/3 + small 1/3 split",
    minItems: 2,
    maxItems: 2,
    itemSize: "h-48 md:h-full",
    aspectRatio: "auto",
    fallbackBg: "bg-zinc-900",
  },
  "asymmetric-2-split": {
    name: "Asymmetric 2 Split",
    description: "Left/right split with borders",
    minItems: 2,
    maxItems: 2,
    itemSize: "h-48 md:h-full",
    aspectRatio: "auto",
    fallbackBg: "bg-surface-container",
  },
  "split-1-2": {
    name: "Split 1-2",
    description: "1/3 + 2/3 vertical split",
    minItems: 2,
    maxItems: 2,
    itemSize: "h-40 md:h-full",
    aspectRatio: "auto",
    fallbackBg: "bg-black",
  },
  "scroll-brands": {
    name: "Scroll Brands",
    description: "Horizontal scrolling brand cards",
    minItems: 3,
    maxItems: 10,
    itemSize: "aspect-[2.44/1]",
    aspectRatio: "2.44/1",
    fallbackBg: "bg-zinc-800",
  },
  "scroll-categories": {
    name: "Scroll Categories",
    description: "Horizontal scrolling categories",
    minItems: 3,
    maxItems: 10,
    itemSize: "aspect-video",
    aspectRatio: "16/9",
    fallbackBg: "bg-neutral-800",
  },
  "grid-tiles-dark": {
    name: "Grid Tiles Dark",
    description: "Dark theme square tiles",
    minItems: 4,
    maxItems: 12,
    itemSize: "aspect-square max-h-[250px]",
    aspectRatio: "1/1",
    fallbackBg: "bg-neutral-800",
  },
  "stacked-banners": {
    name: "Stacked Banners",
    description: "Vertical stacking with icons",
    minItems: 2,
    maxItems: 6,
    itemSize: "h-32 md:h-80",
    aspectRatio: "auto",
    fallbackBg: "bg-black",
  },
};

export default function VariantSectionEditor({
  variant,
  items,
  onItemsChange,
  title,
  subtitle,
  onTitleChange,
  onSubtitleChange,
  onBgChange,
  bg,
}: VariantSectionProps) {
  const config = VARIANT_CONFIGS[variant as keyof typeof VARIANT_CONFIGS];
  const [previewMode, setPreviewMode] = useState(false);

  if (!config) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded p-4">
        <p className="text-red-400 text-sm">Unknown variant: {variant}</p>
      </div>
    );
  }

  const addItem = () => {
    const newItem: CategoryGridItem = {
      _key: `item-${Date.now()}`,
      label: `Item ${items.length + 1}`,
      link: "/",
      bg: config.fallbackBg,
      textColor: "text-on-surface",
      accent: "",
    };
    onItemsChange([...items, newItem]);
  };

  const updateItem = (index: number, updates: Partial<CategoryGridItem>) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], ...updates };
    onItemsChange(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  const duplicateItem = (index: number) => {
    const itemToDuplicate = items[index];
    const duplicatedItem = {
      ...itemToDuplicate,
      _key: `item-${Date.now()}`,
      label: `${itemToDuplicate.label} (Copy)`,
    };
    const updatedItems = [...items];
    updatedItems.splice(index + 1, 0, duplicatedItem);
    onItemsChange(updatedItems);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-800 px-6 py-4 border-b border-neutral-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {config.name}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">{config.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="text-xs bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded transition-colors"
            >
              {previewMode ? "Edit Mode" : "Preview Mode"}
            </button>
            <button
              onClick={addItem}
              disabled={items.length >= config.maxItems}
              className="text-xs bg-primary hover:brightness-75 disabled:opacity-50 text-on-primary px-3 py-1.5 rounded transition-colors"
            >
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Section Settings */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-zinc-500 text-xs font-medium mb-2">
              Section Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter section title..."
            />
          </div>

          {variant === "grid-4-equal" && (
            <div>
              <label className="block text-zinc-500 text-xs font-medium mb-2">
                Background
              </label>
              <select
                value={bg || "bg-surface"}
                onChange={(e) => onBgChange?.(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
              >
                <option value="bg-surface">Surface</option>
                <option value="bg-surface-container">Surface Container</option>
                <option value="bg-surface-container-low">Surface Container Low</option>
                <option value="bg-neutral-900">Neutral 900</option>
                <option value="bg-black">Black</option>
              </select>
            </div>
          )}
        </div>

        {/* Items Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Items ({items.length}/{config.maxItems})
            </h4>
            {items.length < config.minItems && (
              <p className="text-xs text-amber-500">
                Minimum {config.minItems} items required
              </p>
            )}
          </div>

          {previewMode ? (
            /* Preview Mode */
            <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-950">
              <div className="text-xs text-zinc-500 mb-3 text-center">Preview Mode</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((item, index) => (
                  <div
                    key={item._key || index}
                    className={`relative ${config.itemSize} ${item.bg || config.fallbackBg} rounded-lg overflow-hidden group`}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.label}
                        fill
                        className="object-cover opacity-80"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl mb-2">📷</div>
                          <div className="text-sm font-medium text-white/80">
                            {item.label}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="text-white/80 text-sm font-medium">
                        {item.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-4">
              {items.map((item, index) => (
                <ItemCard
                  key={item._key || index}
                  item={item}
                  index={index}
                  variant={variant}
                  config={config}
                  onUpdate={(updates) => updateItem(index, updates)}
                  onRemove={() => removeItem(index)}
                  onDuplicate={() => duplicateItem(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ItemCardProps {
  item: CategoryGridItem;
  index: number;
  variant: string;
  config: any;
  onUpdate: (updates: Partial<CategoryGridItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

function ItemCard({ item, index, variant, config, onUpdate, onRemove, onDuplicate }: ItemCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
      {/* Item Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-750 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/20 text-primary text-xs font-bold rounded flex items-center justify-center">
            {index + 1}
          </div>
          <div>
            <div className="text-sm font-medium text-white">
              {item.label || "Untitled Item"}
            </div>
            <div className="text-xs text-zinc-400">
              {item.link || "/"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="text-zinc-500 hover:text-blue-400 p-1"
            title="Duplicate"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-zinc-500 hover:text-red-400 p-1"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
          <span className="material-symbols-outlined text-[16px] text-zinc-500 transition-transform duration-200" style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            chevron_down
          </span>
        </div>
      </div>

      {/* Item Details */}
      {showDetails && (
        <div className="border-t border-neutral-700 p-4 bg-neutral-750">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-500 text-xs font-medium mb-2">
                Label
              </label>
              <input
                type="text"
                value={item.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Item label..."
              />
            </div>
            <div>
              <label className="block text-zinc-500 text-xs font-medium mb-2">
                Link
              </label>
              <input
                type="text"
                value={item.link}
                onChange={(e) => onUpdate({ link: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="/path/to/page"
              />
            </div>
            <div>
              <label className="block text-zinc-500 text-xs font-medium mb-2">
                Image
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={item.image || ""}
                  onChange={(e) => onUpdate({ image: e.target.value })}
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Image URL..."
                />
                <button
                  type="button"
                  onClick={() => setShowMediaLibrary(true)}
                  className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-sm transition-colors"
                >
                  <span className="material-symbols-outline text-sm">image</span>
                </button>
              </div>
              {item.image && (
                <div className="mt-2 relative w-full h-16 rounded overflow-hidden">
                  <Image
                    src={item.image}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="100%"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-zinc-500 text-xs font-medium mb-2">
                Background
              </label>
              <select
                value={item.bg || config.fallbackBg}
                onChange={(e) => onUpdate({ bg: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
              >
                <option value="bg-surface">Surface</option>
                <option value="bg-surface-container">Surface Container</option>
                <option value="bg-surface-container-low">Surface Container Low</option>
                <option value="bg-neutral-900">Neutral 900</option>
                <option value="bg-black">Black</option>
                <option value="bg-primary">Primary</option>
                <option value="bg-primary-container">Primary Container</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-500 text-xs font-medium mb-2">
                Text Color
              </label>
              <select
                value={item.textColor || "text-on-surface"}
                onChange={(e) => onUpdate({ textColor: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
              >
                <option value="text-on-surface">On Surface</option>
                <option value="text-on-primary">On Primary</option>
                <option value="text-white">White</option>
                <option value="text-black">Black</option>
                <option value="text-zinc-300">Zinc 300</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Media Library Modal */}
      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={(image) => {
          onUpdate({ image });
          setShowMediaLibrary(false);
        }}
        currentImage={item.image}
      />
    </div>
  );
}