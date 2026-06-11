"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface Props {
    items: CategoryGridItem[];
}

export default function StackedBanners({ items }: Props) {
    return (
        <motion.div
            className="flex flex-col gap-3 md:gap-4"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {items.map((item, i) => (
                <Link key={item.label} href={item.href}>
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
