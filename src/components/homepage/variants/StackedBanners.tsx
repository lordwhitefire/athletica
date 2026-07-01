"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface Props {
    items: CategoryGridItem[];
}

export default function StackedBanners({ items: raw }: Props) {
    const MIN = 2;
    const items = raw.length < MIN
        ? Array.from({ length: MIN }, (_, i) => ({
            _key: `ph-${i}`,
            label: `Placeholder ${i + 1}`,
            link: "#",
          }) as CategoryGridItem[])
        : raw.slice(0, MIN);
    if (raw.length > MIN) {
        console.warn(`[StackedBanners] Received ${raw.length} items, max ${MIN}. Discarded:`, raw.slice(MIN).map(i => i.label));
    }
    return (
        <motion.div
            className="flex flex-col gap-3 md:gap-4"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {items.map((item, i) => (
                <Link key={item._key || item.label} href={item.link || "/"}>
                    <div className={`${i === 0 ? "h-32 md:h-48" : "h-48 md:h-80"} ${item.bg || "bg-black"} ${item.textColor || "text-white"} flex items-center justify-between px-6 md:px-20 group cursor-pointer overflow-hidden relative`}>
                        {item.image && (
                            <Image src={item.image} alt={item.label} fill className="object-cover opacity-30 group-hover:scale-105 transition-transform" sizes="(max-width: 768px) 100vw, 50vw" />
                        )}
                        <h3 className={`font-headline font-black italic relative uppercase ${i === 0 ? "text-2xl md:text-5xl" : "text-3xl md:text-7xl"}`}>
                            {item.label}
                        </h3>
                        <span className={`material-symbols-outlined relative group-hover:translate-x-4 transition-transform ${i === 0 ? "text-3xl md:text-6xl" : "text-4xl md:text-8xl"}`}>
                            {i === 0 ? "chevron_right" : "trending_flat"}
                        </span>
                    </div>
                </Link>
            ))}
        </motion.div>
    );
}
