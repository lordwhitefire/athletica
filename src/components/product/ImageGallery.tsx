"use client";

import { useState } from "react";

interface ImageGalleryProps {
    mainImage: string;
    gallery: string[];
    productName: string;
}

export default function ImageGallery({
    mainImage,
    gallery,
    productName,
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
        <div className="flex flex-col gap-4">
            <div
                className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden cursor-zoom-in"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
            >
                <img
                    src={allImages[activeIndex]}
                    alt={productName}
                    className="w-full h-full object-contain p-4 transition-transform duration-200"
                    style={isZoomed ? {
                        transform: "scale(2)",
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    } : {}}
                />
            </div>

            {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {allImages.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden bg-gray-50 transition-colors ${activeIndex === index ? "border-green-500" : "border-gray-200 hover:border-gray-400"}`}
                        >
                            <img
                                src={image}
                                alt={`${productName} view ${index + 1}`}
                                className="w-full h-full object-contain p-1"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}