"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface Props {
    items: CategoryGridItem[];
}

export default function Grid3Bordered({ items: raw }: Props) {
    const MIN = 3;
    const items = raw.length < MIN
        ? Array.from({ length: MIN }, (_, i) => ({
            _key: `ph-${i}`,
            label: `Placeholder ${i + 1}`,
            link: "#",
          })) as CategoryGridItem[]
        : raw.slice(0, MIN);
    if (raw.length > MIN) {
        console.warn(`[Grid3Bordered] Received ${raw.length} items, max ${MIN}. Discarded:`, raw.slice(MIN).map(i => i.label));
    }
    return (
        <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {items.map((item) => (
                <Link key={item._key || item.label} href={item.link || "/"}>
                    <div className={`relative h-32 md:h-64 ${item.bg || "bg-surface-container-low"} flex items-center justify-center ${item.accent || "border-l-8 border-primary-container"} cursor-pointer hover:opacity-90 transition-opacity group overflow-hidden`}>
                        {item.image ? (
                            <Image 
                                src={item.image} 
                                alt={item.label} 
                                fill 
                                className="object-cover opacity-20 group-hover:scale-105 transition-transform" 
                                sizes="(max-width: 768px) 50vw, 33vw"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : null}
                        <span className={`relative z-10 font-black text-lg md:text-2xl uppercase ${item.textColor || "text-on-surface"}`}>
                            {item.label}
                        </span>
                    </div>
                </Link>
            ))}
        </motion.div>
    );
}
