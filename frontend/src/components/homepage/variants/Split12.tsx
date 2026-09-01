"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface Props {
    items: CategoryGridItem[];
}

export default function Split12({ items: raw }: Props) {
    const MIN = 2;
    const items = raw.length < MIN
        ? Array.from({ length: MIN }, (_, i) => ({
            _key: `ph-${i}`,
            label: `Placeholder ${i + 1}`,
            link: "#",
          })) as CategoryGridItem[]
        : raw.slice(0, MIN);
    if (raw.length > MIN) {
        console.warn(`[Split12] Received ${raw.length} items, max ${MIN}. Discarded:`, raw.slice(MIN).map(i => i.label));
    }
    return (
        <motion.div
            className="flex flex-col md:flex-row gap-3 md:gap-4 md:h-[500px]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <Link href={items[0].link || "/"} className="md:w-1/3 relative group overflow-hidden flex items-center justify-center h-40 md:h-full">
                {items[0].image && (
                    <Image src={items[0].image} alt={items[0].label} fill className="object-cover opacity-60 group-hover:scale-105 transition-transform" sizes="(max-width: 768px) 100vw, 50vw" />
                )}
                <div className={`absolute inset-0 ${items[0].bg || "bg-black"}`} style={{ opacity: items[0].image ? 0.4 : 1 }} />
                <h3 className={`relative font-headline text-2xl md:text-3xl font-black italic ${items[0].textColor || "text-white"}`}>
                    {items[0].label}
                </h3>
            </Link>
            <Link href={items[1].link || "/"} className="md:w-2/3 relative group overflow-hidden flex items-center justify-center h-40 md:h-full">
                {items[1].image && (
                    <Image src={items[1].image} alt={items[1].label} fill className="object-cover opacity-60 group-hover:scale-105 transition-transform" sizes="(max-width: 768px) 100vw, 50vw" />
                )}
                <div className={`absolute inset-0 ${items[1].bg || "bg-primary"}`} style={{ opacity: items[1].image ? 0.4 : 1 }} />
                <h3 className={`relative font-headline text-3xl md:text-5xl font-black italic ${items[1].textColor || "text-white"}`}>
                    {items[1].label}
                </h3>
            </Link>
        </motion.div>
    );
}
