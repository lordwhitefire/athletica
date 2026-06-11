"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface Props {
    items: CategoryGridItem[];
}

export default function ScrollCategories({ items }: Props) {
    return (
        <motion.div
            className="flex gap-3 md:gap-6 overflow-x-auto no-scrollbar"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {items.map((item) => (
                <Link key={item.label} href={item.href}>
                    <div className={`relative min-w-[140px] md:min-w-[200px] aspect-video border-4 ${item.accent || "border-white"} flex items-center justify-center font-bold uppercase cursor-pointer hover:bg-white/10 transition-colors group overflow-hidden`}>
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
