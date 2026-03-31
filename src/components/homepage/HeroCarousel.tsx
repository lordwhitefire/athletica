"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { HeroBanner } from "@/types/homepage";

interface HeroCarouselProps {
    banners: HeroBanner[];
    autoSwitchMs: number;
}

export default function HeroCarousel({ banners, autoSwitchMs }: HeroCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const next = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % banners.length);
    }, [banners.length]);

    useEffect(() => {
        if (isPaused || banners.length <= 1) return;
        const timer = setInterval(next, autoSwitchMs);
        return () => clearInterval(timer);
    }, [isPaused, next, autoSwitchMs, banners.length]);

    if (banners.length === 0) return null;

    return (
        <div
            className="w-full bg-gray-950 flex justify-center"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="max-w-7xl w-full px-6 " >
                <div className="relative overflow-visible" style={{ height: "400px" }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                        {banners.map((banner, index) => {
                            const total = banners.length;
                            const isPrev = index === (activeIndex - 1 + total) % total;
                            const isNext = index === (activeIndex + 1) % total;
                            const isActive = index === activeIndex;
                            const isHidden = !isActive && !isPrev && !isNext;

                            let transform = "translateX(0%) scale(1)";
                            let opacity = "1";
                            let zIndex = 0;

                            if (isActive) { transform = "translateX(0%) scale(1)"; opacity = "1"; zIndex = 20; }
                            else if (isPrev) { transform = "translateX(-104%) scale(0.93)"; opacity = "0.45"; zIndex = 10; }
                            else if (isNext) { transform = "translateX(104%) scale(0.93)"; opacity = "0.45"; zIndex = 10; }
                            else if (isHidden) { transform = "translateX(0%) scale(0.9)"; opacity = "0"; zIndex = 0; }

                            return (
                                <div
                                    key={banner.id}
                                    className="absolute transition-all duration-500 ease-in-out rounded-xl overflow-hidden"
                                    style={{ width: "100%", height: "360px", transform, opacity, zIndex }}
                                >
                                    <Link href={banner.link} className="block w-full h-full">
                                        {banner.image ? (
                                            <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className={`w-full h-full bg-gradient-to-br ${banner.gradient} flex items-center justify-center relative overflow-hidden`}>
                                                <div className="absolute inset-0 opacity-10 flex items-center justify-center text-9xl select-none">⚽</div>
                                                <div className="relative z-10 text-center text-white px-12">
                                                    <p className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">Athletica</p>
                                                    <h2 className="text-4xl font-black mb-3 leading-tight">{banner.title}</h2>
                                                    <p className="text-gray-300 text-base mb-6 opacity-80">{banner.subtitle}</p>
                                                    <span className="inline-block px-8 py-3 font-bold rounded text-sm text-white" style={{ backgroundColor: banner.accent_color }}>
                                                        {banner.button_text}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 pb-4 h-8">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className="transition-all duration-300 rounded-full"
                            style={{ width: index === activeIndex ? "24px" : "8px", height: "8px", backgroundColor: index === activeIndex ? "#22c55e" : "rgba(255,255,255,0.3)" }}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}