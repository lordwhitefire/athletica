"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { HeroBanner } from "@/types/homepage";

interface HeroCarouselProps {
    banners: HeroBanner[];
    autoSwitchMs: number;
}

const slideVariants: Variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? "104%" : "-104%",
        scale: 0.93,
        opacity: 0.45,
    }),
    center: {
        x: "0%",
        scale: 1,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? "-104%" : "104%",
        scale: 0.93,
        opacity: 0.45,
    }),
};

const textVariants: Variants = {
    center: {
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const childVariants: Variants = {
    center: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" },
    },
};

export default function HeroCarousel({ banners, autoSwitchMs }: HeroCarouselProps) {
    const [[activeIndex, direction], setPage] = useState([0, 0]);
    const [isPaused, setIsPaused] = useState(false);

    const paginate = useCallback((newDirection: number) => {
        setPage(([prev]) => {
            const next = (prev + newDirection + banners.length) % banners.length;
            return [next, newDirection];
        });
    }, [banners.length]);

    const next = useCallback(() => paginate(1), [paginate]);
    const prev = useCallback(() => paginate(-1), [paginate]);

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

    const banner = banners[activeIndex];

    return (
        <section
            role="region"
            aria-roledescription="carousel"
            aria-label="Hero carousel"
            tabIndex={banners.length > 1 ? 0 : -1}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onKeyDown={handleKeyDown}
            className="w-full bg-gray-950 flex justify-center"
        >
            <div className="max-w-7xl w-full px-3 md:px-6">
                <div
                    className="relative overflow-visible"
                    style={{ height: "clamp(250px, 40vw, 550px)" }}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <AnimatePresence mode="popLayout" custom={direction}>
                            <motion.div
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`Slide ${activeIndex + 1} of ${banners.length}`}
                                key={banner.id}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                className="absolute rounded-lg overflow-hidden"
                                style={{
                                    width: "100%",
                                    height: "clamp(220px, 36vw, 500px)",
                                }}
                            >
                                <Link href={banner.link} className="relative block w-full h-full">
                                    {banner.image ? (
                                        <Image src={banner.image} alt={banner.title} fill className="object-cover" priority sizes="100vw" />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${banner.gradient} flex items-center justify-center relative overflow-hidden`}>
                                            <div className="absolute inset-0 opacity-10 flex items-center justify-center text-9xl select-none">⚽</div>
                                            <motion.div className="relative z-10 text-center text-white px-4 md:px-12" variants={textVariants}>
                                                <motion.p className="text-xs font-bold uppercase tracking-widest mb-2 md:mb-3 opacity-60" variants={childVariants} initial={{ opacity: 0, y: 20 }}>
                                                    Athletica
                                                </motion.p>
                                                <motion.h2 className="text-xl md:text-4xl font-black mb-2 md:mb-3 leading-tight" variants={childVariants} initial={{ opacity: 0, y: 20 }}>
                                                    {banner.title}
                                                </motion.h2>
                                                <motion.p className="text-gray-300 text-xs md:text-base mb-3 md:mb-6 opacity-80 hidden sm:block" variants={childVariants} initial={{ opacity: 0, y: 20 }}>
                                                    {banner.subtitle}
                                                </motion.p>
                                                <motion.span
                                                    className="inline-block px-4 md:px-8 py-2 md:py-3 font-bold rounded text-xs md:text-sm text-white"
                                                    style={{ backgroundColor: banner.accent_color }}
                                                    variants={childVariants}
                                                    initial={{ opacity: 0, y: 20 }}
                                                >
                                                    {banner.button_text}
                                                </motion.span>
                                            </motion.div>
                                        </div>
                                    )}
                                </Link>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 pb-4 h-8">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setPage([index, index > activeIndex ? 1 : -1])}
                            className="transition-all duration-300 rounded-full"
                            style={{
                                width: index === activeIndex ? "24px" : "8px",
                                height: "8px",
                                backgroundColor: index === activeIndex ? "var(--color-primary)" : "rgba(255,255,255,0.3)",
                            }}
                            aria-current={index === activeIndex ? "true" : undefined}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
