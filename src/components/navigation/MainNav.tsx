"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationData, NavItem } from "@/types/navigation";
import CascadingFlyout from "@/components/navigation/CascadingFlyout";

interface MainNavProps {
    navigation: NavigationData[];
}

export default function MainNav({ navigation }: MainNavProps) {
    const [activeItem, setActiveItem] = useState<NavItem | null>(null);
    const [flyoutOrigin, setFlyoutOrigin] = useState<{ left: number; top: number; height: number } | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pathname = usePathname();

    const clearCloseTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const handleMouseEnter = useCallback(
        (item: NavItem, rect: DOMRect) => {
            clearCloseTimeout();
            setActiveItem(item);
            setFlyoutOrigin({ left: rect.left, top: rect.bottom, height: rect.height });
        },
        [clearCloseTimeout]
    );

    const handleMouseLeave = useCallback(() => {
        timeoutRef.current = setTimeout(() => {
            setActiveItem(null);
            setFlyoutOrigin(null);
        }, 150);
    }, []);

    const handleMenuMouseEnter = useCallback(() => {
        clearCloseTimeout();
    }, [clearCloseTimeout]);

    const handleMenuMouseLeave = useCallback(() => {
        timeoutRef.current = setTimeout(() => {
            setActiveItem(null);
            setFlyoutOrigin(null);
        }, 150);
    }, []);

    const handleClose = useCallback(() => {
        setActiveItem(null);
        setFlyoutOrigin(null);
    }, []);

    return (
        <nav className="bg-black">
            <ul className="flex items-stretch flex-nowrap">
                {navigation.map((group) => {
                    const isActive =
                        group.href &&
                        (pathname === group.href ||
                            (group.href !== "/" && pathname.startsWith(group.href)));
                    return (
                        <li
                            key={group.id}
                            onMouseEnter={(e) =>
                                handleMouseEnter(
                                    {
                                        id: group.id,
                                        label: group.label,
                                        href: group.href,
                                        children: group.children,
                                        level: group.level,
                                    } as NavItem,
                                    e.currentTarget.getBoundingClientRect()
                                )
                            }
                            onMouseLeave={handleMouseLeave}
                            className="relative"
                        >
                            <Link
                                href={group.href}
                                data-testid={`nav-item-${group.id}`}
                                aria-current={isActive ? "page" : undefined}
                                aria-expanded={activeItem?.id === group.id}
                                aria-controls={
                                    group.children?.length
                                        ? `flyout-${group.id}`
                                        : undefined
                                }
                                className={`flex items-center px-4 py-3 whitespace-nowrap text-sm font-bold transition-colors border-b-2 h-full ${
                                    activeItem?.id === group.id || isActive
                                        ? "text-primary-container border-primary"
                                        : "text-zinc-300 border-transparent hover:text-primary-container hover:border-primary-container"
                                }`}
                            >
                                {group.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {activeItem &&
                activeItem.children &&
                activeItem.children.length > 0 &&
                flyoutOrigin && (
                    <div
                        onMouseEnter={handleMenuMouseEnter}
                        onMouseLeave={handleMenuMouseLeave}
                    >
                        <CascadingFlyout
                            items={activeItem.children}
                            onClose={handleClose}
                            level={0}
                            origin={flyoutOrigin}
                        />
                    </div>
                )}
        </nav>
    );
}
