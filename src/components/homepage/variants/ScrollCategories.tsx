"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface Props {
    items: CategoryGridItem[];
}

export default function ScrollCategories({ items: raw }: Props) {
    const MIN = 4;
    const items = raw.length < MIN
        ? Array.from({ length: MIN }, (_, i) => ({
            _key: `ph-${i}`,
            label: `Placeholder ${i + 1}`,
            link: "#",
          }) as CategoryGridItem[])
        : raw.slice(0, MIN);
    if (raw.length > MIN) {
        console.warn(`[ScrollCategories] Received ${raw.length} items, max ${MIN}. Discarded:`, raw.slice(MIN).map(i => i.label));
    }
    return (
        <motion.div
            className="flex gap-3 md:gap-6 overflow-x-auto no-scrollbar"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {items.map((item) => (
                <Link key={item.label} href={item.link}>
                    <div className={`relative min-w-[140px] md:min-w-[200px] aspect-video border-4 ${item.accent || "border-black"} ${item.bg || "bg-neutral-900"} flex items-center justify-center font-bold uppercase cursor-pointer hover:bg-white/10 transition-colors group overflow-hidden`}>
                        {item.image && (
                            <Image src={item.image} alt={item.label} fill className="object-cover opacity-30 group-hover:scale-105 transition-transform" sizes="150px" />
                        )}
                        <span className={`relative z-10 text-xs md:text-base ${item.textColor || "text-white"}`}>
                            {item.label}
                        </span>
                    </div>
                </Link>
            ))}
        </motion.div>
    );
}
