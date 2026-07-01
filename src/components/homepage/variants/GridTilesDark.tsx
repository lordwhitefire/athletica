"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface Props {
    items: CategoryGridItem[];
}

export default function GridTilesDark({ items: raw }: Props) {
    const MIN = 4;
    const items = raw.length < MIN
        ? Array.from({ length: MIN }, (_, i) => ({
            _key: `ph-${i}`,
            label: `Placeholder ${i + 1}`,
            link: "#",
          }) as CategoryGridItem[])
        : raw.slice(0, MIN);
    if (raw.length > MIN) {
        console.warn(`[GridTilesDark] Received ${raw.length} items, max ${MIN}. Discarded:`, raw.slice(MIN).map(i => i.label));
    }
    return (
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {items.map((item) => (
                <Link key={item._key || item.label} href={item.link || "/"}>
                    <div className={`w-full relative aspect-square max-h-[250px] ${item.bg || "bg-neutral-800"} flex items-center justify-center font-black text-xl md:text-3xl italic hover:bg-primary-container hover:text-on-primary-container cursor-pointer transition-colors group overflow-hidden`}>
                        {item.image && (
                            <Image src={item.image} alt={item.label} fill className="object-cover opacity-40 group-hover:scale-105 transition-transform" sizes="(max-width: 768px) 50vw, 25vw" />
                        )}
                        <span className={`relative z-10 ${item.textColor || "text-white"}`}>
                            {item.label}
                        </span>
                    </div>
                </Link>
            ))}
        </motion.div>
    );
}
