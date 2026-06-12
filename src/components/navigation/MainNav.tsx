"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationData, NavItem } from "@/types/navigation";
import MegaMenu from "@/components/navigation/MegaMenu";

interface MainNavProps {
    navigation: NavigationData[];
}

export default function MainNav({ navigation }: MainNavProps) {
    const [activeItem, setActiveItem] = useState<NavItem | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pathname = usePathname();

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
        <nav className="bg-black">
            <ul className="flex items-stretch flex-nowrap">
                {navigation.map((topLevel) =>
                    topLevel.children?.map((child) => {
                        const isActive = !child.disabled && child.href && (
                            pathname === child.href ||
                            (child.href !== "/" && pathname.startsWith(child.href))
                        );
                        return (
                            <li
                                key={child.id}
                                onMouseEnter={() => handleMouseEnter(child)}
                                onMouseLeave={handleMouseLeave}
                                className="relative"
                            >
                                {child.disabled || !child.href ? (
                                    <span className="flex items-center px-4 py-3 whitespace-nowrap text-xs font-bold text-zinc-500 cursor-default">
                                        {child.label}
                                    </span>
                                ) : (
                                    <Link
                                        href={child.href}
                                        aria-current={isActive ? "page" : undefined}
                                        aria-expanded={activeItem?.id === child.id}
                                        aria-controls={child.children?.length ? `mega-menu-${child.id}` : undefined}
                                        className={`flex items-center px-4 py-3 whitespace-nowrap text-xs font-bold transition-colors border-b-2 h-full ${activeItem?.id === child.id || isActive
                                            ? "text-primary-container border-primary"
                                            : "text-zinc-300 border-transparent hover:text-primary-container hover:border-primary-container"
                                            }`}
                                    >
                                        {child.label}
                                    </Link>
                                )}
                            </li>
                        );
                    })
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