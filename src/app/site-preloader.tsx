"use client";

import { useState, useEffect, useCallback } from "react";

let hasShownCurtain = false;

export default function SitePreloader() {
    const [phase, setPhase] = useState<"closed" | "opening" | "done">("closed");
    const [mounted, setMounted] = useState(false);

    const onTransitionEnd = useCallback(() => {
        setPhase("done");
    }, []);

    useEffect(() => {
        // Mark hydrated so we can differ server vs. client
        setMounted(true);

        if (hasShownCurtain) {
            setPhase("done");
            return;
        }

        hasShownCurtain = true;

        // Wait one frame so the browser paints the curtain before the open animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setPhase("opening");
            });
        });
    }, []);

    // Server render: show curtain closed
    if (!mounted) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
                <div className="absolute inset-y-0 left-0 w-1/2 bg-neutral-950" />
                <div className="absolute inset-y-0 right-0 w-1/2 bg-neutral-950" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="bg-zinc-800 text-white px-4 py-2">
                        <span className="text-2xl font-black italic tracking-tighter">AT</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-zinc-500 uppercase tracking-widest">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === "done") return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div
                className={`absolute inset-y-0 left-0 w-1/2 bg-neutral-950 transition-transform duration-[1200ms] ease-[cubic-bezier(0.77,0,0.18,1)] ${
                    phase === "opening" ? "-translate-x-full" : "translate-x-0"
                }`}
                onTransitionEnd={() => {
                    if (phase === "opening") onTransitionEnd();
                }}
            />
            <div
                className={`absolute inset-y-0 right-0 w-1/2 bg-neutral-950 transition-transform duration-[1200ms] ease-[cubic-bezier(0.77,0,0.18,1)] ${
                    phase === "opening" ? "translate-x-full" : "translate-x-0"
                }`}
            />
            <div
                className={`relative z-10 flex flex-col items-center gap-4 transition-opacity duration-500 ${
                    phase === "opening" ? "opacity-0" : "opacity-100"
                }`}
            >
                <div className="bg-zinc-800 text-white px-4 py-2">
                    <span className="text-2xl font-black italic tracking-tighter">AT</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-zinc-500 uppercase tracking-widest">Loading...</span>
                </div>
            </div>
        </div>
    );
}
