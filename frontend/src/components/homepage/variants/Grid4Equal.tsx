"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface Props {
    items: CategoryGridItem[];
}

export default function Grid4Equal({ items: raw }: Props) {
    const MIN = 4;
    const items = raw.length < MIN
        ? Array.from({ length: MIN }, (_, i) => ({
            _key: `ph-${i}`,
            label: `Placeholder ${i + 1}`,
            link: "#",
          })) as CategoryGridItem[]
        : raw.slice(0, MIN);
    if (raw.length > MIN) {
        console.warn(`[Grid4Equal] Received ${raw.length} items, max ${MIN}. Discarded:`, raw.slice(MIN).map(i => i.label));
    }
    return (
        <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {items.map((item) => (
                <Link key={item._key || item.label} href={item.link || "/"}>
                    <div className="relative h-40 md:h-96 group overflow-hidden cursor-pointer">
                        {item.image ? (
                            <Image 
                                src={item.image} 
                                alt={item.label} 
                                fill 
                                className="object-cover group-hover:scale-110 transition-transform duration-500" 
                                sizes="(max-width: 768px) 50vw, 25vw"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : null}
                        <div className={`absolute inset-0 ${item.image ? "bg-black/20" : item.bg || "bg-surface-container"} flex items-center justify-center`}>
                            <h3 className={`font-headline text-lg md:text-2xl font-black ${item.textColor || "text-white"}`}>
                                {item.label}
                            </h3>
                        </div>
                    </div>
                </Link>
            ))}
        </motion.div>
    );
}
