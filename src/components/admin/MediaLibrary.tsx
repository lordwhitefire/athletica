"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: string) => void;
  currentImage?: string;
}

// Mock image data - in real app, this would come from Sanity or cloud storage
const mockImages = [
  {
    id: "img-1",
    url: "https://images.unsplash.com/photo-1551739440-423c9021af8e?w=800&h=400&fit=crop&crop=center",
    alt: "Running shoes on track",
    category: "footwear",
  },
  {
    id: "img-2",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=400&fit=crop&crop=center",
    alt: "Athletic apparel",
    category: "apparel",
  },
  {
    id: "img-3",
    url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop&crop=center",
    alt: "Training equipment",
    category: "equipment",
  },
  {
    id: "img-4",
    url: "https://images.unsplash.com/photo-1551698623-1ee9470d9597?w=800&h=400&fit=crop&crop=center",
    alt: "Sports accessories",
    category: "accessories",
  },
  {
    id: "img-5",
    url: "https://images.unsplash.com/photo-1558979158-65a1eaa08691?w=800&h=400&fit=crop&crop=center",
    alt: "Running shoes",
    category: "footwear",
  },
  {
    id: "img-6",
    url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop&crop=center",
    alt: "Fitness apparel",
    category: "apparel",
  },
  {
    id: "img-7",
    url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop&crop=center",
    alt: "Vertical training image",
    category: "equipment",
  },
  {
    id: "img-8",
    url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=600&fit=crop&crop=center",
    alt: "Vertical fitness image",
    category: "apparel",
  },
];

const categories = ["All", "footwear", "appwear", "equipment", "accessories"];

export default function MediaLibrary({ isOpen, onClose, onSelect, currentImage }: MediaLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filteredImages = mockImages.filter(image => {
    const matchesCategory = selectedCategory === "All" || image.category === selectedCategory;
    const matchesSearch = image.alt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 md:inset-8 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-neutral-800 px-6 py-4 border-b border-neutral-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Media Library</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-neutral-700 bg-neutral-850">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search images..."
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-primary text-on-primary"
                      : "bg-neutral-800 text-zinc-300 hover:bg-neutral-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Image Grid */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image) => (
              <motion.div
                key={image.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                onClick={() => handleImageSelect(image.url)}
              >
                <div className="aspect-video relative">
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  
                  {/* Selection Overlay */}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                    selectedImage === image.url ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}>
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-sm">check</span>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {image.category}
                  </div>
                </div>
                
                {/* Image Info */}
                <div className="p-2 bg-neutral-800">
                  <p className="text-xs text-zinc-300 truncate">{image.alt}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-zinc-600 mb-2">image_not_supported</span>
              <p className="text-zinc-400">No images found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-800 px-6 py-4 border-t border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              {selectedImage ? "Image selected" : "No image selected"}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedImage}
                className="px-4 py-2 bg-primary hover:brightness-75 disabled:opacity-50 text-on-primary rounded-lg text-sm font-medium transition-colors"
              >
                Select Image
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}