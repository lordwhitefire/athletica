"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { HeroBanner } from "@/types/homepage";

interface HeroCarouselProps {
    banners: HeroBanner[];
    autoSwitchMs: number;
}

function SlideContent({ banner, logicalIndex }: { banner: HeroBanner; logicalIndex: number }) {
    return (
        <Link href={banner.link} className="relative block w-full h-full">
            {banner.image ? (
                <Image src={banner.image} alt={banner.title} fill className="object-cover" priority sizes="100vw" />
            ) : (
                <div className={`w-full h-full bg-gradient-to-br ${banner.gradient} flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-10 flex items-center justify-center text-9xl select-none">⚽</div>
                    <motion.div
                        key={logicalIndex}
                        className="relative z-10 text-center text-white px-4 md:px-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <p className="text-xs font-bold uppercase tracking-widest mb-2 md:mb-3 opacity-60">
                            Athletica
                        </p>
                        <h2 className="text-xl md:text-4xl font-black mb-2 md:mb-3 leading-tight">
                            {banner.title}
                        </h2>
                        <p className="text-gray-300 text-xs md:text-base mb-3 md:mb-6 opacity-80 hidden sm:block">
                            {banner.subtitle}
                        </p>
                        <span
                            className="inline-block px-4 md:px-8 py-2 md:py-3 font-bold rounded text-xs md:text-sm text-white"
                            style={{ backgroundColor: banner.accent_color }}
                        >
                            {banner.button_text}
                        </span>
                    </motion.div>
                </div>
            )}
        </Link>
    );
}

export default function HeroCarousel({ banners, autoSwitchMs }: HeroCarouselProps) {
    const [renderIndex, setRenderIndex] = useState(1);
    const [noAnimation, setNoAnimation] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const N = banners.length;

    const extendedBanners = useMemo(() => {
        if (N <= 1) return banners;
        return [banners[N - 1], ...banners, banners[0]];
    }, [banners, N]);

    const logicalIndex = useMemo(() => {
        if (N <= 1) return 0;
        return ((renderIndex - 1) % N + N) % N;
    }, [renderIndex, N]);

    const handleAnimationComplete = useCallback(() => {
        if (renderIndex === 0) {
            setRenderIndex(N);
            setNoAnimation(true);
        } else if (renderIndex === N + 1) {
            setRenderIndex(1);
            setNoAnimation(true);
        }
    }, [renderIndex, N]);

    useEffect(() => {
        if (!noAnimation) return;
        const raf = requestAnimationFrame(() => setNoAnimation(false));
        return () => cancelAnimationFrame(raf);
    }, [noAnimation]);

    const goTo = useCallback((logicalIdx: number) => {
        if (N <= 1) return;
        setRenderIndex(logicalIdx + 1);
        setNoAnimation(false);
    }, [N]);

    const next = useCallback(() => {
        if (N <= 1) return;
        setRenderIndex((prev) => prev + 1);
        setNoAnimation(false);
    }, [N]);

    const prev = useCallback(() => {
        if (N <= 1) return;
        setRenderIndex((prev) => prev - 1);
        setNoAnimation(false);
    }, [N]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (N <= 1) return;
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
        [N, next, prev],
    );

    useEffect(() => {
        if (isPaused || N <= 1) return;
        const timer = setInterval(next, autoSwitchMs);
        return () => clearInterval(timer);
    }, [isPaused, next, autoSwitchMs, N]);

    if (N === 0) return null;

    if (N === 1) {
        const b = banners[0];
        return (
            <section role="region" aria-label="Hero banner" className="w-full bg-black">
                <div className="bg-black max-2xl:overflow-hidden" style={{ height: "clamp(280px, 42vw, 560px)" }}>
                    <div className="relative h-full 2xl:max-w-[1500px] 2xl:mx-auto">
                        <SlideContent banner={b} logicalIndex={0} />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section
            role="region"
            aria-roledescription="carousel"
            aria-label="Hero carousel"
            tabIndex={N > 1 ? 0 : -1}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onKeyDown={handleKeyDown}
            className="w-full bg-black"
        >
            <div className="bg-black max-2xl:overflow-hidden" style={{ height: "clamp(280px, 42vw, 560px)" }}>
                <div className="relative h-full 2xl:max-w-[1500px] 2xl:mx-auto">
                    <motion.div
                        className="flex h-full"
                        animate={{ x: `-${renderIndex * 100}%` }}
                        transition={{ duration: noAnimation ? 0 : 0.5, ease: "easeInOut" }}
                        onAnimationComplete={handleAnimationComplete}
                    >
                        {extendedBanners.map((b, idx) => {
                            const slideNumber = idx === 0 ? N : idx > N ? 1 : idx;
                            const key = idx === 0
                                ? `${b.id}-clone-last`
                                : idx === N + 1
                                ? `${b.id}-clone-first`
                                : b.id;
                            return (
                                <div
                                    key={key}
                                    role="group"
                                    aria-roledescription="slide"
                                    aria-label={`Slide ${slideNumber} of ${N}`}
                                    className="min-w-full h-full relative flex-shrink-0"
                                >
                                    <SlideContent banner={b} logicalIndex={logicalIndex} />
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>

            {N > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 bg-black">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goTo(index)}
                            className="transition-all duration-300 rounded-full"
                            style={{
                                width: index === logicalIndex ? "24px" : "8px",
                                height: "8px",
                                backgroundColor: index === logicalIndex ? "var(--color-primary)" : "rgba(255,255,255,0.4)",
                            }}
                            aria-current={index === logicalIndex ? "true" : undefined}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
