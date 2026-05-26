"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { NavigationData, NavItem } from "@/types/navigation";
import MegaMenu from "@/components/navigation/MegaMenu";

interface MainNavProps {
    navigation: NavigationData[];
}

export default function MainNav({ navigation }: MainNavProps) {
    const [activeItem, setActiveItem] = useState<NavItem | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function handleMouseEnter(item: NavItem) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (item.children && item.children.length > 0) {
            setActiveItem(item);
        }
    }

    function handleMouseLeave() {
        timeoutRef.current = setTimeout(() => setActiveItem(null), 150);
    }

    function handleMenuMouseEnter() {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }

    function handleClose() {
        setActiveItem(null);
    }

    return (
        <nav className="relative w-full bg-white">
            {/* Full width, items centered */}
            <ul className="w-full flex items-stretch  justify-center flex-wrap">
                {navigation.map((topLevel) =>
                    topLevel.children?.map((child) => (
                        <li
                            key={child.id}
                            onMouseEnter={() => handleMouseEnter(child)}
                            onMouseLeave={handleMouseLeave}
                            className="relative"
                        >
                            {child.disabled || !child.href ? (
                                <span className="flex items-center justify-center px-3 py-2.5 text-xs font-bold text-gray-400 cursor-default text-center leading-tight w-20">
                                    {child.label}
                                </span>
                            ) : (
                                <Link
                                    href={child.href}
                                    className={`flex items-center justify-center px-3 py-2.5 text-xs font-bold transition-colors text-center leading-tight border-b-2 w-20 h-full ${activeItem?.id === child.id
                                        ? "text-red-600 border-red-600"
                                        : "text-gray-700 border-transparent hover:text-red-600 hover:border-red-600"
                                        }`}
                                    style={{ wordBreak: "break-word" }}
                                >
                                    {child.label}
                                </Link>
                            )}
                        </li>
                    ))
                )}
            </ul>

            {activeItem && (
                <div
                    onMouseEnter={handleMenuMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <MegaMenu item={activeItem} onClose={handleClose} />
                </div>
            )}
        </nav>
    );
}