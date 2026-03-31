"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { CategoryCard } from "@/types/homepage";

interface CategoryCarouselProps {
    cards: CategoryCard[];
    autoSwitchMs: number;
}

export default function CategoryCarousel({ cards, autoSwitchMs }: CategoryCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const next = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % cards.length);
    }, [cards.length]);

    const prev = useCallback(() => {
        setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, [cards.length]);

    useEffect(() => {
        if (isPaused || cards.length <= 1) return;
        const timer = setInterval(next, autoSwitchMs);
        return () => clearInterval(timer);
    }, [isPaused, next, autoSwitchMs, cards.length]);

    useEffect(() => {
        if (!scrollRef.current) return;
        const card = scrollRef.current.children[activeIndex] as HTMLElement;
        if (!card) return;
        const container = scrollRef.current;
        const cardLeft = card.offsetLeft;
        const cardWidth = card.offsetWidth;
        const containerWidth = container.offsetWidth;
        const scrollTo = cardLeft - containerWidth / 2 + cardWidth / 2;
        container.scrollTo({ left: scrollTo, behavior: "smooth" });
    }, [activeIndex]);

    if (cards.length === 0) return null;

    return (
        <div
            className="w-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="relative">
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto pb-2"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {cards.map((card, index) => (
                        <Link
                            key={card.id}
                            href={card.link}
                            className="flex-shrink-0 group"
                            style={{ width: "495px", height: "250px" }}
                            onClick={() => setActiveIndex(index)}
                        >
                            <div
                                className={`relative overflow-hidden rounded-lg transition-all duration-300 ${activeIndex === index ? "ring-2 ring-green-500" : "opacity-80 hover:opacity-100"}`}
                                style={{ aspectRatio: "16/9" }}
                            >
                                {card.image ? (
                                    <img
                                        src={card.image}
                                        alt={card.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className={`w-full h-full bg-gradient-to-br ${card.gradient} flex flex-col items-center justify-center relative overflow-hidden`}>
                                        <div className="absolute inset-0 opacity-10 text-white text-9xl flex items-center justify-center">
                                            {card.emoji}
                                        </div>
                                        <div className="relative z-10 text-center text-white p-4">
                                            <div className="text-4xl mb-2">{card.emoji}</div>
                                            <h3 className="font-black text-lg leading-tight">{card.title}</h3>
                                            <p className="text-xs opacity-75 mt-1">{card.subtitle}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                            </div>
                            <p className="text-sm font-medium text-gray-700 mt-2 text-center truncate">
                                {card.title}
                            </p>
                        </Link>
                    ))}
                </div>

                {cards.length > 3 && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center hover:border-green-500 hover:text-green-500 transition-colors z-10 text-lg"
                        >
                            ‹
                        </button>
                        <button
                            onClick={next}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center hover:border-green-500 hover:text-green-500 transition-colors z-10 text-lg"
                        >
                            ›
                        </button>
                    </>
                )}
            </div>


        </div>
    );
}