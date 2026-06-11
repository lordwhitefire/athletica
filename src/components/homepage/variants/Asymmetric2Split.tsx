"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface Props {
    items: CategoryGridItem[];
}

export default function Asymmetric2Split({ items }: Props) {
    if (items.length < 2) return null;
    return (
        <motion.div
            className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8 md:h-[500px]"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <Link href={items[0].href} className={`relative overflow-hidden group h-48 md:h-full ${items[0].accent || "border-r-[24px] border-primary-container"}`}>
                {items[0].image && (
                    <Image src={items[0].image} alt={items[0].label} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
                )}
                <div className={`absolute inset-0 bg-black/30 flex items-center p-6 md:p-12 ${items[0].textColor || "text-white"} font-headline text-3xl md:text-6xl font-black italic uppercase`}>
                    {items[0].label}
                </div>
            </Link>
            <Link href={items[1].href} className={`relative overflow-hidden group h-48 md:h-full ${items[1].accent || "border-l-[24px] border-black"}`}>
                {items[1].image && (
                    <Image src={items[1].image} alt={items[1].label} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
                )}
                <div className={`absolute inset-0 ${items[1].bg || "bg-primary/30"} flex items-center p-6 md:p-12 ${items[1].textColor || "text-white"} font-headline text-3xl md:text-6xl font-black italic uppercase`}>
                    {items[1].label}
                </div>
            </Link>
        </motion.div>
    );
}
