"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { CategoryCard, CategoryCarouselVariant } from "@/types/homepage";

interface CategoryCarouselProps {
    cards: CategoryCard[];
    autoSwitchMs: number;
    variant?: CategoryCarouselVariant;
}

const GAP = 10;

export default function CategoryCarousel({ cards, autoSwitchMs, variant: _variant }: CategoryCarouselProps) {
    const variant = _variant ?? "default";
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [cardsVisible, setCardsVisible] = useState(3);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        function update() {
            const w = window.innerWidth;
            if (w < 768) setCardsVisible(1);
            else if (w < 1024) setCardsVisible(2);
            else setCardsVisible(3);
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        }
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const cardWidth = containerWidth > 0
        ? (containerWidth - GAP * (cardsVisible - 1)) / cardsVisible
        : 0;

    const step = cardWidth + GAP;
    const maxIndex = Math.max(0, cards.length - cardsVisible);

    const next = useCallback(() => {
        setActiveIndex((prev) => Math.min(prev + 1, maxIndex));
    }, [maxIndex]);

    const prev = useCallback(() => {
        setActiveIndex((prev) => Math.max(prev - 1, 0));
    }, []);

    const canGoNext = activeIndex < maxIndex;
    const canGoPrev = activeIndex > 0;

    useEffect(() => {
        if (isPaused || cards.length <= 1 || !canGoNext) return;
        const timer = setInterval(next, autoSwitchMs);
        return () => clearInterval(timer);
    }, [isPaused, next, autoSwitchMs, cards.length, canGoNext]);

    useEffect(() => {
        setActiveIndex((prev) => Math.min(prev, maxIndex));
    }, [maxIndex]);

    if (cards.length === 0) return null;

    return (
        <motion.div
            role="region"
            aria-label="Category carousel"
            className="w-full"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="relative flex items-center">
                {cards.length > 1 && (
                    <button
                        onClick={prev}
                        disabled={!canGoPrev}
                        aria-label="Previous category"
                        className={`absolute left-0 z-10 -translate-x-1/2 w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center transition-colors text-lg hover:border-primary hover:text-primary ${!canGoPrev ? "opacity-30 cursor-not-allowed" : ""}`}
                    >
                        ‹
                    </button>
                )}

                <div ref={containerRef} className="overflow-hidden w-full 2xl:max-w-[1536px] 2xl:mx-auto">
                    <motion.div
                        className="flex"
                        style={{ gap: `${GAP}px` }}
                        animate={{ x: cardWidth > 0 ? -activeIndex * step : 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                        {cards.map((card) => (
                            <Link
                                key={card.id}
                                href={card.link}
                                className="flex-shrink-0 group"
                                style={{ width: cardWidth > 0 ? `${cardWidth}px` : `${100 / cardsVisible}%` }}
                            >
                                <div
                                    className="w-full relative overflow-hidden"
                                    style={{ aspectRatio: "2.44/1" }}
                                >
                                    {card.image ? (
                                        <Image
                                            src={card.image}
                                            alt={card.title}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div
                                            className={`w-full h-full bg-gradient-to-br ${card.gradient} flex items-center justify-center relative overflow-hidden`}
                                        >
                                            <div className="absolute inset-0 opacity-10 text-white text-7xl flex items-center justify-center select-none">
                                                {card.emoji}
                                            </div>
                                            <div className="relative z-10 text-center text-white">
                                                <div className="text-3xl mb-1">{card.emoji}</div>
                                                <h3 className="font-black text-base leading-tight">{card.title}</h3>
                                                <p className="text-[11px] opacity-75 mt-0.5">{card.subtitle}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                                </div>
                                <p className="text-sm font-medium text-zinc-300 mt-2 truncate text-center">
                                    {card.title}
                                </p>
                            </Link>
                        ))}
                    </motion.div>
                </div>

                {cards.length > 1 && (
                    <button
                        onClick={next}
                        disabled={!canGoNext}
                        aria-label="Next category"
                        className={`absolute right-0 z-10 translate-x-1/2 w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center transition-colors text-lg hover:border-primary hover:text-primary ${!canGoNext ? "opacity-30 cursor-not-allowed" : ""}`}
                    >
                        ›
                    </button>
                )}
            </div>
        </motion.div>
    );
}
