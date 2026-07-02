"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
    mainImage: string;
    gallery?: string[];
    productName: string;
    badges?: string[];
}

export default function ImageGallery({
    mainImage,
    productName,
    badges = [],
    gallery = [],
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
                <Image
                    src={allImages[activeIndex]}
                    alt={productName}
                    fill
                    className="object-cover transition-transform duration-500 ease-out"
                    sizes="(max-width: 768px) 100vw, 50vw"
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
                                className={`${i === 0 ? "text-black" : "text-white"} text-[10px] px-3 py-1 font-bold tracking-tighter uppercase ${i === 0 ? "bg-primary" : "bg-zinc-900"
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
                            className={`relative flex-shrink-0 w-24 h-24 bg-surface-container p-1 transition-all ${activeIndex === index
                                    ? "border-2 border-primary-container"
                                    : "opacity-60 hover:opacity-100"
                                }`}
                        >
                            <Image
                                src={image}
                                alt={`${productName} view ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="96px"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}