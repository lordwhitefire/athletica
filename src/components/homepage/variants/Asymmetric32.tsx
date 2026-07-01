"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface Props {
    items: CategoryGridItem[];
}

export default function Asymmetric32({ items: raw }: Props) {
    const MIN = 2;
    const items = raw.length < MIN
        ? Array.from({ length: MIN }, (_, i) => ({
            _key: `ph-${i}`,
            label: `Placeholder ${i + 1}`,
            link: "#",
          }) as CategoryGridItem[])
        : raw.slice(0, MIN);
    if (raw.length > MIN) {
        console.warn(`[Asymmetric32] Received ${raw.length} items, max ${MIN}. Discarded:`, raw.slice(MIN).map(i => i.label));
    }
    return (
        <motion.div
            className="flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-4 md:h-[600px]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <Link href={items[0].link || "/"} className={`md:col-span-2 relative group overflow-hidden h-48 md:h-full ${items[0].bg || "bg-neutral-800"}`}>
                {items[0].image && (
                    <Image src={items[0].image} alt={items[0].label} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
                )}
                <div className="absolute bottom-4 left-4 md:bottom-10 md:left-10 bg-zinc-900 p-3 md:p-8">
                    <h3 className={`text-xl md:text-4xl font-black italic ${items[0].textColor || ""}`}>{items[0].label}</h3>
                </div>
            </Link>
            <Link href={items[1].link || "/"} className={`relative group overflow-hidden h-48 md:h-full ${items[1].bg || "bg-neutral-800"}`}>
                {items[1].image && (
                    <Image src={items[1].image} alt={items[1].label} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
                )}
                <div className={`absolute bottom-4 left-4 md:bottom-10 md:left-10 ${items[1].bg || "bg-primary"} p-3 md:p-8 ${items[1].textColor || "text-on-primary"}`}>
                    <h3 className="text-xl md:text-3xl font-black italic">{items[1].label}</h3>
                </div>
            </Link>
        </motion.div>
    );
}
