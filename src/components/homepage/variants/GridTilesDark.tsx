"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface Props {
    items: CategoryGridItem[];
}

export default function GridTilesDark({ items }: Props) {
    return (
        <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {items.map((item) => (
                <Link key={item.label} href={item.href}>
                    <div className={`relative aspect-square ${item.bg || "bg-neutral-800"} flex items-center justify-center font-black text-xl md:text-3xl italic hover:bg-primary-container hover:text-on-primary-container cursor-pointer transition-colors group overflow-hidden`}>
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
