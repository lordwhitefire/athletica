"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface Props {
    items: CategoryGridItem[];
}

export default function ScrollBrands({ items: raw }: Props) {
    const MIN = 4;
    const items = raw.length < MIN
        ? Array.from({ length: MIN }, (_, i) => ({
            _key: `ph-${i}`,
            label: `Placeholder ${i + 1}`,
            link: "#",
          }) as CategoryGridItem[])
        : raw.slice(0, MIN);
    if (raw.length > MIN) {
        console.warn(`[ScrollBrands] Received ${raw.length} items, max ${MIN}. Discarded:`, raw.slice(MIN).map(i => i.label));
    }
    const [cardsVisible, setCardsVisible] = useState(3);
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [scrollState, setScrollState] = useState({ canGoPrev: false, canGoNext: true });

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

    useEffect(() => {
        const track = trackRef.current;
        if (track) {
            handleScroll();
        }
    }, [containerWidth, items.length]);

    const handleScroll = () => {
        if (!trackRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
        setScrollState({
            canGoPrev: scrollLeft > 0,
            canGoNext: scrollLeft + clientWidth < scrollWidth - 1 // -1 for strict rounding diffs
        });
    };

    const cardWidth = containerWidth > 0
        ? (containerWidth - 10 * (cardsVisible - 1)) / cardsVisible
        : 0;

    const scrollByStep = (direction: 1 | -1) => {
        if (trackRef.current) {
            const step = cardWidth + 10;
            trackRef.current.scrollBy({ left: direction * step, behavior: "smooth" });
        }
    };

    return (
        <motion.div
            className="w-full relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className="relative flex items-center">
                <button
                    className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 bg-zinc-900 shadow-lg justify-center items-center hover:bg-primary-container hover:text-on-primary-container transition-colors ${!scrollState.canGoPrev ? "opacity-30 cursor-not-allowed hover:bg-zinc-900 hover:text-inherit" : ""}`}
                    onClick={() => scrollByStep(-1)}
                    disabled={!scrollState.canGoPrev}
                    aria-label="Previous items"
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>

                <div ref={containerRef} className="overflow-hidden w-full 2xl:max-w-[1536px] 2xl:mx-auto">
                    <div
                        ref={trackRef}
                        onScroll={handleScroll}
                        id="scroll-brands-track"
                        className="flex gap-[10px] overflow-x-auto no-scrollbar"
                    >
                        {items.map((item) => (
                            <Link
                                key={item._key || item.label}
                                href={item.link || "/"}
                                className="flex-shrink-0 group"
                                style={{ minWidth: cardWidth > 0 ? `${cardWidth}px` : undefined }}
                            >
                                <div className={`w-full relative overflow-hidden aspect-[2.44/1] flex items-center justify-center ${item.bg || "bg-zinc-800"}`}>
                                    {item.image && (
                                        <Image
                                            src={item.image}
                                            alt={item.label}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    )}
                                </div>
                                <p className={`text-sm font-medium ${item.textColor || "text-zinc-300"} mt-2 text-center truncate`}>
                                    {item.label}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>

                <button
                    className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 bg-zinc-900 shadow-lg justify-center items-center hover:bg-primary-container hover:text-on-primary-container transition-colors ${!scrollState.canGoNext ? "opacity-30 cursor-not-allowed hover:bg-zinc-900 hover:text-inherit" : ""}`}
                    onClick={() => scrollByStep(1)}
                    disabled={!scrollState.canGoNext}
                    aria-label="Next items"
                >
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
        </motion.div>
    );
}
