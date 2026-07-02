"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface InfoTooltipProps {
    text: string;
    side?: "top" | "bottom" | "left" | "right";
}

export default function InfoTooltip({ text, side = "top" }: InfoTooltipProps) {
    const [show, setShow] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);

    const updatePos = useCallback(() => {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        const gap = 8;
        switch (side) {
            case "top":
                setPos({ top: rect.top - gap, left: rect.left + rect.width / 2 });
                break;
            case "bottom":
                setPos({ top: rect.bottom + gap, left: rect.left + rect.width / 2 });
                break;
            case "left":
                setPos({ top: rect.top + rect.height / 2, left: rect.left - gap });
                break;
            case "right":
                setPos({ top: rect.top + rect.height / 2, left: rect.right + gap });
                break;
        }
    }, [side]);

    useEffect(() => {
        if (show) {
            updatePos();
            window.addEventListener("scroll", updatePos, true);
            window.addEventListener("resize", updatePos);
            return () => {
                window.removeEventListener("scroll", updatePos, true);
                window.removeEventListener("resize", updatePos);
            };
        }
    }, [show, updatePos]);

    const handleToggle = useCallback(() => {
        if (!show) updatePos();
        setShow((v) => !v);
    }, [show, updatePos]);

    const transformMap: Record<string, string> = {
        top: "translate(-50%, -100%)",
        bottom: "translate(-50%, 0)",
        left: "translate(-100%, -50%)",
        right: "translate(0, -50%)",
    };

    return (
        <>
            <span className="relative inline-flex items-center">
                <button
                    ref={btnRef}
                    type="button"
                    onMouseEnter={() => { updatePos(); setShow(true); }}
                    onMouseLeave={() => setShow(false)}
                    onClick={handleToggle}
                    className="text-zinc-500 hover:text-primary transition-colors cursor-help"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-1-1 1.5-1.5L11 15h2l.5.5L15 16l-1 1h-4zm1-4v-4h2v4h-2z" />
                    </svg>
                </button>
            </span>
            {show && typeof document !== "undefined" && createPortal(
                <div
                    style={{
                        position: "fixed",
                        top: pos.top,
                        left: pos.left,
                        transform: transformMap[side],
                        zIndex: 9999,
                    }}
                    className="w-64 bg-neutral-800 border border-neutral-700 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none"
                >
                    {text}
                </div>,
                document.body
            )}
        </>
    );
}
