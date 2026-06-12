"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { HeroBanner } from "@/types/homepage";

interface HeroCarouselProps {
    banners: HeroBanner[];
    autoSwitchMs: number;
}

export default function HeroCarousel({ banners, autoSwitchMs }: HeroCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const goTo = useCallback((index: number) => {
        setActiveIndex((index + banners.length) % banners.length);
    }, [banners.length]);

    const next = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);
    const prev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (banners.length <= 1) return;
            switch (e.key) {
                case "ArrowLeft":
                    prev();
                    break;
                case "ArrowRight":
                    next();
                    break;
                case "Escape":
                    setIsPaused(true);
                    break;
                default:
                    return;
            }
            e.preventDefault();
        },
        [banners.length, next, prev],
    );

    useEffect(() => {
        if (isPaused || banners.length <= 1) return;
        const timer = setInterval(next, autoSwitchMs);
        return () => clearInterval(timer);
    }, [isPaused, next, autoSwitchMs, banners.length]);

    if (banners.length === 0) return null;

    return (
        <section
            role="region"
            aria-roledescription="carousel"
            aria-label="Hero carousel"
            tabIndex={banners.length > 1 ? 0 : -1}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onKeyDown={handleKeyDown}
            className="w-full bg-black"
        >
            <div className="bg-black overflow-hidden 2xl:overflow-visible" style={{ height: "clamp(280px, 42vw, 560px)" }}>
                <div className="relative h-full 2xl:max-w-[1500px] 2xl:mx-auto">
                    <motion.div
                        className="flex h-full"
                        animate={{ x: `-${activeIndex * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        {banners.map((b) => (
                            <div
                                key={b.id}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`Slide ${banners.indexOf(b) + 1} of ${banners.length}`}
                                className="min-w-full h-full relative flex-shrink-0"
                            >
                                <Link href={b.link} className="relative block w-full h-full">
                                    {b.image ? (
                                        <Image src={b.image} alt={b.title} fill className="object-cover" priority sizes="100vw" />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${b.gradient} flex items-center justify-center relative overflow-hidden`}>
                                            <div className="absolute inset-0 opacity-10 flex items-center justify-center text-9xl select-none">⚽</div>
                                            <motion.div
                                                key={activeIndex}
                                                className="relative z-10 text-center text-white px-4 md:px-12"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, ease: "easeOut" }}
                                            >
                                                <p className="text-xs font-bold uppercase tracking-widest mb-2 md:mb-3 opacity-60">
                                                    Athletica
                                                </p>
                                                <h2 className="text-xl md:text-4xl font-black mb-2 md:mb-3 leading-tight">
                                                    {b.title}
                                                </h2>
                                                <p className="text-gray-300 text-xs md:text-base mb-3 md:mb-6 opacity-80 hidden sm:block">
                                                    {b.subtitle}
                                                </p>
                                                <span
                                                    className="inline-block px-4 md:px-8 py-2 md:py-3 font-bold rounded text-xs md:text-sm text-white"
                                                    style={{ backgroundColor: b.accent_color }}
                                                >
                                                    {b.button_text}
                                                </span>
                                            </motion.div>
                                        </div>
                                    )}
                                </Link>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Dots — below the carousel, not overlaid */}
            {banners.length > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 bg-black">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goTo(index)}
                            className="transition-all duration-300 rounded-full"
                            style={{
                                width: index === activeIndex ? "24px" : "8px",
                                height: "8px",
                                backgroundColor: index === activeIndex ? "var(--color-primary)" : "rgba(255,255,255,0.4)",
                            }}
                            aria-current={index === activeIndex ? "true" : undefined}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
