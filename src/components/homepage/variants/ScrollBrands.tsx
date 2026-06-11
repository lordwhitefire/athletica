"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import type { CategoryGridItem } from "@/types/homepage";

interface Props {
    items: CategoryGridItem[];
}

export default function ScrollBrands({ items }: Props) {
    return (
        <motion.div
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <button
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white shadow-lg items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-colors"
                onClick={() => {
                    const el = document.getElementById("scroll-brands-track");
                    if (el) el.scrollBy({ left: -420, behavior: "smooth" });
                }}
            >
                <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white shadow-lg items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-colors"
                onClick={() => {
                    const el = document.getElementById("scroll-brands-track");
                    if (el) el.scrollBy({ left: 420, behavior: "smooth" });
                }}
            >
                <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <div id="scroll-brands-track" className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar">
                {items.map((item) => (
                    <Link key={item.label} href={item.href}>
                        <div className={`min-w-[180px] md:min-w-[400px] h-36 md:h-64 ${item.bg || "bg-zinc-800"} flex items-center justify-center group cursor-pointer relative overflow-hidden`}>
                            {item.image && (
                                <Image src={item.image} alt={item.label} fill className="object-cover opacity-50 group-hover:scale-105 transition-transform" sizes="200px" />
                            )}
                            <span className={`relative font-headline text-2xl md:text-5xl font-black italic ${item.textColor || "text-white"}`}>
                                {item.label}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </motion.div>
    );
}
