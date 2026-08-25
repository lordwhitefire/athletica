"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { NavItem } from "@/types/navigation";

interface CascadingFlyoutProps {
    items: NavItem[];
    onClose: () => void;
    level?: number;
    origin: { left: number; top: number; height: number };
}

export default function CascadingFlyout({
    items,
    onClose,
    level = 0,
    origin,
}: CascadingFlyoutProps) {
    const [activeChild, setActiveChild] = useState<NavItem | null>(null);
    const [childOrigin, setChildOrigin] = useState<{ left: number; top: number; height: number } | null>(null);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearCloseTimeout = useCallback(() => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    }, []);

    const handleItemEnter = useCallback(
        (item: NavItem, rect: DOMRect) => {
            clearCloseTimeout();
            setActiveChild(item);
            setChildOrigin({ left: rect.right, top: rect.top, height: rect.height });
        },
        [clearCloseTimeout]
    );

    const handleItemLeave = useCallback(() => {
        closeTimeoutRef.current = setTimeout(() => {
            setActiveChild(null);
            setChildOrigin(null);
        }, 150);
    }, []);

    const handlePanelEnter = useCallback(() => {
        clearCloseTimeout();
    }, [clearCloseTimeout]);

    const handlePanelLeave = useCallback(() => {
        closeTimeoutRef.current = setTimeout(() => {
            setActiveChild(null);
            setChildOrigin(null);
        }, 150);
    }, []);

    return (
        <>
            <div
                className="fixed bg-zinc-900 border border-zinc-700/50 shadow-2xl shadow-black/60 z-50 min-w-[220px] py-2 rounded-sm"
                style={{
                    left: origin.left,
                    top: origin.top,
                }}
                onMouseEnter={handlePanelEnter}
                onMouseLeave={handlePanelLeave}
            >
                {items.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isActive = activeChild?.id === item.id;

                    return (
                        <div
                            key={item.id}
                            className="relative"
                            onMouseEnter={(e) =>
                                handleItemEnter(item, e.currentTarget.getBoundingClientRect())
                            }
                            onMouseLeave={handleItemLeave}
                        >
                            {item.disabled || !item.href ? (
                                <div className="flex items-center justify-between px-4 py-2.5 cursor-default group">
                                    <span
                                        className={`${
                                            level === 0
                                                ? "text-sm font-black text-white uppercase tracking-wide"
                                                : level === 1
                                                ? "text-sm font-bold text-zinc-200"
                                                : level === 2
                                                ? "text-xs font-semibold text-zinc-400"
                                                : "text-xs text-zinc-500"
                                        } text-zinc-600`}
                                    >
                                        {item.label}
                                    </span>
                                    {hasChildren && (
                                        <span className="text-zinc-600 text-xs ml-4">›</span>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href={item.href}
                                    onClick={onClose}
                                    className={`flex items-center justify-between px-4 py-2.5 transition-colors group ${
                                        isActive
                                            ? "text-primary-container bg-primary-container/5"
                                            : "text-white hover:text-primary-container hover:bg-primary-container/5"
                                    }`}
                                >
                                    <span
                                        className={
                                            level === 0
                                                ? "text-sm font-black uppercase tracking-wide"
                                                : level === 1
                                                ? "text-sm font-bold text-zinc-200 group-hover:text-primary-container"
                                                : level === 2
                                                ? "text-xs font-semibold text-zinc-400 group-hover:text-primary-container"
                                                : "text-xs text-zinc-500 group-hover:text-primary-container"
                                        }
                                    >
                                        {item.label}
                                    </span>
                                    {hasChildren && (
                                        <span className="text-zinc-600 text-xs ml-4 group-hover:text-primary-container">›</span>
                                    )}
                                </Link>
                            )}

                            {hasChildren && isActive && childOrigin && (
                                <CascadingFlyout
                                    items={item.children!}
                                    onClose={onClose}
                                    level={level + 1}
                                    origin={childOrigin}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
