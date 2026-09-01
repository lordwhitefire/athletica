"use client";

import { useState, useEffect, useCallback } from "react";

export function useUnsavedChanges() {
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        if (!dirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    const markDirty = useCallback(() => setDirty(true), []);
    const markClean = useCallback(() => setDirty(false), []);

    return { isDirty: dirty, markDirty, markClean, setDirty };
}
