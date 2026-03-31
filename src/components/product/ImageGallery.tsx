"use client";

import { useState } from "react";

interface ImageGalleryProps {
    mainImage: string;
    gallery: string[];
    productName: string;
    badges?: string[];
}

export default function ImageGallery({
    mainImage,
    gallery,
    productName,
    badges = [],
}: ImageGalleryProps) {
    const allImages = [mainImage, ...gallery];
    const [activeIndex, setActiveIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomPosition({ x, y });
    }

    return (
        <div className="space-y-4">
            {/* Main image */}
            <div
                className="relative aspect-square bg-surface-container overflow-hidden cursor-crosshair"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
            >
                <img
                    src={allImages[activeIndex]}
                    alt={productName}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out"
                    style={
                        isZoomed
                            ? {
                                transform: "scale(2)",
                                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            }
                            : {}
                    }
                />

                {/* Badges bottom-left */}
                {badges.length > 0 && (
                    <div className="absolute bottom-6 left-6 flex gap-2">
                        {badges.map((badge, i) => (
                            <span
                                key={i}
                                className={`text-white text-[10px] px-3 py-1 font-bold tracking-tighter uppercase ${i === 0 ? "bg-primary" : "bg-zinc-900"
                                    }`}
                            >
                                {badge}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                    {allImages.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={`flex-shrink-0 w-24 h-24 bg-surface-container p-1 transition-all ${activeIndex === index
                                    ? "border-2 border-primary"
                                    : "opacity-60 hover:opacity-100"
                                }`}
                        >
                            <img
                                src={image}
                                alt={`${productName} view ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}